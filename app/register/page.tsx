'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Users, Calendar, MapPin, Star, Shield, Mail, Phone, Zap, ArrowLeft, ArrowRight, Copy } from 'lucide-react'
import { toast } from 'sonner'
import type { Event, RegistrationTier } from '@/lib/types'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import PaymentComponent from '@/components/PaymentComponent'
import { unifiedRegistrationService } from '@/lib/services/unifiedRegistration'
import { UnifiedRegistrationService } from '@/lib/services/unifiedRegistrationAdmin'
import type { CompleteRegistrationData } from '@/lib/services/unifiedRegistration'
import { useAuth } from '@/lib/contexts/AuthContext'
import AuthProtectedRoute from '@/components/AuthProtectedRoute'
import ProfileCompletion from '@/components/ProfileCompletion'
import RegistrationStatus from '@/components/RegistrationStatus'
import { getUserProfile, type UserProfile } from '@/lib/services/userProfile'

// Safely import eventService with fallback
let eventService: any = null;
try {
  eventService = require('@/lib/services/events').eventService;
} catch (error) {
  console.warn('EventService not available:', error);
}

const REGISTRATION_TIERS: RegistrationTier[] = [
  {
    id: 'tier1',
    name: 'TIER 1',
    price: 375,
    description: 'Participate in all competitive events and spectate all competitive events (except demier cri)',
    features: [
      'Inaugural night (day 1)',
      'Chorea night (day 2)', 
      'Aalap finale (day 3)',
      'Tinnitus finale (day 4)',
      'DJ night (day 1)',
      '1 minor proshow'
    ],
    icon: 'shield',
    bgColor: 'bg-gradient-to-br from-red-600 to-red-700'
  },
  {
    id: 'tier2',
    name: 'TIER 2',
    price: 650,
    description: 'Participate in all competitive events and spectate all competitive events (except demier cri)',
    features: [
      'Inaugural night (day 1)',
      'Chorea night (day 2)',
      'Aalap finale (day 3)',
      'Tinnitus finale (day 4)',
      'DJ night (day 1 & 2)',
      '2 minor proshows'
    ],
    icon: 'star',
    bgColor: 'bg-gradient-to-br from-orange-600 to-amber-700'
  },
  {
    id: 'tier3',
    name: 'TIER 3',
    price: 850,
    description: 'Participate in all competitive events and spectate all competitive events (incl. demier cri)',
    features: [
      'Inaugural night (day 1)',
      'Chorea night (day 2)',
      'Aalap finale (day 3)',
      'Tinnitus finale (day 4)',
      'DJ night (day 1, 2 & 3)',
      '2 minor proshows',
      'Major proshow'
    ],
    icon: 'trophy',
    bgColor: 'bg-gradient-to-br from-teal-600 to-cyan-700'
  }
]

export default function RegisterPage() {
  return (
    <AuthProtectedRoute fallbackPath="/register">
      <RegisterPageContent />
    </AuthProtectedRoute>
  )
}

