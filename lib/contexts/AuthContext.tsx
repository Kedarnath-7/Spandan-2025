'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser, type AuthUser } from '@/lib/auth/auth-utils';
import type { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
    }
  };

  const signOut = async () => {
    try {
      // Clear all auth state immediately
      setUser(null);
      setSession(null);
      setLoading(true);
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Force clear any cached session data
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.clear();
      
      // Force reload to clear any stale state
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Get initial session with retry logic
    const getInitialSession = async () => {
      try {
        // Clear any stale session data first
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          // Clear potentially corrupted session
          setSession(null);
          setUser(null);
          return;
        }
        
        console.log('Initial session loaded:', session?.user?.email || 'No session');
        setSession(session);
        
        if (session) {
          try {
            const currentUser = await getCurrentUser();
            console.log('Initial user loaded:', currentUser?.email || 'No user');
            setUser(currentUser);
          } catch (userError) {
            console.error('Error loading user:', userError);
            // If user loading fails, clear session to prevent stuck state
            setSession(null);
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        // Clear everything on error
        setSession(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes with enhanced error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email || 'No session');
        console.log('Current URL:', typeof window !== 'undefined' ? window.location.href : 'SSR');
        
        try {
          setSession(session);
          
          if (session && event !== 'SIGNED_OUT') {
            const currentUser = await getCurrentUser();
            setUser(currentUser);
            console.log('User set in auth context:', currentUser?.email || 'No user');
          } else {
            setUser(null);
            console.log('User cleared from auth context');
          }
          
          // Handle sign out event specifically
          if (event === 'SIGNED_OUT') {
            setUser(null);
            setSession(null);
            // Clear any cached data
            localStorage.removeItem('supabase.auth.token');
            sessionStorage.clear();
          }
          
        } catch (error) {
          console.error('Error in auth state change handler:', error);
          // On error, clear everything to prevent stuck state
          setUser(null);
          setSession(null);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    session,
    loading,
    signOut,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
