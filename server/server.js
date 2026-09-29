import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { groqService } from './services/groqService.js';
import { emailService } from './services/emailService.js';
import { schedulerService } from './services/schedulerService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: [CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));

// Increase payload limit for base64 image parsing from scanner
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'PantryPal AI Backend',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    env: {
      groqConfigured: !!process.env.GROQ_API_KEY,
      resendConfigured: !!process.env.RESEND_API_KEY,
      supabaseConfigured: !!process.env.SUPABASE_URL,
    }
  });
});

// Grocery Vision Scan Endpoint (Groq AI Vision)
app.post('/api/vision/scan', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image || typeof image !== 'string') {
      return res.status(400).json({
        error: 'Please provide an image of the grocery item to scan (base64 string or data URL).',
      });
    }

    const items = await groqService.scanGrocery(image);
    const itemList = Array.isArray(items) ? items : (items ? [items] : []);
    return res.json({
      success: true,
      items: itemList,
      item: itemList[0] || null,
    });
  } catch (err) {
    console.error('[/api/vision/scan error]:', err.message);
    const statusCode = err.message.includes('GROQ_API_KEY') ? 400 : 500;
    return res.status(statusCode).json({
      error: err.message || 'Failed to analyze grocery image. Please try again.',
    });
  }
});

// Recipe Generation Endpoint (Groq AI)
app.post('/api/recipes/generate', async (req, res) => {
  try {
    const { pantryItems, options } = req.body;

    if (!pantryItems || !Array.isArray(pantryItems) || pantryItems.length === 0) {
      return res.status(400).json({
        error: 'Your pantry has no ingredients. Please add grocery items to your inventory first so the AI Chef can suggest a meal.',
      });
    }

    const recipe = await groqService.generateRecipe(pantryItems, options);
    return res.json({
      success: true,
      recipe,
    });
  } catch (err) {
    console.error('[/api/recipes/generate error]:', err.message);
    const statusCode = err.message.includes('GROQ_API_KEY') ? 400 : 500;
    return res.status(statusCode).json({
      error: err.message || 'Failed to generate recipe. Please try again.',
    });
  }
});

// Notification Status Endpoint
app.get('/api/notifications/status', (req, res) => {
  const status = emailService.getTransportStatus();
  res.json({
    configured: status.configured,
    provider: status.provider,
    sender: status.sender,
    reason: status.reason,
  });
});

// Test Email Notification Endpoint
app.post('/api/notifications/test-email', async (req, res) => {
  try {
    const { toEmail, userName, thresholdDays } = req.body;

    if (!toEmail || typeof toEmail !== 'string' || !toEmail.includes('@')) {
      return res.status(400).json({
        error: 'Please provide a valid notification email address to receive the test message.',
      });
    }

    const status = emailService.getTransportStatus();
    if (!status.configured) {
      return res.status(400).json({
        error: status.reason,
        configured: false,
      });
    }

    const html = emailService.generateTestEmailHtml({
      userName: userName || 'Chef User',
      notificationEmail: toEmail.trim(),
      thresholdDays: thresholdDays || 3,
    });

    const result = await emailService.sendEmail({
      to: toEmail.trim(),
      subject: '🌿 PantryPal AI - Notification Test Successful',
      html,
      text: `Hello ${userName || 'Chef'}! Your PantryPal AI notification email is successfully verified. You will receive alerts when items in your pantry are approaching expiry.`,
    });

    return res.json({
      success: true,
      message: `Test email sent successfully to ${toEmail.trim()}! Please check your inbox (and spam folder).`,
      result,
    });
  } catch (err) {
    console.error('[/api/notifications/test-email error]:', err.message);
    return res.status(400).json({
      error: err.message || 'Failed to dispatch test email. Please check your email configuration.',
    });
  }
});

// Scheduler Status Endpoint
app.get('/api/notifications/scheduler-status', (req, res) => {
  const status = schedulerService.getSchedulerStatus();
  res.json(status);
});

// Trigger Scheduled Expiry Check Job (Webhook / Manual Trigger)
app.post('/api/notifications/run-cron', async (req, res) => {
  try {
    const providedSecret = req.headers['x-cron-secret'] || req.query.secret || req.body.secret;
    const configuredSecret = process.env.CRON_SECRET;

    if (configuredSecret && providedSecret !== configuredSecret) {
      return res.status(401).json({
        error: 'Unauthorized: Invalid cron secret provided in x-cron-secret header.',
      });
    }

    const { forceCheck = false, specificUserId = null, fallbackItems = null, fallbackUser = null } = req.body || {};

    const result = await schedulerService.checkAndSendAllExpiryReminders({
      triggerSource: 'api_run_cron',
      forceCheck: Boolean(forceCheck),
      specificUserId,
      fallbackItems,
      fallbackUser,
    });

    return res.json({
      success: result.success,
      message: `Expiry reminder job executed: ${result.emailsSent} email(s) sent for ${result.itemsReminded} item(s). (${result.skippedDuplicates} duplicates prevented).`,
      result,
    });
  } catch (err) {
    console.error('[/api/notifications/run-cron error]:', err);
    return res.status(500).json({
      error: err.message || 'Failed to execute scheduled expiry reminder job.',
    });
  }
});

