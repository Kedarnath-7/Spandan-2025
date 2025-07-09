import { supabase } from '@/lib/supabase';
import { Payment } from '@/lib/types';

class PaymentService {
  /**
   * Get all payments for a user
   */
  async getUserPayments(userId: string): Promise<Payment[]> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get user payments error:', error);
      throw error;
    }
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(paymentId: string): Promise<Payment | null> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get payment by ID error:', error);
      return null;
    }
  }

  /**
   * Upload payment screenshot
   */
  async uploadPaymentScreenshot(file: File, prefix: string = 'payment'): Promise<string> {
    try {
      const fileName = `${prefix}-${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('payment-screenshots')
        .upload(fileName, file);

      if (error) throw error;
      return data.path;
    } catch (error) {
      console.error('Upload payment screenshot error:', error);
      throw error;
    }
  }

  /**
   * Get payment screenshot URL
   */
  async getPaymentScreenshotUrl(filePath: string): Promise<string | null> {
    try {
      const { data } = await supabase.storage
        .from('payment-screenshots')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Get payment screenshot URL error:', error);
      return null;
    }
  }

  /**
   * Admin: Get all payments
   */
  async getAllPayments() {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          users (name, email, college)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get all payments error:', error);
      throw error;
    }
  }

  /**
   * Admin: Approve payment
   */
  async approvePayment(paymentId: string) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .update({ status: 'approved' })
        .eq('id', paymentId)
        .select()
        .single();

      if (error) throw error;

      // TODO: Send approval email if needed
      // Email functionality can be added back if required

      return data;
    } catch (error) {
      console.error('Approve payment error:', error);
      throw error;
    }
  }

  /**
   * Admin: Reject payment
   */
  async rejectPayment(paymentId: string, reason: string = 'Payment verification failed') {
    try {
      const { data, error } = await supabase
        .from('payments')
        .update({ status: 'rejected' })
        .eq('id', paymentId)
        .select()
        .single();

      if (error) throw error;

      // TODO: Send rejection email if needed
      // Email functionality can be added back if required

      return data;
    } catch (error) {
      console.error('Reject payment error:', error);
      throw error;
    }
  }

  /**
   * Get payment statistics
   */
  async getPaymentStats() {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('amount, status, type');

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        approved: data?.filter(payment => payment.status === 'approved').length || 0,
        pending: data?.filter(payment => payment.status === 'pending').length || 0,
        rejected: data?.filter(payment => payment.status === 'rejected').length || 0,
        totalAmount: data?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0,
        approvedAmount: data?.filter(payment => payment.status === 'approved')
          .reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0,
        byType: {
          delegate: data?.filter(payment => payment.type === 'delegate').length || 0,
          event: data?.filter(payment => payment.type === 'event').length || 0,
        },
      };

      return stats;
    } catch (error) {
      console.error('Get payment stats error:', error);
      throw error;
    }
  }

  /**
   * Validate transaction ID format
   */
  validateTransactionId(transactionId: string): boolean {
    // Basic validation - should be between 8-50 characters
    return transactionId.length >= 8 && transactionId.length <= 50;
  }

  /**
   * Validate payment screenshot file
   */
  validatePaymentScreenshot(file: File): { isValid: boolean; error?: string } {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: 'File must be a JPEG or PNG image' };
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return { isValid: false, error: 'File size must be less than 5MB' };
    }

    return { isValid: true };
  }
}

export const paymentService = new PaymentService();
