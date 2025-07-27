import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing email service configuration...');
    
    // Check environment variables
    const hasBrevoKey = !!process.env.BREVO_API_KEY;
    const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasSupabaseServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('Environment check:', {
      hasBrevoKey,
      hasSupabaseUrl,
      hasSupabaseServiceKey
    });

    if (!hasBrevoKey) {
      return NextResponse.json({
        status: 'error',
        message: 'BREVO_API_KEY is not configured',
        details: 'Please add your Brevo API key to .env.local file'
      });
    }

    // Test Brevo API connection
    const response = await fetch('https://api.brevo.com/v3/account', {
      method: 'GET',
      headers: {
        'api-key': process.env.BREVO_API_KEY!,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({
        status: 'error',
        message: 'Brevo API connection failed',
        details: `${response.status}: ${errorText}`
      });
    }

    const accountInfo = await response.json();
    
    return NextResponse.json({
      status: 'success',
      message: 'Email service is configured correctly',
      details: {
        brevoAccount: accountInfo.email,
        plan: accountInfo.plan?.type,
        environment: {
          hasBrevoKey,
          hasSupabaseUrl,
          hasSupabaseServiceKey
        }
      }
    });

  } catch (error) {
    console.error('Email service test error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Email service test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
