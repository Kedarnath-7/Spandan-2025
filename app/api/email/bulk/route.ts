export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getEmailTemplate } from '@/lib/services/emailTemplateService';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { templateKey, filter, subject, body } = await request.json();

    // Fetch recipients based on filter
    let recipients: any[] = [];
    let query;
    
    switch (filter) {
      case 'approved':
        query = supabase.from('registrations').select('*').eq('status', 'approved');
        break;
      case 'paid':
        query = supabase.from('registrations').select('*').gt('total_amount', 0);
        break;
      case 'event':
        query = supabase.from('event_registrations').select('*').eq('status', 'approved');
        break;
      case 'tier':
        query = supabase.from('registrations').select('*').eq('status', 'approved');
        break;
      default:
        // Get all confirmed users (both registrations and event registrations)
        const { data: tierUsers } = await supabase.from('registrations').select('*').eq('status', 'approved');
        const { data: eventUsers } = await supabase.from('event_registrations').select('*').eq('status', 'approved');
        recipients = [...(tierUsers || []), ...(eventUsers || [])];
    }

    if (filter !== 'all' && query) {
      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      recipients = data || [];
    }

    // Fetch template if templateKey is provided
    let template = null;
    if (templateKey) {
      template = await getEmailTemplate(templateKey);
    }

    let sentCount = 0;
    const errors: string[] = [];

    for (const user of recipients) {
      try {
        // Prepare email data
        const userEmail = user.email || user.leader_email;
        const userName = user.name || user.leader_name;
        
        if (!userEmail) {
          errors.push(`No email found for user: ${userName || user.user_id || user.group_id}`);
          continue;
        }

        // Replace template variables
        const finalSubject = subject || template?.subject || 'Announcement';
        const finalBody = (body || template?.body || '').replace(/{{name}}/g, userName || '')
          .replace(/{{user_id}}/g, user.user_id || user.group_id || '')
          .replace(/{{event_name}}/g, user.event_name || '')
          .replace(/{{group_id}}/g, user.group_id || '')
          .replace(/{{college}}/g, user.college || '')
          .replace(/{{tier_pass}}/g, user.tier_pass || '')
          .replace(/{{created_at}}/g, user.created_at ? new Date(user.created_at).toLocaleDateString() : '');

        // Send email via the send API
        const emailResponse = await fetch(`${request.nextUrl.origin}/api/email/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: [{ email: userEmail, name: userName }],
            subject: finalSubject,
            htmlContent: finalBody,
            userId: user.user_id || user.group_id,
            emailType: 'bulk'
          })
        });

        if (emailResponse.ok) {
          sentCount++;
        } else {
          const errorData = await emailResponse.json();
          errors.push(`Failed to send to ${userEmail}: ${errorData.error}`);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`Error sending to ${user.email || user.leader_email}: ${errorMsg}`);
      }
    }

    return NextResponse.json({ 
      success: true, 
      sentCount, 
      totalRecipients: recipients.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Bulk email error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
