'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { eventService } from '@/lib/services/events';
import { Event } from '@/lib/types';
import { Star, Heart, Music, Guitar, Crown, Users, Calendar, Zap, Mail, Phone, MapPin, Search, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { getApprovedUsers, getUserDetails, createEventRegistration } from '@/lib/services/eventRegistrationService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Trash2, Upload, CreditCard, CheckCircle, Copy, IndianRupee, Info, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import QRCode from 'qrcode';
import { validateTransactionIdDetailed } from '@/lib/utils/validation'
import { DuplicateRegistrationService } from '@/lib/services/duplicateRegistrationService'

interface SelectedEvent {
  id: string;
  name: string;
  category: string;
  description: string;
  date: string;
  location: string;
  price: number;
  max_participants?: number;
  info_points?: string[];
}

interface ApprovedUser {
  user_id: string;
  name: string;
  email: string;
  college: string;
  group_id: string;
}

interface RegistrationMember {
  userId: string;
  name: string;
  email: string;
  college: string;
  phone: string;
  originalGroupId: string;
}

interface ContactInfo {
  userId: string;
  name: string;
  email: string;
  phone: string;
}

const PAYMENT_CONFIG = {
  upiId: '9442172827@sbi',
  merchantName: 'DIRECTOR ACCOUNTS OFFICIER JIPMER RECEIPTS'
};

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [approvedUsers, setApprovedUsers] = useState<ApprovedUser[]>([]);
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    userId: '',
    name: '',
    email: '',
    phone: ''
  });
  const [members, setMembers] = useState<RegistrationMember[]>([]);
  const [paymentData, setPaymentData] = useState({
    transactionId: '',
    screenshotFile: null as File | null,
    qrCodeUrl: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [userIdInput, setUserIdInput] = useState('');
  const [validatingUser, setValidatingUser] = useState(false);
  const [validatedUser, setValidatedUser] = useState<any>(null);
  const [userTypeInfo, setUserTypeInfo] = useState<{
    type: 'tier' | 'sports' | 'cult' | 'lit' | 'unknown';
    allowedCategories: string[];
    isCompatible: boolean;
    message: string;
    isFree: boolean;
  } | null>(null);
  
  // Payment validation states
  const [paymentValidationError, setPaymentValidationError] = useState('')
  const [isCheckingTransactionId, setIsCheckingTransactionId] = useState(false)

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

  // Function to detect user type and check event compatibility
  const getUserTypeInfo = (userId: string, eventCategory: string) => {
    const userType = {
      type: 'unknown' as 'tier' | 'sports' | 'cult' | 'lit' | 'unknown',
      allowedCategories: [] as string[],
      isCompatible: false,
      message: '',
      isFree: false
    };

    // Detect user type based on ID pattern
    if (userId.startsWith('USER-ISSU-') || userId.startsWith('USER-DEED-') || userId.startsWith('USER-COPR-')) {
      userType.type = 'tier';
      userType.allowedCategories = ['all']; // Tier users can register for all events
      userType.isCompatible = true;
      userType.message = '✓ Tier registered user - Can register for all events';
      userType.isFree = false;
    } else if (userId.startsWith('USER-PANA-')) {
      userType.type = 'sports';
      userType.allowedCategories = ['Sports'];
      userType.isCompatible = eventCategory === 'Sports';
      userType.message = userType.isCompatible 
        ? '✓ Sports Pass holder - Compatible with Sports events'
        : '⚠️ Sports Pass holder - Can only register for Sports events';
      userType.isFree = false;
    } else if (userId.startsWith('USER-PANS-')) {
      userType.type = 'cult';
      userType.allowedCategories = ['Fine Arts', 'Major Culturals', 'Minor Culturals', 'Culturals'];
      userType.isCompatible = userType.allowedCategories.some(cat => 
        eventCategory.includes(cat) || cat.includes(eventCategory)
      );
      userType.message = userType.isCompatible
        ? '✓ Cult Pass holder - Compatible with Fine Arts & Cultural events'
        : '⚠️ Cult Pass holder - Can only register for Fine Arts & Cultural events';
      userType.isFree = false;
    } else if (userId.startsWith('USER-PANFS-') || userId.startsWith('USER-PANFP-')) {
      userType.type = 'lit';
      userType.allowedCategories = ['Literary'];
      userType.isCompatible = eventCategory === 'Literary';
      userType.message = userType.isCompatible
        ? '🎉 LIT Pass holder - Compatible with Literary events (FREE Registration!)'
        : '⚠️ LIT Pass holder - Can only register for Literary events';
      userType.isFree = userType.isCompatible; // Only free if compatible
    } else {
      userType.message = '❌ Invalid user ID format';
    }

    return userType;
  };

  useEffect(() => {
    if (selectedEvent) {
      const loadApprovedUsers = async () => {
        const result = await getApprovedUsers();
        if (result.success && result.data) {
          setApprovedUsers(result.data);
        } else {
          toast.error('Failed to load approved users for registration.');
        }
      };
      loadApprovedUsers();
      setCurrentStep(2); // Start directly at Step 2 (member selection)
    } else {
      setCurrentStep(1); // Step 1 is the events listing page
    }
  }, [selectedEvent]);

  useEffect(() => {
    if (selectedEvent && members.length > 0) {
      const totalAmount = selectedEvent.price * members.length;
      const qrData = `upi://pay?pa=${PAYMENT_CONFIG.upiId}&pn=${encodeURIComponent(PAYMENT_CONFIG.merchantName)}&am=${totalAmount}&cu=INR&tn=${encodeURIComponent(`SPANDAN 2025 - ${selectedEvent.name} Registration`)}`;
      
      QRCode.toDataURL(qrData, { width: 256, margin: 2 })
        .then(url => setPaymentData(prev => ({ ...prev, qrCodeUrl: url })))
        .catch(err => console.error('QR Code generation failed:', err));
    }
  }, [selectedEvent, members]);

  // Real-time validation for Transaction ID
  useEffect(() => {
    const validateTransactionId = async () => {
      if (paymentData.transactionId.trim() === '') {
        setPaymentValidationError('')
        return
      }

      setIsCheckingTransactionId(true)

      const transactionValidation = validateTransactionIdDetailed(paymentData.transactionId)
      
      if (!transactionValidation.isValid) {
        setPaymentValidationError(transactionValidation.error || 'Invalid transaction ID')
        setIsCheckingTransactionId(false)
        return
      }

      // Check for duplicate transaction ID
      try {
        const duplicateCheck = await DuplicateRegistrationService.checkTransactionIdExists(paymentData.transactionId)
        if (duplicateCheck.isDuplicate) {
          setPaymentValidationError(`Transaction ID already used in registration ${duplicateCheck.existingRegistration?.groupId}`)
        } else {
          setPaymentValidationError('')
        }
      } catch (error) {
        console.error('Error checking transaction ID duplicate:', error)
        setPaymentValidationError('Error validating transaction ID')
      }

      setIsCheckingTransactionId(false)
    }

    const timeoutId = setTimeout(validateTransactionId, 500)
    return () => clearTimeout(timeoutId)
  }, [paymentData.transactionId])

  const handleContactUserChange = async (userId: string) => {
    if (!userId) return;

    try {
      const result = await getUserDetails(userId);
      if (result.success && result.data) {
        setContactInfo({
          userId,
          name: result.data.name,
          email: result.data.email,
          phone: result.data.phone
        });
        
        const newMember: RegistrationMember = {
          userId,
          name: result.data.name,
          email: result.data.email,
          college: result.data.college,
          phone: result.data.phone,
          originalGroupId: result.data.group_id
        };
        setMembers([newMember]);
      }
    } catch (error) {
      toast.error('Error loading user details');
    }
  };

  const validateUser = async () => {
    if (!userIdInput.trim()) {
      toast.error('Please enter a user ID');
      return;
    }

    setValidatingUser(true);
    setUserTypeInfo(null);
    
    try {
      const result = await getUserDetails(userIdInput.trim());
      if (result.success && result.data) {
        // Check user type and event compatibility
        const userTypeData = getUserTypeInfo(userIdInput.trim(), selectedEvent?.category || '');
        setUserTypeInfo(userTypeData);
        
        if (userTypeData.isCompatible) {
          setValidatedUser(result.data);
          toast.success(`User found: ${result.data.name}`);
        } else {
          setValidatedUser(null);
          toast.error(`User found but not compatible with this event category`);
        }
      } else {
        setValidatedUser(null);
        setUserTypeInfo(null);
        toast.error('User not found or not approved for tier/pass registration');
      }
    } catch (error) {
      setValidatedUser(null);
      setUserTypeInfo(null);
      toast.error('Error validating user ID');
    } finally {
      setValidatingUser(false);
    }
  };

  const addValidatedUser = () => {
    if (!validatedUser || !userTypeInfo?.isCompatible) return;

    if (members.find(m => m.userId === validatedUser.user_id)) {
      toast.error('User already added to registration');
      return;
    }

    const newMember: RegistrationMember = {
      userId: validatedUser.user_id,
      name: validatedUser.name,
      email: validatedUser.email,
      college: validatedUser.college,
      phone: validatedUser.phone,
      originalGroupId: validatedUser.group_id
    };

    if (members.length === 0) {
      // First member becomes contact person
      setContactInfo({
        userId: validatedUser.user_id,
        name: validatedUser.name,
        email: validatedUser.email,
        phone: validatedUser.phone
      });
      
      // If it's a LIT pass user, set up free registration
      if (userTypeInfo.isFree) {
        setPaymentData(prev => ({
          ...prev,
          transactionId: 'LIT PASS HOLDER',
          screenshotFile: null // We'll handle this differently for LIT pass
        }));
      }
    }

    setMembers([...members, newMember]);
    setUserIdInput('');
    setValidatedUser(null);
    setUserTypeInfo(null);
    
    const message = userTypeInfo.isFree 
      ? `${validatedUser.name} added to registration (FREE with LIT Pass!)`
      : `${validatedUser.name} added to registration`;
    
    toast.success(message);
  };

  const addMember = async (userId: string) => {
    if (members.find(m => m.userId === userId)) {
      toast.error('User already added to registration');
      return;
    }

    try {
      const result = await getUserDetails(userId);
      if (result.success && result.data) {
        const newMember: RegistrationMember = {
          userId,
          name: result.data.name,
          email: result.data.email,
          college: result.data.college,
          phone: result.data.phone,
          originalGroupId: result.data.group_id
        };
        setMembers([...members, newMember]);
        toast.success(`${result.data.name} added to registration`);
      }
    } catch (error) {
      toast.error('Error adding member');
    }
  };

  const removeMember = (userId: string) => {
    setMembers(members.filter(m => m.userId !== userId));
  };

  const handleScreenshotUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size should not exceed 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      
      setPaymentData(prev => ({ ...prev, screenshotFile: file }));
      toast.success('Payment screenshot uploaded');
    }
  };

  const handleSubmit = async () => {
    if (!selectedEvent || !contactInfo.userId || members.length === 0 || !paymentData.transactionId) {
      toast.error('Please complete all required fields');
      return;
    }

    const isLitPassRegistration = paymentData.transactionId === 'LIT PASS HOLDER';

    // Skip payment validation for LIT pass users
    if (!isLitPassRegistration) {
      // Check for payment validation errors
      if (paymentValidationError) {
        toast.error('Please fix payment validation errors before submitting');
        return;
      }

      // Validate transaction ID format
      const transactionValidation = validateTransactionIdDetailed(paymentData.transactionId)
      if (!transactionValidation.isValid) {
        toast.error(transactionValidation.error || 'Invalid transaction ID')
        return
      }

      // Check for duplicate transaction ID
      try {
        const duplicateCheck = await DuplicateRegistrationService.checkTransactionIdExists(paymentData.transactionId)
        if (duplicateCheck.isDuplicate) {
          toast.error(`Transaction ID already used in registration ${duplicateCheck.existingRegistration?.groupId}`)
          return
        }
      } catch (error) {
        console.error('Error checking transaction ID duplicate:', error)
        toast.error('Error validating transaction ID')
        return
      }
    }

    setSubmitting(true);
    try {
      const result = await createEventRegistration(
        selectedEvent.id,
        contactInfo.userId,
        contactInfo.name,
        contactInfo.email,
        contactInfo.phone,
        paymentData.transactionId,
        isLitPassRegistration ? null : paymentData.screenshotFile, // No screenshot needed for LIT pass
        members
      );

      if (result.success) {
        const successMessage = isLitPassRegistration 
          ? `Event registration submitted successfully (FREE with LIT Pass)! Group ID: ${result.data?.groupId}`
          : `Event registration submitted successfully! Group ID: ${result.data?.groupId}`;
        
        toast.success(successMessage);
        
        setTimeout(() => {
          setSelectedEvent(null);
          setCurrentStep(1);
          setContactInfo({ userId: '', name: '', email: '', phone: '' });
          setMembers([]);
          setPaymentData({ transactionId: '', screenshotFile: null, qrCodeUrl: '' });
          setUserTypeInfo(null);
        }, 2000);
      } else {
        toast.error(result.error || 'Failed to submit registration');
      }
    } catch (error) {
      toast.error('Error submitting registration');
    } finally {
      setSubmitting(false);
    }
  };

  const resetRegistration = () => {
    setSelectedEvent(null);
    setCurrentStep(1);
    setContactInfo({ userId: '', name: '', email: '', phone: '' });
    setMembers([]);
    setPaymentData({ transactionId: '', screenshotFile: null, qrCodeUrl: '' });
    setUserIdInput('');
    setValidatedUser(null);
    setUserTypeInfo(null);
  };

  const totalAmount = selectedEvent ? (
    paymentData.transactionId === 'LIT PASS HOLDER' ? 0 : selectedEvent.price * members.length
  ) : 0;

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
      <Navigation />

      {/* Main Content */}
      <main className="relative z-10 pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-2 sm:px-3 lg:px-4">
          
          {/* Hero Title - Fixed and Dynamic */}
          <div className="text-center mb-12">
            <div className="inline-block bg-gradient-to-r from-cyan-400 to-blue-500 px-12 py-4 rounded-2xl mb-6">
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-wide">
                {selectedEvent ? `${selectedEvent.name.toUpperCase()} REGISTRATION` : 'SPANDAN EVENTS'}
              </h1>
            </div>
            <p className="text-lg text-gray-300 max-w-4xl mx-auto">
              {selectedEvent 
                ? 'Complete your event registration and join the ultimate college fest experience'
                : 'Unleash your talents across cultural performances, sports championships, fine arts, literary competitions, and creative challenges!'
              }
            </p>
          </div>

          {/* Step Indicator - Always shown, current step based on state */}
          <div className="flex justify-center mb-12">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${
                  currentStep >= step 
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg scale-110' 
                    : 'bg-gray-700 text-gray-400'
                }`}>
                  {step}
                </div>
                {step < 4 && (
                  <div className={`w-20 h-1 mx-3 transition-all duration-300 ${
                    currentStep > step ? 'bg-gradient-to-r from-purple-500 to-purple-600' : 'bg-gray-700'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Dynamic Content Area */}
          {selectedEvent ? (
            <div className="max-w-6xl mx-auto">
              {/* Step 2: Add Members (Step 1 is the events listing page) */}
              {currentStep === 2 && (
                <div className="bg-slate-800/50 rounded-2xl p-8 mb-8">
                  <h2 className="text-2xl font-bold text-white mb-6">Event Registration</h2>

                  {/* Complete Event Details - Wider layout */}
                  <div className="bg-slate-700/50 rounded-xl p-6 mb-8">
                    <h3 className="text-xl font-semibold text-cyan-400 mb-4">Event Details</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-white mb-2">Event Name</h4>
                          <p className="text-cyan-400 text-lg">{selectedEvent.name}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-white mb-2">Category</h4>
                          <p className="text-gray-300">{selectedEvent.category}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-white mb-2">Registration Fee</h4>
                          <p className="text-green-400 font-bold text-lg">₹{selectedEvent.price} per member</p>
                        </div>
                        {selectedEvent.start_date && (
                          <div>
                            <h4 className="font-semibold text-white mb-2">Event Date</h4>
                            <p className="text-gray-300">{new Date(selectedEvent.start_date).toLocaleDateString('en-IN', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}</p>
                          </div>
                        )}
                      </div>
                      <div className="space-y-4">
                        {selectedEvent.venue && (
                          <div>
                            <h4 className="font-semibold text-white mb-2">Venue</h4>
                            <p className="text-gray-300">{selectedEvent.venue}</p>
                          </div>
                        )}
                        {selectedEvent.end_date && (
                          <div>
                            <h4 className="font-semibold text-white mb-2">End Date</h4>
                            <p className="text-gray-300">
                              {selectedEvent.start_date === selectedEvent.end_date 
                                ? 'Same as Event Date' 
                                : new Date(selectedEvent.end_date).toLocaleDateString('en-IN', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })
                              }
                            </p>
                          </div>
                        )}
                        <div className="bg-purple-900/30 rounded-lg p-4 border border-purple-500/30">
                          <h4 className="font-semibold text-purple-300 mb-2">Registration Status</h4>
                          <p className={`font-semibold ${
                            selectedEvent.is_active ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {selectedEvent.is_active ? '✓ Open for Registration' : '✗ Registration Closed'}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-white mb-2">Description</h4>
                          <p className="text-gray-300 leading-relaxed">{selectedEvent.description}</p>
                        </div>
                        {selectedEvent.info_points && selectedEvent.info_points.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-white mb-2">Event Information</h4>
                            <ul className="text-gray-300 leading-relaxed space-y-1">
                              {selectedEvent.info_points.map((point, index) => (
                                <li key={index} className="flex items-start">
                                  <span className="text-cyan-400 mr-2">•</span>
                                  {point}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    {/* User ID Input */}
                    <div>
                      <Label className="text-lg font-semibold text-white mb-3 block">
                        Add Team Member {members.length === 0 ? '(Group Leader)' : ''}
                      </Label>
                      <div className="flex gap-3">
                        <Input
                          value={userIdInput}
                          onChange={(e) => setUserIdInput(e.target.value)}
                          placeholder="Enter User ID"
                          className="bg-slate-700/50 border-slate-600 text-white h-12 text-lg flex-1"
                          onKeyPress={(e) => e.key === 'Enter' && validateUser()}
                        />
                        <Button 
                          onClick={validateUser}
                          disabled={validatingUser || !userIdInput.trim()}
                          className="bg-blue-600 hover:bg-blue-700 px-6 h-12"
                        >
                          {validatingUser ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Validating...
                            </>
                          ) : (
                            'Validate'
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* User Type Information */}
                    {userTypeInfo && (
                      <div className={`rounded-xl p-4 border ${
                        userTypeInfo.isCompatible 
                          ? 'bg-green-900/20 border-green-500/30' 
                          : 'bg-yellow-900/20 border-yellow-500/30'
                      }`}>
                        <div className="flex items-start space-x-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                            userTypeInfo.isCompatible ? 'bg-green-500' : 'bg-yellow-500'
                          }`}>
                            {userTypeInfo.isCompatible ? '✓' : '⚠'}
                          </div>
                          <div className="flex-1">
                            <p className={`font-semibold ${
                              userTypeInfo.isCompatible ? 'text-green-400' : 'text-yellow-400'
                            }`}>
                              {userTypeInfo.message}
                            </p>
                            <p className="text-gray-300 text-sm mt-1">
                              {userTypeInfo.type === 'tier' && 'Tier registration allows access to all events'}
                              {userTypeInfo.type === 'sports' && 'Sports Pass allows registration for Sports category events only'}
                              {userTypeInfo.type === 'cult' && 'Cult Pass allows registration for Fine Arts and Cultural category events only'}
                              {userTypeInfo.type === 'lit' && 'LIT Pass allows registration for Literary category events only (with free registration)'}
                            </p>
                            {userTypeInfo.isFree && (
                              <div className="mt-2 px-3 py-1 bg-green-600/20 border border-green-600/40 rounded-full inline-block">
                                <span className="text-green-300 text-xs font-bold">🎉 FREE REGISTRATION</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Validated User Display */}
                    {validatedUser && userTypeInfo?.isCompatible && (
                      <div className="bg-green-900/20 rounded-xl p-4 border border-green-500/30">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-green-400 font-semibold">✓ Valid User Found</p>
                            <p className="text-white font-semibold">{validatedUser.name}</p>
                            <p className="text-gray-300">{validatedUser.email}</p>
                            <p className="text-gray-400 text-sm">{validatedUser.college}</p>
                          </div>
                          <Button 
                            onClick={addValidatedUser}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Add to Team
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Current Members List */}
                    {members.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Team Members ({members.length})</h3>
                        <div className="space-y-3">
                          {members.map((member, index) => (
                            <div key={member.userId} className="bg-slate-700/50 rounded-xl p-4 flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-white">
                                  {member.name} {index === 0 && <span className="text-cyan-400 text-sm">(Group Leader)</span>}
                                </p>
                                <p className="text-gray-300">{member.email}</p>
                                <p className="text-gray-400 text-sm">{member.college}</p>
                              </div>
                              <Button 
                                variant="destructive" 
                                size="sm" 
                                onClick={() => removeMember(member.userId)}
                                className="hover:bg-red-600"
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                        
                        {/* Add Another Member Button */}
                        <div className="mt-4">
                          <Button 
                            onClick={() => {
                              setUserIdInput('');
                              setValidatedUser(null);
                              setUserTypeInfo(null);
                              // Scroll to input area
                              const inputElement = document.querySelector('input[placeholder="Enter User ID"]') as HTMLInputElement;
                              inputElement?.focus();
                            }}
                            variant="outline" 
                            className="border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white w-full"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Another Member
                          </Button>
                        </div>
                        
                        <div className="mt-4 p-4 bg-green-900/20 rounded-xl border border-green-500/30">
                          <p className="text-green-400 font-semibold">
                            Total Registration Fee: {totalAmount === 0 ? 'FREE (LIT Pass)' : `₹${totalAmount}`}
                          </p>
                          {totalAmount === 0 && (
                            <p className="text-green-300 text-sm mt-1">
                              🎉 Free registration courtesy of LIT Pass holder!
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between pt-6">
                    <Button onClick={resetRegistration} variant="outline" className=" bg-blue-600/20 border-blue-200/50 text-white hover:border-blue-300 hover:text-black">
                      Back to Events
                    </Button>
                    <Button 
                      onClick={() => {
                        // Check if LIT pass holder (free registration)
                        const isLitPassRegistration = paymentData.transactionId === 'LIT PASS HOLDER';
                        setCurrentStep(isLitPassRegistration ? 4 : 3); // Skip payment for LIT pass
                      }} 
                      disabled={members.length === 0}
                      className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 px-8"
                    >
                      {paymentData.transactionId === 'LIT PASS HOLDER' ? 'Review & Submit' : 'Continue to Payment'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Payment */}
              {currentStep === 3 && (
                <div className="space-y-8">
                  <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-white text-2xl">Payment Information</CardTitle>
                      <p className="text-gray-300">Complete your payment to confirm registration</p>
                    </CardHeader>
                    <CardContent className="space-y-8">
                      {/* Payment Instructions */}
                      <div className="bg-blue-900/30 border border-blue-600/30 p-6 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <Info className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
                          <div className="space-y-3">
                            <h4 className="text-lg font-semibold text-blue-300">Payment Instructions</h4>
                            <ol className="text-sm text-gray-300 space-y-2 list-decimal list-inside">
                              <li>Scan the QR code with any UPI app or use the UPI ID provided below</li>
                              <li>Enter the exact amount: <span className="font-bold text-green-400">₹{totalAmount}</span></li>
                              <li>Complete the payment and note down the transaction ID</li>
                              <li>Enter the transaction ID in the field below</li>
                              <li>Upload a screenshot of the payment confirmation</li>
                              <li>Click &ldquo;Review &amp; Submit&rdquo; to complete your registration</li>
                            </ol>
                          </div>
                        </div>
                      </div>

                      {/* Payment Methods */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* QR Code Section */}
                        <Card className="bg-slate-700/50 border-slate-600">
                          <CardHeader>
                            <CardTitle className="text-white flex items-center">
                              <CreditCard className="w-5 h-5 mr-2" />
                              Scan QR Code
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex justify-center">
                              <div className="bg-white p-4 rounded-lg">
                                {paymentData.qrCodeUrl ? (
                                  <Image 
                                    src={paymentData.qrCodeUrl}
                                    alt={`UPI QR Code for payment of ₹${totalAmount}`}
                                    width={200}
                                    height={200}
                                    className="w-48 h-48"
                                  />
                                ) : (
                                  <div className="w-48 h-48 flex items-center justify-center bg-gray-100 rounded-lg">
                                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-center space-y-2">
                              <p className="text-sm text-gray-300">
                                Scan with any UPI app
                              </p>
                              <p className="text-lg font-bold text-green-400">
                                Amount: ₹{totalAmount}
                              </p>
                            </div>
                            <div className="bg-slate-600/50 p-3 rounded-lg">
                              <p className="text-xs text-gray-300">
                                <span className="font-semibold">Merchant:</span><br/>
                                DIRECTOR ACCOUNTS OFFICIER JIPMER RECEIPTS
                              </p>
                            </div>
                          </CardContent>
                        </Card>

                        {/* UPI Details Section */}
                        <Card className="bg-slate-700/50 border-slate-600">
                          <CardHeader>
                            <CardTitle className="text-white flex items-center">
                              <IndianRupee className="w-5 h-5 mr-2" />
                              UPI Payment Details
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-3">
                              <div>
                                <Label className="text-gray-300 text-sm">Merchant Name</Label>
                                <div className="bg-slate-600 p-3 rounded-lg mt-1">
                                  <p className="text-white font-medium text-sm break-words">
                                    DIRECTOR ACCOUNTS OFFICIER JIPMER RECEIPTS
                                  </p>
                                </div>
                              </div>
                              
                              <div>
                                <Label className="text-gray-300 text-sm">UPI ID</Label>
                                <div className="flex items-center space-x-2 mt-1">
                                  <div className="bg-slate-600 px-3 py-2 rounded-lg flex-1">
                                    <code className="text-white font-mono text-sm">
                                      9442172827@sbi
                                    </code>
                                  </div>
                                  <Button
                                    onClick={() => {
                                      navigator.clipboard.writeText('9442172827@sbi');
                                      toast.success('UPI ID copied to clipboard!');
                                    }}
                                    variant="outline"
                                    size="sm"
                                    className="border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>

                              <div>
                                <Label className="text-gray-300 text-sm">Amount to Pay</Label>
                                <div className="bg-green-900/30 border border-green-600/30 p-3 rounded-lg mt-1">
                                  <div className="text-2xl font-bold text-green-400">₹{totalAmount}</div>
                                  <p className="text-xs text-green-300">Enter this exact amount</p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Transaction Details */}
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="transaction-id" className="text-gray-300 font-medium">
                            Payment Transaction ID *
                          </Label>
                          <div className="relative">
                            <Input
                              id="transaction-id"
                              value={paymentData.transactionId}
                              onChange={(e) => setPaymentData({...paymentData, transactionId: e.target.value})}
                              className={`bg-slate-700 border-slate-600 text-white ${
                                paymentValidationError ? 'border-red-500' : ''
                              }`}
                              placeholder="Enter UPI transaction ID (e.g., 123456789012)"
                            />
                            {isCheckingTransactionId && (
                              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                            )}
                          </div>
                          {paymentValidationError && (
                            <p className="text-red-400 text-sm mt-1">{paymentValidationError}</p>
                          )}
                          <p className="text-xs text-gray-400">
                            You&apos;ll find this in your UPI app after successful payment
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="payment-screenshot" className="text-gray-300 font-medium">
                            Payment Screenshot *
                          </Label>
                          <div className={`border-2 border-dashed rounded-lg p-6 text-center hover:border-slate-500 transition-colors ${
                            paymentValidationError.includes('screenshot') ? 'border-red-500' : 'border-slate-600'
                          }`}>
                            <input
                              id="payment-screenshot"
                              type="file"
                              accept="image/*"
                              onChange={handleScreenshotUpload}
                              className="hidden"
                            />
                            <Label
                              htmlFor="payment-screenshot"
                              className="cursor-pointer flex flex-col items-center space-y-3 text-gray-300 hover:text-white transition-colors"
                            >
                              <Upload className="w-8 h-8" />
                              <div className="text-center">
                                <span className="block font-medium">
                                  {paymentData.screenshotFile ? paymentData.screenshotFile.name : 'Click to upload payment screenshot'}
                                </span>
                                <span className="text-sm text-gray-400 block mt-1">
                                  PNG, JPG, JPEG (max 5MB)
                                </span>
                              </div>
                            </Label>
                          </div>
                          {paymentValidationError && paymentValidationError.includes('screenshot') && (
                            <p className="text-red-400 text-sm mt-1">{paymentValidationError}</p>
                          )}
                        </div>
                      </div>

                      {/* Navigation Buttons */}
                      <div className="flex justify-between pt-6 border-t border-slate-600">
                        <Button
                          onClick={() => setCurrentStep(2)}
                          variant="outline"
                          className=" bg-blue-600/20 border-blue-200/50 text-white hover:border-blue-300 hover:text-black"
                        >
                          Back to Details
                        </Button>
                        <Button
                          onClick={() => setCurrentStep(4)}
                          className="bg-purple-600 hover:bg-purple-700"
                          disabled={!paymentData.transactionId || !paymentData.screenshotFile || !!paymentValidationError || isCheckingTransactionId}
                        >
                          Review & Submit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Step 4: Review and Submit */}
              {currentStep === 4 && (
                <div className="bg-slate-800/50 rounded-2xl p-8 mb-8">
                  <h2 className="text-2xl font-bold text-white mb-6">Review and Submit</h2>
                  
                  <div className="space-y-6">
                    {/* Event Summary */}
                    <div className="bg-slate-700/50 rounded-xl p-6">
                      <h3 className="text-xl font-semibold text-cyan-400 mb-4">Event Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-400">Event Name</p>
                          <p className="text-white font-semibold">{selectedEvent.name}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Category</p>
                          <p className="text-white font-semibold">{selectedEvent.category}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Members Summary */}
                    <div className="bg-slate-700/50 rounded-xl p-6">
                      <h3 className="text-xl font-semibold text-cyan-400 mb-4">Team Members ({members.length})</h3>
                      <div className="space-y-3">
                        {members.map((member, index) => (
                          <div key={member.userId} className="flex items-center space-x-4">
                            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <p className="text-white font-semibold">
                                {member.name} {index === 0 && <span className="text-yellow-400">(Leader)</span>}
                              </p>
                              <p className="text-gray-400 text-sm">{member.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Payment Summary */}
                    <div className="bg-slate-700/50 rounded-xl p-6">
                      <h3 className="text-xl font-semibold text-cyan-400 mb-4">Payment Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-400">Total Amount</p>
                          <p className={`font-bold text-xl ${totalAmount === 0 ? 'text-green-400' : 'text-green-400'}`}>
                            {totalAmount === 0 ? 'FREE (LIT Pass)' : `₹${totalAmount}`}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Transaction ID</p>
                          <p className="text-white font-semibold">{paymentData.transactionId}</p>
                        </div>
                      </div>
                      {paymentData.transactionId === 'LIT PASS HOLDER' ? (
                        <div className="mt-4">
                          <p className="text-green-400">🎉 Free registration with LIT Pass!</p>
                          <p className="text-gray-300 text-sm">No payment required for LIT Pass holders</p>
                        </div>
                      ) : (
                        paymentData.screenshotFile && (
                          <div className="mt-4">
                            <p className="text-gray-400">Payment Screenshot</p>
                            <p className="text-green-400">✓ {paymentData.screenshotFile.name}</p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between pt-6">
                    <Button 
                      onClick={() => setCurrentStep(paymentData.transactionId === 'LIT PASS HOLDER' ? 2 : 3)} 
                      variant="outline" 
                      className=" bg-blue-600/20 border-blue-200/50 text-white hover:border-blue-300 hover:text-black"
                    >
                      Back
                    </Button>
                    <Button 
                      onClick={handleSubmit} 
                      disabled={submitting}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 px-8 text-lg font-semibold"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Complete Registration'
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Search Bar - Only shown when not in registration mode */}
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

              {/* Category Filter Pills - Only shown when not in registration mode */}
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

              {/* Events Grid */}
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
                        {/* Status Badge - Top Left */}
                        <div className="absolute top-4 left-4">
                          <div className={`backdrop-blur-sm px-3 py-1 rounded-full border-2 ${
                            event.is_active 
                              ? 'bg-green-500/80 border-green-300/60' 
                              : 'bg-red-500/80 border-red-300/60'
                          }`}>
                            <span className="text-white text-xs font-bold">
                              {event.is_active ? 'OPEN' : 'CLOSED'}
                            </span>
                          </div>
                        </div>

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
                          onClick={() => event.is_active && setSelectedEvent(event)}
                          disabled={!event.is_active}
                          className={`w-full py-4 px-6 rounded-xl transition-all duration-300 transform font-black text-sm border-2 border-white ${
                            event.is_active 
                              ? 'bg-cyan-400 hover:bg-cyan-500 text-white hover:scale-105 cursor-pointer' 
                              : 'bg-gray-600 text-gray-300 cursor-not-allowed opacity-60'
                          }`}
                          style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
                        >
                          <div className="text-center">
                            <div className="text-sm font-black tracking-wider uppercase">
                              {event.is_active ? 'REGISTER NOW' : 'REGISTRATION CLOSED'}
                            </div>
                            <div className="text-lg font-black">₹{event.price}</div>
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

        </div>
      </main>

      <Footer ctaText="READY TO SHOWCASE YOUR TALENT?" />
    </div>
  );
}