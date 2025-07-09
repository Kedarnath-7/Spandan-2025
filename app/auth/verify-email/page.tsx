'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { CheckCircle, XCircle, Mail, ArrowLeft } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Check for token in URL
        const token = searchParams.get('token');
        const type = searchParams.get('type');

        if (!token || type !== 'signup') {
          setStatus('error');
          setMessage('Invalid verification link. Please check your email for the correct link.');
          return;
        }

        // Verify the token with Supabase
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'signup'
        });

        if (error) {
          throw error;
        }

        setStatus('success');
        setMessage('Your email has been verified successfully! You can now log in to your account.');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login?verified=true');
        }, 3000);

      } catch (error: any) {
        console.error('Email verification error:', error);
        setStatus('error');
        
        if (error.message?.includes('expired')) {
          setMessage('This verification link has expired. Please request a new one from the login page.');
        } else {
          setMessage('Failed to verify email. Please try again or contact support.');
        }
      }
    };

    verifyEmail();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-[#0A0F1A] text-white relative overflow-hidden">
      {/* Comic book style background elements */}
      <div className="absolute inset-0 opacity-[0.08]">
        <div className="absolute top-20 left-10 text-6xl font-black text-blue-400 transform -rotate-12 select-none">VERIFY!</div>
        <div className="absolute top-40 right-20 text-4xl font-black text-yellow-400 transform rotate-12 select-none">CHECK!</div>
        <div className="absolute bottom-40 left-20 text-5xl font-black text-red-400 transform -rotate-6 select-none">CONFIRM!</div>
        <div className="absolute bottom-20 right-10 text-3xl font-black text-green-400 transform rotate-6 select-none">DONE!</div>
      </div>

      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <main className="relative z-10 pt-32 pb-16">
        <div className="max-w-md mx-auto px-4">
          
          {/* Back Button */}
          <div className="mb-6">
            <Link href="/">
              <Button variant="ghost" className="text-gray-300 hover:text-white p-0">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>

          {/* Verification Card */}
          <Card className="bg-slate-900/50 border-slate-700 backdrop-blur-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center">
                {status === 'loading' && (
                  <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                )}
                {status === 'success' && <CheckCircle className="w-8 h-8 text-green-400" />}
                {status === 'error' && <XCircle className="w-8 h-8 text-red-400" />}
              </div>
              
              <CardTitle className="text-2xl font-bold text-white">
                {status === 'loading' && 'Verifying Email...'}
                {status === 'success' && 'Email Verified!'}
                {status === 'error' && 'Verification Failed'}
              </CardTitle>
              
              <CardDescription className="text-gray-300">
                {message}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="text-center space-y-4">
              {status === 'success' && (
                <>
                  <p className="text-green-400 text-sm">
                    Redirecting to login page in 3 seconds...
                  </p>
                  <Link href="/login">
                    <Button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white">
                      Continue to Login
                    </Button>
                  </Link>
                </>
              )}
              
              {status === 'error' && (
                <div className="space-y-3">
                  <Link href="/login">
                    <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white">
                      Go to Login
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:text-white hover:border-gray-500">
                      Create New Account
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer ctaText="WELCOME TO SPANDAN!" />
    </div>
  );
}
