import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { delegateId } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get delegate registration with user info
    const { data: delegate, error: delegateError } = await supabaseClient
      .from('delegate_registrations')
      .select(`
        *,
        users (name, email)
      `)
      .eq('id', delegateId)
      .single();

    if (delegateError) {
      throw delegateError;
    }

    // Generate unique delegate ID
    const uniqueDelegateId = `FEST-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;

    // Update delegate registration
    const { error: updateError } = await supabaseClient
      .from('delegate_registrations')
      .update({
        status: 'approved',
        delegate_id: uniqueDelegateId
      })
      .eq('id', delegateId);

    if (updateError) {
      throw updateError;
    }

    // Send confirmation email
    const emailMessage = `
      <h2>Delegate Pass Approved!</h2>
      <p>Dear ${delegate.users.name},</p>
      <p>Your delegate pass for <strong>${delegate.tier}</strong> has been approved.</p>
      <p><strong>Your Delegate ID: ${uniqueDelegateId}</strong></p>
      <p>Please keep this ID safe as you'll need it for event registrations.</p>
      <p>Enjoy the fest!</p>
      <br>
      <p>Best regards,<br>College Fest 2024 Team</p>
    `;

    const emailResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: delegate.users.email,
        subject: 'Delegate Pass Approved - College Fest 2024',
        message: emailMessage,
      }),
    });

    return new Response(JSON.stringify({ success: true, delegateId: uniqueDelegateId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});