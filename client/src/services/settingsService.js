import { supabase, isSupabaseConfigured } from './supabaseClient';

/**
 * Service to handle notification preferences, notification email, and user settings persistence
 */
export const settingsService = {
  /**
   * Fetch preferences for the user from Supabase with localStorage backup
   * @param {string} userId - Auth user ID
   * @param {Object} [currentUser] - Optional current auth user
   * @returns {Promise<Object>} Notification preferences object
   */
  async getPreferences(userId, currentUser = null) {
    const storageKey = `pantrypal_settings_${userId || 'guest'}`;
    const emailStorageKey = `pantrypal_notification_email_${userId || 'guest'}`;
    let cached = null;
    let cachedEmail = null;

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) cached = JSON.parse(stored);
      cachedEmail = localStorage.getItem(emailStorageKey);
    } catch (e) {
      // ignore JSON parse error
    }

    const defaultPrefs = {
      email_notifications_enabled: true,
      expiry_reminder_days: 3,
      low_stock_alerts_enabled: true,
      notification_email: currentUser?.user_metadata?.notification_email || cachedEmail || cached?.notification_email || currentUser?.email || '',
    };

    if (!userId || !isSupabaseConfigured) {
      return {
        ...defaultPrefs,
        ...(cached || {}),
        notification_email: cached?.notification_email || cachedEmail || defaultPrefs.notification_email,
      };
    }

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('[settingsService.getPreferences] Error:', error);
        return {
          ...defaultPrefs,
          ...(cached || {}),
          notification_email: currentUser?.user_metadata?.notification_email || cachedEmail || cached?.notification_email || currentUser?.email || '',
        };
      }

      const resolvedEmail =
        currentUser?.user_metadata?.notification_email ||
        cachedEmail ||
        cached?.notification_email ||
        currentUser?.email ||
        '';

      if (data) {
        const normalized = {
          email_notifications_enabled: Boolean(data.email_notifications_enabled),
          expiry_reminder_days: Number(data.expiry_reminder_days) || 3,
          low_stock_alerts_enabled: Boolean(data.low_stock_alerts_enabled),
          notification_email: resolvedEmail,
        };
        try {
          localStorage.setItem(storageKey, JSON.stringify(normalized));
          if (resolvedEmail) {
            localStorage.setItem(emailStorageKey, resolvedEmail);
          }
        } catch (e) {
          // ignore localStorage error
        }
        return normalized;
      }

      // If no row exists yet in the database, return defaults with resolved email
      return {
        ...defaultPrefs,
        ...(cached || {}),
        notification_email: resolvedEmail,
      };
    } catch (err) {
      console.error('[settingsService.getPreferences] Exception:', err);
      return {
        ...defaultPrefs,
        ...(cached || {}),
      };
    }
  },

  /**
   * Save or update notification preferences and notification email securely
   * @param {string} userId - Auth user ID
   * @param {Object} preferences - { email_notifications_enabled, expiry_reminder_days, low_stock_alerts_enabled, notification_email }
   * @returns {Promise<Object>} Updated preferences
   */
  async savePreferences(userId, preferences) {
    const storageKey = `pantrypal_settings_${userId || 'guest'}`;
    const emailStorageKey = `pantrypal_notification_email_${userId || 'guest'}`;

    const notificationEmail = (preferences.notification_email || '').trim();

    const cleanPrefs = {
      email_notifications_enabled: Boolean(preferences.email_notifications_enabled),
      expiry_reminder_days: Math.max(1, Math.min(7, parseInt(preferences.expiry_reminder_days, 10) || 3)),
      low_stock_alerts_enabled: Boolean(preferences.low_stock_alerts_enabled),
      notification_email: notificationEmail,
    };

    try {
      localStorage.setItem(storageKey, JSON.stringify(cleanPrefs));
      if (notificationEmail) {
        localStorage.setItem(emailStorageKey, notificationEmail);
      }
    } catch (e) {
      // ignore localStorage error
    }

    if (!userId || !isSupabaseConfigured) {
      return cleanPrefs;
    }

    // 1. Save preferences to notification_preferences table (with progressive column support)
    const payload = {
      user_id: userId,
      email_notifications_enabled: cleanPrefs.email_notifications_enabled,
      expiry_reminder_days: cleanPrefs.expiry_reminder_days,
      low_stock_alerts_enabled: cleanPrefs.low_stock_alerts_enabled,
      notification_email: notificationEmail,
      updated_at: new Date().toISOString(),
    };

    let data = null;
    let error = null;

    const res = await supabase
      .from('notification_preferences')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single();

    data = res.data;
    error = res.error;

    // Graceful fallback if database table does not yet have notification_email column
    if (error && error.message?.includes('notification_email')) {
      const fallbackPayload = {
        user_id: userId,
        email_notifications_enabled: cleanPrefs.email_notifications_enabled,
        expiry_reminder_days: cleanPrefs.expiry_reminder_days,
        low_stock_alerts_enabled: cleanPrefs.low_stock_alerts_enabled,
        updated_at: new Date().toISOString(),
      };
      const fallbackRes = await supabase
        .from('notification_preferences')
        .upsert(fallbackPayload, { onConflict: 'user_id' })
        .select()
        .single();
      data = fallbackRes.data;
      error = fallbackRes.error;
    }

    if (error) {
      console.error('[settingsService.savePreferences] Error:', error);
      throw new Error(error.message || 'Failed to save settings to the database.');
    }

    // 2. Save notification_email in user metadata in Supabase (does NOT affect login email)
    if (notificationEmail) {
      try {
        await supabase.auth.updateUser({
          data: { notification_email: notificationEmail },
        });
      } catch (authMetaErr) {
        console.warn('[settingsService.savePreferences] Could not sync notification_email to user_metadata:', authMetaErr);
      }
    }

    const saved = {
      email_notifications_enabled: Boolean(data.email_notifications_enabled),
      expiry_reminder_days: Number(data.expiry_reminder_days) || 3,
      low_stock_alerts_enabled: Boolean(data.low_stock_alerts_enabled),
      notification_email: notificationEmail,
    };

    try {
      localStorage.setItem(storageKey, JSON.stringify(saved));
    } catch (e) {
      // ignore
    }

    return saved;
  },
};
