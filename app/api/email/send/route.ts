export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { logEmail } from '@/lib/server/emailLogService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, htmlContent, sender, userId, emailType } = body;

    console.log('=== EMAIL API DEBUG ===');
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    // Validate required fields
    if (!to || !subject || !htmlContent) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, htmlContent' },
        { status: 400 }
      );
    }
    
    // Validate email format in 'to' field
    const recipients = Array.isArray(to) ? to : [to];
    console.log('Recipients array:', recipients);
    
    for (let recipient of recipients) {
      const email = recipient.email || recipient;
      console.log('Checking recipient email:', email);
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        console.error('Invalid recipient email:', email);
        return NextResponse.json(
          { error: `Invalid email format: ${email}` },
          { status: 400 }
        );
      }
    }

    // Validate environment variables
    if (!process.env.BREVO_API_KEY) {
      console.error('BREVO_API_KEY environment variable is not set');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    const finalSender = sender || {
      name: 'JIPMER STUDENT ASSOCIATION',
      email: 'jsa@jipmerspandan.in'
    };

    console.log('Sending email with:', {
      to: Array.isArray(to) ? to : [to],
      subject,
      sender: finalSender,
      hasHtml: !!htmlContent
    });

    // Send email via Brevo API
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: finalSender,
        to: Array.isArray(to) ? to.map(t => ({ email: t.email || t })) : [{ email: to.email || to }],
        subject,
        htmlContent
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Brevo API error:', response.status, errorText);
      
      // Log failed email
      if (userId) {
        const emailAddress = Array.isArray(to) ? to[0]?.email || to[0] : to.email || to;
        await logEmail({
          user_id: userId,
          email_type: emailType || 'general',
          email: emailAddress,
          status: 'failed',
          error: `Brevo API error: ${response.status} - ${errorText}`
        });
      }
      
      return NextResponse.json(
        { error: `Email service error: ${response.status} - ${errorText}` },
        { status: 500 }
      );
    }

    const result = await response.json();
    console.log('Email sent successfully:', result);

    // Log successful email
    if (userId) {
      const emailAddress = Array.isArray(to) ? to[0]?.email || to[0] : to.email || to;
      await logEmail({
        user_id: userId,
        email_type: emailType || 'general',
        email: emailAddress,
        status: 'sent'
      });
    }

    return NextResponse.json({ 
      success: true, 
      messageId: result.messageId,
      message: 'Email sent successfully' 
    });

  } catch (error) {
    console.error('Error in email API route:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
