export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { sendBrevoEmail } from '@/lib/server/brevoClient';
import { logEmail } from '@/lib/services/emailLogService';

export async function POST(request: NextRequest) {
  try {
    const { to, subject, htmlContent, sender, attachments, userId, emailType } = await request.json();

    const response = await sendBrevoEmail({
      to,
      subject,
      htmlContent,
      sender,
      attachments
    });
    
    // Log the email
    if (userId && emailType) {
      await logEmail({
        user_id: userId,
        email_type: emailType,
        email: to[0].email,
        status: 'sent',
      });
    }

    return NextResponse.json({ success: true, messageId: response.messageId });
  } catch (error) {
    console.error('Email sending error:', error);
    
    // Log the failed email
    try {
      const body = await request.json();
      const { userId, emailType, to } = body;
      if (userId && emailType && to) {
        await logEmail({
          user_id: userId,
          email_type: emailType,
          email: to[0]?.email || '',
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    } catch (logError) {
      console.error('Failed to log email error:', logError);
    }

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
