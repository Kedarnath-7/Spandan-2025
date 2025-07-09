import { supabase } from '@/lib/supabase';

export interface UnifiedRegistration {
  id: string;
  
  // User information (stored directly in unified table)
  user_email: string;
  user_name: string;
  user_phone: string;
  user_college: string;
  user_year?: string;
  user_branch?: string;
  
  // Registration details
  registration_tier: string;
  total_amount: number;
  
  // Payment information (stored directly in unified table)
  payment_transaction_id: string;
  payment_screenshot: string; // This is aliased from payment_screenshot_path in admin view
  payment_amount: number;
  
  // Registration status and management
  status: 'pending' | 'approved' | 'rejected';
  delegate_id?: string;
  
  // Admin review information
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Selected events (joined from junction table)
  selected_events: Array<{
    id: string;
    name: string;
    category: string;
    price: number;
  }>;
}

export class UnifiedRegistrationService {
  /**
   * Get all unified registrations for admin
   */
  static async getAllUnifiedRegistrations(): Promise<UnifiedRegistration[]> {
    try {
      const { data, error } = await supabase
        .from('admin_unified_registrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching unified registrations:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Get all unified registrations error:', error);
      throw error;
    }
  }

  /**
   * Get unified registration by ID
   */
  static async getUnifiedRegistrationById(id: string): Promise<UnifiedRegistration | null> {
    try {
      const { data, error } = await supabase
        .from('admin_unified_registrations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching unified registration:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Get unified registration by ID error:', error);
      throw error;
    }
  }

  /**
   * Approve unified registration
   */
  static async approveUnifiedRegistration(registrationId: string, adminEmail: string): Promise<UnifiedRegistration> {
    try {
      const { data, error } = await supabase
        .from('unified_registrations')
        .update({
          status: 'approved',
          reviewed_by: adminEmail,
          reviewed_at: new Date().toISOString(),
          rejection_reason: null
        })
        .eq('id', registrationId)
        .select()
        .single();

      if (error) {
        console.error('Error approving unified registration:', error);
        throw error;
      }

      // Get complete registration data with events
      return await this.getUnifiedRegistrationById(registrationId) as UnifiedRegistration;
    } catch (error) {
      console.error('Approve unified registration error:', error);
      throw error;
    }
  }

  /**
   * Reject unified registration
   */
  static async rejectUnifiedRegistration(
    registrationId: string, 
    adminEmail: string, 
    reason?: string
  ): Promise<UnifiedRegistration> {
    try {
      const { data, error } = await supabase
        .from('unified_registrations')
        .update({
          status: 'rejected',
          reviewed_by: adminEmail,
          reviewed_at: new Date().toISOString(),
          rejection_reason: reason || null
        })
        .eq('id', registrationId)
        .select()
        .single();

      if (error) {
        console.error('Error rejecting unified registration:', error);
        throw error;
      }

      // Get complete registration data with events
      return await this.getUnifiedRegistrationById(registrationId) as UnifiedRegistration;
    } catch (error) {
      console.error('Reject unified registration error:', error);
      throw error;
    }
  }

