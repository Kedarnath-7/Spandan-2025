import { supabase } from '@/lib/supabase';

export interface ExistingRegistration {
  hasDelegateRegistration: boolean;
  hasEventRegistrations: boolean;
  hasPayments: boolean;
  delegateStatus?: string;
  eventRegistrations?: Array<{
    id: string;
    event_id: string;
    status: string;
    event?: {
      name: string;
    };
  }>;
  payments?: Array<{
    id: string;
    status: string;
    type: string;
    amount: number;
  }>;
}

export class DuplicateRegistrationService {
  /**
   * Check if user has existing registrations
   */
  static async checkExistingRegistrations(userId: string): Promise<ExistingRegistration> {
    try {
      // Check for delegate registrations
      const { data: delegateRegs } = await supabase
        .from('delegate_registrations')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Check for event registrations
      const { data: eventRegs } = await supabase
        .from('event_registrations')
        .select(`
          *,
          events (name)
        `)
        .eq('user_id', userId);

      // Check for payments
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId);

      const result: ExistingRegistration = {
        hasDelegateRegistration: !!delegateRegs,
        hasEventRegistrations: !!(eventRegs && eventRegs.length > 0),
        hasPayments: !!(payments && payments.length > 0),
        delegateStatus: delegateRegs?.status,
        eventRegistrations: eventRegs || [],
        payments: payments || []
      };

      return result;
    } catch (error) {
      console.error('Error checking existing registrations:', error);
      return {
        hasDelegateRegistration: false,
        hasEventRegistrations: false,
        hasPayments: false,
        eventRegistrations: [],
        payments: []
      };
    }
  }

  /**
   * Check if user has pending registrations
   */
  static async hasPendingRegistrations(userId: string): Promise<boolean> {
    try {
      const existing = await this.checkExistingRegistrations(userId);
      
      // Check if there are any pending registrations
      const hasPendingDelegate = existing.hasDelegateRegistration && existing.delegateStatus === 'pending';
      const hasPendingEvents = existing.eventRegistrations?.some(reg => reg.status === 'pending') || false;
      const hasPendingPayments = existing.payments?.some(payment => payment.status === 'pending') || false;

      return hasPendingDelegate || hasPendingEvents || hasPendingPayments;
    } catch (error) {
      console.error('Error checking pending registrations:', error);
      return false;
    }
  }

  /**
   * Get detailed registration status for user
   */
  static async getRegistrationStatus(userId: string): Promise<{
    canRegister: boolean;
    reason?: string;
    pendingRegistrations?: string[];
    approvedRegistrations?: string[];
  }> {
    try {
      const existing = await this.checkExistingRegistrations(userId);
      
      if (!existing.hasDelegateRegistration && !existing.hasEventRegistrations && !existing.hasPayments) {
        return { canRegister: true };
      }

      const pendingRegistrations: string[] = [];
      const approvedRegistrations: string[] = [];

      if (existing.hasDelegateRegistration) {
        if (existing.delegateStatus === 'pending') {
          pendingRegistrations.push('Delegate Pass');
        } else if (existing.delegateStatus === 'approved') {
          approvedRegistrations.push('Delegate Pass');
        }
      }

      existing.eventRegistrations?.forEach(reg => {
        const eventName = reg.event?.name || `Event ${reg.event_id}`;
        if (reg.status === 'pending') {
          pendingRegistrations.push(`Event: ${eventName}`);
        } else if (reg.status === 'approved') {
          approvedRegistrations.push(`Event: ${eventName}`);
        }
      });

      existing.payments?.forEach(payment => {
        if (payment.status === 'pending') {
          pendingRegistrations.push(`Payment (${payment.type}): ₹${payment.amount}`);
        } else if (payment.status === 'approved') {
          approvedRegistrations.push(`Payment (${payment.type}): ₹${payment.amount}`);
        }
      });

      if (pendingRegistrations.length > 0) {
        return {
          canRegister: false,
          reason: 'You have pending registrations awaiting admin approval.',
          pendingRegistrations,
          approvedRegistrations
        };
      }

      if (approvedRegistrations.length > 0) {
        return {
          canRegister: false,
          reason: 'You already have approved registrations.',
          approvedRegistrations
        };
      }

      return { canRegister: true };
    } catch (error) {
      console.error('Error getting registration status:', error);
      return { canRegister: true }; // Allow registration on error to avoid blocking users
    }
  }
}
