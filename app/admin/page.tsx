'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { navigateReliably } from '@/lib/utils/pageUtils';
import { Lock, User, ArrowLeft, Calendar, Users, Mail, Phone, MapPin, Zap } from 'lucide-react';
import Footer from '@/components/Footer';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        toast({
          title: "Login Successful",
          description: "Welcome to SPANDAN 2025 Admin Dashboard!",
        });
        
        navigateReliably('/admin/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: "Invalid email or password. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1A] text-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute top-20 left-10 text-6xl font-bold text-white transform -rotate-12">POW!</div>
        <div className="absolute top-40 right-20 text-4xl font-bold text-white transform rotate-12">BOOM!</div>
        <div className="absolute bottom-40 left-20 w-16 h-16 border-4 border-white transform rotate-45"></div>
        <div className="absolute bottom-20 right-10 w-12 h-12 border-4 border-white transform rotate-12"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 bg-black/30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-8">
              <div className="text-xl font-bold text-white">
                SPANDAN 2025
                <span className="text-sm block text-cyan-400">Comic Chronicles</span>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-2 bg-gray-800/50 rounded-full p-1">
              <Link href="/" className="text-gray-300 hover:text-white px-5 py-2 rounded-full text-sm font-medium transition-colors">
                Home
              </Link>
              <Link href="/about" className="text-gray-300 hover:text-white px-5 py-2 rounded-full text-sm font-medium transition-colors">
                About
              </Link>
              <Link href="/events" className="text-gray-300 hover:text-white px-5 py-2 rounded-full text-sm font-medium transition-colors">
                Events
              </Link>
              <Link href="/register" className="text-gray-300 hover:text-white px-5 py-2 rounded-full text-sm font-medium transition-colors">
                Registration
              </Link>
              <Link href="/contact" className="text-gray-300 hover:text-white px-5 py-2 rounded-full text-sm font-medium transition-colors">
                Contact
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-300 bg-gray-800/50 px-4 py-2 rounded-full text-sm">
                <Calendar className="w-4 h-4" />
                <span>Aug 25-30</span>
              </div>
              <Link href="/admin">
                <Button variant="ghost" className="bg-cyan-500 text-white px-4 py-2 h-auto rounded-full text-sm">
                  <Users className="w-4 h-4 mr-2" />
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-full px-6 py-2 h-auto text-sm">
                  Register
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 pt-12 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-block bg-gradient-to-r from-cyan-500 to-blue-500 px-8 py-4 rounded-2xl mb-6">
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-wide">
                ADMIN LOGIN
              </h1>
            </div>
            <p className="text-lg text-white max-w-2xl mx-auto leading-relaxed">
              Access the admin dashboard to manage registrations, events, and payments
            </p>
          </div>

          {/* Login Form */}
          <div className="max-w-md mx-auto">
            <Card className="bg-slate-800/80 border-2 border-cyan-400/50 rounded-2xl">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-white">Admin Access</CardTitle>
                <CardDescription className="text-gray-300">
                  Enter your credentials to access the admin panel
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white font-medium">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@jipmer.edu.in"
                      required
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 focus:border-cyan-400"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white font-medium">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 focus:border-cyan-400"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-3 rounded-xl transition-all duration-300"
                  >
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </form>

                <div className="mt-6 pt-6 border-t border-slate-600">
                  <Link href="/">
                    <Button variant="ghost" className="w-full text-gray-300 hover:text-white">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Homepage
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </main>

      <Footer ctaText="SECURE ADMIN ACCESS FOR MANAGING SPANDAN 2025!" />
    </div>
  );
}