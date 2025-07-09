/**
 * Admin Configuration - Database-Driven Approach
 * Admins are managed through the admin_emails table in the database
 */

import { supabase } from '@/lib/supabase';

/**
 * Admin roles and permissions
 */
export const ADMIN_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  COORDINATOR: 'coordinator',
  FINANCE: 'finance',
} as const;

export type AdminRole = typeof ADMIN_ROLES[keyof typeof ADMIN_ROLES];

/**
 * Check if an email address has admin privileges (database-driven)
 * This function queries the admin_emails table in real-time
 */
export const isAdminEmail = async (email: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('admin_emails')
      .select('email')
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * Get admin role for an email address
 */
export const getAdminRole = async (email: string): Promise<AdminRole | null> => {
  try {
    const { data, error } = await supabase
      .from('admin_emails')
      .select('role')
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return null;
    }

    return data.role as AdminRole;
  } catch (error) {
    console.error('Error getting admin role:', error);
    return null;
  }
};

/**
 * Synchronous version for components that need immediate check
 * Uses cached admin list - should be used sparingly
 */
let adminEmailsCache: string[] = [];
let lastCacheUpdate = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const isAdminEmailSync = (email: string): boolean => {
  // Use cache if available and recent
  if (adminEmailsCache.length > 0 && Date.now() - lastCacheUpdate < CACHE_DURATION) {
    return adminEmailsCache.includes(email.toLowerCase());
  }
  
  // For immediate checks without waiting for async, check against fallback list
  // This is only used as a fallback when the async check can't be performed
  const fallbackAdmins = [
    'admin@spandan2025.com',
    'admin@fest2024.com'
  ];
  
  return fallbackAdmins.includes(email.toLowerCase());
};

/**
 * Update the admin emails cache
 */
export const updateAdminCache = async (): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('admin_emails')
      .select('email')
      .eq('is_active', true);

    if (!error && data) {
      adminEmailsCache = data.map(admin => admin.email.toLowerCase());
      lastCacheUpdate = Date.now();
    }
  } catch (error) {
    console.error('Error updating admin cache:', error);
  }
};

/**
 * Initialize admin cache on module load
 */
updateAdminCache();

/**
 * Admin management functions
 */
export const adminService = {
  /**
   * Add a new admin email
   */
  async addAdmin(email: string, role: AdminRole = ADMIN_ROLES.ADMIN): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('admin_emails')
        .insert({
          email: email.toLowerCase(),
          role,
          is_active: true
        });

      if (error) {
        console.error('Error adding admin:', error);
        return false;
      }

      // Update cache
      await updateAdminCache();
      return true;
    } catch (error) {
      console.error('Error adding admin:', error);
      return false;
    }
  },

  /**
   * Remove an admin email (deactivate)
   */
  async removeAdmin(email: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('admin_emails')
        .update({ is_active: false })
        .eq('email', email.toLowerCase());

      if (error) {
        console.error('Error removing admin:', error);
        return false;
      }

      // Update cache
      await updateAdminCache();
      return true;
    } catch (error) {
      console.error('Error removing admin:', error);
      return false;
    }
  },

  /**
   * Get all active admins
   */
  async getAllAdmins() {
    try {
      const { data, error } = await supabase
        .from('admin_emails')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching admins:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching admins:', error);
      return [];
    }
  }
};
