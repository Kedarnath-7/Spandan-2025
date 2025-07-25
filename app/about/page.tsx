'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, MapPin, Users, Trophy, Clock, Heart, Mail, Phone, Zap } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function AboutPage() {
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
      <Navigation />

      {/* Main Content */}
      <main className="relative z-10 pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Hero Title */}
          <div className="text-center mb-16">
            <div className="inline-block bg-gradient-to-r from-cyan-500 to-blue-500 px-12 py-6 rounded-2xl">
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-wide">
                ABOUT SPANDAN
              </h1>
            </div>
          </div>

          {/* Main Content Blocks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            {/* Left Block - Festival Description */}
            <Card className="bg-slate-800/80 border-2 border-slate-600 rounded-2xl">
              <CardContent className="p-8">
                <h2 className="text-3xl font-bold text-white mb-6">
                  THE ULTIMATE CULTURAL &<br />
                  SPORTS FESTIVAL!
                </h2>
                <div className="space-y-4 text-gray-300 text-lg">
                  <p>
                    SPANDAN has been South India&#39;s premier cultural and sports festival
                    for over 15 years, bringing together the most talented students from
                    across the nation.
                  </p>
                  <p>
                    This year&#39;s theme &#34;Comic Chronicles&#34; transforms the traditional college
                    fest into an epic superhero adventure where creativity meets
                    competition across cultural performances, sports championships, and
                    artistic expressions!
                  </p>
                  <p>
                    Join us for six incredible days of intense competition, spectacular
                    performances, and unforgettable memories as we celebrate the diverse
                    talents of India&#39;s youth.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Right Block - JIPMER Info */}
            <Card className="bg-gradient-to-br from-cyan-500 to-blue-500 border-2 border-cyan-400 rounded-2xl">
              <CardContent className="p-8">
                <h2 className="text-3xl font-bold text-white mb-6">
                  HOSTED BY JIPMER
                </h2>
                <div className="space-y-4 text-white text-lg">
                  <p>
                    Jawaharlal Institute of Postgraduate Medical Education & Research
                    (JIPMER) is one of India&#39;s premier medical institutions and centers of
                    excellence.
                  </p>
                  <p>
                    Established in 1823, JIPMER Pondicherry has been at the forefront of
                    medical education, research, and cultural activities for centuries.
                  </p>
                  <p>
                    Our state-of-the-art facilities, sprawling campus, and vibrant student
                    community provide the perfect backdrop for this grand cultural
                    celebration!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            <Card className="bg-gradient-to-br from-cyan-500 to-blue-500 border-2 border-cyan-400 rounded-2xl">
              <CardContent className="p-8 text-center">
                <Clock className="w-12 h-12 text-white mx-auto mb-4" />
                <div className="text-4xl font-black text-white mb-2">15+</div>
                <p className="text-white font-medium">Years of Excellence</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-700/80 border-2 border-slate-500 rounded-2xl">
              <CardContent className="p-8 text-center">
                <Users className="w-12 h-12 text-white mx-auto mb-4" />
                <div className="text-4xl font-black text-white mb-2">5000+</div>
                <p className="text-white font-medium">Participants Expected</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-2 border-blue-400 rounded-2xl">
              <CardContent className="p-8 text-center">
                <MapPin className="w-12 h-12 text-white mx-auto mb-4" />
                <div className="text-4xl font-black text-white mb-2">100+</div>
                <p className="text-white font-medium">Colleges Participating</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-600/80 border-2 border-slate-400 rounded-2xl">
              <CardContent className="p-8 text-center">
                <Heart className="w-12 h-12 text-white mx-auto mb-4" />
                <div className="text-4xl font-black text-white mb-2">50+</div>
                <p className="text-white font-medium">Events & Competitions</p>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Info Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            {/* Festival Duration */}
            <Card className="bg-slate-800/80 border-2 border-slate-600 rounded-2xl">
              <CardContent className="p-8">
                <div className="flex items-center space-x-3 mb-4">
                  <Calendar className="w-8 h-8 text-cyan-400" />
                  <h3 className="text-2xl font-bold text-cyan-400">FESTIVAL DURATION</h3>
                </div>
                <div className="space-y-3">
                  <p className="text-3xl font-bold text-white">August 25-30, 2025</p>
                  <p className="text-gray-300 text-lg">
                    Six action-packed days of competitions, performances, and celebrations
                  </p>
                  <p className="text-gray-300 text-lg">
                    Multiple events running simultaneously across different venues
                  </p>
                  <p className="text-gray-300 text-lg">
                    Grand Finale and award ceremony on the final day
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Venue & Facilities */}
            <Card className="bg-slate-800/80 border-2 border-slate-600 rounded-2xl">
              <CardContent className="p-8">
                <div className="flex items-center space-x-3 mb-4">
                  <MapPin className="w-8 h-8 text-cyan-400" />
                  <h3 className="text-2xl font-bold text-cyan-400">VENUE & FACILITIES</h3>
                </div>
                <div className="space-y-3">
                  <p className="text-3xl font-bold text-white">JIPMER Campus, Pondicherry</p>
                  <p className="text-gray-300 text-lg">
                    State-of-the-art auditoriums and performance venues
                  </p>
                  <p className="text-gray-300 text-lg">
                    Modern sports facilities and outdoor arenas
                  </p>
                  <p className="text-gray-300 text-lg">
                    On-campus accomodation and dining facilities
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Event Category Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <Card className="bg-pink-600/80 border-2 border-pink-400 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-2">CULTURAL EVENTS</h3>
              <p className="text-white/80">Dance, Music, Fashion Shows, and Theatrical Performances</p>
            </Card>
            <Card className="bg-orange-600/80 border-2 border-orange-400 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-2">SPORTS</h3>
              <p className="text-white/80">Cricket, Football, Basketball, Volleyball Championships</p>
            </Card>
            <Card className="bg-green-600/80 border-2 border-green-400 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-2">FINE ARTS</h3>
              <p className="text-white/80">Painting, Sketching, and Visual Arts</p>
            </Card>
            <Card className="bg-purple-600/80 border-2 border-purple-400 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-2">LITERARY</h3>
              <p className="text-white/80">Debates, Quiz, Creative Writing, and Online Competitions</p>
            </Card>
          </div>

          {/* Mission, Vision, Values */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            <Card className="bg-slate-800/80 border-2 border-slate-600 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-cyan-400 mb-4">MISSION</h3>
              <p className="text-gray-300 text-lg">To create a platform where students from across India can showcase their diverse talents, compete at the highest level, and celebrate the spirit of youth and creativity.</p>
            </Card>
            <Card className="bg-slate-800/80 border-2 border-slate-600 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-cyan-400 mb-4">VISION</h3>
              <p className="text-gray-300 text-lg">To establish SPANDAN as India&#39;s premier cultural and sports festival, fostering excellence, innovation, and lifelong friendships among the brightest young minds.</p>
            </Card>
            <Card className="bg-slate-800/80 border-2 border-slate-600 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-cyan-400 mb-4">VALUES</h3>
              <p className="text-gray-300 text-lg">Excellence in competition, creativity in expression, sportsmanship in victory and defeat, and the celebration of diverse talents and cultural heritage.</p>
            </Card>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
