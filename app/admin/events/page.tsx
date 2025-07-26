'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { eventService } from '@/lib/services/events';
import { Event } from '@/lib/types';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Calendar, 
  Users, 
  MapPin,
  ArrowLeft,
  Save,
  X,
  RefreshCw,
  DollarSign
} from 'lucide-react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface EventFormData {
  name: string;
  category: 'Cultural' | 'Sports' | 'Fine Arts' | 'Literary' | 'Academic' | 'Other';
  customCategory: string; // For when "Other" is selected
  price: number;
  description: string;
  info_points: string; // Comma-separated string that will be converted to array
  venue: string;
  start_date: string;
  end_date: string;
  is_active: boolean; // Registration status toggle
}

const initialFormData: EventFormData = {
  name: '',
  category: 'Cultural',
  customCategory: '',
  price: 0,
  description: '',
  info_points: '',
  venue: '',
  start_date: '',
  end_date: '',
  is_active: true // New events are open by default
};

export default function AdminEventManagement() {
  const router = useRouter();
  
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState<EventFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check authentication using simple localStorage session
  useEffect(() => {
    const adminSession = localStorage.getItem('adminSession');
    if (!adminSession) {
      toast.error('Please login to access admin panel');
      router.push('/admin');
      return;
    }

    const session = JSON.parse(adminSession);
    const currentTime = Date.now();
    const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours

    if (currentTime - session.loginTime > sessionDuration) {
      localStorage.removeItem('adminSession');
      toast.error('Session expired. Please login again.');
      router.push('/admin');
      return;
    }

    loadEvents();
  }, [router]);

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const eventsData = await eventService.getAllEvents();
      setEvents(eventsData);
    } catch (error) {
      console.error('Error loading events:', error);
      toast.error('Failed to load events. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    const filterEvents = () => {
      let filtered = events;

      // Filter by search query
      if (searchQuery) {
        filtered = filtered.filter(event =>
          event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.category.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      // Filter by category
      if (selectedCategory !== 'all') {
        filtered = filtered.filter(event => event.category === selectedCategory);
      }

      setFilteredEvents(filtered);
    };

    filterEvents();
  }, [events, searchQuery, selectedCategory]);

  const handleCreateEvent = () => {
    setEditingEvent(null);
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    
    // Format dates properly for datetime-local input
    const formatDateForInput = (dateString: string | undefined) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      // Format to YYYY-MM-DDTHH:MM format required by datetime-local
      return date.toISOString().slice(0, 16);
    };
    
    // Check if it's a custom category (not in the predefined list)
    const predefinedCategories = ['Cultural', 'Sports', 'Fine Arts', 'Literary', 'Academic'];
    const isCustomCategory = !predefinedCategories.includes(event.category);
    
    setFormData({
      name: event.name,
      category: isCustomCategory ? 'Other' : (event.category as 'Cultural' | 'Sports' | 'Fine Arts' | 'Literary' | 'Academic'),
      customCategory: isCustomCategory ? event.category : '',
      price: event.price || 0,
      description: event.description,
      info_points: event.info_points ? event.info_points.join(', ') : '',
      venue: event.venue || '',
      start_date: formatDateForInput(event.start_date),
      end_date: formatDateForInput(event.end_date),
      is_active: event.is_active !== false // Default to true if undefined
    });
    setIsDialogOpen(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      await eventService.deleteEvent(eventId);
      toast.success('Event deleted successfully!');
      await loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.log('Submitting form data:', formData);
      console.log('Editing event:', editingEvent);

      // Validate required fields
      if (!formData.name || !formData.description || !formData.category) {
        toast.error('Please fill in all required fields (name, description, category)');
        return;
      }

      // Validate custom category if "Other" is selected
      if (formData.category === 'Other' && !formData.customCategory.trim()) {
        toast.error('Please enter a custom category name');
        return;
      }

      // Validate mandatory date fields
      if (!formData.start_date) {
        toast.error('Start date is required');
        return;
      }

      if (!formData.end_date) {
        toast.error('End date is required');
        return;
      }

      // Validate date logic
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      
      if (endDate < startDate) {
        toast.error('End date must be after start date');
        return;
      }

      // Determine the final category
      const finalCategory = formData.category === 'Other' ? formData.customCategory.trim() : formData.category;

      // Prepare event data with info_points conversion and default values
      const eventData = {
        name: formData.name,
        category: finalCategory, // Use the final category (custom or predefined)
        price: formData.price,
        description: formData.description,
        start_date: formData.start_date,
        end_date: formData.end_date,
        is_active: formData.is_active, // Registration status
        // Set default values for optional fields
        info_points: formData.info_points 
          ? formData.info_points.split(',').map(point => point.trim()).filter(point => point.length > 0)
          : ['No Info Provided'],
        venue: formData.venue.trim() || 'Not Specified',
        max_participants: 50, // Keep in database but don't use for logic
        updated_at: new Date().toISOString()
      };

      if (editingEvent) {
        // Update existing event
        console.log('Updating event with ID:', editingEvent.id);
        const updatedEvent = await eventService.updateEvent(editingEvent.id, eventData);
        console.log('Update successful:', updatedEvent);
        toast.success(`Event "${formData.name}" updated successfully!`);
      } else {
        // Create new event
        console.log('Creating new event...');
        const newEvent = await eventService.createEvent(eventData);
        console.log('Create successful:', newEvent);
        toast.success(`Event "${formData.name}" created successfully!`);
      }

      setIsDialogOpen(false);
      await loadEvents();
    } catch (error) {
      console.error('Error saving event:', error);
      
      // More detailed error handling
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
      }
      
      toast.error(`${editingEvent ? 'Failed to update event' : 'Failed to create event'}: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      'Cultural': 'bg-green-500',
      'Sports': 'bg-red-500',
      'Fine Arts': 'bg-purple-500',
      'Literary': 'bg-blue-500',
      'Academic': 'bg-orange-500'
    };
    return (
      <Badge className={`${colors[category as keyof typeof colors]} text-white`}>
        {category}
      </Badge>
    );
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0F1A] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading admin events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F1A] text-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute top-20 left-10 text-6xl font-bold text-white transform -rotate-12">EVENTS</div>
        <div className="absolute top-40 right-20 text-4xl font-bold text-white transform rotate-12">MGMT</div>
        <div className="absolute bottom-40 left-20 w-16 h-16 border-4 border-white transform rotate-45"></div>
        <div className="absolute bottom-20 right-10 w-12 h-12 border-4 border-white transform rotate-12"></div>
      </div>

      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <main className="relative z-10 pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <div className="flex items-center mb-2">
                <Link href="/admin/dashboard">
                  <Button variant="ghost" className="text-cyan-400 hover:text-cyan-300 p-0 mr-4">
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                </Link>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  Event Management
                </h1>
              </div>
              <p className="text-gray-300">Manage SPANDAN 2025 events</p>
            </div>
            <div className="flex space-x-3">
              <Button 
                onClick={loadEvents}
                variant="outline"
                className="border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button 
                onClick={handleCreateEvent}
                className="bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Event
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-8 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search events by name, description, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800/50 border-slate-600 text-white placeholder-gray-400"
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('all')}
                className={selectedCategory === 'all' ? 'bg-cyan-500' : 'border-slate-600 text-gray-300'}
              >
                All Categories
              </Button>
              {/* Predefined categories */}
              {['Cultural', 'Sports', 'Fine Arts', 'Literary', 'Academic'].map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(category)}
                  className={selectedCategory === category ? 'bg-cyan-500' : 'border-slate-600 text-gray-300'}
                >
                  {category}
                </Button>
              ))}
              {/* Custom categories from existing events */}
              {Array.from(new Set(events
                .map(event => event.category)
                .filter(category => !['Cultural', 'Sports', 'Fine Arts', 'Literary', 'Academic'].includes(category))
              )).map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(category)}
                  className={selectedCategory === category ? 'bg-cyan-500' : 'border-slate-600 text-gray-300'}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Events Grid */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="text-gray-400">Loading events...</div>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400">
                {searchQuery || selectedCategory !== 'all' 
                  ? 'No events match your search criteria'
                  : 'No events found. Create your first event!'
                }
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <Card key={event.id} className="bg-slate-800/80 border-2 border-slate-600 hover:border-cyan-500 transition-colors">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-bold text-white mb-2">
                          {event.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 mb-2">
                          {getCategoryBadge(event.category)}
                          <Badge className={`${
                            event.is_active 
                              ? 'bg-green-500 text-white' 
                              : 'bg-red-500 text-white'
                          }`}>
                            {event.is_active ? 'Open' : 'Closed'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditEvent(event)}
                          className="border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-white"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteEvent(event.id)}
                          className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-gray-300 text-sm line-clamp-3">
                        {event.description}
                      </p>
                      
                      <div className="space-y-1">
                        <p className="text-gray-400 text-xs font-semibold">Event Details:</p>
                        <div className="space-y-1">
                          {(event.info_points && event.info_points.length > 0 ? event.info_points : ['No Info Provided']).slice(0, 3).map((point, index) => (
                            <div key={index} className="flex items-start space-x-2">
                              <div className="w-1 h-1 bg-cyan-400 rounded-full flex-shrink-0 mt-2"></div>
                              <span className="text-gray-400 text-xs leading-relaxed">{point}</span>
                            </div>
                          ))}
                          {event.info_points && event.info_points.length > 3 && (
                            <p className="text-gray-500 text-xs">+{event.info_points.length - 3} more...</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-green-400">
                          <span className="font-bold">₹{event.price}</span>
                        </div>
                        <div className="flex items-center text-gray-400">
                          <span className={`font-semibold ${
                            event.is_active ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {event.is_active ? 'Registration Open' : 'Registration Closed'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center text-gray-400 text-sm">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>{event.venue || 'Not Specified'}</span>
                      </div>

                      {event.start_date && (
                        <div className="flex items-center text-gray-400 text-sm">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>{new Date(event.start_date).toLocaleDateString()}</span>
                          {event.end_date && (
                            <span className="ml-2">- {new Date(event.end_date).toLocaleDateString()}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

        </div>
      </main>

      {/* Create/Edit Event Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-600 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-cyan-400">
              {editingEvent ? 'Edit Event' : 'Create New Event'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {editingEvent ? 'Update event details' : 'Add a new event to SPANDAN 2025'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Event Name */}
            <div>
              <Label htmlFor="name" className="text-gray-300">Event Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="bg-slate-700 border-slate-600 text-white"
                required
              />
            </div>

            {/* Category and Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category" className="text-gray-300">Category *</Label>
                <Select value={formData.category} onValueChange={(value: any) => setFormData({...formData, category: value, customCategory: value !== 'Other' ? '' : formData.customCategory})}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="Cultural">Cultural</SelectItem>
                    <SelectItem value="Sports">Sports</SelectItem>
                    <SelectItem value="Fine Arts">Fine Arts</SelectItem>
                    <SelectItem value="Literary">Literary</SelectItem>
                    <SelectItem value="Academic">Academic</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {/* Custom Category Input - Only show when "Other" is selected */}
                {formData.category === 'Other' && (
                  <div className="mt-2">
                    <Input
                      placeholder="Enter custom category name"
                      value={formData.customCategory}
                      onChange={(e) => setFormData({...formData, customCategory: e.target.value})}
                      className="bg-slate-700 border-slate-600 text-white"
                      required
                    />
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="price" className="text-gray-300">Price (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: parseInt(e.target.value) || 0})}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-gray-300">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
                required
              />
            </div>

            {/* Info Points */}
            <div>
              <Label htmlFor="info_points" className="text-gray-300">Info Points</Label>
              <Textarea
                id="info_points"
                value={formData.info_points}
                onChange={(e) => setFormData({...formData, info_points: e.target.value})}
                className="bg-slate-700 border-slate-600 text-white min-h-[80px]"
                placeholder="Enter bullet points separated by commas (e.g., First point, Second point, Third point)"
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional - will show &quot;No Info Provided&quot; if left blank
              </p>
            </div>

            {/* Venue and Registration Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="venue" className="text-gray-300">Venue</Label>
                <Input
                  id="venue"
                  value={formData.venue}
                  onChange={(e) => setFormData({...formData, venue: e.target.value})}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Enter venue or leave blank for 'Not Specified'"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional - will show &quot;Not Specified&quot; if left blank
                </p>
              </div>
              <div>
                <Label htmlFor="is_active" className="text-gray-300">Registration Status</Label>
                <div className="flex items-center space-x-3 mt-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                  />
                  <Label htmlFor="is_active" className={`text-sm font-medium ${
                    formData.is_active ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {formData.is_active ? 'Registration Open' : 'Registration Closed'}
                  </Label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Toggle to open/close event registrations
                </p>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date" className="text-gray-300">Start Date *</Label>
                <Input
                  id="start_date"
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>
              <div>
                <Label htmlFor="end_date" className="text-gray-300">End Date *</Label>
                <Input
                  id="end_date"
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="border-slate-600 text-gray-300"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-cyan-600 to-blue-500 hover:from-cyan-700 hover:to-blue-600"
              >
                {isSubmitting ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {editingEvent ? 'Update Event' : 'Create Event'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Footer ctaText="MANAGING EVENTS WITH SUPERHERO PRECISION!" />
    </div>
  );
}
