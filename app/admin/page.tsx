'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function AdminRedirectPage() {
  const router = useRouter();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (session) {
        // Always redirect authenticated users to profile
        // Profile page has admin dashboard button for admins
        router.push('/profile');
      } else {
        // Not authenticated, redirect to main login
        router.push('/login');
      }
    }
  }, [session, loading, router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-400" />
        <p className="text-white">Redirecting...</p>
      </div>
    </div>
  );
}