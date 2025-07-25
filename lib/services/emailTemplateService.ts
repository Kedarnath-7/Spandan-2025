import { supabase } from '@/lib/supabase';

export async function getEmailTemplate(type: string) {
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('type', type)
    .single();
  if (error) throw error;
  return data;
}

export async function updateEmailTemplate(type: string, subject: string, body: string) {
  const { data, error } = await supabase
    .from('email_templates')
    .upsert({ type, subject, body, last_edited: new Date().toISOString() }, { onConflict: 'type' });
  if (error) throw error;
  return data;
}

export async function getAllEmailTemplates() {
  const { data, error } = await supabase
    .from('email_templates')
    .select('*');
  if (error) throw error;
  return data;
}

// Add default templates if not present
export async function ensureDefaultEmailTemplates() {
  const defaults = [
    {
      type: 'approval_tier',
      subject: 'Registration Confirmed - Spandan 2025 Delegate Pass',
      body: `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #667eea; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Registration Confirmed!</h1>
            <h2>SPANDAN 2025 - Excelsior: The Comic Chronicles</h2>
        </div>
        <div class="content">
            <p>Dear <strong>{{name}}</strong>,</p>
            
            <p>We are delighted to confirm your registration as a delegate for <strong>SPANDAN 2025 - Excelsior: The Comic Chronicles</strong>, scheduled from <strong>August 25th to August 30th</strong> at JIPMER, Pudicherry.</p>
            
            <div class="info-box">
                <h3>📋 Registration Details</h3>
                <p><strong>Delegate Name:</strong> {{name}}<br>
                <strong>College:</strong> {{college}}<br>
                <strong>Tier/Pass:</strong> {{tier_pass}}<br>
                <strong>Delegate ID:</strong> {{user_id}}<br>
                <strong>Registration Date:</strong> {{created_at}}</p>
            </div>
            
            <p>🎯 <strong>Next Steps:</strong><br>
            Use your Delegate ID <strong>{{user_id}}</strong> to continue and complete your event registrations for Spandan 2025 through our website.</p>
            
            <p>📱 <strong>Important Reminders:</strong><br>
            • Carry a copy of this email and your college ID during the event<br>
            • Further details about schedule and venues will be shared soon<br>
            • Join our official WhatsApp group for updates</p>
            
            <p>For any queries, contact us at <a href="mailto:jsa.jipmer@gmail.com">jsa.jipmer@gmail.com</a></p>
            
            <p>Looking forward to seeing you at Spandan 2025!</p>
            
            <p>Best regards,<br>
            <strong>Team Spandan 2025</strong><br>
            JIPMER, Pudicherry</p>
        </div>
        <div class="footer">
            <p>This is an automated email. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>`
    },
    {
      type: 'approval_event',
      subject: 'Event Registration Confirmed - {{event_name}} | Spandan 2025',
      body: `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #43cea2 0%, #185a9d 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #43cea2; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎊 Event Registration Confirmed!</h1>
            <h2>{{event_name}}</h2>
        </div>
        <div class="content">
            <p>Dear <strong>{{name}}</strong>,</p>
            
            <p>Congratulations! Your registration for <strong>{{event_name}}</strong> at SPANDAN 2025 - Excelsior: The Comic Chronicles has been confirmed.</p>
            
            <div class="info-box">
                <h3>🎪 Event Registration Details</h3>
                <p><strong>Participant:</strong> {{name}}<br>
                <strong>College:</strong> {{college}}<br>
                <strong>Event:</strong> {{event_name}}<br>
                <strong>Participant ID:</strong> {{user_id}}<br>
                <strong>Registration Date:</strong> {{created_at}}</p>
            </div>
            
            <p>🏆 <strong>What's Next:</strong><br>
            • Event details and venue information will be shared closer to the date<br>
            • Bring this confirmation email and your college ID to the event<br>
            • Check our website regularly for updates and schedule changes</p>
            
            <p>📞 <strong>Need Help?</strong><br>
            Contact us at <a href="mailto:jsa.jipmer@gmail.com">jsa.jipmer@gmail.com</a> for any questions or concerns.</p>
            
            <p>Get ready to showcase your talents at Spandan 2025!</p>
            
            <p>Best regards,<br>
            <strong>Team Spandan 2025</strong><br>
            JIPMER, Pudicherry</p>
        </div>
        <div class="footer">
            <p>This is an automated email. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>`
    },
    {
      type: 'bulk_announcement',
      subject: 'Important Update - Spandan 2025',
      body: `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📢 Important Announcement</h1>
            <h2>SPANDAN 2025</h2>
        </div>
        <div class="content">
            <p>Dear <strong>{{name}}</strong>,</p>
            
            <p>We have an important update regarding Spandan 2025. Please read the following carefully:</p>
            
            <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #ff6b6b;">
                <!-- Custom message content will be inserted here -->
            </div>
            
            <p>For any questions or clarifications, please contact us at <a href="mailto:jsa.jipmer@gmail.com">jsa.jipmer@gmail.com</a></p>
            
            <p>Thank you for your attention.</p>
            
            <p>Best regards,<br>
            <strong>Team Spandan 2025</strong><br>
            JIPMER, Puducherry</p>
        </div>
        <div class="footer">
            <p>This is an automated email. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>`
    }
  ];
  
  for (const tpl of defaults) {
    const { data, error } = await supabase
      .from('email_templates')
      .select('type')
      .eq('type', tpl.type)
      .single();
    if (!data) {
      await supabase.from('email_templates').insert({
        type: tpl.type,
        subject: tpl.subject,
        body: tpl.body,
        last_edited: new Date().toISOString()
      });
    }
  }
}
