import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Service to manage professional HTML email generation and delivery via Resend SDK or SMTP
 */
class EmailService {
  /**
   * Check if an email transport is configured on the backend
   * @returns {{ configured: boolean, provider: string|null, reason: string|null, sender: string|null }}
   */
  getTransportStatus() {
    dotenv.config();
    const resendApiKey = process.env.RESEND_API_KEY?.trim();
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;

    if (resendApiKey && resendApiKey !== '' && !resendApiKey.includes('your_key_here')) {
      return {
        configured: true,
        provider: 'resend',
        sender: process.env.RESEND_SENDER_EMAIL || 'PantryPal AI <onboarding@resend.dev>',
        reason: null,
      };
    }

    if (smtpHost && smtpUser && smtpPass) {
      return {
        configured: true,
        provider: 'smtp',
        sender: smtpUser,
        reason: null,
      };
    }

    if (smtpUser && smtpPass && (smtpUser.includes('@gmail.com') || process.env.GMAIL_USER)) {
      return {
        configured: true,
        provider: 'gmail',
        sender: smtpUser,
        reason: null,
      };
    }

    if (process.env.ETHEREAL_TEST_MODE === 'true') {
      return {
        configured: true,
        provider: 'ethereal',
        sender: 'PantryPal AI <notifications@pantrypal.ai>',
        reason: null,
      };
    }

    return {
      configured: false,
      provider: null,
      sender: null,
      reason: 'Email service is not configured. Please add RESEND_API_KEY to server/.env (get a free key at https://resend.com/api-keys) or configure SMTP settings.',
    };
  }

  /**
   * Instantiate Resend SDK client securely
   * @returns {Resend|null}
   */
  getResendClient() {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (!apiKey || apiKey.includes('your_key_here')) {
      return null;
    }
    return new Resend(apiKey);
  }

  /**
   * Create Nodemailer transport if SMTP is configured
   */
  getSmtpTransporter() {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;

    if (smtpUser && smtpPass && (smtpUser.includes('@gmail.com') || process.env.GMAIL_USER)) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
    }

    if (smtpHost && smtpUser && smtpPass) {
      return nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
    }

