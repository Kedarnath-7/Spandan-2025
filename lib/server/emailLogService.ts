import { createClient } from '@supabase/supabase-js';

// Create server-side Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function logEmail({ 
  user_id, 
  email_type, 
  email, 
  status, 
  error = null 
}: {
  user_id: string;
  email_type: string;
  email: string;
  status: string;
  error?: string | null;
}) {
  try {
    const { data, error: dbError } = await supabaseServer
      .from('email_logs')
      .insert({ 
        user_id, 
        email_type, 
        email, 
        status, 
        error,
        sent_at: new Date().toISOString()
      });
      
    if (dbError) {
      console.error('Database error when logging email:', dbError);
      throw dbError;
    }
    
    return data;
  } catch (error) {
    console.error('Error logging email:', error);
    throw error;
  }
}

export async function getEmailLogs({ 
  user_id, 
  email_type, 
  limit = 100 
}: { 
  user_id?: string; 
  email_type?: string;
  limit?: number;
} = {}) {
  try {
    let query = supabaseServer
      .from('email_logs')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(limit);
      
    if (user_id) query = query.eq('user_id', user_id);
    if (email_type) query = query.eq('email_type', email_type);
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Database error when fetching email logs:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching email logs:', error);
    throw error;
  }
}
