'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import QRCode from 'qrcode'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Plus, Trash2, Upload, CreditCard, CheckCircle, Copy, Users, Calendar, MapPin, IndianRupee, Search, Star, Heart, Music, Guitar, Crown, Zap, FileText, Info, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { getEvents } from '@/lib/services/events'
import { getApprovedUsers, getUserDetails, createEventRegistration } from '@/lib/services/eventRegistrationService'
import { Event } from '@/lib/types'

// Payment configuration (same as tier/pass registration)
const PAYMENT_CONFIG = {
  upiId: '9442172827@sbi',
  merchantName: 'DIRECTOR ACCOUNTS OFFICIER JIPMER RECEIPTS'
}

interface SelectedEvent {
  id: string
  name: string
  category: string
  description: string
  date: string
  location: string
  price: number
  max_participants?: number
  info_points?: string[]
}

interface ApprovedUser {
  user_id: string
  name: string
  email: string
  college: string
  group_id: string
}

interface RegistrationMember {
  userId: string
  name: string
  email: string
  college: string
  phone: string
  originalGroupId: string
}

interface ContactInfo {
  userId: string
  name: string
  email: string
  phone: string
}

export default function EventRegistrationPage() {
  const router = useRouter()
  
  // Main state
  const [currentStep, setCurrentStep] = useState(1)
  const [events, setEvents] = useState<Event[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<SelectedEvent | null>(null)
  const [approvedUsers, setApprovedUsers] = useState<ApprovedUser[]>([])
  
  // Registration data
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    userId: '',
    name: '',
    email: '',
    phone: ''
  })
  const [members, setMembers] = useState<RegistrationMember[]>([])
  const [paymentData, setPaymentData] = useState({
    transactionId: '',
    screenshotFile: null as File | null,
    qrCodeUrl: ''
  })
  
  // Loading states
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false)

  // Load events and approved users
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [eventsResult, usersResult] = await Promise.all([
          getEvents(),
          getApprovedUsers()
        ])

        if (eventsResult) {
          setEvents(eventsResult)
          const uniqueCategories = Array.from(new Set(eventsResult.map(event => event.category)))
          setCategories(['all', ...uniqueCategories])
        } else {
          toast.error('Failed to load events')
        }

        if (usersResult.success && usersResult.data) {
          setApprovedUsers(usersResult.data)
        } else {
          toast.error('Failed to load approved users')
        }
      } catch (error) {
        toast.error('Error loading data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Generate QR code for payment
  useEffect(() => {
    if (selectedEvent && members.length > 0) {
      const totalAmount = selectedEvent.price * members.length
      const qrData = `upi://pay?pa=${PAYMENT_CONFIG.upiId}&pn=${encodeURIComponent(PAYMENT_CONFIG.merchantName)}&am=${totalAmount}&cu=INR&tn=${encodeURIComponent(`SPANDAN 2025 - ${selectedEvent.name} Registration`)}`
      
      QRCode.toDataURL(qrData, { width: 256, margin: 2 })
        .then(url => setPaymentData(prev => ({ ...prev, qrCodeUrl: url })))
        .catch(err => console.error('QR Code generation failed:', err))
    }
  }, [selectedEvent, members])

  // Filter events based on category and search
  const filteredEvents = events.filter(event => {
    const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory
    const matchesSearch = searchQuery === '' || 
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.category.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesCategory && matchesSearch && event.is_active
  })

  // Handle event selection
  const handleEventSelect = (event: Event) => {
    setSelectedEvent({
      id: event.id,
      name: event.name,
      category: event.category,
      description: event.description,
      date: event.start_date || event.created_at,
      location: event.venue || 'TBD',
      price: event.price,
      max_participants: event.max_participants,
      info_points: event.info_points
    })
    setCurrentStep(2)
  }

  // Auto-fill contact info when contact user is selected
  const handleContactUserChange = async (userId: string) => {
    if (!userId) return

    try {
      const result = await getUserDetails(userId)
      if (result.success && result.data) {
        setContactInfo({
          userId,
          name: result.data.name,
          email: result.data.email,
          phone: result.data.phone
        })
        
        // Auto-add contact person as first member
        const newMember: RegistrationMember = {
          userId,
          name: result.data.name,
          email: result.data.email,
          college: result.data.college,
          phone: result.data.phone,
          originalGroupId: result.data.group_id
        }
        setMembers([newMember])
      }
    } catch (error) {
      toast.error('Error loading user details')
    }
  }

  // Add member to registration
  const addMember = async (userId: string) => {
    if (members.find(m => m.userId === userId)) {
      toast.error('User already added to registration')
      return
    }

    try {
      const result = await getUserDetails(userId)
      if (result.success && result.data) {
        const newMember: RegistrationMember = {
          userId,
          name: result.data.name,
          email: result.data.email,
          college: result.data.college,
          phone: result.data.phone,
          originalGroupId: result.data.group_id
        }
        setMembers([...members, newMember])
        toast.success(`${result.data.name} added to registration`)
      }
    } catch (error) {
      toast.error('Error adding member')
    }
  }

  // Remove member from registration
  const removeMember = (userId: string) => {
    setMembers(members.filter(m => m.userId !== userId))
  }

  // Handle screenshot upload
  const handleScreenshotUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size should not exceed 5MB')
        return
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file')
        return
      }
      
      setPaymentData(prev => ({ ...prev, screenshotFile: file }))
      toast.success('Payment screenshot uploaded')
    }
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedEvent || !contactInfo.userId || members.length === 0 || !paymentData.transactionId) {
      toast.error('Please complete all required fields')
      return
    }

    setSubmitting(true)
    try {
      const result = await createEventRegistration(
        selectedEvent.id,
        contactInfo.userId,
        contactInfo.name,
        contactInfo.email,
        contactInfo.phone,
        paymentData.transactionId,
        paymentData.screenshotFile, // Pass the File object directly
        members
      )

      if (result.success) {
        toast.success(`Event registration submitted successfully! Group ID: ${result.data?.groupId}`)
        
        // Reset form and go back to step 1
        setTimeout(() => {
          setCurrentStep(1)
          setSelectedEvent(null)
          setContactInfo({ userId: '', name: '', email: '', phone: '' })
          setMembers([])
          setPaymentData({ transactionId: '', screenshotFile: null, qrCodeUrl: '' })
        }, 2000)
      } else {
        toast.error(result.error || 'Failed to submit registration')
      }
    } catch (error) {
      toast.error('Error submitting registration')
    } finally {
      setSubmitting(false)
    }
  }

  // Calculate total amount
  const totalAmount = selectedEvent ? selectedEvent.price * members.length : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
        <Navigation />
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center text-white">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
              <p>Loading event registration...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
              Event Registration
            </h1>
            <p className="text-xl text-purple-200 max-w-2xl mx-auto">
              Browse events and register your group with approved participants
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex justify-center mb-8">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                  currentStep >= step 
                    ? 'bg-purple-600 shadow-lg shadow-purple-500/25' 
                    : 'bg-gray-700'
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`w-20 h-1 mx-2 ${
                    currentStep > step ? 'bg-purple-600' : 'bg-gray-700'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step content */}
          {currentStep === 1 && (
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-white text-2xl">Browse & Select Event</CardTitle>
                <p className="text-gray-400">Choose the event you want to register for</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Search and Filter */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search events..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
                      />
                    </div>
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full md:w-[200px] bg-gray-700/50 border-gray-600 text-white">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category === 'all' ? 'All Categories' : category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Events Grid */}
                {filteredEvents.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-xl">No events found</p>
                    <p>Try adjusting your search or category filter</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEvents.map((event) => {
                      const icons = [Star, Heart, Music, Guitar, Crown, Users, Zap]
                      const IconComponent = icons[Math.abs(event.name.charCodeAt(0)) % icons.length]
                      
                      return (
                        <Card key={event.id} className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 overflow-hidden hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 transform hover:scale-105">
                          <CardContent className="p-0">
                            {/* Event Header */}
                            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 text-white">
                              <div className="flex items-center justify-between mb-2">
                                <Badge variant="secondary" className="bg-white/20 text-white">
                                  {event.category}
                                </Badge>
                                <IconComponent className="w-6 h-6" />
                              </div>
                              <h3 className="text-xl font-bold mb-1">{event.name}</h3>
                            </div>

                            {/* Event Content */}
                            <div className="p-4">
                              <p className="text-gray-300 mb-4 line-clamp-3">{event.description}</p>
                              
                              {/* Event Details */}
                              <div className="space-y-2 mb-4 text-sm text-gray-400">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(event.start_date || event.created_at).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4" />
                                  {event.venue || 'TBD'}
                                </div>
                                <div className="flex items-center gap-2">
                                  <IndianRupee className="w-4 h-4" />
                                  ₹{event.price} per person
                                </div>
                                {event.max_participants && (
                                  <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    Max {event.max_participants} participants
                                  </div>
                                )}
                              </div>

                              {/* Info Points */}
                              {event.info_points && event.info_points.length > 0 && (
                                <div className="mb-4">
                                  <h4 className="text-white font-medium mb-2 text-sm">Event Highlights:</h4>
                                  <ul className="text-xs text-gray-400 space-y-1">
                                    {event.info_points.slice(0, 3).map((point, index) => (
                                      <li key={index} className="flex items-start gap-2">
                                        <span className="text-purple-400 mt-1">•</span>
                                        <span>{point}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Register Button */}
                              <Button
                                onClick={() => handleEventSelect(event)}
                                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                              >
                                Register for ₹{event.price}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 2: Registration Details */}
          {currentStep === 2 && selectedEvent && (
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-white text-2xl">Registration Details</CardTitle>
                <p className="text-gray-400">
                  Registering for: <span className="text-purple-400 font-semibold">{selectedEvent.name}</span>
                </p>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Event Summary */}
                <Card className="bg-purple-900/30 border-purple-700">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-white font-bold text-lg">{selectedEvent.name}</h3>
                        <p className="text-purple-200 text-sm mb-2">{selectedEvent.category}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-300">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(selectedEvent.date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {selectedEvent.location}
                          </div>
                          <div className="flex items-center gap-1">
                            <IndianRupee className="w-4 h-4" />
                            ₹{selectedEvent.price} per person
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setCurrentStep(1)}
                        className="border-gray-600 text-gray-400 hover:text-white"
                      >
                        Change Event
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Contact Person Selection */}
                <div className="space-y-4">
                  <h3 className="text-white text-xl font-bold">Contact Person</h3>
                  <Alert className="border-blue-500 bg-blue-900/20">
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-blue-200">
                      Only users with approved tier/pass registrations can participate in events. 
                      The contact person will be automatically added as the first member.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="contactUser" className="text-white">Select Contact User *</Label>
                      <Select value={contactInfo.userId} onValueChange={handleContactUserChange}>
                        <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white">
                          <SelectValue placeholder="Choose an approved user as contact person" />
                        </SelectTrigger>
                        <SelectContent>
                          {approvedUsers.map(user => (
                            <SelectItem key={user.user_id} value={user.user_id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{user.name}</span>
                                <span className="text-sm text-gray-500">{user.college} • {user.user_id}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {contactInfo.userId && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-700/30 rounded-lg border border-gray-600">
                        <div>
                          <Label className="text-white text-sm">Name</Label>
                          <Input
                            value={contactInfo.name}
                            onChange={(e) => setContactInfo({...contactInfo, name: e.target.value})}
                            className="bg-gray-700/50 border-gray-600 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-white text-sm">Email</Label>
                          <Input
                            type="email"
                            value={contactInfo.email}
                            onChange={(e) => setContactInfo({...contactInfo, email: e.target.value})}
                            className="bg-gray-700/50 border-gray-600 text-white"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label className="text-white text-sm">Phone</Label>
                          <Input
                            value={contactInfo.phone}
                            onChange={(e) => setContactInfo({...contactInfo, phone: e.target.value})}
                            className="bg-gray-700/50 border-gray-600 text-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Group Members */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-white text-xl font-bold">Group Members</h3>
                    <Badge variant="secondary" className="bg-purple-600 text-white">
                      {members.length} member{members.length !== 1 ? 's' : ''} • Total: ₹{totalAmount}
                    </Badge>
                  </div>
                  
                  <div className="grid gap-4">
                    <div>
                      <Label className="text-white">Add Group Member</Label>
                      <Select onValueChange={addMember}>
                        <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white">
                          <SelectValue placeholder="Select approved user to add to group" />
                        </SelectTrigger>
                        <SelectContent>
                          {approvedUsers
                            .filter(user => !members.find(m => m.userId === user.user_id))
                            .map(user => (
                              <SelectItem key={user.user_id} value={user.user_id}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{user.name}</span>
                                  <span className="text-sm text-gray-500">{user.college} • {user.user_id}</span>
                                </div>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Members List */}
                    {members.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-white font-medium">Selected Members ({members.length})</h4>
                        {members.map((member, index) => (
                          <Card key={member.userId} className="bg-gray-700/30 border-gray-600">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                                  <div>
                                    <Label className="text-gray-400 text-xs">Name</Label>
                                    <p className="text-white font-medium">{member.name}</p>
                                  </div>
                                  <div>
                                    <Label className="text-gray-400 text-xs">College</Label>
                                    <p className="text-white">{member.college}</p>
                                  </div>
                                  <div>
                                    <Label className="text-gray-400 text-xs">User ID</Label>
                                    <p className="text-purple-400 font-mono text-sm">{member.userId}</p>
                                  </div>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeMember(member.userId)}
                                  className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white ml-4"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-between pt-6">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="border-gray-600 text-gray-400 hover:text-white"
                  >
                    Back to Events
                  </Button>
                  <Button
                    onClick={() => setCurrentStep(3)}
                    disabled={!contactInfo.userId || members.length === 0}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Continue to Payment
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Payment & Review */}
          {currentStep === 3 && selectedEvent && (
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-white text-2xl">Payment & Review</CardTitle>
                <p className="text-gray-400">Complete payment and review your registration</p>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Payment Summary */}
                <Card className="bg-green-900/20 border-green-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      Payment Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-gray-300">
                        <span>Event: {selectedEvent.name}</span>
                        <span>₹{selectedEvent.price} × {members.length}</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Participants:</span>
                        <span>{members.length} member{members.length !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="border-t border-gray-600 pt-3">
                        <div className="flex justify-between text-white text-xl font-bold">
                          <span>Total Amount:</span>
                          <span>₹{totalAmount}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Instructions */}
                <Card className="bg-blue-900/20 border-blue-700">
                  <CardHeader>
                    <CardTitle className="text-white">Payment Instructions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* QR Code */}
                      <div className="text-center">
                        <h4 className="text-white font-medium mb-3">Scan QR Code to Pay</h4>
                        {paymentData.qrCodeUrl ? (
                          <div className="bg-white p-4 rounded-lg inline-block">
                            <Image
                              src={paymentData.qrCodeUrl}
                              alt="Payment QR Code"
                              width={200}
                              height={200}
                              className="mx-auto"
                            />
                          </div>
                        ) : (
                          <div className="bg-gray-700 w-52 h-52 mx-auto rounded-lg flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Payment Details */}
                      <div className="space-y-4">
                        <h4 className="text-white font-medium">Payment Details</h4>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">UPI ID:</span>
                            <span className="text-white font-mono">{PAYMENT_CONFIG.upiId}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Amount:</span>
                            <span className="text-white font-bold">₹{totalAmount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Beneficiary:</span>
                            <span className="text-white text-xs">{PAYMENT_CONFIG.merchantName}</span>
                          </div>
                        </div>
                        
                        <Alert className="border-yellow-500 bg-yellow-900/20 mt-4">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-yellow-200 text-sm">
                            After making the payment, please provide the transaction ID and upload a screenshot for verification.
                          </AlertDescription>
                        </Alert>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Transaction Details */}
                <Card className="bg-gray-700/30 border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-white">Transaction Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="transactionId" className="text-white">Transaction ID *</Label>
                      <Input
                        id="transactionId"
                        value={paymentData.transactionId}
                        onChange={(e) => setPaymentData(prev => ({ ...prev, transactionId: e.target.value }))}
                        placeholder="Enter UPI transaction ID"
                        className="bg-gray-700/50 border-gray-600 text-white"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="screenshot" className="text-white">Payment Screenshot (Optional)</Label>
                      <div className="mt-2">
                        <Input
                          id="screenshot"
                          type="file"
                          accept="image/*"
                          onChange={handleScreenshotUpload}
                          className="bg-gray-700/50 border-gray-600 text-white"
                        />
                        {paymentData.screenshotFile && (
                          <p className="text-green-400 text-sm mt-2 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Screenshot uploaded: {paymentData.screenshotFile.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Registration Review */}
                <Card className="bg-gray-700/30 border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-white">Registration Review</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Event Details */}
                    <div>
                      <h4 className="text-white font-medium mb-3">Event Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Event:</span>
                          <p className="text-white">{selectedEvent.name}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Category:</span>
                          <p className="text-white">{selectedEvent.category}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Date:</span>
                          <p className="text-white">{new Date(selectedEvent.date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Location:</span>
                          <p className="text-white">{selectedEvent.location}</p>
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div>
                      <h4 className="text-white font-medium mb-3">Contact Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Name:</span>
                          <p className="text-white">{contactInfo.name}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Email:</span>
                          <p className="text-white">{contactInfo.email}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Phone:</span>
                          <p className="text-white">{contactInfo.phone}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">User ID:</span>
                          <p className="text-purple-400 font-mono">{contactInfo.userId}</p>
                        </div>
                      </div>
                    </div>

                    {/* Members List */}
                    <div>
                      <h4 className="text-white font-medium mb-3">Registered Members ({members.length})</h4>
                      <div className="space-y-3">
                        {members.map((member, index) => (
                          <div key={member.userId} className="border border-gray-600 rounded p-3">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                              <div>
                                <span className="text-gray-400">Name:</span>
                                <p className="text-white">{member.name}</p>
                              </div>
                              <div>
                                <span className="text-gray-400">College:</span>
                                <p className="text-white">{member.college}</p>
                              </div>
                              <div>
                                <span className="text-gray-400">User ID:</span>
                                <p className="text-purple-400 font-mono">{member.userId}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Navigation */}
                <div className="flex justify-between pt-6">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(2)}
                    className="border-gray-600 text-gray-400 hover:text-white"
                  >
                    Back to Details
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting || !paymentData.transactionId}
                    className="bg-green-600 hover:bg-green-700 text-white min-w-[200px]"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Submit Registration
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  )
}
