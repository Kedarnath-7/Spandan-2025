'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, MapPin, Users, Phone, Mail, Zap } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function HomePage() {
  const { session } = useAuth();
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Comic book style background elements - positioned exactly as in design */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 text-6xl font-black text-blue-400 transform -rotate-12 select-none">POW!</div>
        <div className="absolute top-40 right-20 text-4xl font-black text-yellow-400 transform rotate-12 select-none">BOOM!</div>
        <div className="absolute bottom-40 left-20 text-5xl font-black text-red-400 transform -rotate-6 select-none">ZAP!</div>
        <div className="absolute bottom-20 right-10 text-3xl font-black text-green-400 transform rotate-6 select-none">BANG!</div>
      </div>

      {/* Geometric shapes - matching design positioning */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-32 right-32 w-16 h-16 border-4 border-blue-400 transform rotate-45 opacity-30"></div>
        <div className="absolute bottom-32 left-32 w-12 h-12 border-4 border-yellow-400 transform rotate-12 opacity-30"></div>
        <div className="absolute top-1/2 left-10 w-8 h-8 bg-red-400 transform rotate-45 opacity-30"></div>
        <div className="absolute top-1/4 right-10 w-10 h-10 bg-green-400 transform rotate-12 opacity-30"></div>
      </div>

      {/* Navigation */}
      <Navigation />

      {/* Hero Section - exact typography and spacing from design */}
      <section className="relative z-10 pt-20 sm:pt-24 pb-6 sm:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Main title - matching design font weight and size */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-white mb-4 sm:mb-6 tracking-wider transform hover:scale-105 transition-transform duration-500 select-none">
              SPANDAN
            </h1>
            <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-blue-400 mb-2 tracking-wide">
              EXCELSIOR: The Comic Chronicles
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-blue-300 mb-6 sm:mb-8 tracking-wider">
              25TH TO 30TH AUGUST
            </div>
          </div>

          {/* Description text - matching design typography */}
          <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 text-gray-200 mb-8 sm:mb-12">
            <p className="text-base sm:text-lg md:text-xl font-medium leading-relaxed tracking-wide px-2">
              WELCOME TO JIPMER&#39;S VERY OWN COMIC MULTIVERSE—WHERE THE STREETS SHIMMER
              WITH SECRETS AND EVERY FACE HIDES A HERO.
            </p>
            <p className="text-base sm:text-lg md:text-xl font-medium leading-relaxed tracking-wide px-2">
              GET READY FOR EPIC SPORTS SHOWDOWNS, MIND-BENDING ACADEMIC DUELS, AND
              CULTURAL SPECTACLES THAT BURST OFF THE PAGE!
            </p>
          </div>
        </div>
      </section>

      {/* Second Section - matching design layout and spacing */}
      <section className="relative z-10 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Additional description - exact typography from design */}
          <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 text-gray-200 mb-8 sm:mb-12">
            <p className="text-base sm:text-lg md:text-xl font-medium leading-relaxed tracking-wide px-2">
              IN THIS LEGENDARY SAGA, EVERY EVENT IS A PLOT TWIST, FROM THE ROAR OF THE ARENA
              TO THE HUSH OF MYSTERY IN THE MIST. SPANDAN IS WHERE DESTINIES COLLIDE AND
              STORIES ARE BORN.
            </p>
            <p className="text-base sm:text-lg md:text-xl font-medium leading-relaxed tracking-wide px-2">
              This isn&#39;t just a fest—it&#39;s your origin story. <span className="text-blue-400 font-semibold">Suit up. Step in.</span>
            </p>
            <p className="text-base sm:text-lg md:text-xl font-medium leading-relaxed tracking-wide px-2">
              The panel&#39;s been drawn... are you ready to turn the page?
            </p>
          </div>

          {/* Info Cards - exact styling and colors from design */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12 px-4">
            {/* Dates Card - cyan theme as in design */}
            <Card className="bg-cyan-500/20 border-2 border-cyan-400 backdrop-blur-sm hover:bg-cyan-500/30 transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-4 sm:p-6 lg:p-8 text-center">
                <Calendar className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-cyan-400 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-2 tracking-wide">DATES</h3>
                <p className="text-cyan-300 text-sm sm:text-base lg:text-lg font-medium">Aug 25-30, 2025</p>
              </CardContent>
            </Card>

            {/* Venue Card - dark theme as in design */}
            <Card className="bg-slate-700/50 border-2 border-slate-500 backdrop-blur-sm hover:bg-slate-700/70 transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-4 sm:p-6 lg:p-8 text-center">
                <MapPin className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-gray-300 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-2 tracking-wide">VENUE</h3>
                <p className="text-gray-300 text-sm sm:text-base lg:text-lg font-medium">JIPMER Pondicherry</p>
              </CardContent>
            </Card>

            {/* Participants Card - blue theme as in design */}
            <Card className="bg-blue-600/20 border-2 border-blue-400 backdrop-blur-sm hover:bg-blue-600/30 transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-8 text-center">
                <Users className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2 tracking-wide">PARTICIPANTS</h3>
                <p className="text-blue-300 text-lg font-medium">5000+ Expected</p>
              </CardContent>
            </Card>
          </div>

          {/* After Movie CTA - exact styling from design */}
          <div className="mb-12">
            <div className="bg-cyan-500/20 border-2 border-cyan-400 rounded-lg p-6 mb-4 backdrop-blur-sm hover:bg-cyan-500/30 transition-all duration-300 cursor-pointer transform hover:scale-105">
              <p className="text-cyan-300 text-xl font-bold tracking-wide">
                CHECK OUT THE SPANDAN 2024 AFTER MOVIE HERE!
              </p>
            </div>
            <p className="text-gray-400 text-sm tracking-wide">(CLICK ON THE LOGO)</p>
          </div>

          {/* Action Buttons - matching design styling */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            {session ? (
              <Link href="/register">
                <Button size="lg" className="bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-4 text-lg font-bold transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-cyan-500/25 border-2 border-cyan-400 rounded-lg tracking-wide">
                  REGISTER NOW
                </Button>
              </Link>
            ) : (
              <Link href="/login?redirect=/register">
                <Button size="lg" className="bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-4 text-lg font-bold transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-cyan-500/25 border-2 border-cyan-400 rounded-lg tracking-wide">
                  REGISTER NOW
                </Button>
              </Link>
            )}
            <Link href="/events">
              <Button size="lg" variant="outline" className="border-2 border-cyan-400 text-cyan-800 hover:bg-cyan-400 hover:text-slate-900 px-8 py-4 text-lg font-bold transform hover:scale-105 transition-all duration-300 rounded-lg tracking-wide">
                VIEW EVENTS
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}