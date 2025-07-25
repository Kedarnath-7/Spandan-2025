-- Insert default email templates for Spandan 2025
-- Run this script in Supabase SQL Editor to set up email templates

-- Insert approval_tier template
INSERT INTO email_templates (type, subject, body, last_edited) 
VALUES (
  'approval_tier',
  'Registration Approved - Spandan 2025 Delegate Pass',
  '<html><body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
<div style="max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="margin: 0; font-size: 28px;">🎉 Registration Approved!</h1>
    <p style="margin: 10px 0 0 0; font-size: 18px;">Welcome to Spandan 2025</p>
  </div>
  
  <div style="background: white; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 10px 10px;">
    <p>Dear <strong>{{name}}</strong>,</p>
    
    <p>Congratulations! Your registration as a delegate for <strong>SPANDAN 2025 - Excelsior: The Comic Chronicles</strong> has been <span style="color: #28a745; font-weight: bold;">APPROVED</span>.</p>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #495057; margin-top: 0;">📋 Registration Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; font-weight: bold;">Delegate Name:</td><td>{{name}}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: bold;">College:</td><td>{{college}}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: bold;">Tier/Pass:</td><td>{{tier_pass}}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: bold;">Delegate ID:</td><td><span style="background: #007bff; color: white; padding: 4px 8px; border-radius: 4px; font-family: monospace;">{{user_id}}</span></td></tr>
        <tr><td style="padding: 8px 0; font-weight: bold;">Registration Date:</td><td>{{created_at}}</td></tr>
      </table>
    </div>
    
    <div style="background: #e7f3ff; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #0056b3;">🎯 Next Steps</h4>
      <ul style="margin: 10px 0;">
        <li>Use your <strong>Delegate ID: {{user_id}}</strong> to register for events</li>
        <li>Keep this email and your college ID ready for event entry</li>
        <li>Visit our website to complete event registrations</li>
      </ul>
    </div>
    
    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #856404;">📅 Event Details</h4>
      <p style="margin: 5px 0;"><strong>Dates:</strong> August 25th - 30th, 2025</p>
      <p style="margin: 5px 0;"><strong>Venue:</strong> JIPMER, Pudicherry</p>
      <p style="margin: 5px 0;"><strong>Theme:</strong> Excelsior: The Comic Chronicles</p>
    </div>
    
    <p>For any queries or assistance, feel free to contact us at <a href="mailto:jsa.jipmer@gmail.com" style="color: #007bff;">jsa.jipmer@gmail.com</a></p>
    
    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
      <p style="color: #6c757d; font-size: 14px;">See you at Spandan 2025! 🚀</p>
    </div>
  </div>
</div>
</body></html>',
  NOW()
) ON CONFLICT (type) DO UPDATE SET 
  subject = EXCLUDED.subject,
  body = EXCLUDED.body,
  last_edited = EXCLUDED.last_edited;

-- Insert approval_event template
INSERT INTO email_templates (type, subject, body, last_edited) 
VALUES (
  'approval_event',
  'Event Registration Confirmed - {{event_name}} | Spandan 2025',
  '<html><body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
<div style="max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="margin: 0; font-size: 28px;">✅ Event Registration Confirmed!</h1>
    <p style="margin: 10px 0 0 0; font-size: 18px;">You''re all set for {{event_name}}</p>
  </div>
  
  <div style="background: white; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 10px 10px;">
    <p>Dear <strong>{{name}}</strong>,</p>
    
    <p>Great news! Your registration for <strong>{{event_name}}</strong> at Spandan 2025 has been <span style="color: #28a745; font-weight: bold;">CONFIRMED</span>.</p>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #495057; margin-top: 0;">🎪 Event Registration Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; font-weight: bold;">Participant:</td><td>{{name}}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: bold;">College:</td><td>{{college}}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: bold;">Event:</td><td><span style="color: #28a745; font-weight: bold;">{{event_name}}</span></td></tr>
        <tr><td style="padding: 8px 0; font-weight: bold;">Participant ID:</td><td><span style="background: #28a745; color: white; padding: 4px 8px; border-radius: 4px; font-family: monospace;">{{user_id}}</span></td></tr>
        <tr><td style="padding: 8px 0; font-weight: bold;">Group ID:</td><td>{{group_id}}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: bold;">Registration Date:</td><td>{{created_at}}</td></tr>
      </table>
    </div>
    
    <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #155724;">🏆 What to Bring</h4>
      <ul style="margin: 10px 0;">
        <li>This confirmation email (printed or digital)</li>
        <li>Valid college ID card</li>
        <li>Your Participant ID: <strong>{{user_id}}</strong></li>
        <li>Any event-specific materials (if mentioned earlier)</li>
      </ul>
    </div>
    
    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #856404;">⏰ Important Reminders</h4>
      <p style="margin: 5px 0;">• Arrive 30 minutes before the event start time</p>
      <p style="margin: 5px 0;">• Check the event schedule for any last-minute updates</p>
      <p style="margin: 5px 0;">• Follow event guidelines and dress code (if any)</p>
    </div>
    
    <p>We''re excited to have you participate in {{event_name}}! For any queries, contact us at <a href="mailto:jsa.jipmer@gmail.com" style="color: #007bff;">jsa.jipmer@gmail.com</a></p>
    
    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
      <p style="color: #6c757d; font-size: 14px;">Best of luck for your event! 🎉</p>
    </div>
  </div>
</div>
</body></html>',
  NOW()
) ON CONFLICT (type) DO UPDATE SET 
  subject = EXCLUDED.subject,
  body = EXCLUDED.body,
  last_edited = EXCLUDED.last_edited;

-- Insert bulk_announcement template
INSERT INTO email_templates (type, subject, body, last_edited) 
VALUES (
  'bulk_announcement',
  'Important Update - Spandan 2025',
  '<html><body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
<div style="max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #6f42c1 0%, #e83e8c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="margin: 0; font-size: 28px;">📢 Spandan 2025 Update</h1>
    <p style="margin: 10px 0 0 0; font-size: 18px;">Important Information for Participants</p>
  </div>
  
  <div style="background: white; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 10px 10px;">
    <p>Dear <strong>{{name}}</strong>,</p>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <div style="color: #495057;">
        {{body_content}}
      </div>
    </div>
    
    <p>Thank you for being part of Spandan 2025. For any questions, reach out to us at <a href="mailto:jsa.jipmer@gmail.com" style="color: #007bff;">jsa.jipmer@gmail.com</a></p>
    
    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
      <p style="color: #6c757d; font-size: 14px;">Team Spandan 2025 📚</p>
    </div>
  </div>
</div>
</body></html>',
  NOW()
) ON CONFLICT (type) DO UPDATE SET 
  subject = EXCLUDED.subject,
  body = EXCLUDED.body,
  last_edited = EXCLUDED.last_edited;

-- Verify templates were inserted
SELECT type, subject, LENGTH(body) as body_length, last_edited 
FROM email_templates 
ORDER BY type;
