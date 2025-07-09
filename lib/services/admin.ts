import { supabase } from '@/lib/supabase';
import { registrationService } from './registration';
import { paymentService } from './payment';
import { eventService } from './events';

class AdminService {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    try {
      const [
        registrationStats,
        paymentStats,
        eventStats
      ] = await Promise.all([
        registrationService.getRegistrationStats(),
        paymentService.getPaymentStats(),
        this.getGeneralStats()
      ]);

      return {
        registrations: registrationStats,
        payments: paymentStats,
        events: eventStats,
      };
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      throw error;
    }
  }

  /**
   * Get general statistics
   */
  async getGeneralStats() {
    try {
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id');

      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id');

      if (eventsError) throw eventsError;
      if (usersError) throw usersError;

      return {
        totalEvents: events?.length || 0,
        totalUsers: users?.length || 0,
      };
    } catch (error) {
      console.error('Get general stats error:', error);
      throw error;
    }
  }

  /**
   * Get all users
   */
  async getAllUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get all users error:', error);
      throw error;
    }
  }

  /**
   * Get user by ID with detailed information
   */
  async getUserDetails(userId: string) {
    try {
      const [
        userProfile,
        delegateRegistrations,
        eventRegistrations,
        payments
      ] = await Promise.all([
        supabase.from('users').select('*').eq('id', userId).single(),
        supabase.from('delegate_registrations').select('*').eq('user_id', userId),
        supabase.from('event_registrations').select(`
          *,
          events (*)
        `).eq('user_id', userId),
        supabase.from('payments').select('*').eq('user_id', userId)
      ]);

      return {
        profile: userProfile.data,
        delegateRegistrations: delegateRegistrations.data || [],
        eventRegistrations: eventRegistrations.data || [],
        payments: payments.data || [],
      };
    } catch (error) {
      console.error('Get user details error:', error);
      throw error;
    }
  }

  /**
   * Send notification email
   */
  async sendNotificationEmail(
    to: string,
    subject: string,
    message: string,
    type: 'approval' | 'rejection' | 'general' = 'general'
  ) {
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to,
          subject,
          message,
          type,
        },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Send notification email error:', error);
      throw error;
    }
  }

  /**
   * Bulk approve registrations (unified system)
   */
  async bulkApproveRegistrations(registrationIds: string[]) {
    try {
      const results = await Promise.allSettled(
        registrationIds.map(id => registrationService.approveEventRegistration(id))
      );

      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;

      return { successful, failed };
    } catch (error) {
      console.error('Bulk approve registrations error:', error);
      throw error;
    }
  }

  /**
   * Bulk approve event registrations
   */
  async bulkApproveEventRegistrations(registrationIds: string[]) {
    try {
      const results = await Promise.allSettled(
        registrationIds.map(id => registrationService.approveEventRegistration(id))
      );

      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;

      return { successful, failed };
    } catch (error) {
      console.error('Bulk approve event registrations error:', error);
      throw error;
    }
  }

  /**
   * Export data to CSV
   */
  exportToCSV(data: any[], filename: string) {
    try {
      if (!data.length) {
        throw new Error('No data to export');
      }

      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header];
            // Handle nested objects and arrays
            if (typeof value === 'object' && value !== null) {
              return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
            }
            // Escape commas and quotes in strings
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export to CSV error:', error);
      throw error;
    }
  }

  /**
   * Get recent activities
   */
  async getRecentActivities(limit: number = 50) {
    try {
      const { data, error } = await supabase
        .from('delegate_registrations')
        .select(`
          id,
          created_at,
          status,
          tier,
          users (name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Format activities
      const activities = data?.map(registration => {
        const user = registration.users as any;
        return {
          id: registration.id,
          type: 'delegate_registration',
          description: `${user?.name} registered for ${registration.tier}`,
          status: registration.status,
          timestamp: registration.created_at,
          userEmail: user?.email,
        };
      }) || [];

      return activities;
    } catch (error) {
      console.error('Get recent activities error:', error);
      throw error;
    }
  }

  /**
   * Check admin permissions
   */
  async checkAdminPermissions(userId: string): Promise<boolean> {
    try {
      // For now, we'll check if user exists in a simple way
      // In a real application, you might have an admin_users table
      const adminEmails = [
        'admin@jipmer.edu.in',
        'spandan2025@jipmer.edu.in',
        // Add more admin emails as needed
      ];

      const { data: user, error } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      return adminEmails.includes(user.email.toLowerCase());
    } catch (error) {
      console.error('Check admin permissions error:', error);
      return false;
    }
  }

  /**
   * Generate reports
   */
  async generateReport(reportType: 'delegates' | 'events' | 'payments' | 'users') {
    try {
      let data: any[] = [];
      let filename = '';

      switch (reportType) {
        case 'delegates':
          // Get unified registrations for delegate passes
          data = await registrationService.getAllEventRegistrations();
          filename = `delegate-registrations-${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case 'events':
          data = await registrationService.getAllEventRegistrations();
          filename = `event-registrations-${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case 'payments':
          data = await paymentService.getAllPayments();
          filename = `payments-${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case 'users':
          data = await this.getAllUsers();
          filename = `users-${new Date().toISOString().split('T')[0]}.csv`;
          break;
        default:
          throw new Error('Invalid report type');
      }

      this.exportToCSV(data, filename);
      return { success: true, recordCount: data.length };
    } catch (error) {
      console.error('Generate report error:', error);
      throw error;
    }
  }
}

export const adminService = new AdminService();
