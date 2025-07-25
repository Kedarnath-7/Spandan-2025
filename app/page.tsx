'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, MapPin, Users, Phone, Mail, Zap, FileText, Play, X, Instagram } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function HomePage() {
  const { toast } = useToast();
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [loadingVideo, setLoadingVideo] = useState(false);

  // Handle brochure download using Google Drive
  const handleDownloadBrochure = () => {
    try {
      // Google Drive direct download URL
      // Replace 'YOUR_FILE_ID' with your actual Google Drive file ID
      // Get this from your Google Drive share link: https://drive.google.com/file/d/YOUR_FILE_ID/view?usp=sharing
      const googleDriveFileId = '1l82Wm4sg3qsThH-a0Rl5QJ0Uz2fE-yv6'; // Replace with your file ID
      const googleDriveDownloadUrl = `https://drive.google.com/uc?export=download&id=${googleDriveFileId}`;
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = googleDriveDownloadUrl;
      link.download = 'Spandan-2025-Brochure.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Started",
        description: "Spandan 2025 brochure download has started!",
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    }
  };

  // Handle video modal using Google Drive
  const handleOpenVideo = () => {
    try {
      // Google Drive direct stream URL for video playback
      const googleDriveVideoId = '1OW6L657tNxqoPDyY4PBPV44jcpXvT8Nj';
      // Use preview URL for streaming instead of download URL
      const googleDriveVideoUrl = `https://drive.google.com/file/d/${googleDriveVideoId}/preview`;
      
      setVideoUrl(googleDriveVideoUrl);
      setShowVideoModal(true);
    } catch (error) {
      console.error('Video error:', error);
      toast({
        title: "Video Unavailable",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
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
          <div className="max-w-5xl mx-auto space-y-3 text-gray-200 mb-8 sm:mb-12">
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
          <div className="max-w-5xl mx-auto space-y-3 text-gray-200 mb-8 sm:mb-12">
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

          {/* Registration Status Button - Positioned above video */}
          <div className="mb-8 flex justify-center">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
              <Link href="/registration-status">
                <Button size="lg" className="relative bg-gradient-to-r from-purple-700 via-purple-800 to-indigo-900 hover:from-purple-600 hover:via-purple-700 hover:to-indigo-800 text-white px-8 py-4 text-lg font-bold transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-purple-500/25 border-2 border-purple-400 rounded-lg tracking-wide group-hover:text-yellow-300">
                  <Zap className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                  CHECK REGISTRATION STATUS
                </Button>
              </Link>
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                Track your registration progress
              </div>
            </div>
          </div>

          {/* After Movie CTA - exact styling from design */}
          <div className="mb-12">
            <div 
              onClick={handleOpenVideo}
              className="bg-cyan-500/20 border-2 border-cyan-400 rounded-lg p-6 mb-4 backdrop-blur-sm hover:bg-cyan-500/30 transition-all duration-300 cursor-pointer transform hover:scale-105 group"
            >
              <div className="flex items-center justify-center gap-3">
                <Play className="w-8 h-8 text-cyan-300 group-hover:text-white transition-colors duration-300" />
                <p className="text-cyan-300 group-hover:text-white text-xl font-bold tracking-wide transition-colors duration-300">
                  CHECK OUT THE SPANDAN 2024 AFTER MOVIE HERE!
                </p>
              </div>
            </div>
            <p className="text-gray-400 text-sm tracking-wide">(CLICK TO PLAY VIDEO)</p>
          </div>

          {/* Action Buttons - Unified styling */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center flex-wrap">
            <Link href="/register">
              <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white px-8 py-4 text-lg font-bold transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-cyan-500/25 border-2 border-cyan-400 rounded-lg tracking-wide">
                REGISTER NOW
              </Button>
            </Link>
            
            <Link href="/events">
              <Button size="lg" className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-4 text-lg font-bold transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-blue-500/25 border-2 border-blue-400 rounded-lg tracking-wide">
                VIEW EVENTS
              </Button>
            </Link>
            
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                handleDownloadBrochure();
              }}
              className="inline-block"
            >
              <Button size="lg" className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-slate-900 px-8 py-4 text-lg font-bold transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-yellow-500/25 border-2 border-yellow-400 rounded-lg tracking-wide">
                <FileText className="w-5 h-5 mr-2" />
                DOWNLOAD BROCHURE
              </Button>
            </a>
          </div>

          {/* Instagram Follow Section */}
          <div className="mt-8 flex justify-center">
            <a
              href="https://www.instagram.com/jipmer_spandan?igsh=OXZnOHJ1MG9nMmdk"
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 p-1 rounded-lg hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-purple-500/25">
                <div className="bg-slate-900 px-6 py-3 rounded-md flex items-center gap-3">
                  <Instagram className="w-6 h-6 text-pink-400 group-hover:text-white transition-colors duration-300" />
                  <span className="text-pink-400 group-hover:text-white font-bold text-lg transition-colors duration-300">
                    FOLLOW @jipmer_spandan FOR MORE UPDATES
                  </span>
                </div>
              </div>
            </a>
          </div>
        </div>
      </section>

      <Footer />

      {/* Video Modal */}
      <Dialog open={showVideoModal} onOpenChange={setShowVideoModal}>
        <DialogContent className="max-w-4xl bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center justify-between">
              <span>Spandan 2024 After Movie</span>
              <button 
                onClick={() => {
                  setShowVideoModal(false);
                  setVideoUrl('');
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </DialogTitle>
          </DialogHeader>
          
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            {loadingVideo ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-white">Loading video...</div>
              </div>
            ) : videoUrl ? (
              <iframe
                src={videoUrl}
                className="w-full h-full"
                frameBorder="0"
                allow="autoplay; encrypted-media"
                allowFullScreen
                title="Spandan 2024 After Movie"
                onLoad={() => setLoadingVideo(false)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Video not available</p>
                  <p className="text-sm mt-2">Upload your files to Google Drive and update the file IDs in the code</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-center gap-3 mt-4">
            <Button
              onClick={() => setShowVideoModal(false)}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Close
            </Button>
            {videoUrl && (
              <Button
                onClick={() => {
                  // Convert preview URL back to view URL for opening in new tab
                  const fileId = videoUrl.split('/d/')[1]?.split('/preview')[0];
                  const viewUrl = `https://drive.google.com/file/d/${fileId}/view`;
                  window.open(viewUrl, '_blank');
                }}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                Open in new tab
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}