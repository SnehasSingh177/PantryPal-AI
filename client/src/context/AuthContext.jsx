import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      try {
        const demo = localStorage.getItem('pantrypal_demo_user');
        if (demo) setUser(JSON.parse(demo));
      } catch (e) {
        // ignore
      }
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email, password, fullName) => {
    if (!isSupabaseConfigured) {
      throw new Error('Authentication service is not configured. Please try again later.');
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    });
    if (error) throw error;
    return data;
  };

  const signIn = async (email, password) => {
    if (!isSupabaseConfigured) {
      throw new Error('Authentication service is not configured. Please try again later.');
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
  };

  const resetPassword = async (email) => {
    if (!isSupabaseConfigured) {
      throw new Error('Password reset service is not configured.');
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  const updateProfile = async ({ fullName, email }) => {
    const currentFullName = user?.user_metadata?.full_name || '';
    const currentEmail = user?.email || '';

    const trimmedName = fullName !== undefined ? fullName.trim() : undefined;
    const trimmedEmail = email !== undefined ? email.trim().toLowerCase() : undefined;

    const isNameChanged = Boolean(trimmedName !== undefined && trimmedName !== '' && trimmedName !== currentFullName);
    const isEmailChanged = Boolean(trimmedEmail !== undefined && trimmedEmail !== '' && trimmedEmail !== currentEmail.toLowerCase());

    if (!isNameChanged && !isEmailChanged) {
      return {
        user,
        nameUpdated: false,
        emailUpdated: false,
        emailConfirmationSent: false,
        message: 'No changes detected. Your profile is already up to date.',
      };
    }

    if (!isSupabaseConfigured) {
      // Local preview / demo fallback
      const updatedUser = {
        ...(user || {}),
        email: isEmailChanged && trimmedEmail ? trimmedEmail : currentEmail,
        user_metadata: {
          ...(user?.user_metadata || {}),
          full_name: isNameChanged && trimmedName ? trimmedName : (currentFullName || 'Chef User'),
        },
      };
      setUser(updatedUser);
      try {
        localStorage.setItem('pantrypal_demo_user', JSON.stringify(updatedUser));
      } catch (e) {
        // ignore
      }
      return {
        user: updatedUser,
        nameUpdated: isNameChanged,
        emailUpdated: isEmailChanged,
        emailConfirmationSent: false,
      };
    }

    if (!user?.id) {
      throw new Error('Please sign in to update your profile.');
    }

    let updatedUser = { ...user };
    let nameUpdateSuccess = false;
    let emailUpdateSuccess = false;
    let emailConfirmationSent = false;
    let emailErrorMsg = null;

    // 1. Update Display Name independently if changed
    if (isNameChanged) {
      const { data: nameData, error: nameErr } = await supabase.auth.updateUser({
        data: { full_name: trimmedName },
      });

      if (nameErr) {
        console.error('[AuthContext.updateProfile] Name update error:', nameErr);
        throw new Error(nameErr.message || 'Failed to update display name.');
      }

      // Also update public.profiles table for persistence
      try {
        await supabase
          .from('profiles')
          .update({
            full_name: trimmedName,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);
      } catch (profileErr) {
        console.warn('[AuthContext.updateProfile] Profile table sync warning:', profileErr);
      }

      nameUpdateSuccess = true;
      updatedUser = {
        ...updatedUser,
        ...(nameData?.user || {}),
        user_metadata: {
          ...(updatedUser.user_metadata || {}),
          ...(nameData?.user?.user_metadata || {}),
          full_name: trimmedName,
        },
      };
    }

    // 2. Update Email independently if changed
    if (isEmailChanged) {
      const { data: emailData, error: emailErr } = await supabase.auth.updateUser(
        { email: trimmedEmail },
        { emailRedirectTo: `${window.location.origin}/settings` }
      );

      if (emailErr) {
        console.error('[AuthContext.updateProfile] Email update error:', emailErr);
        let readableErr = emailErr.message || 'Failed to update email address.';
        if (readableErr.toLowerCase().includes('is invalid')) {
          readableErr = `Unable to send verification email to "${trimmedEmail}". Please use a valid, active email address.`;
        }

        // If name was also updated, don't throw and lose the name update
        if (isNameChanged) {
          emailErrorMsg = readableErr;
        } else {
          throw new Error(readableErr);
        }
      } else {
        emailUpdateSuccess = true;
        const newEmailPending = emailData?.user?.new_email;
        emailConfirmationSent = Boolean(newEmailPending);

        updatedUser = {
          ...updatedUser,
          ...(emailData?.user || {}),
          email: newEmailPending ? updatedUser.email : (emailData?.user?.email || trimmedEmail),
          new_email: newEmailPending || null,
          user_metadata: {
            ...(updatedUser.user_metadata || {}),
            ...(emailData?.user?.user_metadata || {}),
            full_name: trimmedName !== undefined ? trimmedName : (updatedUser.user_metadata?.full_name || currentFullName),
          },
        };
      }
    }

    // Update state so the sidebar and the rest of the application reflect the changes immediately
    setUser(updatedUser);

    return {
      user: updatedUser,
      nameUpdated: nameUpdateSuccess,
      emailUpdated: emailUpdateSuccess,
      emailConfirmationSent,
      newEmail: trimmedEmail,
      emailError: emailErrorMsg,
    };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isConfigured: isSupabaseConfigured,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
