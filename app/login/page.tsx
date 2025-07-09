'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { signInUser, resendEmailVerification } from '@/lib/auth/auth-utils';
import { isAdminEmailSync } from '@/lib/config/admin';
import { Lock, User, ArrowLeft, Mail, Eye, EyeOff } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || null;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setNeedsVerification(false);

    try {
      const { data, error } = await signInUser(email, password);

      if (error) {
        // Check if it's an email verification error
        if ((error as any)?.message?.includes('email not confirmed')) {
          setNeedsVerification(true);
          toast({
            title: "Email Verification Required",
            description: "Please check your email and verify your account before logging in.",
            variant: "destructive"
          });
          return;
        }
        
        throw error;
      }

      if (data?.user) {
        const userEmail = data.user.email!;
        
        toast({
          title: "Login Successful",
          description: `Welcome ${isAdminEmailSync(userEmail) ? 'Admin' : 'to SPANDAN 2025'}!`,
        });
        
        // Role-based redirection with redirect parameter support
        if (redirectTo) {
          router.push(redirectTo);
        } else if (isAdminEmailSync(userEmail)) {
          router.push('/admin/dashboard');
        } else {
          router.push('/profile');
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      const { error } = await resendEmailVerification(email);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Verification Email Sent",
        description: "Please check your email for the verification link.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send verification email.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1A] text-white relative overflow-hidden">
      {/* Comic book style background elements */}
      <div className="absolute inset-0 opacity-[0.08]">
        <div className="absolute top-20 left-10 text-6xl font-black text-blue-400 transform -rotate-12 select-none">LOGIN!</div>
        <div className="absolute top-40 right-20 text-4xl font-black text-yellow-400 transform rotate-12 select-none">ACCESS!</div>
        <div className="absolute bottom-40 left-20 text-5xl font-black text-red-400 transform -rotate-6 select-none">ENTER!</div>
        <div className="absolute bottom-20 right-10 text-3xl font-black text-green-400 transform rotate-6 select-none">GO!</div>
      </div>

      {/* Geometric shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-32 right-32 w-16 h-16 border-4 border-blue-400 transform rotate-45 opacity-20"></div>
        <div className="absolute bottom-32 left-32 w-12 h-12 border-4 border-yellow-400 transform rotate-12 opacity-20"></div>
        <div className="absolute top-1/2 left-10 w-8 h-8 bg-red-400 transform rotate-45 opacity-20"></div>
        <div className="absolute top-1/4 right-10 w-10 h-10 bg-green-400 transform rotate-12 opacity-20"></div>
      </div>

      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <main className="relative z-10 pt-32 pb-16">
        <div className="max-w-md mx-auto px-4">
          
          {/* Login Card */}
          <Card className="bg-slate-900/50 border-slate-700 backdrop-blur-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center">
                <Lock className="w-8 h-8 text-cyan-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-white">Welcome Back</CardTitle>
              <CardDescription className="text-gray-300">
                Sign in to your SPANDAN 2025 account
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300">Email</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-slate-800/50 border-slate-600 text-white placeholder-gray-400 focus:border-cyan-400"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-300">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 bg-slate-800/50 border-slate-600 text-white placeholder-gray-400 focus:border-cyan-400"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Email Verification Notice */}
                {needsVerification && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-yellow-400" />
                      <p className="text-yellow-300 text-sm">
                        Please verify your email address before logging in.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="link"
                      className="text-yellow-400 hover:text-yellow-300 p-0 h-auto"
                      onClick={handleResendVerification}
                    >
                      Resend verification email
                    </Button>
                  </div>
                )}

                {/* Forgot Password */}
                <div className="text-right">
                  <Link href="/auth/forgot-password">
                    <Button variant="link" className="text-cyan-400 hover:text-cyan-300 p-0 h-auto">
                      Forgot your password?
                    </Button>
                  </Link>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium py-3"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Signing In...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              {/* Sign Up Link */}
              <div className="text-center mt-6 pt-4 border-t border-slate-700">
                <p className="text-gray-300">
                  Don&apos;t have an account?{' '}
                  <Link href="/signup">
                    <Button variant="link" className="text-cyan-400 hover:text-cyan-300 p-0 h-auto">
                      Sign up here
                    </Button>
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer ctaText="JOIN THE SPANDAN FAMILY!" />
    </div>
  );
}
