import { supabase } from '@/lib/supabase';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  college: string;
  phone: string;
  year?: string;
  branch?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get user profile data from the users table
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

/**
 * Create or update user profile
 */
export const upsertUserProfile = async (profile: Omit<UserProfile, 'created_at' | 'updated_at'>): Promise<UserProfile | null> => {
  try {
    console.log('Upserting user profile:', profile);
    
    const { data, error } = await supabase
      .from('users')
      .upsert({
        ...profile,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting user profile:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return null;
    }

    console.log('Profile upserted successfully:', data);
    return data;
  } catch (error) {
    console.error('Error upserting user profile:', error);
    return null;
  }
};
