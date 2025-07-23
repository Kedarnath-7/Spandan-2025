'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, Trash2, Upload, CreditCard, CheckCircle, Copy, QrCode, Smartphone } from 'lucide-react'
import { toast } from 'sonner'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { GroupRegistrationService } from '@/lib/services/groupRegistration'
import type { RegistrationFormData, MemberFormData } from '@/lib/types'
import { TIER_PRICES } from '@/lib/types'
import { PAYMENT_CONFIG } from '@/lib/config/payment'

// Tier definitions with updated names and pricing
const REGISTRATION_TIERS = [
  {
    id: 'Issue #1',
    name: 'Issue #1',
    price: 375,
    description: 'Basic access to competitive events and essential pro-shows',
    features: [
      'Inaugural night (day 1)',
      'Chorea night (day 2)', 
      'Aalap finale (day 3)',
      'DJ night (day 1)',
      '1 minor proshow'
    ],
    bgColor: 'bg-gradient-to-br from-red-600 to-red-700',
    textColor: 'text-red-100'
  },
  {
    id: 'Deluxe Edition',
    name: 'Deluxe Edition',
    price: 650,
    description: 'Enhanced access with additional DJ nights and pro-shows',
    features: [
      'Inaugural night (day 1)',
      'Chorea night (day 2)',
      'Aalap finale (day 3)',
      'Tinnitus finale (day 4)',
      'DJ night (day 1 & 2)',
      '2 minor proshows'
    ],
    bgColor: 'bg-gradient-to-br from-orange-600 to-amber-700',
    textColor: 'text-orange-100'
  },
  {
    id: 'Collectors Print',
    name: 'Collectors Print',
    price: 850,
    description: 'Premium access with all events including exclusive experiences',
    features: [
      'Inaugural night (day 1)',
      'Chorea night (day 2)',
      'Aalap finale (day 3)',
      'Tinnitus finale (day 4)',
      'DJ night (all 3 days)',
      '2 minor proshows',
      'Major proshow access'
    ],
    bgColor: 'bg-gradient-to-br from-teal-600 to-cyan-700',
    textColor: 'text-teal-100'
  }
]