function RegisterPageContent() {
  const router = useRouter()
  const { user } = useAuth()

  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false)
  const [canRegister, setCanRegister] = useState(true)

  // Static state - no dependencies on external contexts
  const [events, setEvents] = useState<Event[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [selectedTier, setSelectedTier] = useState<RegistrationTier | null>(null)
  const [orderId, setOrderId] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    email: user?.email || '',
    phone: '',
    college: '',
    year: '',
    branch: '',
    registrationTier: ''
  })

  const [selectedEventsByCategory, setSelectedEventsByCategory] = useState({
    cultural: new Set<string>(),
    sports: new Set<string>(),
    fineArts: new Set<string>(),
    literary: new Set<string>()
  })

  // Copy order ID state
  const [copyingOrderId, setCopyingOrderId] = useState(false)

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return;
      
      setProfileLoading(true);
      try {
        const profile = await getUserProfile(user.id);
        if (profile && profile.name && profile.college && profile.phone && profile.year && profile.branch) {
          // Profile is complete
          setUserProfile(profile);
          setFormData(prev => ({
            ...prev,
            name: profile.name || '',
            email: profile.email || user.email || '',
            phone: profile.phone || '',
            college: profile.college || '',
            year: profile.year || '',
            branch: profile.branch || ''
          }));
          setNeedsProfileCompletion(false);
        } else {
          // Profile is incomplete - need to complete it
          setNeedsProfileCompletion(true);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // If profile doesn't exist, need to create it
        setNeedsProfileCompletion(true);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, [user?.id, user?.email])

  const handleProfileComplete = (profile: UserProfile) => {
    setUserProfile(profile);
    setFormData(prev => ({
      ...prev,
      name: profile.name || '',
      email: profile.email || user?.email || '',
      phone: profile.phone || '',
      college: profile.college || '',
      year: profile.year || '',
      branch: profile.branch || ''
    }));
    setNeedsProfileCompletion(false);
  };

  // Update email when user data is available (fallback)
  useEffect(() => {
    if (user?.email && !userProfile && formData.email !== user.email) {
      setFormData(prev => ({ ...prev, email: user.email }))
    }
  }, [user?.email, userProfile, formData.email])

  // Generate order ID on component mount
  useEffect(() => {
    setOrderId(unifiedRegistrationService.generateOrderId())
  }, [])

  // Load events in background with loading indicator
  useEffect(() => {
    const loadEventsFromDatabase = async () => {
      if (!eventService) {
        console.log('EventService not available - using static events only');
        return;
      }

      try {
        setEventsLoading(true)
        const eventsData = await eventService.getAllEvents()
        setEvents(eventsData || [])
      } catch (error) {
        console.error('Error loading events from database:', error)
      } finally {
        setEventsLoading(false)
      }
    }

    const timeoutId = setTimeout(() => {
      loadEventsFromDatabase()
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleTierSelect = (tier: RegistrationTier) => {
    setSelectedTier(tier)
    setFormData(prev => ({ ...prev, registrationTier: tier.id }))
  }

  const handleEventSelection = (category: string, eventName: string) => {
    setSelectedEventsByCategory(prev => {
      const newState = { ...prev }
      const categorySet = new Set(newState[category as keyof typeof newState])
      
      if (categorySet.has(eventName)) {
        categorySet.delete(eventName)
      } else {
        categorySet.add(eventName)
      }
      
      newState[category as keyof typeof newState] = categorySet
      return newState
    })
  }

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!formData.name || !formData.email || !formData.phone || !formData.college || !formData.year || !formData.branch) {
        toast.error('Please complete your profile with all required fields (including year and branch)')
        return
      }
      if (!selectedTier) {
        toast.error('Please select a registration tier to continue')
        return
      }
    }
    setCurrentStep(prev => prev + 1)
  }

  const handlePrevStep = () => {
    setCurrentStep(prev => prev - 1)
  }

  // Calculate total amount including tier price and selected events
  const calculateTotalAmount = () => {
    let total = selectedTier?.price || 0;
    
    // Add prices for selected events
    Object.entries(selectedEventsByCategory).forEach(([category, eventSet]) => {
      eventSet.forEach(eventName => {
        const event = events.find(e => e.name === eventName);
        if (event && event.price > 0) {
          total += event.price;
        }
      });
    });
    
    return total;
  }

  // Copy order ID to clipboard
  const handleCopyOrderId = async () => {
    try {
      setCopyingOrderId(true)
      await navigator.clipboard.writeText(orderId)
      toast.success('Order ID copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy Order ID')
    } finally {
      setCopyingOrderId(false)
    }
  }

  const handlePaymentComplete = async (paymentData: { transactionId: string; screenshot: File }) => {
    try {
      setIsSubmitting(true)
      
      const registrationData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        college: formData.college,
        year: formData.year,
        branch: formData.branch,
        tier: formData.registrationTier as 'tier1' | 'tier2' | 'tier3',
        selectedEvents: {
          cultural: Array.from(selectedEventsByCategory.cultural),
          sports: Array.from(selectedEventsByCategory.sports),
          fineArts: Array.from(selectedEventsByCategory.fineArts),
          literary: Array.from(selectedEventsByCategory.literary)
        },
        transactionId: paymentData.transactionId,
        screenshot: paymentData.screenshot
      }

      const result = await UnifiedRegistrationService.completeRegistration(registrationData)
      
      if (result.success) {
        toast.success(result.message)
        
        // Clear form data
        setFormData({
          name: '',
          email: '',
          phone: '',
          college: '',
          year: '',
          branch: '',
          registrationTier: ''
        })
        setSelectedEventsByCategory({
          cultural: new Set(),
          sports: new Set(),
          fineArts: new Set(),
          literary: new Set()
        })
        setSelectedTier(null)
        setCurrentStep(1)
        
        // Redirect to profile page
        router.push('/profile')
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error('Registration error:', error)
      toast.error('Registration failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getIcon = (iconName: string) => {
    switch(iconName) {
      case 'shield': return (
        <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.5C15.4,11.5 16,12.4 16,13V16C16,17.4 15.4,18 14.8,18H9.2C8.6,18 8,17.4 8,16V13C8,12.4 8.6,11.5 9.2,11.5V10C9.2,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.5,8.7 10.5,10V11.5H13.5V10C13.5,8.7 12.8,8.2 12,8.2Z"/>
        </svg>
      );
      case 'star': return (
        <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.46,13.97L5.82,21L12,17.27Z"/>
        </svg>
      );
      case 'trophy': return (
        <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M7,15H9C9,16.08 9.37,17 10,17.2V20H8V22H16V20H14V17.2C14.63,17 15,16.08 15,15H17C18.1,15 19,14.1 19,13V9C19,8.4 18.6,8 18,8H17V7C17,5.9 16.1,5 15,5H9C7.9,5 7,5.9 7,7V8H6C5.4,8 5,8.4 5,9V13C5,14.1 5.9,15 7,15M9,7H15V8H9V7M7,10H5V13H7V10M19,10V13H17V10H19Z"/>
        </svg>
      );
      default: return (
        <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.46,13.97L5.82,21L12,17.27Z"/>
        </svg>
      );
    }
  };

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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Hero Title */}
          <div className="text-center mb-12">
            <div className="inline-block bg-gradient-to-r from-cyan-400 to-blue-500 px-8 py-4 rounded-xl mb-6">
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-wide">
                SUIT UP & REGISTER!
              </h1>
            </div>
            <p className="text-lg text-white max-w-4xl mx-auto">
              Choose your registration tier and join the ultimate cultural & sports festival at JIPMER!
            </p>
          </div>

          {/* Profile Completion Check */}
          {profileLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-400" />
                <p className="text-white">Loading your profile...</p>
              </div>
            </div>
          ) : needsProfileCompletion ? (
            <div className="py-16">
              <ProfileCompletion
                userId={user?.id || ''}
                email={user?.email || ''}
                name={user?.name || ''}
                onComplete={handleProfileComplete}
              />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Registration Status Check */}
              <RegistrationStatus
                userEmail={user?.email || ''}
                onStatusChecked={setCanRegister}
              />
              
              {/* Registration Form - Only show if user can register */}
              {canRegister && (
                <div>
                  {/* Existing registration form content */}
                  {/* Step Indicator */}
                  <div className="flex justify-center mb-8">
                    <div className="flex items-center space-x-4">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                        currentStep >= 1 ? 'bg-cyan-500 border-cyan-500 text-white' : 'border-gray-400 text-gray-400'
                      }`}>
                        1
                      </div>
                      <div className={`w-16 h-0.5 ${currentStep >= 2 ? 'bg-cyan-500' : 'bg-gray-400'}`} />
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                        currentStep >= 2 ? 'bg-cyan-500 border-cyan-500 text-white' : 'border-gray-400 text-gray-400'
                      }`}>
                        2
                      </div>
                      <div className={`w-16 h-0.5 ${currentStep >= 3 ? 'bg-cyan-500' : 'bg-gray-400'}`} />
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                        currentStep >= 3 ? 'bg-cyan-500 border-cyan-500 text-white' : 'border-gray-400 text-gray-400'
                      }`}>
                        3
                      </div>
                    </div>
                  </div>

                  {/* Step Labels */}
                  <div className="flex justify-center mb-12">
                    <div className="flex items-center justify-between w-80">
                      <span className={`text-sm ${currentStep >= 1 ? 'text-cyan-400' : 'text-gray-400'}`}>
                        Registration
                      </span>
                      <span className={`text-sm ${currentStep >= 2 ? 'text-cyan-400' : 'text-gray-400'}`}>
                        Events
                      </span>
                      <span className={`text-sm ${currentStep >= 3 ? 'text-cyan-400' : 'text-gray-400'}`}>
                        Payment
                      </span>
                    </div>
                  </div>

                  {/* Step 1: Registration & Tier Selection */}
                  {currentStep === 1 && (
                    <div className="space-y-8">
                      {/* Tier Selection Instructions */}
                      <div className="text-center mb-6">
                        <h3 className="text-xl font-bold text-white mb-2">Choose Your Registration Tier</h3>
                        <p className="text-gray-300">
                          Click on any one of the below tiers to select your registration plan
                        </p>
                      </div>

                      {/* Registration Tiers */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {REGISTRATION_TIERS.map((tier) => (
                          <div
                            key={tier.id}
                            className={`${tier.bgColor} rounded-2xl p-6 cursor-pointer transition-all duration-300 transform hover:scale-105 border-2 ${
                              selectedTier?.id === tier.id
                                ? 'border-white/70 shadow-2xl scale-105'
                                : 'border-white/30 hover:border-white/50'
                            } min-h-[400px] flex flex-col`}
                            onClick={() => handleTierSelect(tier)}
                          >
                            <div className="flex justify-center mb-4">
                              {getIcon(tier.icon || 'star')}
                            </div>
                            
                            <div className="text-center mb-4">
                              <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
                              <p className="text-3xl font-black text-white">₹{tier.price}</p>
                            </div>
                            
                            <p className="text-white/90 text-sm text-center mb-6 leading-relaxed">
                              {tier.description}
                            </p>
                            
                            <div className="flex-grow">
                              <div className="text-white font-semibold mb-3 text-center underline">Amenities:</div>
                              <div className="space-y-2">
                                {tier.features.map((feature: string, index: number) => (
                                  <div key={index} className="flex items-start space-x-2">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full flex-shrink-0 mt-2"></div>
                                    <span className="text-white text-sm">{feature}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            {selectedTier?.id === tier.id && (
                              <div className="mt-4 text-center">
                                <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
                                  <span className="text-white text-sm font-bold">SELECTED</span>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Personal Information Form */}
                      <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl p-8 border-2 border-cyan-400/30">
                        <h3 className="text-2xl font-bold text-white mb-4 text-center">Personal Information</h3>
                        
                        {/* Info Note */}
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="text-sm">
                              <p className="text-blue-200 font-medium">Profile Information</p>
                              <p className="text-blue-300 mt-1">
                                Personal details are pulled from your profile. To update them, go to 
                                <Link href="/profile" className="text-blue-400 hover:text-blue-300 underline mx-1">
                                  My Account → Settings
                                </Link>
                                first.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <div className="flex items-center mb-2">
                              <Users className="w-5 h-5 text-gray-400 mr-2" />
                              <Label htmlFor="name" className="text-gray-300 font-medium">
                                Full Name *
                                <span className="text-xs text-gray-500 ml-1">(From Profile)</span>
                              </Label>
                            </div>
                            <Input
                              id="name"
                              name="name"
                              value={formData.name}
                              disabled
                              placeholder={profileLoading ? "Loading..." : "Enter your full name in profile settings"}
                              className="bg-slate-800/80 border-slate-600 text-gray-300 placeholder-gray-500 h-12 rounded-lg cursor-not-allowed"
                            />
                          </div>
                          <div>
                            <div className="flex items-center mb-2">
                              <Mail className="w-5 h-5 text-gray-400 mr-2" />
                              <Label htmlFor="email" className="text-gray-300 font-medium">
                                Email Address *
                                <span className="text-xs text-gray-500 ml-1">(From Account)</span>
                              </Label>
                            </div>
                            <Input
                              id="email"
                              name="email"
                              type="email"
                              value={formData.email}
                              disabled
                              className="bg-slate-800/80 border-slate-600 text-gray-300 h-12 rounded-lg cursor-not-allowed"
                            />
                          </div>
                          <div>
                            <div className="flex items-center mb-2">
                              <Phone className="w-5 h-5 text-gray-400 mr-2" />
                              <Label htmlFor="phone" className="text-gray-300 font-medium">
                                Phone Number *
                                <span className="text-xs text-gray-500 ml-1">(From Profile)</span>
                              </Label>
                            </div>
                            <Input
                              id="phone"
                              name="phone"
                              value={formData.phone}
                              disabled
                              placeholder={profileLoading ? "Loading..." : "Enter your phone in profile settings"}
                              className="bg-slate-800/80 border-slate-600 text-gray-300 placeholder-gray-500 h-12 rounded-lg cursor-not-allowed"
                            />
                          </div>
                          <div>
                            <div className="flex items-center mb-2">
                              <MapPin className="w-5 h-5 text-gray-400 mr-2" />
                              <Label htmlFor="college" className="text-gray-300 font-medium">
                                College/Institution *
                                <span className="text-xs text-gray-500 ml-1">(From Profile)</span>
                              </Label>
                            </div>
                            <Input
                              id="college"
                              name="college"
                              value={formData.college}
                              disabled
                              placeholder={profileLoading ? "Loading..." : "Enter your college in profile settings"}
                              className="bg-slate-800/80 border-slate-600 text-gray-300 placeholder-gray-500 h-12 rounded-lg cursor-not-allowed"
                            />
                          </div>
                          <div>
                            <div className="flex items-center mb-2">
                              <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                              <Label htmlFor="year" className="text-gray-300 font-medium">
                                Year of Study *
                                <span className="text-xs text-gray-500 ml-1">(From Profile)</span>
                              </Label>
                            </div>
                            <Input
                              id="year"
                              name="year"
                              value={formData.year}
                              disabled
                              placeholder={profileLoading ? "Loading..." : "Enter your year in profile settings"}
                              className="bg-slate-800/80 border-slate-600 text-gray-300 placeholder-gray-500 h-12 rounded-lg cursor-not-allowed"
                            />
                          </div>
                          <div>
                            <div className="flex items-center mb-2">
                              <Zap className="w-5 h-5 text-gray-400 mr-2" />
                              <Label htmlFor="branch" className="text-gray-300 font-medium">
                                Branch/Department *
                                <span className="text-xs text-gray-500 ml-1">(From Profile)</span>
                              </Label>
                            </div>
                            <Input
                              id="branch"
                              name="branch"
                              value={formData.branch}
                              disabled
                              placeholder={profileLoading ? "Loading..." : "Enter your branch in profile settings"}
                              className="bg-slate-800/80 border-slate-600 text-gray-300 placeholder-gray-500 h-12 rounded-lg cursor-not-allowed"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end mt-8">
                          <Button
                            type="button"
                            onClick={handleNextStep}
                            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
                          >
                            Next: Select Events
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Event Selection */}
                  {currentStep === 2 && (
                    <div className="space-y-8">
                      <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl p-8 border-2 border-cyan-400/30">
                        <h3 className="text-2xl font-bold text-white mb-6 text-center">Select Events (Optional)</h3>
                        <p className="text-gray-300 text-center mb-8">
                          Your {selectedTier?.name} pass includes access to most events. Select additional events you want to specifically register for.
                        </p>

                        {eventsLoading && (
                          <div className="text-center py-8">
                            <Loader2 className="mx-auto h-8 w-8 animate-spin text-cyan-400" />
                            <p className="text-gray-400 mt-2">Loading events...</p>
                          </div>
                        )}

                        <div className="space-y-6">
                          {['Culturals', 'Sports', 'Fine Arts', 'Literary'].map((category) => {
                            const categoryEvents = events.filter(event => event.category === category)
                            // Fixed mapping to match state object keys
                            const categoryKey = (() => {
                              switch(category) {
                                case 'Culturals': return 'cultural'
                                case 'Sports': return 'sports'
                                case 'Fine Arts': return 'fineArts'
                                case 'Literary': return 'literary'
                                default: return 'cultural'
                              }
                            })() as keyof typeof selectedEventsByCategory
                            
                            return (
                              <div key={category} className="border border-gray-600 rounded-lg p-6">
                                <h4 className="text-xl font-bold text-white mb-4">{category}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {categoryEvents.map((event) => (
                                    <div
                                      key={event.id}
                                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                                        selectedEventsByCategory[categoryKey].has(event.name)
                                          ? 'border-cyan-400 bg-cyan-400/10'
                                          : 'border-gray-600 hover:border-gray-500'
                                      }`}
                                      onClick={() => handleEventSelection(categoryKey, event.name)}
                                    >
                                      <h5 className="font-semibold text-white mb-2">{event.name}</h5>
                                      <p className="text-gray-400 text-sm mb-2">{event.description}</p>
                                      {event.price > 0 && (
                                        <p className="text-cyan-400 font-bold">₹{event.price}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        <div className="flex justify-between mt-8">
                          <Button
                            type="button"
                            onClick={handlePrevStep}
                            variant="outline"
                            className="border-gray-600 text-black hover:bg-gray-700"
                          >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                          </Button>
                          <Button
                            type="button"
                            onClick={handleNextStep}
                            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
                          >
                            Next: Payment
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Payment */}
                  {currentStep === 3 && (
                    <div className="space-y-8">
                      {/* Registration Summary */}
                      <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl p-8 border-2 border-cyan-400/30 mb-8 max-w-4xl mx-auto">
                        <h3 className="text-2xl font-bold text-white mb-6 text-center">Registration Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          <div>
                            <h4 className="text-lg font-semibold text-white mb-4">Personal Details</h4>
                            <div className="space-y-2 text-gray-300">
                              <p><span className="font-medium">Name:</span> {formData.name}</p>
                              <p><span className="font-medium">Email:</span> {formData.email}</p>
                              <p><span className="font-medium">Phone:</span> {formData.phone}</p>
                              <p><span className="font-medium">College:</span> {formData.college}</p>
                              <p><span className="font-medium">Year:</span> {formData.year}</p>
                              <p><span className="font-medium">Branch:</span> {formData.branch}</p>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-white mb-4">Registration Details</h4>
                            <div className="space-y-2 text-gray-300">
                              <p><span className="font-medium">Tier:</span> {selectedTier?.name}</p>
                              <p><span className="font-medium">Tier Price:</span> ₹{selectedTier?.price}</p>
                              {Object.values(selectedEventsByCategory).some(set => set.size > 0) && (
                                <p><span className="font-medium">Events Price:</span> ₹{calculateTotalAmount() - (selectedTier?.price || 0)}</p>
                              )}
                              <p className="text-lg font-bold text-cyan-400"><span className="font-medium">Total Amount:</span> ₹{calculateTotalAmount()}</p>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">Order ID:</span>
                                <code className="bg-slate-700 px-2 py-1 rounded text-xs text-cyan-400">{orderId}</code>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleCopyOrderId}
                                  disabled={copyingOrderId}
                                  className="h-8 w-8 p-0 hover:bg-slate-700"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {Object.values(selectedEventsByCategory).some(set => set.size > 0) && (
                          <div className="mt-6">
                            <h4 className="text-lg font-semibold text-white mb-4">Selected Events</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {Object.entries(selectedEventsByCategory).map(([category, eventSet]) => {
                                if (eventSet.size === 0) return null
                                return (
                                  <div key={category}>
                                    <h5 className="font-medium text-cyan-400 mb-2 capitalize">
                                      {category.replace('fineArts', 'Fine Arts')}
                                    </h5>
                                    <ul className="space-y-1 text-gray-300 text-sm">
                                      {Array.from(eventSet).map(eventName => (
                                        <li key={eventName}>• {eventName}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Payment Component */}
                      <PaymentComponent
                        amount={calculateTotalAmount()}
                        orderId={orderId}
                        description={`SPANDAN 2025 ${selectedTier?.name} Registration`}
                        onPaymentComplete={handlePaymentComplete}
                        isLoading={isSubmitting}
                      />

                      <div className="flex justify-center mt-8">
                        <Button
                          type="button"
                          onClick={handlePrevStep}
                          variant="outline"
                          className="border-gray-600 text-black hover:bg-gray-700 mr-4"
                          disabled={isSubmitting}
                        >
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Back
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      <Footer ctaText="YOUR HERO JOURNEY STARTS HERE!" />
    </div>
  )
}