    return null;
  }

  /**
   * Send an email using Resend SDK or fallback SMTP
   * Confirms delivery acceptance before returning success
   */
  async sendEmail({ to, subject, html, text }) {
    const status = this.getTransportStatus();

    if (!status.configured) {
      throw new Error(status.reason);
    }

    if (!to || typeof to !== 'string' || !to.includes('@')) {
      throw new Error('A valid recipient notification email address is required.');
    }

    const cleanTo = to.trim();

    // 1. Dispatch via Resend SDK
    if (status.provider === 'resend') {
      const resend = this.getResendClient();
      if (!resend) {
        throw new Error('Resend SDK could not be initialized. Please check RESEND_API_KEY in server/.env.');
      }

      const sender = process.env.RESEND_SENDER_EMAIL || 'PantryPal AI <onboarding@resend.dev>';

      const { data, error } = await resend.emails.send({
        from: sender,
        to: [cleanTo],
        subject: subject,
        html: html,
        text: text,
      });

      if (error || !data?.id) {
        console.error('[EmailService Resend Error]:', error);
        let errorMsg = error?.message || 'Failed to dispatch email via Resend SDK.';

        // Handle common Resend testing / domain verification error messages
        if (errorMsg.includes('can only send testing emails to your own email address')) {
          errorMsg = `Resend Test Mode: With the default sender (${sender}), Resend only permits sending to your registered Resend account email (snehassingh177@gmail.com). To deliver to other inboxes, verify your custom domain at resend.com/domains.`;
        } else if (error?.name === 'invalid_api_key' || errorMsg.includes('API key')) {
          errorMsg = 'Invalid Resend API Key. Please verify RESEND_API_KEY in server/.env.';
        } else if (errorMsg.includes('domain is not verified') || errorMsg.includes('not verified')) {
          errorMsg = `The sender domain in RESEND_SENDER_EMAIL (${sender}) is not verified. Please verify your domain in Resend or set RESEND_SENDER_EMAIL="PantryPal AI <onboarding@resend.dev>".`;
        }

        const customError = new Error(errorMsg);
        customError.resendError = error;
        throw customError;
      }

      return {
        success: true,
        provider: 'resend',
        id: data.id,
        to: cleanTo,
      };
    }

    // 2. Dispatch via Nodemailer (SMTP / Gmail)
    if (status.provider === 'smtp' || status.provider === 'gmail') {
      const transporter = this.getSmtpTransporter();
      if (!transporter) {
        throw new Error('SMTP transporter failed to initialize.');
      }

      const sender = process.env.SMTP_FROM || status.sender;
      const info = await transporter.sendMail({
        from: sender,
        to: cleanTo,
        subject: subject,
        html: html,
        text: text,
      });

      return {
        success: true,
        provider: status.provider,
        id: info.messageId,
        to: cleanTo,
      };
    }

    // 3. Dispatch via Ethereal test inbox (fallback test mode)
    if (status.provider === 'ethereal') {
      if (!this._etherealTransporter) {
        const testAccount = await nodemailer.createTestAccount();
        this._etherealTransporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
      }

      const info = await this._etherealTransporter.sendMail({
        from: 'PantryPal AI <notifications@pantrypal.ai>',
        to: cleanTo,
        subject: subject,
        html: html,
        text: text,
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`[EmailService Ethereal] Delivered to ${cleanTo}: Preview at ${previewUrl}`);

      return {
        success: true,
        provider: 'ethereal',
        id: info.messageId,
        to: cleanTo,
        previewUrl,
      };
    }

    throw new Error('No active email delivery provider available.');
  }

  /**
   * Generate professional HTML template for Test Email
   */
  generateTestEmailHtml({ userName, notificationEmail, thresholdDays }) {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const chefName = userName || 'Chef';
    const days = thresholdDays || 3;
    const year = new Date().getFullYear();

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PantryPal AI - Email Notification Verification</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px 0; color: #1e293b; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 36px 32px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0 0 8px 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 0; font-size: 14px; opacity: 0.9; }
    .body { padding: 32px; }
    .badge { display: inline-block; background-color: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; margin-bottom: 20px; }
    .card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .card-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; }
    .card-row:last-child { margin-bottom: 0; }
    .card-label { color: #64748b; font-weight: 500; }
    .card-value { color: #0f172a; font-weight: 600; text-align: right; }
    .btn { display: inline-block; background-color: #059669; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-size: 14px; font-weight: 600; text-align: center; margin-top: 10px; box-shadow: 0 2px 4px rgba(5, 150, 105, 0.2); }
    .tip-box { background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 14px 16px; border-radius: 8px; font-size: 13px; color: #065f46; margin: 24px 0; }
    .footer { padding: 24px 32px; background-color: #f1f5f9; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌿 PantryPal AI</h1>
      <p>Smart Expiry Notifications & Food Waste Prevention</p>
    </div>

    <div class="body">
      <div style="text-align: center;">
        <span class="badge">✓ Verification Successful</span>
      </div>

      <h2 style="font-size: 20px; margin-top: 0; color: #0f172a;">Hello ${chefName},</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #334155;">
        Your email notification channel is now successfully connected via Resend! You are all set to receive automated alerts whenever grocery items in your pantry are approaching their expiration date.
      </p>

      <div class="card">
        <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
          Configuration Summary
        </div>
        <div class="card-row">
          <span class="card-label">Notification Email:</span>
          <span class="card-value">${notificationEmail}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Reminder Timing:</span>
          <span class="card-value">${days} Days Before Expiry</span>
        </div>
        <div class="card-row">
          <span class="card-label">Alert Status:</span>
          <span class="card-value" style="color: #059669;">Active & Monitored</span>
        </div>
        <div class="card-row">
          <span class="card-label">Delivery Provider:</span>
          <span class="card-value" style="color: #059669;">Resend Transactional API</span>
        </div>
        <div class="card-row">
          <span class="card-label">Verified At:</span>
          <span class="card-value">${new Date().toLocaleString()}</span>
        </div>
      </div>

      <div class="tip-box">
        <strong>💡 Pro-tip:</strong> When you receive expiry alerts, click on "AI Chef Recipe Generator" in PantryPal AI to cook delicious meals with your ingredients before they spoil, saving both food and money!
      </div>

      <div style="text-align: center; margin: 28px 0 10px 0;">
        <a href="${clientUrl}/inventory" class="btn">View Your Pantry Inventory</a>
      </div>
    </div>

    <div class="footer">
      <p style="margin: 0 0 6px 0;">You received this email because you configured notification alerts in PantryPal AI.</p>
      <p style="margin: 0;">© ${year} PantryPal AI. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate professional HTML template for Expiry Reminder Alert
   */
  generateExpiryReminderHtml({ userName, notificationEmail, thresholdDays, items }) {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const chefName = userName || 'Chef';
    const year = new Date().getFullYear();
    const count = items.length;

    // Render table rows for expiring items
    const itemRowsHtml = items.map((item) => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const expDate = new Date(item.expiry_date);
      expDate.setHours(0, 0, 0, 0);
      const diffTime = expDate - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let badgeBg = '#fef3c7';
      let badgeColor = '#92400e';
      let badgeText = `Expires in ${diffDays} day${diffDays === 1 ? '' : 's'}`;

      if (diffDays <= 0) {
        badgeBg = '#fee2e2';
        badgeColor = '#991b1b';
        badgeText = diffDays === 0 ? 'Expires Today' : 'Expired';
      } else if (diffDays === 1) {
        badgeBg = '#ffedd5';
        badgeColor = '#9a3412';
        badgeText = 'Expires Tomorrow';
      }

      const formattedDate = new Date(item.expiry_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      const qty = item.quantity ? `${item.quantity} ${item.unit || ''}`.trim() : '1 unit';
      const category = item.category || 'Pantry';
      const location = item.location || 'Pantry';

      return `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 12px 14px; font-weight: 600; color: #0f172a; font-size: 14px;">
            ${item.name}
            <div style="font-size: 11px; font-weight: 400; color: #64748b; margin-top: 2px;">
              ${category} • ${location}
            </div>
          </td>
          <td style="padding: 12px 14px; color: #475569; font-size: 13px; text-align: center;">
            ${qty}
          </td>
          <td style="padding: 12px 14px; color: #475569; font-size: 13px; text-align: center;">
            ${formattedDate}
          </td>
          <td style="padding: 12px 14px; text-align: right;">
            <span style="display: inline-block; background-color: ${badgeBg}; color: ${badgeColor}; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700;">
              ${badgeText}
            </span>
          </td>
        </tr>
      `;
    }).join('');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PantryPal AI - Expiry Alert</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px 0; color: #1e293b; }
    .container { max-width: 620px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 32px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0 0 6px 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 0; font-size: 13px; opacity: 0.9; }
    .body { padding: 32px; }
    .alert-banner { background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 14px 18px; margin-bottom: 24px; color: #92400e; font-size: 13px; display: flex; align-items: center; }
    .items-table { width: 100%; border-collapse: collapse; margin: 16px 0 24px 0; }
    .items-table th { background-color: #f8fafc; color: #475569; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 14px; border-bottom: 2px solid #e2e8f0; }
    .btn { display: inline-block; background-color: #059669; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-size: 14px; font-weight: 600; text-align: center; box-shadow: 0 2px 4px rgba(5, 150, 105, 0.2); }
    .btn-secondary { display: inline-block; background-color: #f1f5f9; color: #334155 !important; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-size: 14px; font-weight: 600; text-align: center; margin-left: 8px; border: 1px solid #e2e8f0; }
    .tip-box { background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 14px 16px; border-radius: 8px; font-size: 13px; color: #065f46; margin: 24px 0; }
    .footer { padding: 24px 32px; background-color: #f1f5f9; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌿 PantryPal AI</h1>
      <p>Automated Expiry Notification</p>
    </div>

    <div class="body">
      <h2 style="font-size: 20px; margin-top: 0; color: #0f172a;">Hello ${chefName},</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #334155;">
        You have <strong>${count} grocery item${count === 1 ? '' : 's'}</strong> in your pantry approaching expiration within your alert threshold of <strong>${thresholdDays} days</strong>.
      </p>

      <table class="items-table">
        <thead>
          <tr>
            <th style="text-align: left;">Item</th>
            <th style="text-align: center;">Quantity</th>
            <th style="text-align: center;">Expiry Date</th>
            <th style="text-align: right;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${itemRowsHtml}
        </tbody>
      </table>

      <div class="tip-box">
        <strong>💡 Zero-Waste Suggestion:</strong> Don't let your food go to waste! Open the <strong>AI Recipe Generator</strong> in PantryPal AI to turn these expiring ingredients into a delicious meal today.
      </div>

      <div style="text-align: center; margin: 28px 0 10px 0;">
        <a href="${clientUrl}/recipes" class="btn">Generate Recipe with Ingredients</a>
        <a href="${clientUrl}/inventory" class="btn-secondary">View Pantry</a>
      </div>
    </div>

    <div class="footer">
      <p style="margin: 0 0 6px 0;">This alert was delivered to <strong>${notificationEmail}</strong> based on your notification settings.</p>
      <p style="margin: 0 0 6px 0;">To update your timing or turn off alerts, visit <a href="${clientUrl}/settings" style="color: #059669; text-decoration: underline;">Settings & Alerts</a>.</p>
      <p style="margin: 0;">© ${year} PantryPal AI. Smart Food Management.</p>
    </div>
  </div>
</body>
</html>
    `;
  }
}

export const emailService = new EmailService();