export default function RegisterPage() {
  const router = useRouter()
  
  // Form state
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [members, setMembers] = useState<MemberFormData[]>([
    {
      name: '',
      email: '',
      college: '',
      phone: '',
      collegeLocation: '',
      tier: 'Issue #1'
    }
  ])
  // State for payment
  const [paymentTransactionId, setPaymentTransactionId] = useState('')
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null)
  const [copying, setCopying] = useState(false)

  // Add new member to group
  const addMember = () => {
    if (members.length < 12) {
      setMembers([...members, {
        name: '',
        email: '',
        college: '',
        phone: '',
        collegeLocation: '',
        tier: 'Issue #1'
      }])
    }
  }

  // Remove member from group
  const removeMember = (index: number) => {
    if (members.length > 1) {
      setMembers(members.filter((_, i) => i !== index))
    }
  }

  // Update member data
  const updateMember = (index: number, field: keyof MemberFormData, value: string) => {
    const updatedMembers = [...members]
    updatedMembers[index] = { ...updatedMembers[index], [field]: value }
    setMembers(updatedMembers)
  }

  // Calculate total amount
  const calculateTotal = () => {
    return members.reduce((total, member) => {
      return total + (member.tier ? TIER_PRICES[member.tier as keyof typeof TIER_PRICES] : 0)
    }, 0)
  }

  // Validation for current step
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // Member details
        return members.every(member => 
          member.name.trim() && 
          member.email.trim() && 
          member.college.trim() && 
          member.phone.trim() &&
          member.collegeLocation.trim() && // Now mandatory
          member.tier
        )
      
      case 2: // Payment details
        return paymentTransactionId.trim() !== '' && paymentScreenshot !== null
      
      default:
        return false
    }
  }

  // Detailed validation with specific error messages
  const getValidationErrors = (step: number): string[] => {
    const errors: string[] = []
    
    if (step === 1) {
      members.forEach((member, index) => {
        const memberLabel = members.length === 1 ? 'Member' : `Member ${index + 1}`
        
        if (!member.name.trim()) {
          errors.push(`${memberLabel}: Name is required`)
        }
        if (!member.email.trim()) {
          errors.push(`${memberLabel}: Email is required`)
        }
        if (!member.college.trim()) {
          errors.push(`${memberLabel}: College/Institution is required`)
        }
        if (!member.phone.trim()) {
          errors.push(`${memberLabel}: Phone number is required`)
        }
        if (!member.collegeLocation.trim()) {
          errors.push(`${memberLabel}: College location is required`)
        }
        if (!member.tier) {
          errors.push(`${memberLabel}: Registration tier is required`)
        }
      })
    } else if (step === 2) {
      if (!paymentTransactionId.trim()) {
        errors.push('Transaction ID is required')
      }
      if (!paymentScreenshot) {
        errors.push('Payment screenshot is required')
      }
    }
    
    return errors
  }

  // Handle step navigation
  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1)
    } else {
      const errors = getValidationErrors(currentStep)
      errors.forEach(error => toast.error(error))
    }
  }

  const prevStep = () => {
    setCurrentStep(currentStep - 1)
  }

  // Handle form submission
  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      const formData: RegistrationFormData = {
        registrationType: 'group', // Always treat as group (even single member)
        members,
        paymentTransactionId,
        paymentScreenshot
      }

      // Validate form data
      const validation = GroupRegistrationService.validateRegistrationData(formData)
      if (!validation.isValid) {
        validation.errors.forEach(error => toast.error(error))
        setIsSubmitting(false)
        return
      }

      // Submit registration
      const result = await GroupRegistrationService.submitRegistration(formData)

      if (result.success) {
        toast.success('Registration submitted successfully!')
        
        // Show success information
        toast.success(`Group ID: ${result.groupId}`)
        result.delegateIds?.forEach((id, index) => {
          toast.success(`${members[index].name} - Delegate ID: ${id}`)
        })

        // Redirect to success page or home
        setTimeout(() => {
          router.push('/?registered=true')
        }, 3000)
      } else {
        toast.error(result.error || 'Registration failed')
      }
    } catch (error) {
      console.error('Registration error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload a valid image file (JPEG, PNG, or WebP)')
        return
      }
      
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        toast.error('File size must be less than 5MB')
        return
      }
      
      setPaymentScreenshot(file)
      toast.success('Payment screenshot uploaded successfully')
    }
  }

  // Handle UPI ID copy
  const handleCopyUPI = async () => {
    try {
      setCopying(true)
      await navigator.clipboard.writeText(PAYMENT_CONFIG.upiId)
      toast.success('UPI ID copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy UPI ID')
    } finally {
      setCopying(false)
    }
  }

  // Open UPI app for payment
  const openUPIApp = () => {
    const amount = calculateTotal()
    const orderId = `SPD25-${Date.now()}`
    const upiLink = `upi://pay?pa=${PAYMENT_CONFIG.upiId}&pn=${PAYMENT_CONFIG.merchantName}&am=${amount}&cu=INR&tn=${orderId}`
    window.open(upiLink, '_blank')
  }

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
            <p className="text-gray-300 text-lg mb-8">
              Join the Comic Chronicles Adventure at SPANDAN 2025
            </p>
            
            {/* Progress Indicator */}
            <div className="flex justify-center items-center mb-8">
              <div className="flex items-center space-x-8">
                <div className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep >= 1 ? 'bg-cyan-500 border-cyan-500 text-white' : 'border-gray-400 text-gray-400'
                  }`}>
                    1
                  </div>
                  {currentStep > 1 && (
                    <div className="w-16 h-1 bg-cyan-500 ml-2"></div>
                  )}
                  {currentStep === 1 && (
                    <div className="w-16 h-1 bg-gray-400 ml-2"></div>
                  )}
                </div>
                <div className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep >= 2 ? 'bg-cyan-500 border-cyan-500 text-white' : 'border-gray-400 text-gray-400'
                  }`}>
                    2
                  </div>
                </div>
              </div>
            </div>

            {/* Step Labels */}
            <div className="flex justify-center mb-12">
              <div className="flex items-center justify-between w-60">
                <span className={`text-sm ${currentStep >= 1 ? 'text-cyan-400' : 'text-gray-400'}`}>
                  Registration Details
                </span>
                <span className={`text-sm ${currentStep >= 2 ? 'text-cyan-400' : 'text-gray-400'}`}>
                  Payment
                </span>
              </div>
            </div>
          </div>

          {/* Step Content */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardContent className="p-8">
              
              {/* Step 1: Registration Details & Tier Selection */}
              {currentStep === 1 && (
                <div className="space-y-8">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">
                      Registration Details
                    </h2>
                    <p className="text-gray-300">
                      Fill in member details and select registration tiers. For group registration, click &#34;Add Another Member&#34;.
                    </p>
                  </div>

                  {/* Tier Information Display */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {REGISTRATION_TIERS.map((tier) => (
                      <Card key={tier.id} className={`${tier.bgColor} border-0 transition-all duration-300 hover:scale-105`}>
                        <CardContent className="p-6">
                          <div className="text-center">
                            <h3 className={`text-xl font-bold ${tier.textColor} mb-2`}>{tier.name}</h3>
                            <p className={`text-3xl font-bold ${tier.textColor} mb-4`}>₹{tier.price}</p>
                            <p className={`text-sm ${tier.textColor} opacity-90 mb-4`}>{tier.description}</p>
                            <div className="space-y-2">
                              {tier.features.map((feature, idx) => (
                                <p key={idx} className={`text-sm ${tier.textColor} opacity-90`}>
                                  • {feature}
                                </p>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Member Forms */}
                  <div className="space-y-6">
                    {members.map((member, index) => (
                      <Card key={index} className="bg-slate-800/50 border-slate-600">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                          <CardTitle className="text-white">
                            {members.length === 1 ? 'Member Details' : `Member ${index + 1}`}
                            {index === 0 && members.length > 1 && (
                              <Badge variant="secondary" className="ml-2">Contact Person</Badge>
                            )}
                          </CardTitle>
                          {members.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMember(index)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`name-${index}`} className="text-gray-300">
                                Full Name *
                              </Label>
                              <Input
                                id={`name-${index}`}
                                value={member.name}
                                onChange={(e) => updateMember(index, 'name', e.target.value)}
                                className="bg-slate-700 border-slate-600 text-white"
                                placeholder="Enter full name"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`email-${index}`} className="text-gray-300">
                                Email Address *
                              </Label>
                              <Input
                                id={`email-${index}`}
                                type="email"
                                value={member.email}
                                onChange={(e) => updateMember(index, 'email', e.target.value)}
                                className="bg-slate-700 border-slate-600 text-white"
                                placeholder="Enter email address"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`college-${index}`} className="text-gray-300">
                                College/Institution *
                              </Label>
                              <Input
                                id={`college-${index}`}
                                value={member.college}
                                onChange={(e) => updateMember(index, 'college', e.target.value)}
                                className="bg-slate-700 border-slate-600 text-white"
                                placeholder="Enter college name"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`phone-${index}`} className="text-gray-300">
                                Phone Number *
                              </Label>
                              <Input
                                id={`phone-${index}`}
                                value={member.phone}
                                onChange={(e) => updateMember(index, 'phone', e.target.value)}
                                className="bg-slate-700 border-slate-600 text-white"
                                placeholder="Enter phone number"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`location-${index}`} className="text-gray-300">
                                College Location *
                              </Label>
                              <Input
                                id={`location-${index}`}
                                value={member.collegeLocation}
                                onChange={(e) => updateMember(index, 'collegeLocation', e.target.value)}
                                className="bg-slate-700 border-slate-600 text-white"
                                placeholder="City, State"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`tier-${index}`} className="text-gray-300">
                                Registration Tier *
                              </Label>
                              <Select
                                value={member.tier}
                                onValueChange={(value: 'Collectors Print' | 'Deluxe Edition' | 'Issue #1') => 
                                  updateMember(index, 'tier', value)
                                }
                              >
                                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                                  <SelectValue placeholder="Select tier" />
                                </SelectTrigger>
                                <SelectContent>
                                  {REGISTRATION_TIERS.map((tier) => (
                                    <SelectItem key={tier.id} value={tier.id}>
                                      {tier.name} - ₹{tier.price}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Add Member Button */}
                  {members.length < 12 && (
                    <div className="text-center">
                      <Button
                        variant="outline"
                        onClick={addMember}
                        className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Another Member
                      </Button>
                      <p className="text-gray-400 text-sm mt-2">
                        Group Registration: {members.length}/12 members
                      </p>
                    </div>
                  )}

                  {/* Total Amount Display */}
                  <Card className="bg-cyan-500/10 border-cyan-500/30">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-lg font-semibold text-white">Total Amount</h3>
                          <p className="text-gray-300 text-sm">
                            {members.length} member{members.length > 1 ? 's' : ''} • Mixed tiers
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-cyan-400">₹{calculateTotal()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Navigation Buttons */}
                  <div className="flex justify-end">
                    <Button onClick={nextStep} className="bg-cyan-500 hover:bg-cyan-600 text-white">
                      Next: Payment Details
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Payment Details */}
              {currentStep === 2 && (
                <div className="space-y-8">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">
                      Payment Details
                    </h2>
                    <p className="text-gray-300">
                      Complete your registration by providing payment information
                    </p>
                  </div>

                  {/* Payment Summary */}
                  <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/30">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Registration Summary</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Registration Type:</span>
                          <span className="text-white font-medium">
                            {members.length === 1 ? 'Individual' : 'Group'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Number of Members:</span>
                          <span className="text-white font-medium">{members.length}</span>
                        </div>
                        <div className="border-t border-gray-600 pt-3">
                          <div className="flex justify-between text-lg">
                            <span className="text-white font-semibold">Total Amount:</span>
                            <span className="text-cyan-400 font-bold">₹{calculateTotal()}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Enhanced Payment Section */}
                  <Card className="bg-yellow-500/10 border-yellow-500/30">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-yellow-400 mb-4">
                        <QrCode className="w-5 h-5 inline mr-2" />
                        Payment Methods
                      </h3>
                      
                      {/* UPI Payment Details */}
                      <div className="bg-slate-800/50 p-4 rounded-lg mb-4">
                        <h4 className="font-medium text-white mb-3">UPI Payment Details:</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">UPI ID:</span>
                            <div className="flex items-center gap-2">
                              <code className="bg-slate-700 px-2 py-1 rounded text-cyan-400">
                                {PAYMENT_CONFIG.upiId}
                              </code>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCopyUPI}
                                disabled={copying}
                                className="text-cyan-400 border-cyan-400 hover:bg-cyan-500/10"
                              >
                                {copying ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                              </Button>
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Merchant:</span>
                            <span className="text-white font-medium">{PAYMENT_CONFIG.merchantName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Amount:</span>
                            <span className="text-cyan-400 font-bold">₹{calculateTotal()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Payment Options */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <Button
                          onClick={openUPIApp}
                          className="bg-green-600 hover:bg-green-700 text-white h-12"
                        >
                          <Smartphone className="mr-2 h-4 w-4" />
                          Pay with UPI App
                        </Button>
                        <Button
                          variant="outline"
                          disabled
                          className="border-gray-600 text-gray-400 h-12"
                        >
                          <QrCode className="mr-2 h-4 w-4" />
                          QR Code (Coming Soon)
                        </Button>
                      </div>

                      {/* Manual Payment Instructions */}
                      <div className="text-sm text-yellow-200">
                        <p className="font-medium mb-2">Manual Payment Steps:</p>
                        <ol className="list-decimal list-inside space-y-1">
                          <li>Open your UPI app (GPay, PhonePe, Paytm, etc.)</li>
                          <li>Send money to UPI ID: <span className="font-mono text-cyan-300">{PAYMENT_CONFIG.upiId}</span></li>
                          <li>Enter the exact amount: <span className="font-bold text-cyan-300">₹{calculateTotal()}</span></li>
                          <li>Add your name in the note/description</li>
                          <li>Complete the payment and take a screenshot</li>
                          <li>Fill the details below and submit</li>
                        </ol>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Payment Form */}
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="transaction-id" className="text-gray-300">
                        Payment Transaction ID *
                      </Label>
                      <Input
                        id="transaction-id"
                        value={paymentTransactionId}
                        onChange={(e) => setPaymentTransactionId(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="Enter UPI/Bank transaction ID"
                      />
                    </div>

                    <div>
                      <Label htmlFor="payment-screenshot" className="text-gray-300">
                        Payment Screenshot *
                      </Label>
                      <div className="mt-2">
                        <input
                          id="payment-screenshot"
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <Label
                          htmlFor="payment-screenshot"
                          className="cursor-pointer border-2 border-dashed border-gray-600 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:border-gray-500 transition-colors"
                        >
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          {paymentScreenshot ? (
                            <div>
                              <p className="text-green-400 font-medium">{paymentScreenshot.name}</p>
                              <p className="text-gray-400 text-sm">Click to change file</p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-gray-300">Click to upload payment screenshot</p>
                              <p className="text-gray-400 text-sm">PNG, JPG, WebP up to 5MB</p>
                            </div>
                          )}
                        </Label>
                      </div>
                    </div>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={prevStep} className="border-gray-600 text-gray-300">
                      Previous
                    </Button>
                    <Button 
                      onClick={handleSubmit} 
                      disabled={isSubmitting || !validateStep(2)}
                      className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Complete Registration
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

            </CardContent>
          </Card>
        </div>
      </main>

      <Footer ctaText="JOIN THE COMIC CHRONICLES ADVENTURE!" />
    </div>
  )
}
