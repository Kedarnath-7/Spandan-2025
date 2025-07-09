import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { to, subject, message } = await req.json();

    // Sender.net API configuration
    const senderApiKey = Deno.env.get('SENDER_API_KEY');
    const senderApiUrl = 'https://api.sender.net/v2/email';

    const emailData = {
      to: [{ email: to }],
      from: { email: 'noreply@fest2024.com', name: 'College Fest 2024' },
      subject: subject,
      html: message,
    };

    const response = await fetch(senderApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${senderApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      throw new Error(`Failed to send email: ${response.status}`);
    }

    const result = await response.json();

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});