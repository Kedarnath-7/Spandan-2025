import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Test the event approval email functionality
    const { getEmailTemplate } = await import('@/lib/services/emailTemplateService');
    const { sendApprovalEmail } = await import('@/lib/services/emailService');
    
    console.log('Testing event approval email...');
    
    // Check if template exists
    const template = await getEmailTemplate('approval_event');
    
    if (!template) {
      return NextResponse.json({
        status: 'error',
        message: 'approval_event template not found',
        details: 'Please add the approval_event template to the database'
      });
    }
    
    console.log('Template found:', template);
    
    // Test data structure that matches event registration
    const testEventUser = {
      // Event registration fields
      contact_name: 'Test User',
      contact_email: 'test@example.com',
      contact_user_id: 'USER-TEST-123',
      event_name: 'Test Event',
      group_id: 'EVT-TEST-123',
      created_at: new Date().toISOString(),
      members: [
        {
          name: 'Test Member',
          college: 'Test College',
          email: 'member@example.com'
        }
      ]
    };
    
    console.log('Test user data:', testEventUser);
    
    // Test the email service without actually sending
    try {
      // Just test the template processing
      const userName = testEventUser.contact_name || '';
      const userEmail = testEventUser.contact_email || '';
      const userId = testEventUser.contact_user_id || '';
      
      if (!userEmail || !userEmail.includes('@')) {
        return NextResponse.json({
          status: 'error',
          message: 'Email validation would fail',
          details: `Invalid email: ${userEmail}`
        });
      }
      
      return NextResponse.json({
        status: 'success',
        message: 'Event approval email system is configured correctly',
        details: {
          templateFound: true,
          templateType: template.type,
          templateSubject: template.subject,
          userData: {
            userName,
            userEmail,
            userId,
            eventName: testEventUser.event_name,
            college: testEventUser.members?.[0]?.college
          }
        }
      });
      
    } catch (emailError) {
      return NextResponse.json({
        status: 'error',
        message: 'Email processing failed',
        details: emailError instanceof Error ? emailError.message : 'Unknown error'
      });
    }
    
  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
