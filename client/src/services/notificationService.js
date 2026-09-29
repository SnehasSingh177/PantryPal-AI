/**
 * Service to manage backend email notifications, test dispatches, and status checks
 */
export const notificationService = {
  /**
   * Check backend email transport configuration status
   * @returns {Promise<{ configured: boolean, provider: string|null, sender: string|null, reason: string|null }>}
   */
  async getStatus() {
    try {
      const response = await fetch('/api/notifications/status');
      if (!response.ok) {
        throw new Error('Failed to retrieve notification service status.');
      }
      return await response.json();
    } catch (err) {
      console.error('[notificationService.getStatus] Error:', err);
      return {
        configured: false,
        provider: null,
        sender: null,
        reason: err.message || 'Notification service unreachable.',
      };
    }
  },

  /**
   * Send a test email to the user's notification email address
   * @param {Object} params - { toEmail, userName, thresholdDays }
   * @returns {Promise<{ success: boolean, message: string, result?: Object }>}
   */
  async sendTestEmail({ toEmail, userName, thresholdDays }) {
    if (!toEmail || typeof toEmail !== 'string' || !toEmail.includes('@')) {
      throw new Error('Please enter a valid notification email address.');
    }

    const response = await fetch('/api/notifications/test-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        toEmail: toEmail.trim(),
        userName: userName || 'Chef',
        thresholdDays: thresholdDays || 3,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data?.error || 'Failed to dispatch test email.';
      const err = new Error(errorMsg);
      err.configured = data?.configured !== undefined ? data.configured : true;
      throw err;
    }

    return data;
  },

  /**
   * Trigger an automated expiry reminder email for items approaching expiration
   * @param {Object} params - { toEmail, userName, thresholdDays, items }
   * @returns {Promise<{ success: boolean, sent: boolean, count: number, message: string }>}
   */
  async sendExpiryReminders({ toEmail, userName, thresholdDays, items }) {
    if (!toEmail || typeof toEmail !== 'string' || !toEmail.includes('@')) {
      throw new Error('Please specify a valid notification email address to receive expiry alerts.');
    }

    const response = await fetch('/api/notifications/send-reminders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        toEmail: toEmail.trim(),
        userName: userName || 'Chef',
        thresholdDays: thresholdDays || 3,
        items: items || [],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data?.error || 'Failed to dispatch expiry reminders.';
      const err = new Error(errorMsg);
      err.configured = data?.configured !== undefined ? data.configured : true;
      throw err;
    }

    return data;
  },

  /**
   * Get the real-time status of the automated background cron scheduler
   * @returns {Promise<Object>}
   */
  async getSchedulerStatus() {
    try {
      const response = await fetch('/api/notifications/scheduler-status');
      if (!response.ok) {
        throw new Error('Failed to retrieve scheduler status.');
      }
      return await response.json();
    } catch (err) {
      console.error('[notificationService.getSchedulerStatus] Error:', err);
      return {
        isRunning: false,
        cronEnabled: false,
        error: err.message,
      };
    }
  },

  /**
   * Trigger the automated cron job manually or via webhook
   * @param {Object} [options]
   * @returns {Promise<Object>}
   */
  async triggerCronJob(options = {}) {
    const response = await fetch('/api/notifications/run-cron', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || 'Failed to trigger cron job.');
    }
    return data;
  },
};

