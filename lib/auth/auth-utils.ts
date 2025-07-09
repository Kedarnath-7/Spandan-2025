import { supabase } from '@/lib/supabase';
import { isAdminEmailSync } from '@/lib/config/admin';
import { upsertUserProfile } from '@/lib/services/userProfile';
import type { User } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  isAdmin: boolean;
  emailVerified: boolean;
}

/**
 * Get current authenticated user
 */
export const getCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.name || user.email?.split('@')[0],
      isAdmin: isAdminEmailSync(user.email!),
      emailVerified: user.email_confirmed_at !== null,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Sign up new user with email verification (minimal signup - just name as metadata)
 */
export const signUpUser = async (
  email: string, 
  password: string, 
  name: string
) => {
  try {
    console.log('Starting simple signup process for:', email);
    console.log('Name to store as metadata:', name);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
        emailRedirectTo: `${window.location.origin}/auth/verify-email`,
      },
    });

    if (error) {
      console.error('Auth signup error:', error);
      // Enhanced error handling for better user experience
      if (error.message?.includes('already registered') || 
          error.message?.includes('already been registered')) {
        throw new Error('This email is already registered. Please try logging in instead.');
      } else if (error.message?.includes('Invalid email')) {
        throw new Error('Please enter a valid email address.');
      } else if (error.message?.includes('Password should be')) {
        throw new Error('Password must be at least 6 characters long.');
      } else if (error.message?.includes('signup is disabled')) {
        throw new Error('Account registration is currently disabled. Please contact support.');
      }
      throw error;
    }

    // For simple signup, we only store auth data + name metadata
    // Profile completion will happen during registration
    if (data?.user) {
      console.log('User created successfully with ID:', data.user.id);
      console.log('Name stored in metadata:', data.user.user_metadata?.name);
    }

    return { data, error: null };
  } catch (error) {
    console.error('Sign up error:', error);
    return { data: null, error };
  }
};

/**
 * Sign in user
 */
export const signInUser = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Sign in error:', error);
    return { data: null, error };
  }
};

/**
 * Sign out user
 */
export const signOutUser = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    return { error: null };
  } catch (error) {
    console.error('Sign out error:', error);
    return { error };
  }
};

/**
 * Reset password
 */
export const resetPassword = async (email: string) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      throw error;
    }

    return { error: null };
  } catch (error) {
    console.error('Reset password error:', error);
    return { error };
  }
};

/**
 * Update password with comprehensive error handling
 */
export const updatePasswordSafely = async (newPassword: string) => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      // Handle specific Supabase error messages
      if (error.message?.includes('New password should be different')) {
        throw new Error('New password must be different from your current password');
      } else if (error.message?.includes('Password should be')) {
        throw new Error('Password must be at least 6 characters long');
      } else if (error.message?.includes('Auth session missing')) {
        throw new Error('Your session has expired. Please log in again to change your password.');
      } else if (error.message?.includes('User not found') || error.message?.includes('Invalid')) {
        throw new Error('Authentication failed. Please log in again to change your password.');
      }
      
      // Generic error fallback
      throw new Error(error.message || 'Failed to update password');
    }

    return { success: true };
  } catch (error) {
    console.error('Update password error:', error);
    throw error;
  }
};

/**
 * Update password (simple version - for backward compatibility)
 */
export const updatePassword = async (newPassword: string) => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw error;
    }

    return { error: null };
  } catch (error) {
    console.error('Update password error:', error);
    throw error; // Throw the error instead of returning it
  }
};

/**
 * Resend email verification
 */
export const resendEmailVerification = async (email: string) => {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/verify-email`,
      },
    });

    if (error) {
      throw error;
    }

    return { error: null };
  } catch (error) {
    console.error('Resend verification error:', error);
    return { error };
  }
};
