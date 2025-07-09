'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Calendar, Users, User, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { isAdminEmailSync } from '@/lib/config/admin';

interface NavigationProps {
  cartCount?: number;
}

export default function Navigation({ cartCount = 0 }: NavigationProps) {
  const pathname = usePathname();
  const { user, session, loading, signOut } = useAuth();
  
  const isActive = (path: string) => {
    return pathname === path;
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const isAdmin = user?.email ? isAdminEmailSync(user.email) : false;

  return (
    <nav className="fixed top-4 left-4 right-4 z-50">
      <div className="max-w-7xl mx-auto bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl px-3 sm:px-4 lg:px-6 shadow-xl shadow-black/20 hover:shadow-black/30 transition-all duration-300">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link href="/" className="text-lg sm:text-xl font-bold text-white hover:text-cyan-400 transition-colors">
              <span className="hidden sm:inline">SPANDAN 2025</span>
              <span className="sm:hidden">SPANDAN</span>
              <span className="text-xs sm:text-sm block text-cyan-400">Comic Chronicles</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden lg:flex items-center space-x-2 bg-gray-800/50 rounded-full p-1">
            <Link 
              href="/" 
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                isActive('/') 
                  ? 'bg-cyan-500 text-white' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Home
            </Link>
            <Link 
              href="/about" 
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                isActive('/about') 
                  ? 'bg-cyan-500 text-white' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              About
            </Link>
            <Link 
              href="/events" 
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                isActive('/events') 
                  ? 'bg-cyan-500 text-white' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Events
            </Link>
            <Link 
              href="/contact" 
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                isActive('/contact') 
                  ? 'bg-cyan-500 text-white' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Contact
            </Link>
          </div>

          {/* Right Side Elements */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Date Badge */}
            <div className="hidden sm:flex items-center space-x-2 text-gray-300 bg-gray-800/50 px-3 py-1.5 rounded-full text-xs sm:text-sm">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden md:inline">Aug 25-30</span>
              <span className="md:hidden">Aug 25</span>
            </div>

            {/* Authentication Status */}
            {loading ? (
              <div className="text-gray-300 bg-gray-800/50 px-3 py-1.5 rounded-full text-xs sm:text-sm">
                Loading...
              </div>
            ) : session ? (
              <div className="flex items-center space-x-1 sm:space-x-2">
                {/* Register Button - moved to left of My Account */}
                {pathname === '/register' && cartCount > 0 ? (
                  <Link href="/payment">
                    <Button className="bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white rounded-full px-3 sm:px-6 py-1.5 sm:py-2 h-auto text-xs sm:text-sm">
                      <span className="hidden sm:inline">Cart ({cartCount})</span>
                      <span className="sm:hidden">({cartCount})</span>
                    </Button>
                  </Link>
                ) : (
                  <Link href="/register">
                    <Button className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-full px-3 sm:px-6 py-1.5 sm:py-2 h-auto text-xs sm:text-sm">
                      Register
                    </Button>
                  </Link>
                )}
                
                {/* My Account Button - always goes to profile */}
                <Link href="/profile">
                  <Button variant="ghost" className="text-gray-300 hover:text-black bg-gray-800/50 px-2 sm:px-4 py-1.5 sm:py-2 h-auto rounded-full text-xs sm:text-sm">
                    <User className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                    <span className="hidden sm:inline">My Account</span>
                  </Button>
                </Link>
                
                {/* Sign Out Button */}
                <Button 
                  variant="ghost" 
                  onClick={handleSignOut}
                  className="text-gray-300 hover:text-red-800 hover:bg-red-500/10 bg-gray-800/50 px-2 sm:px-4 py-1.5 sm:py-2 h-auto rounded-full text-xs sm:text-sm"
                >
                  <LogOut className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </div>
            ) : (
              /* Unauthenticated - Register first, then Log In/Sign Up */
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Link href="/login?redirect=/register">
                  <Button className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-full px-3 sm:px-6 py-1.5 sm:py-2 h-auto text-xs sm:text-sm">
                    Register
                  </Button>
                </Link>
                
                <Link href="/login">
                  <Button variant="ghost" className="text-gray-300 hover:text-black bg-gray-800/50 px-2 sm:px-4 py-1.5 sm:py-2 h-auto rounded-full text-xs sm:text-sm">
                    <Users className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Log In / Sign Up</span>
                    <span className="sm:hidden">Login</span>
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
