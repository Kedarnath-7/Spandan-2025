import { supabase } from '@/lib/supabase';

// Function to format date as dd/mm/yyyy
function formatDateForCSV(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

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
   * Export tier registrations to CSV using registration_view
   */
  async exportTierRegistrationsCSV(): Promise<void> {
    try {
      const data = await this.getRegistrationViewData();
      
      // Filter only tier registrations
      const tierData = data.filter(item => item.selection_type === 'tier');
      
      if (tierData.length === 0) {
        throw new Error('No tier registrations found for export');
      }
      
      // Transform data for better CSV column names
      const csvData = tierData.map(item => ({
        'Group ID': item.group_id,
        'User ID': item.user_id,
        'Name': item.name,
        'Email': item.email,
        'College': item.college,
        'Phone': item.phone,
        'Location': item.college_location || '',
        'Tier': item.tier || '',
        'Amount': item.amount,
        'Total Amount': item.total_amount,
        'Transaction ID': item.payment_transaction_id,
        'Status': item.status,
        'Created At': formatDateForCSV(item.created_at),
        'Reviewed At': item.reviewed_at ? formatDateForCSV(item.reviewed_at) : '',
        'Reviewed By': item.reviewed_by || '',
        'Rejection Reason': item.rejection_reason || '',
        'Member Count': item.member_count
      }));

      this.generateCSV(csvData, 'tier_registrations');
    } catch (error) {
      console.error('Export tier registrations CSV error:', error);
      throw error;
    }
  }

  /**
   * Export pass registrations to CSV using registration_view
   */
  async exportPassRegistrationsCSV(): Promise<void> {
    try {
      const data = await this.getRegistrationViewData();
      
      // Filter only pass registrations
      const passData = data.filter(item => item.selection_type === 'pass');
      
      if (passData.length === 0) {
        throw new Error('No pass registrations found for export');
      }
      
      // Transform data for better CSV column names
      const csvData = passData.map(item => ({
        'Group ID': item.group_id,
        'User ID': item.user_id,
        'Name': item.name,
        'Email': item.email,
        'College': item.college,
        'Phone': item.phone,
        'Location': item.college_location || '',
        'Delegate ID': item.delegate_user_id || '',
        'Pass Type': item.pass_type || '',
        'Pass Tier': item.pass_tier || '',
        'Pass ID': item.pass_id || '',
        'Amount': item.amount,
        'Total Amount': item.total_amount,
        'Transaction ID': item.payment_transaction_id,
        'Status': item.status,
        'Created At': formatDateForCSV(item.created_at),
        'Reviewed At': item.reviewed_at ? formatDateForCSV(item.reviewed_at) : '',
        'Reviewed By': item.reviewed_by || '',
        'Rejection Reason': item.rejection_reason || '',
        'Member Count': item.member_count
      }));

      this.generateCSV(csvData, 'pass_registrations');
    } catch (error) {
      console.error('Export pass registrations CSV error:', error);
      throw error;
    }
  }

  /**
   * Export all registrations to CSV using registration_view (legacy method)
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
        'Created At': formatDateForCSV(item.created_at),
        'Reviewed At': item.reviewed_at ? formatDateForCSV(item.reviewed_at) : '',
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
        'Reviewed At': item.reviewed_at ? formatDateForCSV(item.reviewed_at) : '',
        'Rejection Reason': item.rejection_reason || '',
        'Created At': formatDateForCSV(item.created_at),
        'Updated At': formatDateForCSV(item.updated_at)
      }));

      this.generateCSV(csvData, 'event_registrations');
    } catch (error) {
      console.error('Export event registrations CSV error:', error);
      throw error;
    }
  }

  /**
   * Export event-specific registrations to CSV using event_registration_view
   */
  async exportEventSpecificCSV(eventName: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('event_registration_view')
        .select('*')
        .eq('event_name', eventName)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching event-specific data:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error(`No registrations found for event: ${eventName}`);
      }
      
      // Transform data for better CSV column names
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
        'Reviewed At': item.reviewed_at ? formatDateForCSV(item.reviewed_at) : '',
        'Rejection Reason': item.rejection_reason || '',
        'Created At': formatDateForCSV(item.created_at),
        'Updated At': formatDateForCSV(item.updated_at)
      }));

      // Create safe filename from event name
      const safeEventName = eventName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      this.generateCSV(csvData, `${safeEventName}_registrations`);
    } catch (error) {
      console.error('Export event-specific CSV error:', error);
      throw error;
    }
  }
}

export const exportService = new ExportService();
