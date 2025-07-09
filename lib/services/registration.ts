import { supabase } from '@/lib/supabase';
import { Payment } from '@/lib/types';

export interface EventRegistrationData {
  eventIds: string[];
  delegateId?: string;
  transactionId: string;
  paymentScreenshot: File;
}

class RegistrationService {
  /**
   * Register for events
   */
  async registerForEvents(userId: string, registrationData: EventRegistrationData) {
    try {
      // Calculate total amount
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id, price')
        .in('id', registrationData.eventIds);

      if (eventsError) throw eventsError;

      const totalAmount = events?.reduce((sum, event) => sum + event.price, 0) || 0;

      // Upload payment screenshot
      const fileName = `event-payment-${Date.now()}-${registrationData.paymentScreenshot.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment-screenshots')
        .upload(fileName, registrationData.paymentScreenshot);

      if (uploadError) throw uploadError;

      // Create payment record
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: userId,
          type: 'event',
          payment_screenshot: uploadData.path,
          transaction_id: registrationData.transactionId,
          amount: totalAmount,
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Create event registrations
      const registrations = registrationData.eventIds.map(eventId => ({
        user_id: userId,
        event_id: eventId,
        delegate_id: registrationData.delegateId || null,
        payment_id: paymentData.id,
      }));

      const { data: registrationData_result, error: registrationError } = await supabase
        .from('event_registrations')
        .insert(registrations)
        .select();

      if (registrationError) throw registrationError;

      return {
        payment: paymentData,
        registrations: registrationData_result,
      };
    } catch (error) {
      console.error('Register for events error:', error);
      throw error;
    }
  }

  /**
   * Get user's event registrations
   */
  async getUserEventRegistrations(userId: string) {
    try {
      const { data, error } = await supabase
        .from('event_registrations')
        .select(`
          *,
          events (*),
          payments (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get user event registrations error:', error);
      throw error;
    }
  }

  /**
   * Check if user is registered for event
   */
  async isUserRegisteredForEvent(userId: string, eventId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('event_registrations')
        .select('id')
        .eq('user_id', userId)
        .eq('event_id', eventId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
      return !!data;
    } catch (error) {
      console.error('Check user registration error:', error);
      return false;
    }
  }

  /**
   * Cancel event registration
   */
  async cancelEventRegistration(userId: string, registrationId: string) {
    try {
      const { error } = await supabase
        .from('event_registrations')
        .delete()
        .eq('id', registrationId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Cancel event registration error:', error);
      throw error;
    }
  }

  /**
   * Admin: Get all event registrations
   */
  async getAllEventRegistrations() {
    try {
      const { data, error } = await supabase
        .from('event_registrations')
        .select(`
          *,
          users (*),
          events (*),
          payments (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get all event registrations error:', error);
      throw error;
    }
  }

  /**
   * Admin: Approve event registration
   */
  async approveEventRegistration(registrationId: string) {
    try {
      const { data, error } = await supabase
        .from('event_registrations')
        .update({ status: 'approved' })
        .eq('id', registrationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Approve event registration error:', error);
      throw error;
    }
  }

  /**
   * Admin: Reject event registration
   */
  async rejectEventRegistration(registrationId: string) {
    try {
      const { data, error } = await supabase
        .from('event_registrations')
        .update({ status: 'rejected' })
        .eq('id', registrationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Reject event registration error:', error);
      throw error;
    }
  }

  /**
   * Get registration statistics
   */
  async getRegistrationStats() {
    try {
      const { data, error } = await supabase
        .from('event_registrations')
        .select(`
          status,
          events (category)
        `);

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        approved: data?.filter(reg => reg.status === 'approved').length || 0,
        pending: data?.filter(reg => reg.status === 'pending').length || 0,
        rejected: data?.filter(reg => reg.status === 'rejected').length || 0,
        byCategory: {} as Record<string, number>,
      };

      // Count by category
      data?.forEach(registration => {
        const events = registration.events as any;
        const category = events?.category;
        if (category) {
          stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
        }
      });

      return stats;
    } catch (error) {
      console.error('Get registration stats error:', error);
      throw error;
    }
  }
}

export const registrationService = new RegistrationService();
