'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, MapPin, Users, Mail, Phone, Globe, Zap } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function ContactPage() {
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
          
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-block bg-gradient-to-r from-cyan-500 to-blue-500 px-8 py-4 rounded-2xl mb-6">
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-wide">
                CONTACT HQ
              </h1>
            </div>
            <p className="text-lg text-white max-w-2xl mx-auto leading-relaxed">
              Need help with registration, events, or accommodation? Our superhero
              support team is here to assist you!
            </p>
          </div>

          {/* Contact Info Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {/* Phone Card */}
            <Card className="bg-slate-700 border-2 border-cyan-400/50 rounded-2xl">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-slate-700" />
                </div>
                <h3 className="text-lg font-bold text-white mb-3">PHONE</h3>
                <p className="text-white text-sm leading-relaxed">
                  +91 98765 43210<br />
                  +91 87654 32109
                </p>
              </CardContent>
            </Card>

            {/* Email Card */}
            <Card className="bg-gradient-to-br from-cyan-500 to-blue-500 border-2 border-cyan-400 rounded-2xl">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-cyan-600" />
                </div>
                <h3 className="text-lg font-bold text-white mb-3">EMAIL</h3>
                <p className="text-white text-sm leading-relaxed">
                  spandan2025@jipmer.edu.in<br />
                  info@spandan2025.com
                </p>
              </CardContent>
            </Card>

            {/* Location Card */}
            <Card className="bg-slate-700 border-2 border-cyan-400/50 rounded-2xl">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-slate-700" />
                </div>
                <h3 className="text-lg font-bold text-white mb-3">LOCATION</h3>
                <p className="text-white text-sm leading-relaxed">
                  JIPMER Campus<br />
                  Dhanvantari Nagar, Pondicherry
                </p>
              </CardContent>
            </Card>

            {/* Office Hours Card */}
            <Card className="bg-gradient-to-br from-cyan-500 to-blue-500 border-2 border-cyan-400 rounded-2xl">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-cyan-600" />
                </div>
                <h3 className="text-lg font-bold text-white mb-3">OFFICE HOURS</h3>
                <p className="text-white text-sm leading-relaxed">
                  Mon - Fri: 9:00 AM - 6:00 PM<br />
                  Sat: 9:00 AM - 2:00 PM
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Leadership Team Section */}
          <div className="mb-20">
            {/* Section Title */}
            <div className="text-center mb-12">
              <div className="inline-block bg-gradient-to-r from-cyan-500 to-blue-500 px-8 py-4 rounded-2xl">
                <h2 className="text-xl md:text-2xl font-black text-white tracking-wide">
                  SPANDAN 2025 LEADERSHIP TEAM
                </h2>
              </div>
            </div>

            {/* Leadership Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Suriya - President */}
              <Card className="bg-slate-700 border-2 border-cyan-400/50 rounded-2xl">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">Suriya</h3>
                  <p className="text-cyan-400 font-medium mb-1">President</p>
                  <p className="text-gray-300 text-sm mb-3">Leadership</p>
                  <p className="text-white text-sm">+91 9342150454</p>
                </CardContent>
              </Card>

              {/* Niranjana - Vice-President */}
              <Card className="bg-slate-700 border-2 border-cyan-400/50 rounded-2xl">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">Niranjana</h3>
                  <p className="text-cyan-400 font-medium mb-1">Vice-President</p>
                  <p className="text-gray-300 text-sm mb-3">Leadership</p>
                  <p className="text-white text-sm">+91 9825502153</p>
                </CardContent>
              </Card>

              {/* Nishit Anand - General Secretary */}
              <Card className="bg-slate-700 border-2 border-cyan-400/50 rounded-2xl">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">Nishit Anand</h3>
                  <p className="text-cyan-400 font-medium mb-1">General Secretary</p>
                  <p className="text-gray-300 text-sm mb-3">Administration</p>
                  <p className="text-white text-sm">+91 7032366780</p>
                </CardContent>
              </Card>

              {/* Tejaswini - Speaker */}
              <Card className="bg-slate-700 border-2 border-cyan-400/50 rounded-2xl">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">Tejaswini</h3>
                  <p className="text-cyan-400 font-medium mb-1">Speaker</p>
                  <p className="text-gray-300 text-sm mb-3">Communications</p>
                  <p className="text-white text-sm">+91 9346244609</p>
                </CardContent>
              </Card>

              {/* Mruthyunjay - Public Relations */}
              <Card className="bg-slate-700 border-2 border-cyan-400/50 rounded-2xl">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">Mruthyunjay</h3>
                  <p className="text-cyan-400 font-medium mb-1">Public Relations</p>
                  <p className="text-gray-300 text-sm mb-3">Public Relations</p>
                  <p className="text-white text-sm">+91 9445919454</p>
                </CardContent>
              </Card>

              {/* Thrishala - Public Relations */}
              <Card className="bg-slate-700 border-2 border-cyan-400/50 rounded-2xl">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">Thrishala</h3>
                  <p className="text-cyan-400 font-medium mb-1">Public Relations</p>
                  <p className="text-gray-300 text-sm mb-3">Public Relations</p>
                  <p className="text-white text-sm">+91 9063082793</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Services Section */}
          <div className="mb-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Accommodation Card */}
              <Card className="bg-gradient-to-br from-purple-600 to-purple-800 border-none rounded-3xl overflow-hidden">
                <CardContent className="p-10 text-center">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <MapPin className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-6">ACCOMMODATION</h3>
                  <div className="space-y-3 text-white text-lg">
                    <p>AC & Non-AC rooms available</p>
                    <p>On-campus housing</p>
                    <p>Advance booking required</p>
                    <p className="mt-4 font-semibold">Contact: Skand (9036849005)</p>
                  </div>
                </CardContent>
              </Card>

              {/* Catering Card */}
              <Card className="bg-gradient-to-br from-green-600 to-green-800 border-none rounded-3xl overflow-hidden">
                <CardContent className="p-10 text-center">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Mail className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-6">CATERING</h3>
                  <div className="space-y-3 text-white text-lg">
                    <p>Pre-ordered meals</p>
                    <p>Room delivery service</p>
                    <p>Multiple cuisine options</p>
                    <p className="mt-4 font-semibold">Contact: Harini (9994452417)</p>
                    <p className="font-semibold">Contact: Annarya (9626897335)</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Registration Fees Overview */}
          <div className="mb-16">
            <div className="max-w-2xl mx-auto">
              <Card className="bg-gradient-to-br from-purple-600 to-pink-600 border-none rounded-3xl overflow-hidden">
                <CardContent className="p-8">
                  <div className="flex items-center justify-center space-x-3 mb-8">
                    <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                      <span className="text-purple-800 font-bold text-lg">🔒</span>
                    </div>
                    <h3 className="text-xl font-bold text-white">REGISTRATION FEES OVERVIEW</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Registration Tiers */}
                    <div>
                      <h4 className="text-lg font-bold text-yellow-300 mb-4">Registration Tiers</h4>
                      <div className="space-y-2 text-white">
                        <p>• Tier 1 (Hero): ₹375</p>
                        <p>• Tier 2 (Super Hero): ₹650</p>
                        <p>• Tier 3 (Legend): ₹850</p>
                      </div>
                    </div>

                    {/* Individual Event Fees */}
                    <div>
                      <h4 className="text-lg font-bold text-yellow-300 mb-4">Individual Event Fees</h4>
                      <div className="space-y-2 text-white">
                        <p>• Cultural Events: ₹100-250</p>
                        <p>• Sports Events: ₹250-450</p>
                        <p>• Fine Arts: ₹100-125</p>
                        <p>• Literary/Online: ₹50-250</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Important Dates Section */}
          <div className="mb-16">
            <div className="max-w-4xl mx-auto">
              <Card className="bg-slate-700 border-2 border-cyan-400/50 rounded-3xl overflow-hidden">
                <CardContent className="p-8">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center space-x-3 bg-cyan-500/20 rounded-2xl px-6 py-3">
                      <Calendar className="w-8 h-8 text-cyan-400" />
                      <h3 className="text-2xl font-bold text-white">IMPORTANT DATES</h3>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Registration Opens */}
                    <div className="bg-slate-600 rounded-2xl p-6 text-center">
                      <h4 className="text-lg font-bold text-cyan-400 mb-2">Registration Opens</h4>
                      <p className="text-white text-lg">January 15, 2025</p>
                    </div>

                    {/* Early Bird Deadline */}
                    <div className="bg-slate-600 rounded-2xl p-6 text-center">
                      <h4 className="text-lg font-bold text-cyan-400 mb-2">Early Bird Deadline</h4>
                      <p className="text-white text-lg">March 31, 2025</p>
                    </div>

                    {/* Final Registration */}
                    <div className="bg-slate-600 rounded-2xl p-6 text-center">
                      <h4 className="text-lg font-bold text-cyan-400 mb-2">Final Registration</h4>
                      <p className="text-white text-lg">July 31, 2025</p>
                    </div>

                    {/* Festival Dates */}
                    <div className="bg-slate-600 rounded-2xl p-6 text-center">
                      <h4 className="text-lg font-bold text-cyan-400 mb-2">Festival Dates</h4>
                      <p className="text-white text-lg">August 25-30, 2025</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Follow the Adventure Section */}
          <div className="mb-16">
            <div className="max-w-4xl mx-auto">
              <Card className="bg-slate-700 border-2 border-cyan-400/50 rounded-3xl overflow-hidden">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4">FOLLOW THE ADVENTURE!</h3>
                  <p className="text-gray-300 text-lg mb-6 max-w-2xl mx-auto">
                    Stay updated with the latest news, announcements, and behind-the-scenes content
                  </p>
                  <p className="text-cyan-400 text-xl font-bold">
                    @SPANDAN2025 | #ComicChronicles | #JIPMER
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