  /**
   * Get user's unified registration (for user dashboard)
   */
  static async getUserUnifiedRegistration(userEmail: string): Promise<UnifiedRegistration | null> {
    try {
      const { data, error } = await supabase
        .from('admin_unified_registrations')
        .select('*')
        .eq('user_email', userEmail)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No registration found
          return null;
        }
        console.error('Error fetching user unified registration:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Get user unified registration error:', error);
      throw error;
    }
  }

  /**
   * Create unified registration (PURE - no legacy dependencies)
   */
  static async createUnifiedRegistration(data: {
    userEmail: string;
    userName: string;
    userPhone: string;
    userCollege: string;
    userYear?: string;
    userBranch?: string;
    registrationTier: string;
    totalAmount: number;
    paymentTransactionId: string;
    paymentScreenshotPath: string;
    paymentAmount: number;
    selectedEventIds: string[];
  }): Promise<UnifiedRegistration> {
    try {
      // Create unified registration
      const { data: unifiedReg, error: unifiedError } = await supabase
        .from('unified_registrations')
        .insert({
          user_email: data.userEmail,
          user_name: data.userName,
          user_phone: data.userPhone,
          user_college: data.userCollege,
          user_year: data.userYear,
          user_branch: data.userBranch,
          registration_tier: data.registrationTier,
          total_amount: data.totalAmount,
          payment_transaction_id: data.paymentTransactionId,
          payment_screenshot_path: data.paymentScreenshotPath,
          payment_amount: data.paymentAmount,
          status: 'pending'
        })
        .select()
        .single();

      if (unifiedError) {
        console.error('Error creating unified registration:', unifiedError);
        throw unifiedError;
      }

      // Link selected events
      if (data.selectedEventIds.length > 0) {
        const eventLinks = data.selectedEventIds.map(eventId => ({
          unified_registration_id: unifiedReg.id,
          event_id: eventId
        }));

        const { error: eventsError } = await supabase
          .from('unified_registration_events')
          .insert(eventLinks);

        if (eventsError) {
          console.error('Error linking events to unified registration:', eventsError);
          throw eventsError;
        }
      }

      // Return complete registration data
      return await this.getUnifiedRegistrationById(unifiedReg.id) as UnifiedRegistration;
    } catch (error) {
      console.error('Create unified registration error:', error);
      throw error;
    }
  }

  /**
   * Get registration statistics for admin dashboard
   */
  static async getRegistrationStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    totalRevenue: number;
    approvedRevenue: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('admin_unified_registrations')
        .select('status, total_amount');

      if (error) {
        console.error('Error fetching registration stats:', error);
        throw error;
      }

      const stats = (data || []).reduce((acc, reg) => {
        acc.total += 1;
        acc.totalRevenue += reg.total_amount || 0;
        
        switch (reg.status) {
          case 'pending':
            acc.pending += 1;
            break;
          case 'approved':
            acc.approved += 1;
            acc.approvedRevenue += reg.total_amount || 0;
            break;
          case 'rejected':
            acc.rejected += 1;
            break;
        }
        
        return acc;
      }, {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        totalRevenue: 0,
        approvedRevenue: 0
      });

      return stats;
    } catch (error) {
      console.error('Get registration stats error:', error);
      throw error;
    }
  }

  /**
   * Complete registration (PURE UNIFIED - no legacy tables)
   */
  static async completeRegistration(data: {
    name: string;
    email: string;
    phone: string;
    college: string;
    year: string;
    branch: string;
    tier: 'tier1' | 'tier2' | 'tier3';
    selectedEvents: {
      cultural: string[];
      sports: string[];
      fineArts: string[];
      literary: string[];
    };
    transactionId: string;
    screenshot: File;
  }): Promise<{ success: boolean; message: string; registration?: UnifiedRegistration }> {
    try {
      console.log('Starting pure unified registration workflow...');

      // 1. Check if user already has a registration
      const existingRegistration = await this.getUserUnifiedRegistrationByEmail(data.email);
      if (existingRegistration) {
        return {
          success: false,
          message: 'You already have a SPANDAN 2025 registration. Multiple registrations are not allowed.'
        };
      }

      // 2. Upload payment screenshot to storage bucket
      const timestamp = Date.now();
      const fileExt = data.screenshot.name.split('.').pop();
      const fileName = `payments/${data.email.replace('@', '_')}_${timestamp}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('payment-screenshots')
        .upload(fileName, data.screenshot);

      if (uploadError) {
        console.error('Error uploading payment screenshot:', uploadError);
        throw new Error('Failed to upload payment screenshot');
      }

      // 3. Tier mapping
      const tierMapping = {
        'tier1': 'Tier 1',
        'tier2': 'Tier 2', 
        'tier3': 'Tier 3'
      };

      const tierPricing = {
        'tier1': 375,
        'tier2': 650,
        'tier3': 850
      };

      // 4. Get selected event IDs and calculate total pricing
      const allSelectedEvents = [
        ...data.selectedEvents.cultural,
        ...data.selectedEvents.sports,
        ...data.selectedEvents.fineArts,
        ...data.selectedEvents.literary
      ];

      let eventsPricing = 0;
      let selectedEventIds: string[] = [];

      if (allSelectedEvents.length > 0) {
        const { data: events, error: eventsError } = await supabase
          .from('events')
          .select('id, name, price')
          .in('name', allSelectedEvents);

        if (eventsError) {
          console.error('Error fetching events:', eventsError);
          throw new Error('Failed to fetch selected events');
        }

        if (events) {
          eventsPricing = events.reduce((sum, e) => sum + (e.price || 0), 0);
          selectedEventIds = events.map(e => e.id);
        }
      }

      const totalAmount = tierPricing[data.tier] + eventsPricing;

      // 5. Create unified registration (PURE - no legacy dependencies)
      const unifiedRegistration = await this.createUnifiedRegistration({
        userEmail: data.email,
        userName: data.name,
        userPhone: data.phone,
        userCollege: data.college,
        userYear: data.year,
        userBranch: data.branch,
        registrationTier: tierMapping[data.tier],
        totalAmount: totalAmount,
        paymentTransactionId: data.transactionId,
        paymentScreenshotPath: fileName,
        paymentAmount: tierPricing[data.tier],
        selectedEventIds: selectedEventIds
      });

      console.log('Pure unified registration completed successfully:', unifiedRegistration.id);

      return {
        success: true,
        message: 'Registration completed successfully! Your registration is pending admin approval. You will receive a confirmation email once approved.',
        registration: unifiedRegistration
      };

    } catch (error) {
      console.error('Complete registration error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Registration failed. Please try again.'
      };
    }
  }

  /**
   * Get user unified registration by email
   */
  static async getUserUnifiedRegistrationByEmail(email: string): Promise<UnifiedRegistration | null> {
    try {
      const { data, error } = await supabase
        .from('admin_unified_registrations')
        .select('*')
        .eq('user_email', email)
        .maybeSingle();

      if (error) {
        console.error('Error fetching unified registration by email:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Get unified registration by email error:', error);
      return null;
    }
  }
}
