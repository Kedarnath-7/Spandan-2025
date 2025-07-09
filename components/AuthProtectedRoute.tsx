'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/AuthContext'
import { Loader2 } from 'lucide-react'
import Navigation from '@/components/Navigation'

interface AuthProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
  fallbackPath?: string
}

export default function AuthProtectedRoute({ 
  children, 
  redirectTo = '/login',
  fallbackPath = '/register' 
}: AuthProtectedRouteProps) {
  const { session, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !session) {
      // Not authenticated, redirect to login with callback
      const loginUrl = `${redirectTo}?redirect=${encodeURIComponent(fallbackPath)}`
      router.push(loginUrl)
    }
  }, [loading, session, router, redirectTo, fallbackPath])

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 relative overflow-hidden">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-400" />
            <p className="text-white">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show nothing while redirecting
  if (!session) {
    return null
  }

  // Render the protected content
  return <>{children}</>
}
