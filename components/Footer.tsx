'use client';

import Link from 'next/link';
import { Calendar, MapPin, Mail, Phone, Zap } from 'lucide-react';

interface FooterProps {
  ctaText?: string;
}

export default function Footer({ ctaText = "THE END... OR IS IT JUST THE BEGINNING?" }: FooterProps) {
  return (
    <footer className="relative z-10 bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 border-t border-cyan-400/30 py-16">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="md:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center border border-cyan-300">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-xl font-bold text-white tracking-wide">SPANDAN 2025</div>
                <div className="text-cyan-400 text-sm font-medium">COMIC CHRONICLES</div>
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Where medical excellence meets superhero adventure. Join us for the ultimate celebration of healthcare heroism!
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold mb-4 text-cyan-400 tracking-wide">QUICK LINKS</h4>
            <ul className="space-y-3 text-gray-300 text-sm">
              <li>
                <Link href="/events" className="hover:text-cyan-400 transition-colors duration-300">
                  Event Registration
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-cyan-400 transition-colors duration-300">
                  Registration
                </Link>
              </li>
              <li>
                <Link href="/registration-status" className="hover:text-cyan-400 transition-colors duration-300">
                  Registration Status
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-cyan-400 transition-colors duration-300">
                  About JIPMER
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-cyan-400 transition-colors duration-300">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-bold mb-4 text-cyan-400 tracking-wide">CONTACT INFO</h4>
            <div className="space-y-3 text-gray-300 text-sm">
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-cyan-400" />
                <span>jsa.jipmer@gmail.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-cyan-400" />
                <span>+91 9110570248</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-cyan-400 mt-0.5" />
                <div>
                  <div>JIPMER Pondicherry</div>
                  <div className="text-xs text-gray-400">Dhanvantari Nagar, Pondicherry - 605006</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>Aug 25-30, 2025</span>
              </div>
            </div>
          </div>

          {/* Find Us Here */}
          <div>
            <h4 className="font-bold mb-4 text-cyan-400 tracking-wide">FIND US HERE</h4>
            <a
              href="https://maps.app.goo.gl/qwxdJDqnRKiEdF1u6?g_st=iw"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="bg-gradient-to-br from-green-500 via-teal-500 to-blue-600 rounded-lg p-4 mb-4 relative cursor-pointer hover:scale-105 transition-transform duration-300 border border-cyan-400/30">
                <div className="absolute inset-0 bg-black/10 rounded-lg"></div>
                <div className="relative text-center">
                  <div className="w-8 h-8 bg-red-500 rounded-full mx-auto mb-2 flex items-center justify-center border-2 border-white">
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                  <div className="text-white text-xs font-bold">JIPMER</div>
                </div>
              </div>
            </a>
            <p className="text-gray-300 text-xs text-center">Click map to get directions</p>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-cyan-400/30 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-300 text-sm mb-4 md:mb-0">
              <p>© 2025 SPANDAN - JIPMER Pondicherry. All rights reserved.</p>
              <p className="text-xs">Designed with ❤️ for medical superheroes</p>
            </div>
            <div className="text-cyan-400 text-sm">
              <p className="mb-1 font-medium">#ComicChronicles #SPANDAN2025</p>
              <p>Be the hero healthcare needs!</p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center mt-8">
          <div className="bg-cyan-500/20 border-2 border-cyan-400 rounded-lg p-4 backdrop-blur-sm hover:bg-cyan-500/30 transition-all duration-300 cursor-pointer transform hover:scale-105">
            <p className="text-cyan-300 text-lg font-bold tracking-wide">
              {ctaText}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
