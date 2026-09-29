import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { emailService } from './emailService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CACHE_DIR = path.resolve(__dirname, '../.cache');
const DUPLICATE_CACHE_FILE = path.join(CACHE_DIR, 'sent_reminders_cache.json');

/**
 * Service to manage automated expiry reminder checking, duplicate prevention, and background cron scheduling
 */
class SchedulerService {
  constructor() {
    this.cronTask = null;
    this.isRunning = false;
    this.lastRunAt = null;
    this.lastResult = null;
    this.totalEmailsSent = 0;
    this.inMemoryReminderCache = new Set();

    this._initLocalCache();
  }

  /**
   * Initialize local cache file to guarantee duplicate prevention across server restarts
   */
  _initLocalCache() {
    try {
      if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
      }
      if (fs.existsSync(DUPLICATE_CACHE_FILE)) {
        const raw = fs.readFileSync(DUPLICATE_CACHE_FILE, 'utf8');
        const data = JSON.parse(raw);
        if (Array.isArray(data)) {
          // Keep only entries from the last 7 days to keep cache clean
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          const cutoff = sevenDaysAgo.toISOString().split('T')[0];

          data.forEach((entry) => {
            if (entry.date >= cutoff) {
              this.inMemoryReminderCache.add(`${entry.itemId}_${entry.date}`);
            }
          });
        }
      }
    } catch (err) {
      console.warn('[SchedulerService] Could not load local reminder cache:', err.message);
    }
  }

  /**
   * Persist a sent reminder key locally as a fallback safeguard
   */
  _persistToLocalCache(itemId, dateStr) {
    try {
      this.inMemoryReminderCache.add(`${itemId}_${dateStr}`);
      const entries = Array.from(this.inMemoryReminderCache).map((key) => {
        const [id, date] = key.split('_');
        return { itemId: id, date };
      });
      fs.writeFileSync(DUPLICATE_CACHE_FILE, JSON.stringify(entries, null, 2), 'utf8');
    } catch (err) {
      console.warn('[SchedulerService] Could not save to local reminder cache:', err.message);
    }
  }

  /**
   * Check if a reminder has already been sent for this item today in local cache
   */
  _isLocallyRemindedToday(itemId, dateStr) {
    return this.inMemoryReminderCache.has(`${itemId}_${dateStr}`);
  }

  /**
   * Instantiate Supabase client securely on the backend
   * Prioritizes SUPABASE_SERVICE_ROLE_KEY to bypass RLS for administrative background jobs,
   * falling back to SUPABASE_ANON_KEY for RPC execution
   */
  getSupabaseClient() {
    dotenv.config();
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || (!serviceRoleKey && !anonKey)) {
      return null;
    }

    const keyToUse = serviceRoleKey && serviceRoleKey.trim() !== '' ? serviceRoleKey.trim() : anonKey.trim();

    return createClient(supabaseUrl.trim(), keyToUse, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  /**
   * Check if a reminder has already been sent for an item on a specific date in the database
   */
  async checkDuplicateReminderInDb(supabase, itemId, dateStr) {
    if (this._isLocallyRemindedToday(itemId, dateStr)) {
      return true;
    }

    if (!supabase) return false;

    try {
      const { data, error } = await supabase
        .from('reminder_logs')
        .select('id')
        .eq('item_id', itemId)
        .eq('reminder_date', dateStr)
        .maybeSingle();

      if (error) {
        // If table does not exist or RLS restricts, fallback to in-memory check
        return false;
      }

      return Boolean(data);
    } catch {
      return false;
    }
  }

  /**
   * Record that a reminder was sent for an item on today's date
   */
  async logSentReminder(supabase, { userId, itemId, notificationEmail, daysBeforeExpiry, resendMessageId, dateStr }) {
    this._persistToLocalCache(itemId, dateStr);

    if (!supabase) return;

    // 1. Try helper RPC function if available
    try {
      const { error: rpcError } = await supabase.rpc('log_sent_reminder', {
        p_user_id: userId,
        p_item_id: itemId,
        p_notification_email: notificationEmail,
        p_days_before_expiry: daysBeforeExpiry,
        p_resend_message_id: resendMessageId,
      });

      if (!rpcError) return;
    } catch {
      // Continue to direct insert
    }

    // 2. Direct table upsert if service role key is active
    try {
      await supabase.from('reminder_logs').upsert(
        {
          user_id: userId,
          item_id: itemId,
          notification_email: notificationEmail,
          reminder_date: dateStr,
          days_before_expiry: daysBeforeExpiry,
          resend_message_id: resendMessageId,
          sent_at: new Date().toISOString(),
        },
        { onConflict: 'item_id,reminder_date' }
      );

      await supabase
        .from('pantry_items')
        .update({ last_reminder_sent_at: new Date().toISOString() })
        .eq('id', itemId);
    } catch (err) {
      console.warn('[SchedulerService] Notice: Could not record to reminder_logs table in Supabase:', err.message);
    }
  }

  /**
   * Main function to check all active pantry items approaching expiry and dispatch reminders
   * @param {{ triggerSource: string, forceCheck?: boolean, specificUserId?: string, fallbackItems?: Array, fallbackUser?: Object }} options
   */
  async checkAndSendAllExpiryReminders(options = {}) {
    const {
      triggerSource = 'cron',
      forceCheck = false,
      specificUserId = null,
      fallbackItems = null,
      fallbackUser = null,
    } = options;

    const startTime = new Date();
    const todayStr = startTime.toISOString().split('T')[0];
    const today = new Date(todayStr);

    console.log(`[SchedulerService] 🕒 Starting automated expiry check (${triggerSource}) at ${startTime.toISOString()}...`);

    const summary = {
      triggerSource,
      startedAt: startTime.toISOString(),
      completedAt: null,
      success: true,
      usersChecked: 0,
      usersReminded: 0,
      itemsReminded: 0,
      skippedDuplicates: 0,
      emailsSent: 0,
      deliveries: [],
      errors: [],
    };

    // 1. Check email delivery status
    const emailStatus = emailService.getTransportStatus();
    if (!emailStatus.configured) {
      const msg = `Email dispatch is not configured on the backend. ${emailStatus.reason}`;
      console.warn(`[SchedulerService] ⚠️ ${msg}`);
      summary.errors.push(msg);
      summary.success = false;
      summary.completedAt = new Date().toISOString();
      this.lastResult = summary;
      return summary;
    }

    const supabase = this.getSupabaseClient();

    // 2. Query items to check
    let eligibleItemsByUser = new Map(); // userId -> { user: {...}, items: [...] }

    if (supabase) {
      // Strategy A: Try RPC helper function
      try {
        const { data: rpcItems, error: rpcErr } = await supabase.rpc('get_expiring_items_for_reminder_job');
        if (!rpcErr && Array.isArray(rpcItems) && rpcItems.length > 0) {
          console.log(`[SchedulerService] Found ${rpcItems.length} candidate items via RPC helper.`);
          for (const row of rpcItems) {
            const uid = row.user_id;
            if (specificUserId && uid !== specificUserId) continue;

            if (!eligibleItemsByUser.has(uid)) {
              eligibleItemsByUser.set(uid, {
                userId: uid,
                notificationEmail: row.notification_email,
                userName: row.full_name || 'Chef',
                thresholdDays: row.expiry_reminder_days || 3,
                items: [],
              });
            }

            eligibleItemsByUser.get(uid).items.push({
              id: row.item_id,
              name: row.item_name,
              quantity: row.item_quantity,
              unit: row.item_unit,
              category: row.item_category,
              location: row.item_storage_location,
              expiry_date: row.item_expiry_date,
              days_until_expiry: row.days_until_expiry,
            });
          }
        }
      } catch (rpcEx) {
        console.log('[SchedulerService] RPC query skipped, falling back to direct table queries.');
      }

      // Strategy B: If RPC didn't populate (or returned 0), try querying tables directly
      if (eligibleItemsByUser.size === 0) {
        try {
          // Fetch users with email alerts enabled
          let prefQuery = supabase
            .from('notification_preferences')
            .select('user_id, email_notifications_enabled, expiry_reminder_days, notification_email')
            .eq('email_notifications_enabled', true);

          if (specificUserId) {
            prefQuery = prefQuery.eq('user_id', specificUserId);
          }

          const { data: preferences, error: prefErr } = await prefQuery;

          if (!prefErr && Array.isArray(preferences) && preferences.length > 0) {
            summary.usersChecked = preferences.length;

            for (const pref of preferences) {
              const uid = pref.user_id;
              const threshold = pref.expiry_reminder_days || 3;

              // Calculate threshold date (today + threshold days)
              const maxDate = new Date(today);
              maxDate.setDate(maxDate.getDate() + threshold);
              const maxDateStr = maxDate.toISOString().split('T')[0];

              // Query active items for this user approaching expiry
              const { data: userItems, error: itemsErr } = await supabase
                .from('pantry_items')
                .select('*')
                .eq('user_id', uid)
                .eq('status', 'active')
                .lte('expiry_date', maxDateStr);

              if (!itemsErr && Array.isArray(userItems) && userItems.length > 0) {
                // Fetch user profile name
                let userName = 'Chef';
                const { data: prof } = await supabase
                  .from('profiles')
                  .select('full_name')
                  .eq('id', uid)
                  .maybeSingle();
                if (prof?.full_name) userName = prof.full_name;

                // Fallback to notification_email or auth user email
                let toEmail = (pref.notification_email || '').trim();
                if (!toEmail) {
                  const { data: authUser } = await supabase.auth.admin?.getUserById(uid).catch(() => ({ data: null })) || {};
                  toEmail = authUser?.user?.user_metadata?.notification_email || authUser?.user?.email || '';
                }

                if (toEmail) {
                  eligibleItemsByUser.set(uid, {
                    userId: uid,
                    notificationEmail: toEmail,
                    userName,
                    thresholdDays: threshold,
                    items: userItems,
                  });
                }
              }
            }
          }
        } catch (tableErr) {
          console.warn('[SchedulerService] Table query notice:', tableErr.message);
        }
      }
    }

    // Strategy C: Client-assisted fallback (when triggered with direct items array from active user session)
    if (eligibleItemsByUser.size === 0 && fallbackItems && Array.isArray(fallbackItems) && fallbackItems.length > 0) {
      console.log(`[SchedulerService] Processing ${fallbackItems.length} candidate items passed from user context.`);
      const uid = fallbackUser?.id || 'active_user';
      const toEmail = fallbackUser?.notification_email || fallbackUser?.email;
      const userName = fallbackUser?.full_name || 'Chef';
      const thresholdDays = Number(fallbackUser?.thresholdDays) || 3;

      if (toEmail) {
        eligibleItemsByUser.set(uid, {
          userId: uid,
          notificationEmail: toEmail.trim(),
          userName,
          thresholdDays,
          items: fallbackItems,
        });
      }
    }

    summary.usersChecked = Math.max(summary.usersChecked, eligibleItemsByUser.size);

    if (eligibleItemsByUser.size === 0) {
      console.log('[SchedulerService] ✓ No active users or items requiring email reminders at this time.');
      summary.completedAt = new Date().toISOString();
      this.lastRunAt = summary.completedAt;
      this.lastResult = summary;
      return summary;
    }

    // 3. Process each user's expiring items and send reminder
    for (const [uid, userRecord] of eligibleItemsByUser.entries()) {
      const { notificationEmail, userName, thresholdDays, items } = userRecord;

      if (!notificationEmail || !notificationEmail.includes('@')) {
        console.warn(`[SchedulerService] User ${uid} has invalid notification email: "${notificationEmail}". Skipping.`);
        continue;
      }

      // Filter active items within expiry threshold and check duplicates
      const itemsToAlert = [];

      for (const item of items) {
        if (!item.expiry_date) continue;

        const itemExpDate = new Date(item.expiry_date);
        const diffTime = itemExpDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Must be within threshold and not expired longer than 1 day ago
        if (diffDays > thresholdDays || diffDays < -1) {
          continue;
        }

        // Check duplicate reminder for today
        const alreadySent = !forceCheck && (await this.checkDuplicateReminderInDb(supabase, item.id, todayStr));
        if (alreadySent) {
          summary.skippedDuplicates++;
          continue;
        }

        itemsToAlert.push({
          ...item,
          diffDays,
        });
      }

      if (itemsToAlert.length === 0) {
        console.log(`[SchedulerService] User ${userName} (${notificationEmail}): 0 items requiring new alerts today.`);
        continue;
      }

      // 4. Generate professional HTML email & dispatch via Resend SDK
      try {
        console.log(`[SchedulerService] 📧 Dispatching expiry reminder for ${itemsToAlert.length} item(s) to ${notificationEmail}...`);

        const html = emailService.generateExpiryReminderHtml({
          userName,
          notificationEmail,
          thresholdDays,
          items: itemsToAlert,
        });

        const subject = `🚨 PantryPal AI: ${itemsToAlert.length} pantry item${itemsToAlert.length === 1 ? '' : 's'} expiring soon!`;
        const text = `Hello ${userName}! You have ${itemsToAlert.length} item(s) in your pantry approaching expiration within ${thresholdDays} days. Please log in to PantryPal AI to view details and zero-waste recipe suggestions.`;

        const sendResult = await emailService.sendEmail({
          to: notificationEmail,
          subject,
          html,
          text,
        });

        // 5. Confirm delivery acceptance and record reminder logs
        if (sendResult?.success && sendResult?.id) {
          summary.emailsSent++;
          this.totalEmailsSent++;
          summary.usersReminded++;
          summary.itemsReminded += itemsToAlert.length;

          // Record each alerted item in reminder_logs
          for (const alertedItem of itemsToAlert) {
            await this.logSentReminder(supabase, {
              userId: uid,
              itemId: alertedItem.id,
              notificationEmail,
              daysBeforeExpiry: alertedItem.diffDays,
              resendMessageId: sendResult.id,
              dateStr: todayStr,
            });
          }

          summary.deliveries.push({
            userId: uid,
            recipient: notificationEmail,
            itemCount: itemsToAlert.length,
            itemNames: itemsToAlert.map((i) => i.name),
            resendId: sendResult.id,
            timestamp: new Date().toISOString(),
          });

          console.log(`[SchedulerService] ✓ Expiry alert accepted by Resend (ID: ${sendResult.id}) for ${notificationEmail}`);
        } else {
          throw new Error('Resend did not return a valid delivery acceptance message ID.');
        }
      } catch (sendErr) {
        console.error(`[SchedulerService] ❌ Failed to dispatch email to ${notificationEmail}:`, sendErr.message);
        summary.errors.push(`Failed to send to ${notificationEmail}: ${sendErr.message}`);
        summary.success = false;
      }
    }

    summary.completedAt = new Date().toISOString();
    this.lastRunAt = summary.completedAt;
    this.lastResult = summary;

    console.log(`[SchedulerService] ✅ Expiry check completed in ${Date.now() - startTime.getTime()}ms. Sent ${summary.emailsSent} email(s) for ${summary.itemsReminded} item(s).`);

    return summary;
  }

  /**
   * Start the recurring background cron job
   */
  startScheduler() {
    dotenv.config();

    if (process.env.CRON_ENABLED === 'false') {
      console.log('[SchedulerService] Automated background cron is disabled via CRON_ENABLED=false.');
      return;
    }

    const schedule = process.env.CRON_SCHEDULE || '0 9 * * *';

    if (!cron.validate(schedule)) {
      console.error(`[SchedulerService] Invalid cron expression: "${schedule}". Scheduler not started.`);
      return;
    }

    if (this.cronTask) {
      this.cronTask.stop();
    }

    console.log(`[SchedulerService] 🚀 Initializing automated expiry reminder cron job [Schedule: "${schedule}"]`);

    this.cronTask = cron.schedule(schedule, async () => {
      try {
        await this.checkAndSendAllExpiryReminders({ triggerSource: 'cron_scheduled' });
      } catch (err) {
        console.error('[SchedulerService] Error during scheduled cron execution:', err);
      }
    });

    this.isRunning = true;

    // Optional: run an initial check on startup if enabled
    if (process.env.RUN_CRON_ON_STARTUP === 'true') {
      console.log('[SchedulerService] RUN_CRON_ON_STARTUP is true. Running immediate startup check...');
      setTimeout(() => {
        this.checkAndSendAllExpiryReminders({ triggerSource: 'startup_check' }).catch((e) =>
          console.error('[SchedulerService Startup Check Error]:', e)
        );
      }, 5000);
    }
  }

  /**
   * Stop the scheduled job
   */
  stopScheduler() {
    if (this.cronTask) {
      this.cronTask.stop();
      this.cronTask = null;
      this.isRunning = false;
      console.log('[SchedulerService] Automated cron scheduler stopped.');
    }
  }

  /**
   * Return real-time status of scheduler service
   */
  getSchedulerStatus() {
    dotenv.config();
    const cronSchedule = process.env.CRON_SCHEDULE || '0 9 * * *';
    const cronEnabled = process.env.CRON_ENABLED !== 'false';

    return {
      isRunning: this.isRunning,
      cronSchedule,
      cronEnabled,
      lastRunAt: this.lastRunAt,
      lastResult: this.lastResult,
      totalEmailsSent: this.totalEmailsSent,
      cachedRemindersCount: this.inMemoryReminderCache.size,
      emailConfigured: emailService.getTransportStatus().configured,
    };
  }
}

export const schedulerService = new SchedulerService();
