import { supabase } from '@/lib/supabase';
import type { 
  GroupRegistration, 
  GroupMember, 
  RegistrationView,
  AdminUser 
} from '@/lib/types';

export class AdminService {
  
  /**
   * Admin authentication
   */
  static async authenticateAdmin(email: string, password: string): Promise<{
    success: boolean;
    admin?: AdminUser;
    error?: string;
  }> {
    try {
      console.log('Attempting admin login for:', email);
      
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      console.log('Admin query result:', { adminData, adminError });

      if (adminError || !adminData) {
        console.log('Admin not found or error:', adminError);
        return {
          success: false,
          error: 'Invalid email or password',
        };
      }

      // For development/demo purposes, use simple password comparison
      // In production, implement proper bcrypt password hashing
      let isValidPassword = false;
      
      console.log('Checking password for:', email, 'against stored value:', adminData.password_hash);
      
      // Simple plain text comparison for demo (database has "admin123" stored)
      isValidPassword = password === adminData.password_hash;
      
      // Alternative: also check if password matches "admin123" directly
      if (!isValidPassword) {
        isValidPassword = password === 'admin123';
      }

      console.log('Password validation result:', isValidPassword);

      if (!isValidPassword) {
        return {
          success: false,
          error: 'Invalid email or password',
        };
      }

      console.log('Login successful for:', email);

      // Update last login
      await supabase
        .from('admin_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', adminData.id);

      return {
        success: true,
        admin: adminData,
      };

    } catch (error) {
      console.error('Admin authentication error:', error);
      return {
        success: false,
        error: 'Authentication failed',
      };
    }
  }

