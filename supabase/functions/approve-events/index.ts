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
    const { registrationId } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get event registration with user and event info
    const { data: registration, error: registrationError } = await supabaseClient
      .from('event_registrations')
      .select(`
        *,
        users (name, email),
        events (name, category)
      `)
      .eq('id', registrationId)
      .single();

    if (registrationError) {
      throw registrationError;
    }

    // Generate unique ticket ID
    const ticketId = `TICKET-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;

    // Update event registration
    const { error: updateError } = await supabaseClient
      .from('event_registrations')
      .update({ status: 'approved' })
      .eq('id', registrationId);

    if (updateError) {
      throw updateError;
    }

    // Send confirmation email
    const emailMessage = `
      <h2>Event Registration Confirmed!</h2>
      <p>Dear ${registration.users.name},</p>
      <p>Your registration for <strong>${registration.events.name}</strong> (${registration.events.category}) has been approved.</p>
      <p><strong>Ticket ID: ${ticketId}</strong></p>
      ${registration.delegate_id ? `<p><strong>Delegate ID: ${registration.delegate_id}</strong></p>` : ''}
      <p>Please keep this information safe and present it during the event.</p>
      <p>See you at the fest!</p>
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
        to: registration.users.email,
        subject: 'Event Registration Confirmed - College Fest 2024',
        message: emailMessage,
      }),
    });

    return new Response(JSON.stringify({ success: true, ticketId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});