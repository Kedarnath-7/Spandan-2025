'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/lib/contexts/CartContext';
import { eventService } from '@/lib/services/events';
import { Event } from '@/lib/types';
import { Star, Heart, Music, Guitar, Crown, Users, Calendar, Zap, Mail, Phone, MapPin, Search, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { cart, addToCart, isInCart, getTotalItems } = useCart();

  useEffect(() => {
    fetchEvents();
    fetchCategories();
  }, []);

  const fetchEvents = async () => {
    try {
      setIsLoadingEvents(true);
      setError(null);
      const eventsData = await eventService.getAllEvents();
      setEvents(eventsData);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to load events. Please try again.');
      toast.error('Failed to load events. Please try again.');
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setIsLoadingCategories(true);
      const categoriesData = await eventService.getCategories();
      setCategories(['all', ...categoriesData]);
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Use fallback categories if API fails
      setCategories(['all', 'Culturals', 'Sports', 'Fine Arts', 'Literary', 'Academic']);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  // Apply filters to database events
  let filteredEvents = events;

  // Filter by search query first
  if (searchQuery.trim()) {
    filteredEvents = filteredEvents.filter((event: Event) => {
      const searchTerm = searchQuery.toLowerCase();
      return (
        event.name.toLowerCase().includes(searchTerm) ||
        event.description.toLowerCase().includes(searchTerm) ||
        event.category.toLowerCase().includes(searchTerm)
      );
    });
  }

  // Then filter by category
  if (selectedCategory !== 'all') {
    filteredEvents = filteredEvents.filter((event: Event) => {
      return event.category.toLowerCase() === selectedCategory.toLowerCase();
    });
  }

  const handleAddToCart = (event: Event) => {
    addToCart(event);
    toast.success(`${event.name} has been added to your cart.`);
  };

  const handleRetryEvents = () => {
    fetchEvents();
  };

  const handleRetryCategories = () => {
    fetchCategories();
  };

  const getCategoryColor = (category: string, eventName?: string) => {
    const name = (eventName || '').toLowerCase();
    
    // Special case mappings for specific event names (matching reference design)
    if (name.includes('chorea') && (name.includes('theme') && !name.includes('non-theme'))) {
      return 'bg-gradient-to-br from-pink-500 via-pink-600 to-pink-700'; // Pink for theme dance
    }
    if (name.includes('chorea') && name.includes('non-theme')) {
      return 'bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700'; // Purple for non-theme dance
    }
    if (name.includes('alaap') || name.includes('eastern') || name.includes('band')) {
      return 'bg-gradient-to-br from-orange-600 via-orange-700 to-orange-800'; // Orange for music/band
    }
    
    const colors = {
      'Culturals': 'bg-gradient-to-br from-pink-500 via-pink-600 to-pink-700',
      'Cultural': 'bg-gradient-to-br from-pink-500 via-pink-600 to-pink-700',
      'Sports': 'bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700',
      'Fine Arts': 'bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700',
      'Literary': 'bg-gradient-to-br from-green-500 via-green-600 to-green-700',
      'Academic': 'bg-gradient-to-br from-teal-500 via-teal-600 to-teal-700',
      'Music': 'bg-gradient-to-br from-orange-600 via-orange-700 to-orange-800',
      'Dance': 'bg-gradient-to-br from-pink-500 via-pink-600 to-pink-700'
    };
    
    // Check for partial matches in category
    for (const [key, value] of Object.entries(colors)) {
      if (category.toLowerCase().includes(key.toLowerCase())) {
        return value;
      }
    }
    
    return colors[category as keyof typeof colors] || 'bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800';
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      'Culturals': Music,
      'Sports': Zap,
      'Fine Arts': Star,
      'Literary': Heart,
      'Academic': Crown
    };
    const IconComponent = icons[category as keyof typeof icons] || Star;
    return IconComponent;
  };

  return (
    <div className="min-h-screen bg-[#0A0F1A] text-white relative overflow-hidden">
      {/* Comic book style background elements - consistent with other pages */}
      <div className="absolute inset-0 opacity-[0.08]">
        <div className="absolute top-20 left-10 text-6xl font-black text-blue-400 transform -rotate-12 select-none">POW!</div>
        <div className="absolute top-40 right-20 text-4xl font-black text-yellow-400 transform rotate-12 select-none">BOOM!</div>
        <div className="absolute bottom-40 left-20 text-5xl font-black text-red-400 transform -rotate-6 select-none">ZAP!</div>
        <div className="absolute bottom-20 right-10 text-3xl font-black text-green-400 transform rotate-6 select-none">BANG!</div>
      </div>

      {/* Geometric shapes - matching other pages */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-32 right-32 w-16 h-16 border-4 border-blue-400 transform rotate-45 opacity-20"></div>
        <div className="absolute bottom-32 left-32 w-12 h-12 border-4 border-yellow-400 transform rotate-12 opacity-20"></div>
        <div className="absolute top-1/2 left-10 w-8 h-8 bg-red-400 transform rotate-45 opacity-20"></div>
        <div className="absolute top-1/4 right-10 w-10 h-10 bg-green-400 transform rotate-12 opacity-20"></div>
      </div>

      {/* Navigation */}
      <Navigation cartCount={getTotalItems()} />

      {/* Main Content */}
      <main className="relative z-10 pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-2 sm:px-3 lg:px-4">
          
          {/* Hero Title - Exact match to design */}
          <div className="text-center mb-12">
            <div className="inline-block bg-gradient-to-r from-cyan-400 to-blue-500 px-12 py-4 rounded-2xl mb-6">
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-wide">
                SPANDAN EVENTS
              </h1>
            </div>
            <p className="text-lg text-gray-300 max-w-4xl mx-auto">
              Unleash your talents across cultural performances, sports championships, fine arts, 
              literary competitions, and creative challenges!
            </p>
          </div>

          {/* Search Bar - Static, loads immediately */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search events by name, description, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Category Filter Pills - Exact match to design */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {isLoadingCategories ? (
              <div className="flex items-center gap-3 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading categories...</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleRetryCategories}
                  className="text-cyan-400 hover:text-cyan-300 p-2"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 capitalize border ${
                    selectedCategory === category
                      ? 'bg-cyan-500 text-white border-cyan-500'
                      : 'bg-transparent text-gray-300 border-gray-500 hover:border-gray-400 hover:text-white'
                  }`}
                >
                  {category === 'all' ? 'All' : category}
                </button>
              ))
            )}
          </div>

          {/* Events Grid - Dynamic, shows loading */}
          {isLoadingEvents ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-cyan-500 mb-4" />
              <p className="text-gray-300 mb-4 text-lg">Loading amazing events...</p>
              <Button 
                variant="outline" 
                onClick={handleRetryEvents}
                className="border-cyan-500 text-cyan-800 hover:bg-cyan-500/10 hover:text-white transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Loading
              </Button>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-red-400 mb-4 text-lg">{error}</p>
              <Button 
                variant="outline" 
                onClick={handleRetryEvents}
                className="border-red-500 text-red-400 hover:bg-red-500/10"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-300 text-xl">No events found matching your criteria.</p>
              <p className="text-gray-400 mt-2">Try adjusting your search or category filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 max-w-full mx-auto px-1">
              {filteredEvents.map((event) => {
                const IconComponent = getCategoryIcon(event.category);
                const bgColor = getCategoryColor(event.category, event.name);
                
                return (
                  <div key={event.id} className={`${bgColor} rounded-2xl p-6 relative transition-all duration-300 hover:scale-105 hover:shadow-2xl min-h-[400px] flex flex-col border-2 border-white`}>
                    {/* Category Badge - Top Right */}
                    <div className="absolute top-4 right-4">
                      <div className="bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full border-3 border-white/60">
                        <span className="text-white text-xs font-bold">{event.category}</span>
                      </div>
                    </div>

                    {/* Icon - Center Top */}
                    <div className="flex justify-center mb-6 mt-8">
                      <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border-2 border-white/50">
                        <IconComponent className="w-12 h-12 text-white" />
                      </div>
                    </div>

                    {/* Event Title - Large and Bold with better font */}
                    <h3 className="text-xl md:text-2xl font-black text-white mb-3 text-center leading-tight tracking-wider uppercase" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', fontWeight: 900 }}>
                      {event.name}
                    </h3>

                    {/* Event Description - Better typography */}
                    <p className="text-white/95 text-sm font-semibold mb-6 text-center leading-relaxed flex-grow" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
                      {event.description}
                    </p>

                    {/* Event Details - Info Points with better styling */}
                    <div className="space-y-2 mb-6">
                      {event.info_points && event.info_points.length > 0 ? (
                        event.info_points.map((point, index) => (
                          <div key={index} className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-white rounded-full flex-shrink-0 mt-2"></div>
                            <span className="text-white text-sm font-bold leading-relaxed">{point}</span>
                          </div>
                        ))
                      ) : (
                        <>
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-white rounded-full flex-shrink-0"></div>
                            <span className="text-white text-sm font-bold">Team Event</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-white rounded-full flex-shrink-0"></div>
                            <span className="text-white text-sm font-bold">{event.category}</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-white rounded-full flex-shrink-0"></div>
                            <span className="text-white text-sm font-bold">Live Performance</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Registration Fee Button - With thick white border */}
                    <button
                      onClick={() => handleAddToCart(event)}
                      disabled={isInCart(event.id)}
                      className={`w-full py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 font-black text-sm border-2 border-white ${
                        isInCart(event.id)
                          ? 'bg-green-500 hover:bg-green-600 text-white'
                          : 'bg-cyan-400 hover:bg-cyan-500 text-white'
                      }`}
                      style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
                    >
                      <div className="text-center">
                        <div className="text-sm font-black tracking-wider uppercase">
                          {isInCart(event.id) ? 'ADDED TO CART ✓' : 'REGISTRATION FEE'}
                        </div>
                        <div className="text-lg font-black">₹{event.price}</div>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Cart Indicator */}
          {getTotalItems() > 0 && (
            <div className="fixed bottom-8 right-8 z-50">
              <Link href="/payment">
                <Button className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-full px-8 py-4 text-lg font-bold shadow-2xl transform hover:scale-105 transition-all duration-300 border-2 border-white/30">
                  View Cart ({getTotalItems()})
                </Button>
              </Link>
            </div>
          )}

        </div>
      </main>

      <Footer ctaText="READY TO SHOWCASE YOUR TALENT?" />
    </div>
  );
}