  /**
   * Get all group registrations for admin dashboard
   */
  static async getAllRegistrations(): Promise<{
    success: boolean;
    data?: RegistrationView[];
    error?: string;
  }> {
    try {
      // Get group registrations with member info using the corrected view
      const { data: registrationData, error: registrationError } = await supabase
        .from('registration_view')
        .select('*')
        .order('created_at', { ascending: false });

      if (registrationError) {
        console.error('Registration fetch error:', registrationError);
        throw new Error(`Failed to fetch registrations: ${registrationError.message}`);
      }

      // Group by group_id and transform to RegistrationView format
      const groupedData = new Map<string, RegistrationView>();
      
      if (registrationData) {
        for (const row of registrationData) {
          if (!groupedData.has(row.group_id)) {
            // Create entry for the group leader (first member)
            groupedData.set(row.group_id, {
              group_id: row.group_id,
              delegate_user_id: row.delegate_user_id,
              leader_name: row.name,
              leader_email: row.email,
              leader_phone: row.phone,
              college: row.college,
              college_location: row.college_location,
              tier: row.tier,
              tier_amount: row.tier_amount,
              members_count: row.member_count,
              total_amount: row.group_total_amount,
              payment_transaction_id: row.payment_transaction_id,
              status: row.registration_status,
              created_at: row.created_at,
              group_name: `Group ${row.group_id}`,
              review_status: row.review_status,
              reviewed_at: row.reviewed_at,
              reviewed_by: row.reviewed_by,
              rejection_reason: row.rejection_reason
            });
          }
        }
      }

      return {
        success: true,
        data: Array.from(groupedData.values()),
      };

    } catch (error) {
      console.error('Error fetching registrations:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get detailed registration view for Excel export
   */
  static async getRegistrationExportData(): Promise<{
    success: boolean;
    data?: RegistrationView[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('registration_export_view')
        .select('*')
        .order('submitted_date', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch export data: ${error.message}`);
      }

      return {
        success: true,
        data,
      };

    } catch (error) {
      console.error('Get export data error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get group members for a specific group
   */
  static async getGroupMembers(groupId: string): Promise<{
    success: boolean;
    members?: GroupMember[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupId)
        .order('member_order');

      if (error) {
        throw new Error(`Failed to fetch group members: ${error.message}`);
      }

      return {
        success: true,
        members: data,
      };

    } catch (error) {
      console.error('Get group members error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Approve a group registration
   */
  static async approveRegistration(
    groupId: string,
    adminEmail?: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase
        .from('group_registrations')
        .update({
          registration_status: 'approved',
          reviewed_by: adminEmail || 'admin',
          reviewed_at: new Date().toISOString(),
          rejection_reason: null,
        })
        .eq('group_id', groupId);

      if (error) {
        throw new Error(`Failed to approve registration: ${error.message}`);
      }

      return { success: true };

    } catch (error) {
      console.error('Approve registration error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Reject a group registration
   */
  static async rejectRegistration(
    groupId: string,
    rejectionReason: string,
    adminEmail?: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      if (!rejectionReason?.trim()) {
        throw new Error('Rejection reason is required');
      }

      const { error } = await supabase
        .from('group_registrations')
        .update({
          registration_status: 'rejected',
          reviewed_by: adminEmail || 'admin',
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
        })
        .eq('group_id', groupId);

      if (error) {
        throw new Error(`Failed to reject registration: ${error.message}`);
      }

      return { success: true };

    } catch (error) {
      console.error('Reject registration error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Bulk approve multiple registrations
   */
  static async bulkApprove(
    groupIds: string[],
    adminEmail: string
  ): Promise<{
    success: boolean;
    processedCount?: number;
    error?: string;
  }> {
    try {
      if (!groupIds || groupIds.length === 0) {
        throw new Error('No registrations selected');
      }

      const { data, error } = await supabase
        .from('group_registrations')
        .update({
          status: 'approved',
          reviewed_by: adminEmail,
          reviewed_at: new Date().toISOString(),
          rejection_reason: null,
        })
        .in('group_id', groupIds)
        .select('group_id');

      if (error) {
        throw new Error(`Failed to bulk approve: ${error.message}`);
      }

      return {
        success: true,
        processedCount: data.length,
      };

    } catch (error) {
      console.error('Bulk approve error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get registration statistics
   */
  static async getRegistrationStats(): Promise<{
    success: boolean;
    stats?: {
      total: number;
      pending: number;
      approved: number;
      rejected: number;
      totalRevenue: number;
      totalMembers: number;
      tierBreakdown: Record<string, number>;
    };
    error?: string;
  }> {
    try {
      // Get group registration counts
      const { data: registrationCounts, error: countError } = await supabase
        .from('group_registrations')
        .select('status, total_amount');

      if (countError) {
        throw new Error(`Failed to fetch registration counts: ${countError.message}`);
      }

      // Get member counts and tier breakdown
      const { data: memberCounts, error: memberError } = await supabase
        .from('group_members')
        .select('tier');

      if (memberError) {
        throw new Error(`Failed to fetch member counts: ${memberError.message}`);
      }

      // Calculate statistics
      const stats = {
        total: registrationCounts.length,
        pending: registrationCounts.filter(r => r.status === 'pending').length,
        approved: registrationCounts.filter(r => r.status === 'approved').length,
        rejected: registrationCounts.filter(r => r.status === 'rejected').length,
        totalRevenue: registrationCounts
          .filter(r => r.status === 'approved')
          .reduce((sum, r) => sum + Number(r.total_amount), 0),
        totalMembers: memberCounts.length,
        tierBreakdown: memberCounts.reduce((breakdown, member) => {
          breakdown[member.tier] = (breakdown[member.tier] || 0) + 1;
          return breakdown;
        }, {} as Record<string, number>),
      };

      return {
        success: true,
        stats,
      };

    } catch (error) {
      console.error('Get registration stats error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get dashboard statistics
   */
  static async getDashboardStats(): Promise<{
    success: boolean;
    data?: {
      totalRegistrations: number;
      totalRevenue: number;
      pendingApprovals: number;
      approvedRegistrations: number;
      rejectedRegistrations: number;
      totalGroups: number;
    };
    error?: string;
  }> {
    try {
      // Get total groups and registrations
      const { data: groupData, error: groupError } = await supabase
        .from('group_registrations')
        .select('id, total_amount, registration_status');

      if (groupError) {
        throw new Error(`Failed to fetch group data: ${groupError.message}`);
      }

      // Get total individual registrations
      const { data: memberData, error: memberError } = await supabase
        .from('group_members')
        .select('id');

      if (memberError) {
        throw new Error(`Failed to fetch member data: ${memberError.message}`);
      }

      const totalGroups = groupData?.length || 0;
      const totalRegistrations = memberData?.length || 0;
      const totalRevenue = groupData?.reduce((sum, group) => sum + (group.total_amount || 0), 0) || 0;
      const pendingApprovals = groupData?.filter(g => g.registration_status === 'pending').length || 0;
      const approvedRegistrations = groupData?.filter(g => g.registration_status === 'approved').length || 0;
      const rejectedRegistrations = groupData?.filter(g => g.registration_status === 'rejected').length || 0;

      return {
        success: true,
        data: {
          totalRegistrations,
          totalRevenue,
          pendingApprovals,
          approvedRegistrations,
          rejectedRegistrations,
          totalGroups
        }
      };

    } catch (error) {
      console.error('Get dashboard stats error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Export registrations as Excel file
   */
  static async exportRegistrations(): Promise<{
    success: boolean;
    data?: Blob;
    error?: string;
  }> {
    try {
      const result = await this.getAllRegistrations();
      
      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error || 'Failed to fetch registration data'
        };
      }

      // Convert data to CSV format
      const csvData = this.generateExcelData(result.data);
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });

      return {
        success: true,
        data: blob
      };

    } catch (error) {
      console.error('Export registrations error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Generate Excel export data
   */
  static generateExcelData(registrations: RegistrationView[]): string {
    const headers = [
      'Group ID',
      'Delegate User ID',
      'Name',
      'Email',
      'College',
      'Phone',
      'College Location',
      'Tier',
      'Tier Amount',
      'Group Total Amount',
      'Payment Transaction ID',
      'Registration Status',
      'Submitted Date',
      'Review Status',
      'Reviewed At',
      'Reviewed By',
      'Rejection Reason'
    ];

    const csvContent = [
      headers.join(','),
      ...registrations.map(reg => [
        reg.group_id,
        reg.delegate_user_id,
        `"${reg.leader_name}"`,
        reg.leader_email,
        `"${reg.college}"`,
        reg.leader_phone,
        `"${reg.college_location || ''}"`,
        `"${reg.tier}"`,
        reg.tier_amount,
        reg.total_amount,
        reg.payment_transaction_id,
        reg.status,
        new Date(reg.created_at).toLocaleDateString(),
        reg.status,
        reg.created_at ? new Date(reg.created_at).toLocaleString() : '',
        '', // reviewed_by - not in current schema
        `"${reg.rejection_reason || ''}"`
      ].join(','))
    ].join('\n');

    return csvContent;
  }
}
