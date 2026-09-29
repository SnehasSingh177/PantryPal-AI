import React, { useState, useEffect } from 'react';
import {
  Bell,
  Mail,
  User,
  Save,
  Check,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  Sparkles,
  Edit2,
  X,
  ShieldCheck,
  Send,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePantry } from '../context/PantryContext';
import { settingsService } from '../services/settingsService';
import { notificationService } from '../services/notificationService';

export const SettingsPage = () => {
  const { user, updateProfile } = useAuth();
  const { items } = usePantry();

  // Settings form states
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [notificationEmail, setNotificationEmail] = useState('');
  const [thresholdDays, setThresholdDays] = useState(3);
  const [lowStockAlerts, setLowStockAlerts] = useState(true);

  // Email transport & scheduler status
  const [transportStatus, setTransportStatus] = useState(null);
  const [schedulerStatus, setSchedulerStatus] = useState(null);

  // Loading & submission states for preferences
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Test email action states
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testEmailSuccess, setTestEmailSuccess] = useState(null);
  const [testEmailError, setTestEmailError] = useState(null);

  // Expiry reminders dispatch states
  const [isSendingReminders, setIsSendingReminders] = useState(false);
  const [remindersSuccess, setRemindersSuccess] = useState(null);
  const [remindersError, setRemindersError] = useState(null);

  // Profile form states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(user?.user_metadata?.full_name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(null);
  const [profileError, setProfileError] = useState(null);

  // Load preferences, backend transport status, and scheduler status on mount or user change
  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      setIsLoading(true);
      setSaveError(null);
      try {
        const [prefs, status, schedStatus] = await Promise.all([
          settingsService.getPreferences(user?.id, user),
          notificationService.getStatus(),
          notificationService.getSchedulerStatus(),
        ]);

        if (isMounted) {
          if (prefs) {
            setEmailAlerts(Boolean(prefs.email_notifications_enabled));
            setThresholdDays(Number(prefs.expiry_reminder_days) || 3);
            setLowStockAlerts(Boolean(prefs.low_stock_alerts_enabled));
            setNotificationEmail(prefs.notification_email || user?.email || '');
          }
          if (status) {
            setTransportStatus(status);
          }
          if (schedStatus) {
            setSchedulerStatus(schedStatus);
          }
        }
      } catch (err) {
        console.error('[SettingsPage] Error loading settings:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, [user?.id, user?.email]);

  // Keep profile inputs synchronized with auth user when not actively editing
  useEffect(() => {
    if (!isEditingProfile && user) {
      setProfileName(user?.user_metadata?.full_name || user?.email?.split('@')[0] || '');
      setProfileEmail(user?.email || '');
    }
  }, [user, isEditingProfile]);

  // Handle Save Preferences to database
  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    setSavedSuccess(false);

    // Validate notification email if email alerts are enabled
    if (emailAlerts) {
      const cleanEmail = (notificationEmail || '').trim();
      if (!cleanEmail) {
        setSaveError('Please enter a notification email address to receive alerts.');
        setIsSaving(false);
        return;
      }
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(cleanEmail)) {
        setSaveError('Please enter a valid notification email address (e.g., name@gmail.com).');
        setIsSaving(false);
        return;
      }
    }

    try {
      const updated = await settingsService.savePreferences(
        user?.id,
        {
          email_notifications_enabled: emailAlerts,
          notification_email: notificationEmail.trim(),
          expiry_reminder_days: thresholdDays,
          low_stock_alerts_enabled: lowStockAlerts,
        },
        user
      );

      setEmailAlerts(Boolean(updated.email_notifications_enabled));
      setThresholdDays(Number(updated.expiry_reminder_days) || 3);
      setLowStockAlerts(Boolean(updated.low_stock_alerts_enabled));
      setNotificationEmail(updated.notification_email || '');

      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
      }, 5000);
    } catch (err) {
      console.error('[SettingsPage] Save preferences error:', err);
      setSaveError(err.message || 'Failed to save preferences. Please check your network and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Send Test Email
  const handleSendTestEmail = async () => {
    setTestEmailError(null);
    setTestEmailSuccess(null);

    const targetEmail = (notificationEmail || '').trim();
    if (!targetEmail) {
      setTestEmailError('Please enter a notification email address first.');
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(targetEmail)) {
      setTestEmailError('Please enter a valid notification email format (e.g., name@gmail.com).');
      return;
    }

    setIsSendingTest(true);
    try {
      const response = await notificationService.sendTestEmail({
        toEmail: targetEmail,
        userName: user?.user_metadata?.full_name || 'Chef User',
        thresholdDays,
      });

      if (response.result?.previewUrl) {
        setTestEmailSuccess(
          <span>
            {response.message}{' '}
            <a
              href={response.result.previewUrl}
              target="_blank"
              rel="noreferrer"
              className="underline font-bold text-emerald-800 hover:text-emerald-950 ml-1 inline-flex items-center gap-0.5"
            >
              <span>View Delivered Email Preview</span> ↗
            </a>
          </span>
        );
      } else {
        setTestEmailSuccess(response.message || `Test email dispatched to ${targetEmail}! Please check your inbox.`);
      }
      setTimeout(() => setTestEmailSuccess(null), 10000);
    } catch (err) {
      console.error('[SettingsPage] Test email error:', err);
      setTestEmailError(err.message || 'Failed to dispatch test email.');
    } finally {
      setIsSendingTest(false);
    }
  };

  // Handle Send Expiry Alerts Now
  const handleSendExpiryRemindersNow = async () => {
    setRemindersError(null);
    setRemindersSuccess(null);

    const targetEmail = (notificationEmail || '').trim();
    if (!targetEmail) {
      setRemindersError('Please enter and save a notification email address first.');
      return;
    }

    setIsSendingReminders(true);
    try {
      const response = await notificationService.sendExpiryReminders({
        toEmail: targetEmail,
        userName: user?.user_metadata?.full_name || 'Chef User',
        thresholdDays,
        items: items || [],
      });

      if (response.sent) {
        if (response.result?.previewUrl) {
          setRemindersSuccess(
            <span>
              {response.message}{' '}
              <a
                href={response.result.previewUrl}
                target="_blank"
                rel="noreferrer"
                className="underline font-bold text-emerald-800 hover:text-emerald-950 ml-1 inline-flex items-center gap-0.5"
              >
                <span>View Delivered Email Preview</span> ↗
              </a>
            </span>
          );
        } else {
          setRemindersSuccess(response.message || `Expiry alert sent for ${response.count} item(s)!`);
        }
      } else {
        setRemindersSuccess(response.message || `No pantry items are expiring within ${thresholdDays} day(s).`);
      }
      setTimeout(() => setRemindersSuccess(null), 10000);
    } catch (err) {
      console.error('[SettingsPage] Expiry reminder error:', err);
      setRemindersError(err.message || 'Failed to send expiry reminder email.');
    } finally {
      setIsSendingReminders(false);
    }
  };

  // Email format & domain validation helper for Login Profile
  const validateEmailFormat = (email) => {
    if (!email || typeof email !== 'string') {
      return { isValid: false, error: 'Email address cannot be empty.' };
    }
    const trimmed = email.trim();
    if (!trimmed) {
      return { isValid: false, error: 'Email address cannot be empty.' };
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmed)) {
      return { isValid: false, error: 'Please enter a valid email format (e.g., name@gmail.com).' };
    }
    const domain = trimmed.split('@')[1]?.toLowerCase();
    const testDomains = ['example.com', 'test.com', 'sample.com', 'dummy.com', 'fake.com', 'domain.com'];
    if (testDomains.includes(domain)) {
      return {
        isValid: false,
        error: `"${domain}" is a reserved test domain and cannot receive verification emails. Please use an active email provider (e.g., Gmail, Outlook, Yahoo).`,
      };
    }
    return { isValid: true, email: trimmed.toLowerCase() };
  };

  // Profile Action Handlers (Independent login credentials)
  const handleStartEditProfile = () => {
    setProfileName(user?.user_metadata?.full_name || '');
    setProfileEmail(user?.email || '');
    setProfileError(null);
    setProfileSuccess(null);
    setIsEditingProfile(true);
  };

  const handleCancelEditProfile = () => {
    setProfileName(user?.user_metadata?.full_name || '');
    setProfileEmail(user?.email || '');
    setProfileError(null);
    setIsEditingProfile(false);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    const trimmedName = profileName.trim();
    const trimmedEmail = profileEmail.trim();

    const currentFullName = user?.user_metadata?.full_name || '';
    const currentEmail = user?.email || '';

    const isNameChanged = Boolean(trimmedName !== currentFullName);
    const isEmailChanged = Boolean(trimmedEmail && trimmedEmail.toLowerCase() !== currentEmail.toLowerCase());

    // If nothing changed, exit edit mode smoothly
    if (!isNameChanged && !isEmailChanged) {
      setIsEditingProfile(false);
      setProfileSuccess('No changes detected. Your profile is already up to date.');
      setTimeout(() => setProfileSuccess(null), 4000);
      return;
    }

    // Name validation
    if (isNameChanged && !trimmedName) {
      setProfileError('Display Name cannot be empty.');
      return;
    }

    // Email validation (only validate if the user actively modified the login email)
    let validatedEmail = undefined;
    if (isEmailChanged) {
      const emailValidation = validateEmailFormat(trimmedEmail);
      if (!emailValidation.isValid) {
        setProfileError(emailValidation.error);
        return;
      }
      validatedEmail = emailValidation.email;
    }

    setIsSavingProfile(true);
    try {
      const result = await updateProfile({
        fullName: isNameChanged ? trimmedName : undefined,
        email: isEmailChanged ? validatedEmail : undefined,
      });

      // Contextual feedback based on what succeeded
      if (result?.nameUpdated && result?.emailUpdated) {
        if (result?.emailConfirmationSent) {
          setProfileSuccess(
            `Display name updated! A verification email has been sent to "${result.newEmail}". Please check your inbox and click the link to confirm your new login email.`
          );
        } else {
          setProfileSuccess('Display name and login email updated successfully!');
        }
      } else if (result?.nameUpdated && result?.emailError) {
        setProfileSuccess('Display name updated successfully! Changes appear across the app.');
        setProfileError(`Email could not be updated: ${result.emailError}`);
      } else if (result?.nameUpdated) {
        setProfileSuccess('Display name updated successfully! Changes are now reflected across PantryPal AI.');
      } else if (result?.emailUpdated) {
        if (result?.emailConfirmationSent) {
          setProfileSuccess(
            `Verification email sent to "${result.newEmail}". Please check your inbox and click the confirmation link to update your login email.`
          );
        } else {
          setProfileSuccess(`Login email updated successfully to "${result.newEmail}"!`);
        }
      } else {
        setProfileSuccess('Profile is up to date.');
      }

      setIsEditingProfile(false);
      setTimeout(() => {
        setProfileSuccess(null);
      }, 6000);
    } catch (err) {
      console.error('[SettingsPage] Error saving profile:', err);
      let errMsg = err.message || 'Failed to update profile. Please try again.';
      if (errMsg.toLowerCase().includes('is invalid')) {
        errMsg = 'The email address could not be validated. Please ensure it is a valid, active email address.';
      }
      setProfileError(errMsg);
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in pb-12 relative z-10">
      {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-[#F4D98A] shadow-sm bg-white shrink-0">
            <img src="/assets/3d_lemon.jpg" alt="Settings" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#1E2E24] flex items-center gap-2">
                <span>Settings & Alerts</span>
              </h1>
              <span className="text-xs px-3 py-0.5 rounded-full bg-[#DCEBDD] text-[#315C45] font-semibold border border-[#c2dec5] shadow-xs flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#D97B5B]" />
                <span>Preferences ✨</span>
              </span>
            </div>
            <p className="text-sm sm:text-base text-[#343A35] font-normal mt-0.5 leading-relaxed">
              Configure real email expiry reminders, reminder thresholds, and account profile details.
            </p>
          </div>
        </div>

        {/* Preferences Notification Banner (Success) */}
        {savedSuccess && (
          <div className="p-4 rounded-2xl bg-kawaii-mint/60 border border-kawaii-forest/30 text-kawaii-forest text-xs flex items-center gap-3 animate-fade-in shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-kawaii-forest shrink-0" />
            <div className="flex-1">
              <p className="font-display font-bold text-kawaii-forest text-sm">Preferences Saved Successfully! 🎉</p>
              <p className="text-[#315C45] font-medium mt-0.5">
                Your notification email and reminder thresholds have been securely saved and activated.
              </p>
            </div>
          </div>
        )}

        {/* Preferences Notification Banner (Error) */}
        {saveError && (
          <div className="p-4 rounded-2xl bg-kawaii-terracotta/15 border border-kawaii-terracotta/30 text-kawaii-terracotta text-xs flex items-center gap-3 animate-shake">
            <AlertCircle className="w-5 h-5 text-kawaii-terracotta shrink-0" />
            <div className="flex-1">
              <p className="font-display font-bold text-kawaii-terracotta text-sm">Unable to Save Preferences</p>
              <p className="mt-0.5 text-[#343A35]">{saveError}</p>
            </div>
          </div>
        )}

        {/* Email Notification Preferences Card & Form */}
        <form onSubmit={handleSavePreferences} className="space-y-4">
          <div className="card-kawaii p-6 bg-white border-kawaii-border relative overflow-hidden shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-kawaii-border/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-kawaii-mint/60 text-kawaii-forest flex items-center justify-center border border-kawaii-forest/20 shadow-xs">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-display font-bold text-kawaii-espresso">Automated Expiry Reminders</h3>
                  <p className="text-sm text-[#343A35] font-normal leading-relaxed mt-0.5">
                    Real email alerts dispatched when pantry items approach their expiration date
                  </p>
                </div>
              </div>

            {/* Email Dispatch Readiness & Scheduler Indicators */}
            <div className="flex flex-wrap items-center gap-2">
              {schedulerStatus?.isRunning && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-kawaii-mint/70 text-kawaii-forest border border-kawaii-forest/20 shadow-xs">
                  <Clock className="w-3.5 h-3.5 text-kawaii-forest" />
                  <span>Daily Auto-Check Active (9:00 AM)</span>
                </span>
              )}

              {transportStatus && (
                <div>
                  {transportStatus.configured ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-kawaii-mint/70 text-kawaii-forest border border-kawaii-forest/20 shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-kawaii-forest animate-pulse"></span>
                      <span>Live Delivery Active</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-kawaii-butter/40 text-[#8A5B10] border border-[#E2BC55]/40 shadow-xs">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#8A5B10]" />
                      <span>Setup Key Needed</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Email Service Setup Notice (Shown if backend Resend/SMTP is unconfigured) */}
          {transportStatus && !transportStatus.configured && (
            <div className="mb-5 p-4 bg-kawaii-butter/30 border border-[#E2BC55]/40 rounded-2xl text-xs text-[#6B460C] flex items-start gap-3 animate-fade-in">
              <AlertTriangle className="w-4 h-4 text-[#8A5B10] shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-display font-bold text-[#6B460C] text-sm">Backend Email Dispatch Configuration Required</p>
                <p className="mt-1 leading-relaxed text-xs text-[#5C3D0A]">
                  To deliver real emails to inboxes, add your <code className="bg-white px-1.5 py-0.5 rounded-md border border-[#E2BC55]/50 font-mono text-[11px] text-kawaii-espresso">RESEND_API_KEY</code> to <code className="bg-white px-1.5 py-0.5 rounded-md border border-[#E2BC55]/50 font-mono text-[11px] text-kawaii-espresso">server/.env</code> (obtain a free key at <a href="https://resend.com/api-keys" target="_blank" rel="noreferrer" className="underline font-bold text-kawaii-forest hover:text-kawaii-espresso">resend.com/api-keys</a>) or configure SMTP settings.
                </p>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-8 h-8 text-kawaii-forest animate-spin mx-auto mb-2" />
              <p className="text-sm font-bold text-[#315C45]">Loading your saved preferences...</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Toggle: Enable Email Alerts */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <label htmlFor="email-alerts-toggle" className="text-base font-bold text-kawaii-espresso block cursor-pointer">
                    Enable Expiry Email Alerts 📬
                  </label>
                  <p className="text-sm text-[#343A35] font-normal leading-relaxed mt-1">
                    Automatically dispatch alerts when grocery items enter your expiry window
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    id="email-alerts-toggle"
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6.5 bg-kawaii-border/60 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-kawaii-border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-kawaii-forest shadow-inner"></div>
                </label>
              </div>

              {/* Notification Email Field & Send Test Email Button */}
              <div className={`pt-5 border-t border-kawaii-border/60 transition-opacity ${emailAlerts ? 'opacity-100' : 'opacity-60'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                  <div>
                    <label htmlFor="notification-email-input" className="text-base font-bold text-kawaii-espresso block">
                      Notification Email Address
                    </label>
                    <p className="text-sm text-[#343A35] font-normal leading-relaxed mt-1">
                      Expiry alerts will be delivered to this address without changing your login email.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 mt-2">
                  <div className="relative flex-1">
                    <Mail className="w-4 h-4 text-[#66736A] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="notification-email-input"
                      type="email"
                      disabled={!emailAlerts}
                      value={notificationEmail}
                      onChange={(e) => setNotificationEmail(e.target.value)}
                      placeholder="e.g. alerts@yourdomain.com"
                      className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-kawaii-border text-sm font-medium text-kawaii-espresso bg-white placeholder:text-[#88968C] focus:outline-none focus:ring-2 focus:ring-kawaii-forest/20 focus:border-kawaii-forest disabled:bg-kawaii-cream/50 disabled:text-[#66736A] transition-all shadow-xs"
                    />
                  </div>

                  <button
                    type="button"
                    id="send-test-email-btn"
                    onClick={handleSendTestEmail}
                    disabled={!emailAlerts || isSendingTest || !notificationEmail}
                    className="btn-secondary text-xs font-semibold py-2.5 px-4 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                  >
                    {isSendingTest ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending Test...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5 text-kawaii-forest" />
                        <span>Send Test Email</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Resend Sender & Testing Mode Info Tip */}
                <div className="mt-3 p-3.5 bg-[#FFFDF9] rounded-2xl border border-kawaii-border text-xs text-[#343A35] flex items-start gap-2.5 leading-relaxed">
                  <span className="font-bold text-[#315C45] shrink-0">Resend Tip:</span>
                  <span>
                    When using Resend's default test sender (<code className="font-mono text-[#315C45] font-semibold bg-[#DCEBDD] px-1.5 py-0.5 rounded text-[11px]">onboarding@resend.dev</code>), Resend sends test emails to your registered Resend account email. To deliver alerts to other email domains, verify your domain in the Resend dashboard.
                  </span>
                </div>

                {/* Test Email Feedback Banners */}
                {testEmailSuccess && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-kawaii-mint/60 border border-kawaii-forest/30 text-kawaii-forest text-xs flex items-center gap-2 animate-fade-in shadow-xs">
                    <CheckCircle2 className="w-4 h-4 text-kawaii-forest shrink-0" />
                    <span className="font-bold">{testEmailSuccess}</span>
                  </div>
                )}
                {testEmailError && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-kawaii-terracotta/15 border border-kawaii-terracotta/30 text-kawaii-terracotta text-xs flex items-start gap-2 animate-shake">
                    <AlertCircle className="w-4 h-4 text-kawaii-terracotta shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-bold text-kawaii-terracotta">Test Email Delivery Failed</p>
                      <p className="mt-0.5 text-kawaii-terracotta/90">{testEmailError}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Dropdown: Reminder Timing */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-5 border-t border-kawaii-border/60">
                <div>
                  <label htmlFor="reminder-timing-select" className="text-base font-bold text-kawaii-espresso block">
                    Reminder Timing
                  </label>
                  <p className="text-sm text-[#343A35] font-normal leading-relaxed mt-1">
                    How many days before an item's expiration date to dispatch the alert
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#66736A] shrink-0" />
                  <select
                    id="reminder-timing-select"
                    value={thresholdDays}
                    onChange={(e) => setThresholdDays(Number(e.target.value))}
                    disabled={!emailAlerts}
                    className="px-4 py-2.5 rounded-2xl border border-kawaii-border text-sm bg-white font-bold text-kawaii-espresso focus:outline-none focus:ring-2 focus:ring-kawaii-forest/20 focus:border-kawaii-forest disabled:opacity-50 disabled:bg-kawaii-cream/50 cursor-pointer shadow-xs"
                  >
                    <option value={1}>1 Day Before Expiry</option>
                    <option value={2}>2 Days Before Expiry</option>
                    <option value={3}>3 Days Before (Recommended ⭐)</option>
                    <option value={5}>5 Days Before Expiry</option>
                    <option value={7}>1 Week Before Expiry</option>
                  </select>
                </div>
              </div>

              {/* Toggle: Low Stock Warnings */}
              <div className="flex items-center justify-between gap-4 pt-5 border-t border-kawaii-border/60">
                <div>
                  <label htmlFor="low-stock-toggle" className="text-base font-bold text-kawaii-espresso block cursor-pointer">
                    Low Stock Warnings 🧺
                  </label>
                  <p className="text-sm text-[#343A35] font-normal leading-relaxed mt-1">
                    Notify when pantry staples or essentials reach low quantity thresholds
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    id="low-stock-toggle"
                    type="checkbox"
                    checked={lowStockAlerts}
                    onChange={(e) => setLowStockAlerts(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6.5 bg-kawaii-border/60 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-kawaii-border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-kawaii-forest shadow-inner"></div>
                </label>
              </div>

              {/* Check & Send Expiry Alerts Now Footer Bar */}
              {emailAlerts && (
                <div className="pt-4 border-t border-kawaii-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 bg-kawaii-cream/60 -mx-6 -mb-6 p-5 rounded-b-2xl border-t border-kawaii-border">
                  <div className="text-sm text-[#343A35] leading-relaxed">
                    <span className="font-bold text-[#315C45]">Instant Expiry Check:</span> Send an immediate alert for items expiring within your {thresholdDays}-day window.
                  </div>

                  <button
                    type="button"
                    id="send-reminders-now-btn"
                    onClick={handleSendExpiryRemindersNow}
                    disabled={isSendingReminders || !notificationEmail}
                    className="btn-terracotta text-xs px-4 py-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer font-semibold"
                  >
                    {isSendingReminders ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Checking & Sending...</span>
                      </>
                    ) : (
                      <>
                        <Bell className="w-3.5 h-3.5" />
                        <span>Send Expiry Alerts Now</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Reminders Dispatch Feedback Banners */}
              {remindersSuccess && (
                <div className="mt-3 p-3.5 rounded-2xl bg-kawaii-mint/60 border border-kawaii-forest/30 text-kawaii-forest text-xs flex items-center gap-2 animate-fade-in shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-kawaii-forest shrink-0" />
                  <span className="font-semibold">{remindersSuccess}</span>
                </div>
              )}
              {remindersError && (
                <div className="mt-3 p-3.5 rounded-2xl bg-kawaii-terracotta/15 border border-kawaii-terracotta/30 text-kawaii-terracotta text-xs flex items-start gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 text-kawaii-terracotta shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-kawaii-terracotta">Expiry Reminder Notice</p>
                    <p className="mt-0.5 text-kawaii-terracotta/90 font-normal">{remindersError}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Save Preferences Button Area */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {savedSuccess && (
            <span className="text-xs font-semibold text-kawaii-forest bg-kawaii-mint/60 border border-kawaii-forest/30 px-3.5 py-2 rounded-2xl flex items-center gap-1.5 animate-fade-in shadow-xs">
              <Check className="w-4 h-4 text-kawaii-forest stroke-[2.5]" />
              <span>Preferences Saved!</span>
            </span>
          )}

          <button
            type="submit"
            id="save-preferences-btn"
            disabled={isLoading || isSaving}
            className="btn-primary flex items-center gap-2 text-sm px-6 py-2.5 disabled:opacity-60 cursor-pointer font-semibold"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving Preferences...</span>
              </>
            ) : savedSuccess ? (
              <>
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Saved ✨</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Preferences</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* User Profile Card (Independent Authentication Credentials) */}
      <div className={`card-kawaii p-6 bg-white border-kawaii-border transition-all duration-200 shadow-xs ${isEditingProfile ? 'ring-2 ring-kawaii-forest/30 border-kawaii-forest' : ''}`}>
        <div className="flex items-center justify-between gap-3 mb-5 pb-4 border-b border-kawaii-border/60">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors shadow-xs ${
              isEditingProfile ? 'bg-kawaii-forest text-white' : 'bg-kawaii-mint/60 text-kawaii-forest border border-kawaii-forest/20'
            }`}>
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-display font-semibold text-kawaii-espresso">User Profile</h3>
                {isEditingProfile && (
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-kawaii-butter/40 text-[#8A5B10] border border-[#E2BC55]/40 shadow-xs">
                    Editing Mode ✏️
                  </span>
                )}
              </div>
              <p className="text-sm text-[#343A35] font-normal leading-relaxed mt-0.5">
                {isEditingProfile
                  ? 'Update your display name and login email address'
                  : 'Your personal details and account credentials'}
              </p>
            </div>
          </div>

          {/* Edit Profile Button (Header Action when not editing) */}
          {!isEditingProfile && (
            <button
              type="button"
              id="edit-profile-btn"
              onClick={handleStartEditProfile}
              className="btn-secondary text-xs font-semibold px-4 py-2 flex items-center gap-1.5 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-kawaii-forest" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>

        {/* Profile Success Banner */}
        {profileSuccess && (
          <div className="mb-4 p-4 rounded-2xl bg-kawaii-mint/60 border border-kawaii-forest/30 text-kawaii-forest text-xs flex items-center gap-2.5 animate-fade-in shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-kawaii-forest shrink-0" />
            <div className="flex-1">
              <p className="font-display font-bold text-kawaii-forest text-sm">Profile Updated Successfully! 🎉</p>
              <p className="text-[#315C45] font-medium mt-0.5">{profileSuccess}</p>
            </div>
          </div>
        )}

        {/* Profile Error Banner */}
        {profileError && (
          <div className="mb-4 p-4 rounded-2xl bg-kawaii-terracotta/15 border border-kawaii-terracotta/30 text-kawaii-terracotta text-xs flex items-center gap-2.5 animate-shake">
            <AlertCircle className="w-5 h-5 text-kawaii-terracotta shrink-0" />
            <div className="flex-1">
              <p className="font-display font-bold text-kawaii-terracotta text-sm">Update Failed</p>
              <p className="mt-0.5 text-[#343A35]">{profileError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="profile-display-name"
                className="block text-xs font-bold text-kawaii-espresso uppercase tracking-wider mb-1"
              >
                Display Name {isEditingProfile && <span className="text-kawaii-terracotta">*</span>}
              </label>
              <div className="relative">
                <input
                  id="profile-display-name"
                  type="text"
                  disabled={!isEditingProfile || isSavingProfile}
                  readOnly={!isEditingProfile}
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Enter display name"
                  className={`w-full px-4 py-2.5 rounded-2xl border text-sm font-medium transition-all ${
                    isEditingProfile
                      ? 'bg-white border-kawaii-border text-kawaii-espresso placeholder:text-[#88968C] focus:outline-none focus:ring-2 focus:ring-kawaii-forest/20 focus:border-kawaii-forest shadow-xs cursor-text'
                      : 'bg-kawaii-cream/50 border-kawaii-border text-[#343A35] font-medium cursor-not-allowed select-none'
                  }`}
                />
              </div>
              {isEditingProfile && (
                <p className="text-xs text-[#66736A] mt-1.5 font-medium">
                  Your name displayed in the sidebar and greetings.
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="profile-registered-email"
                className="block text-xs font-bold text-kawaii-espresso uppercase tracking-wider mb-1"
              >
                Registered Email (Login) {isEditingProfile && <span className="text-kawaii-terracotta">*</span>}
              </label>
              <div className="relative">
                <input
                  id="profile-registered-email"
                  type="email"
                  disabled={!isEditingProfile || isSavingProfile}
                  readOnly={!isEditingProfile}
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  placeholder="Enter registered email"
                  className={`w-full px-4 py-2.5 rounded-2xl border text-sm font-medium transition-all ${
                    isEditingProfile
                      ? 'bg-white border-kawaii-border text-kawaii-espresso placeholder:text-[#88968C] focus:outline-none focus:ring-2 focus:ring-kawaii-forest/20 focus:border-kawaii-forest shadow-xs cursor-text'
                      : 'bg-kawaii-cream/50 border-kawaii-border text-[#343A35] font-medium cursor-not-allowed select-none'
                  }`}
                />
              </div>
              {user?.new_email && (
                <div className="mt-1.5 text-xs bg-kawaii-butter/40 border border-[#E2BC55]/40 text-[#8A5B10] rounded-xl p-2.5 flex items-center gap-1.5 animate-fade-in font-medium">
                  <Mail className="w-3.5 h-3.5 text-[#8A5B10] shrink-0" />
                  <span>Pending verification: <strong className="font-bold text-[#6B460C]">{user.new_email}</strong></span>
                </div>
              )}
              {isEditingProfile && (
                <p className="text-xs text-[#66736A] mt-1.5 font-medium">
                  Used for signing in to your PantryPal AI account.
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons for User Profile */}
          {isEditingProfile && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-kawaii-border/60 animate-fade-in">
              <p className="text-xs text-[#343A35] font-medium flex items-center gap-1.5 order-2 sm:order-1">
                <ShieldCheck className="w-4 h-4 text-kawaii-forest shrink-0" />
                <span>Changes will update your credentials and appear across the app.</span>
              </p>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end order-1 sm:order-2">
                <button
                  type="button"
                  id="cancel-profile-btn"
                  disabled={isSavingProfile}
                  onClick={handleCancelEditProfile}
                  className="btn-secondary text-xs px-4 py-2 font-semibold cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>

                <button
                  type="submit"
                  id="save-profile-btn"
                  disabled={isSavingProfile}
                  className="btn-primary flex items-center gap-1.5 text-xs px-5 py-2 disabled:opacity-60 cursor-pointer font-semibold"
                >
                  {isSavingProfile ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Changes ✨</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