// Send Expiry Reminders Endpoint (User-Triggered or Client Context)
app.post('/api/notifications/send-reminders', async (req, res) => {
  try {
    const { toEmail, userName, thresholdDays = 3, items = [], force = false, userId = null } = req.body;

    if (!toEmail || typeof toEmail !== 'string' || !toEmail.includes('@')) {
      return res.status(400).json({
        error: 'A valid notification email address is required to dispatch expiry alerts.',
      });
    }

    const status = emailService.getTransportStatus();
    if (!status.configured) {
      return res.status(400).json({
        error: status.reason,
        configured: false,
      });
    }

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const today = new Date(todayStr);

    // 1. Filter items approaching expiry according to user threshold
    const expiringItems = items.filter((item) => {
      if (!item.expiry_date || item.status === 'consumed' || item.status === 'wasted') {
        return false;
      }
      const expDate = new Date(item.expiry_date);
      const diffTime = expDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      // Include items within threshold down to -1 day (expiring soon or today)
      return diffDays <= thresholdDays && diffDays >= -1;
    });

    if (expiringItems.length === 0) {
      return res.json({
        success: true,
        sent: false,
        count: 0,
        message: `No active pantry items are expiring within your alert window of ${thresholdDays} day(s).`,
      });
    }

    // 2. Duplicate Prevention: Filter out items already reminded today (unless force=true)
    const itemsToAlert = [];
    let duplicateCount = 0;

    for (const item of expiringItems) {
      const alreadySent = !force && schedulerService._isLocallyRemindedToday(item.id, todayStr);
      if (alreadySent) {
        duplicateCount++;
      } else {
        itemsToAlert.push(item);
      }
    }

    if (itemsToAlert.length === 0) {
      return res.json({
        success: true,
        sent: false,
        count: 0,
        duplicatesPrevented: duplicateCount,
        message: `All ${expiringItems.length} expiring item(s) have already received notification alerts today. Duplicate reminders prevented!`,
      });
    }

    // 3. Generate HTML & Dispatch via Resend SDK
    const html = emailService.generateExpiryReminderHtml({
      userName: userName || 'Chef User',
      notificationEmail: toEmail.trim(),
      thresholdDays: Number(thresholdDays) || 3,
      items: itemsToAlert,
    });

    const result = await emailService.sendEmail({
      to: toEmail.trim(),
      subject: `🚨 PantryPal AI: ${itemsToAlert.length} pantry item${itemsToAlert.length === 1 ? '' : 's'} expiring soon!`,
      html,
      text: `Hello ${userName || 'Chef'}! You have ${itemsToAlert.length} item(s) in your pantry approaching expiration within ${thresholdDays} days. Log in to PantryPal AI to view details and recipe ideas.`,
    });

    // 4. Log sent reminders to prevent duplicates
    const supabase = schedulerService.getSupabaseClient();
    for (const item of itemsToAlert) {
      const expDate = new Date(item.expiry_date);
      const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
      await schedulerService.logSentReminder(supabase, {
        userId: userId || 'manual_user',
        itemId: item.id,
        notificationEmail: toEmail.trim(),
        daysBeforeExpiry: diffDays,
        resendMessageId: result.id,
        dateStr: todayStr,
      });
    }

    return res.json({
      success: true,
      sent: true,
      count: itemsToAlert.length,
      duplicatesPrevented: duplicateCount,
      message: `Expiry notification for ${itemsToAlert.length} item(s) delivered to ${toEmail.trim()}!`,
      result,
    });
  } catch (err) {
    console.error('[/api/notifications/send-reminders error]:', err.message);
    return res.status(400).json({
      error: err.message || 'Failed to send expiry reminder email.',
    });
  }
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

app.listen(PORT, () => {
  console.log(`🌿 PantryPal AI Server running on http://localhost:${PORT}`);
  console.log(`   Health Check: http://localhost:${PORT}/api/health`);
  console.log(`   Scheduler Status: http://localhost:${PORT}/api/notifications/scheduler-status`);

  // Start automated background cron scheduler
  schedulerService.startScheduler();
});
