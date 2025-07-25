import { supabase } from '@/lib/supabase';

export async function logEmail({ user_id, email_type, email, status, error = null }: {
  user_id: string;
  email_type: string;
  email: string;
  status: string;
  error?: string | null;
}) {
  const { data, error: dbError } = await supabase
    .from('email_logs')
    .insert({ user_id, email_type, email, status, error });
  if (dbError) throw dbError;
  return data;
}

export async function getEmailLogs({ user_id, email_type }: { user_id?: string; email_type?: string }) {
  let query = supabase.from('email_logs').select('*');
  if (user_id) query = query.eq('user_id', user_id);
  if (email_type) query = query.eq('email_type', email_type);
  const { data, error } = await query.order('sent_at', { ascending: false });
  if (error) throw error;
  return data;
}
