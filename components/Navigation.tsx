'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface NavigationProps {
  cartCount?: number;
}

export default function Navigation({ cartCount = 0 }: NavigationProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const isActive = (path: string) => {
    return pathname === path;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

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

            {/* Register Button - Prominent Call to Action */}
            <Link href="/register">
              <Button className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-full px-4 sm:px-6 py-2 sm:py-2.5 h-auto text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                <Users className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Register Now</span>
                <span className="sm:hidden">Register</span>
              </Button>
            </Link>

            {/* Mobile Menu Toggle */}
            <div className="lg:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMobileMenu}
                className="text-gray-300 hover:text-white bg-gray-800/50 p-2 rounded-full"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-4 right-4 mt-2 bg-black/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl">
            <div className="flex flex-col space-y-3">
              <Link 
                href="/" 
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive('/') 
                    ? 'bg-cyan-500 text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                Home
              </Link>
              <Link 
                href="/about"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive('/about') 
                    ? 'bg-cyan-500 text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                About
              </Link>
              <Link 
                href="/events"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive('/events') 
                    ? 'bg-cyan-500 text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                Events
              </Link>
              <Link 
                href="/contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive('/contact') 
                    ? 'bg-cyan-500 text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                Contact
              </Link>
              
              {/* Admin Link in Mobile Menu */}
              <div className="border-t border-gray-700 pt-3 mt-3">
                <Link 
                  href="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-4 py-2 text-xs text-gray-400 hover:text-gray-300 transition-colors"
                >
                  Admin Access
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Admin Access Link (Desktop - Small Corner Link) */}
      <div className="hidden lg:block fixed bottom-4 right-4 z-40">
        <Link 
          href="/admin"
          className="text-xs text-gray-500 hover:text-gray-400 transition-colors bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full border border-gray-700/50"
        >
          Admin
        </Link>
      </div>
    </nav>
  );
}
