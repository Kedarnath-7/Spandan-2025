import { supabase } from '@/lib/supabase';

export interface RegistrationViewData {
  group_id: string;
  user_id: string;
  name: string;
  email: string;
  college: string;
  phone: string;
  college_location?: string;
  selection_type: 'tier' | 'pass';
  tier?: string;
  delegate_user_id?: string;
  pass_type?: string;
  pass_tier?: string;
  pass_id?: string;
  amount: number;
  total_amount: number;
  payment_transaction_id: string;
  status: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  rejection_reason?: string;
  member_count: number;
}

export interface EventRegistrationViewData {
  group_id: string;
  user_id: string;
  name: string;
  email: string;
  college: string;
  phone: string;
  college_location: string;
  event_name: string;
  event_category: string;
  event_price: number;
  member_count: number;
  amount: number;
  total_amount: number;
  status: string;
  payment_transaction_id: string;
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  status_display: string;
  formatted_created_at: string;
  formatted_reviewed_at?: string;
  formatted_updated_at?: string;
}

class ExportService {
  /**
   * Get registration data from registration_view for CSV export
   */
  async getRegistrationViewData(): Promise<RegistrationViewData[]> {
    try {
      const { data, error } = await supabase
        .from('registration_view')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching registration view data:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Get registration view data error:', error);
      throw error;
    }
  }

  /**
   * Get event registration data from event_registration_view for CSV export
   */
  async getEventRegistrationViewData(): Promise<EventRegistrationViewData[]> {
    try {
      const { data, error } = await supabase
        .from('event_registration_view')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching event registration view data:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Get event registration view data error:', error);
      throw error;
    }
  }

  /**
   * Generate CSV content from data array
   */
  generateCSV(data: any[], filename: string): void {
    if (!data || data.length === 0) {
      throw new Error('No data available for export');
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle null/undefined values and escape quotes
          const stringValue = value == null ? '' : String(value);
          return `"${stringValue.replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Export tier/pass registrations to CSV using registration_view
   */
  async exportRegistrationsCSV(): Promise<void> {
    try {
      const data = await this.getRegistrationViewData();
      
      // Transform data for better CSV column names
      const csvData = data.map(item => ({
        'Group ID': item.group_id,
        'User ID': item.user_id,
        'Name': item.name,
        'Email': item.email,
        'College': item.college,
        'Phone': item.phone,
        'Location': item.college_location || '',
        'Selection Type': item.selection_type,
        'Tier': item.tier || '',
        'Delegate ID': item.delegate_user_id || '',
        'Pass Type': item.pass_type || '',
        'Pass Tier': item.pass_tier || '',
        'Pass ID': item.pass_id || '',
        'Amount': item.amount,
        'Total Amount': item.total_amount,
        'Transaction ID': item.payment_transaction_id,
        'Status': item.status,
        'Created At': new Date(item.created_at).toLocaleString(),
        'Reviewed At': item.reviewed_at ? new Date(item.reviewed_at).toLocaleString() : '',
        'Reviewed By': item.reviewed_by || '',
        'Rejection Reason': item.rejection_reason || '',
        'Member Count': item.member_count
      }));

      this.generateCSV(csvData, 'tier_pass_registrations');
    } catch (error) {
      console.error('Export registrations CSV error:', error);
      throw error;
    }
  }

  /**
   * Export event registrations to CSV using event_registration_view
   */
  async exportEventRegistrationsCSV(): Promise<void> {
    try {
      const data = await this.getEventRegistrationViewData();
      
      // Transform data for better CSV column names matching your requirements
      const csvData = data.map(item => ({
        'Group ID': item.group_id,
        'User ID': item.user_id,
        'Name': item.name,
        'Email': item.email,
        'College': item.college,
        'Phone': item.phone,
        'College Location': item.college_location,
        'Event Name': item.event_name,
        'Event Category': item.event_category,
        'Event Price': item.event_price,
        'Member Count': item.member_count,
        'Amount': item.amount,
        'Total Amount': item.total_amount,
        'Status': item.status,
        'Payment Transaction ID': item.payment_transaction_id,
        'Reviewed By': item.reviewed_by || '',
        'Reviewed At': item.reviewed_at || '',
        'Rejection Reason': item.rejection_reason || '',
        'Created At': item.created_at,
        'Updated At': item.updated_at
      }));

      this.generateCSV(csvData, 'event_registrations');
    } catch (error) {
      console.error('Export event registrations CSV error:', error);
      throw error;
    }
  }
}

export const exportService = new ExportService();
