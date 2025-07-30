'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Plus, Trash2, Upload, CreditCard, CheckCircle, Copy, QrCode, Smartphone, Ticket, Trophy, Sparkles, FileText, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { EnhancedGroupRegistrationService } from '@/lib/services/enhancedGroupRegistration'
import { EnhancedPricingService } from '@/lib/services/enhancedPricingService'
import type { EnhancedRegistrationFormData, EnhancedMemberFormData, TierType, PassType, PassTier, SelectionType } from '@/lib/types'
import { TIER_PRICES, PASS_PRICES } from '@/lib/types'

// Payment configuration  
const PAYMENT_CONFIG = {
  upiId: 'spandan2025@paytm'
}

// Enhanced tier definitions with fantastic styling
const REGISTRATION_TIERS = [
  {
    id: 'Issue #1' as TierType,
    name: 'Issue #1',
    price: 375,
    description: 'Basic delegate access to competitive events and essential pro-shows',
    features: [
      'Inaugural night (day 1)',
      'Chorea night (day 2)', 
      'Aalap finale (day 3)',
      'DJ night (day 1)',
      '1 minor proshow'
    ],
    bgColor: 'bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800',
    textColor: 'text-purple-100',
    icon: Trophy,
    glow: 'shadow-purple-500/25'
  },
  {
    id: 'Deluxe Edition' as TierType,
    name: 'Deluxe Edition',
    price: 650,
    description: 'Enhanced delegate access with additional DJ nights and pro-shows',
    features: [
      'Inaugural night (day 1)',
      'Chorea night (day 2)',
      'Aalap finale (day 3)',
      'Tinnitus finale (day 4)',
      'DJ night (day 1 & 2)',
      '2 minor proshows'
    ],
    bgColor: 'bg-gradient-to-br from-amber-500 via-orange-600 to-red-700',
    textColor: 'text-amber-100',
    icon: Sparkles,
    glow: 'shadow-orange-500/25'
  },
  {
    id: 'Collectors Print' as TierType,
    name: 'Collectors Print',
    price: 850,
    description: 'Premium delegate access with all events including exclusive experiences',
    features: [
      'Inaugural night (day 1)',
      'Chorea night (day 2)',
      'Aalap finale (day 3)',
      'Tinnitus finale (day 4)',
      'DJ night (all 3 days)',
      '2 minor proshows',
      'Major proshow access'
    ],
    bgColor: 'bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700',
    textColor: 'text-emerald-100',
    icon: CreditCard,
    glow: 'shadow-teal-500/25'
  }
]

// Enhanced pass definitions with fantastic styling  
const REGISTRATION_PASSES = [
  {
    id: 'Nexus Arena' as PassType,
    name: 'Nexus Arena - Sports Pass',
    price: 250,
    description: 'Access to spectate and participate in all sports events',
    details: 'Event registration fee to be paid separately',
    features: [
      'Spectate all sports events',
      'Participate in sports events*',
      'Access to sports venues',
      'Sports event scheduling priority'
    ],
    bgColor: 'bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800',
    textColor: 'text-blue-100',
    icon: Trophy,
    glow: 'shadow-blue-500/25'
  },
  {
    id: 'Nexus Spotlight' as PassType,
    name: 'Nexus Spotlight - CULT Pass',
    price: 250,
    description: 'Access to spectate and participate in minor stage and fine arts events',
    details: 'Does not allow participation in Major Cultural Events',
    features: [
      'Spectate all minor cultural events',
      'Participate in fine arts events*',
      'Access to minor stage performances',
      'Fine arts workshop access'
    ],
    bgColor: 'bg-gradient-to-br from-pink-600 via-rose-700 to-red-800',
    textColor: 'text-pink-100',
    icon: Sparkles,
    glow: 'shadow-pink-500/25'
  },
  {
    id: 'Nexus Forum' as PassType,
    name: 'Nexus Forum - LIT Pass',
    tiers: [
      { id: 'Standard' as PassTier, name: 'Standard', price: 500 },
      { id: 'Premium' as PassTier, name: 'Premium', price: 750 }
    ],
    description: 'Literary and academic event access with varying amenities',
    details: 'For detailed amenities refer to the brochure',
    features: [
      'Literary event access',
      'Academic workshops',
      'Debate competitions',
      'Writing contests',
      'Premium: Enhanced amenities (see brochure)'
    ],
    bgColor: 'bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800',
    textColor: 'text-violet-100',
    icon: FileText,
    glow: 'shadow-violet-500/25'
  }
]

export default function EnhancedRegisterPage() {
  const router = useRouter()
  
  // Form state
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [members, setMembers] = useState<EnhancedMemberFormData[]>([
    {
      name: '',
      email: '',
      college: '',
      phone: '',
      collegeLocation: '',
      selectionType: 'tier',
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
        selectionType: 'tier',
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
  const updateMember = (index: number, field: keyof EnhancedMemberFormData, value: any) => {
    const updatedMembers = [...members]
    
    // Handle selection type change - reset tier/pass fields
    if (field === 'selectionType') {
      updatedMembers[index] = {
        ...updatedMembers[index],
        selectionType: value,
        tier: value === 'tier' ? 'Issue #1' : undefined,
        passType: value === 'pass' ? 'Nexus Arena' : undefined,
        passTier: undefined
      }
    } 
    // Handle pass type change - reset pass tier for non-Forum passes
    else if (field === 'passType') {
      updatedMembers[index] = {
        ...updatedMembers[index],
        passType: value,
        passTier: value === 'Nexus Forum' ? 'Standard' : undefined
      }
    }
    else {
      updatedMembers[index] = {
        ...updatedMembers[index],
        [field]: value
      }
    }
    
    setMembers(updatedMembers)
  }

  // Calculate total amount
  const totalAmount = EnhancedPricingService.calculateTotalAmount(members)

  // Copy UPI ID to clipboard
  const copyUpiId = async () => {
    setCopying(true)
    try {
      await navigator.clipboard.writeText(PAYMENT_CONFIG.upiId)
      toast.success('UPI ID copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy UPI ID')
    } finally {
      setCopying(false)
    }
  }

  // Handle form submission
  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      const formData: EnhancedRegistrationFormData = {
        registrationType: members.length === 1 ? 'individual' : 'group',
        members,
        paymentTransactionId,
        paymentScreenshot
      }

      // Validate form data
      const validation = EnhancedGroupRegistrationService.validateRegistrationData(formData)
      if (!validation.isValid) {
        toast.error(validation.errors[0])
        setIsSubmitting(false)
        return
      }

      // Submit registration
      const result = await EnhancedGroupRegistrationService.submitRegistration(formData)
      
      if (result.success) {
        toast.success('Registration submitted successfully!')
        router.push(`/register/success?groupId=${result.groupId}`)
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

  // Render tier selection card
  const renderTierCard = (tier: typeof REGISTRATION_TIERS[0], memberIndex: number, isSelected: boolean) => {
    const Icon = tier.icon
    return (
      <Card 
        key={tier.id}
        className={`relative overflow-hidden transition-all duration-300 cursor-pointer transform hover:scale-105 h-full ${
          isSelected 
            ? `ring-2 ring-white ring-opacity-60 ${tier.glow} shadow-2xl` 
            : 'hover:shadow-xl opacity-80 hover:opacity-100'
        }`}
        onClick={() => updateMember(memberIndex, 'tier', tier.id)}
      >
        <div className={`${tier.bgColor} ${tier.textColor} h-full flex flex-col justify-between`}>
          <div className="p-6 flex-1">
            <div className="absolute top-2 right-2">
              <Icon className="w-8 h-8 opacity-30" />
            </div>
            {isSelected && (
              <div className="absolute top-2 left-2">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            )}
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-xl font-bold mb-2">{tier.name}</CardTitle>
              <div className="text-3xl font-bold mb-2">₹{tier.price}</div>
              <p className="text-sm opacity-90">{tier.description}</p>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="space-y-2">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 mr-2 opacity-80 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </div>
        </div>
      </Card>
    )
  }

  // Render pass selection card
  const renderPassCard = (pass: typeof REGISTRATION_PASSES[0], memberIndex: number, isSelected: boolean, selectedTier?: PassTier) => {
    const Icon = pass.icon
    const member = members[memberIndex]
    
    return (
      <Card 
        key={pass.id}
        className={`relative overflow-hidden transition-all duration-300 cursor-pointer transform hover:scale-105 h-full ${
          isSelected 
            ? `ring-2 ring-white ring-opacity-60 ${pass.glow} shadow-2xl` 
            : 'hover:shadow-xl opacity-80 hover:opacity-100'
        }`}
        onClick={() => updateMember(memberIndex, 'passType', pass.id)}
      >
        <div className={`${pass.bgColor} ${pass.textColor} h-full flex flex-col`}>
          <div className="p-6 flex-1">
            <div className="absolute top-2 right-2">
              <Icon className="w-8 h-8 opacity-30" />
            </div>
            {isSelected && (
              <div className="absolute top-2 left-2">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            )}
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-xl font-bold mb-2">{pass.name}</CardTitle>
              {pass.tiers ? (
                <div className="space-y-2 mb-4">
                  {pass.tiers.map((tier) => (
                    <div 
                      key={tier.id}
                      className={`p-3 rounded-lg border border-white/20 cursor-pointer transition-all ${
                        selectedTier === tier.id ? 'bg-white/20' : 'hover:bg-white/10'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation()
                        updateMember(memberIndex, 'passType', pass.id)
                        updateMember(memberIndex, 'passTier', tier.id)
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">{tier.name}</span>
                        <span className="text-xl font-bold">₹{tier.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-3xl font-bold mb-4">₹{pass.price}</div>
              )}
              <p className="text-sm opacity-90 mb-2">{pass.description}</p>
              <p className="text-xs opacity-75 italic">{pass.details}</p>
            </CardHeader>
          </div>
          
          <div className="p-6 pt-0">
            <CardContent className="p-0">
              <ul className="space-y-2 mb-4">
                {pass.features.map((feature, index) => (
                  <li key={index} className="flex items-start text-sm">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 opacity-80 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              {pass.id === 'Nexus Forum' && (
                <div className="p-3 bg-white/10 rounded-lg">
                  <a 
                    href="#" 
                    className="text-sm underline flex items-center hover:text-white transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      toast.info('Please upload the brochure PDF file to enable this link')
                    }}
                  >
                    <ExternalLink className="w-4 h-4 mr-1 flex-shrink-0" />
                    View detailed amenities brochure
                  </a>
                </div>
              )}
            </CardContent>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent mb-4">
              Register for Spandan 2025
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Choose your tier or pass and join the ultimate college fest experience
            </p>
            
            {/* Step indicator */}
            <div className="flex justify-center items-center space-x-4 mb-8">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    currentStep >= step 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-700 text-gray-400'
                  }`}>
                    {step}
                  </div>
                  {step < 3 && (
                    <div className={`w-16 h-1 ${
                      currentStep > step ? 'bg-purple-600' : 'bg-gray-700'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step content */}
          {currentStep === 1 && (
            <div className="space-y-8">
              {members.map((member, index) => (
                <Card key={index} className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-white">
                        Member {index + 1} {index === 0 && '(Group Leader)'}
                      </CardTitle>
                      {members.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeMember(index)}
                          className="text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Personal Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`name-${index}`} className="text-gray-300">Name *</Label>
                        <Input
                          id={`name-${index}`}
                          value={member.name}
                          onChange={(e) => updateMember(index, 'name', e.target.value)}
                          className="bg-slate-700 border-slate-600 text-white"
                          placeholder="Enter full name"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`email-${index}`} className="text-gray-300">Email *</Label>
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
                        <Label htmlFor={`college-${index}`} className="text-gray-300">College *</Label>
                        <Input
                          id={`college-${index}`}
                          value={member.college}
                          onChange={(e) => updateMember(index, 'college', e.target.value)}
                          className="bg-slate-700 border-slate-600 text-white"
                          placeholder="Enter college name"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`phone-${index}`} className="text-gray-300">Phone *</Label>
                        <Input
                          id={`phone-${index}`}
                          value={member.phone}
                          onChange={(e) => updateMember(index, 'phone', e.target.value)}
                          className="bg-slate-700 border-slate-600 text-white"
                          placeholder="Enter phone number"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor={`location-${index}`} className="text-gray-300">College Location</Label>
                        <Input
                          id={`location-${index}`}
                          value={member.collegeLocation}
                          onChange={(e) => updateMember(index, 'collegeLocation', e.target.value)}
                          className="bg-slate-700 border-slate-600 text-white"
                          placeholder="Enter college location"
                        />
                      </div>
                    </div>

                    {/* Selection Type Toggle */}
                    <div className="space-y-4">
                      <Label className="text-gray-300">Choose Your Access Type *</Label>
                      <Tabs 
                        value={member.selectionType} 
                        onValueChange={(value) => updateMember(index, 'selectionType', value as SelectionType)}
                        className="w-full"
                      >
                        <TabsList className="grid w-full grid-cols-2 bg-slate-700">
                          <TabsTrigger value="tier" className="data-[state=active]:bg-purple-600">
                            <Trophy className="w-4 h-4 mr-2" />
                            Delegate Tiers
                          </TabsTrigger>
                          <TabsTrigger value="pass" className="data-[state=active]:bg-purple-600">
                            <Ticket className="w-4 h-4 mr-2" />
                            Event Passes
                          </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="tier" className="space-y-4">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                            {REGISTRATION_TIERS.map((tier) => 
                              renderTierCard(tier, index, member.selectionType === 'tier' && member.tier === tier.id)
                            )}
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="pass" className="space-y-4">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                            {REGISTRATION_PASSES.map((pass) => 
                              renderPassCard(
                                pass, 
                                index, 
                                member.selectionType === 'pass' && member.passType === pass.id,
                                member.passTier
                              )
                            )}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>

                    {/* Selection Summary */}
                    <div className="mt-4 p-4 bg-slate-700/50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">
                          {member.name || `Member ${index + 1}`} - {EnhancedPricingService.getMemberSelectionDisplay(member)}
                        </span>
                        <span className="text-2xl font-bold text-purple-400">
                          ₹{EnhancedPricingService.calculateMemberAmount(member)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Add Member Button */}
              {members.length < 12 && (
                <Card className="bg-slate-800/30 border-dashed border-slate-600 border-2">
                  <CardContent className="flex items-center justify-center py-12">
                    <Button
                      onClick={addMember}
                      variant="outline"
                      className="border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Member ({members.length}/12)
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Total and Next Button */}
              <Card className="bg-gradient-to-r from-purple-600 to-pink-600 border-none">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center text-white">
                    <div>
                      <h3 className="text-2xl font-bold">Total Amount</h3>
                      <p className="opacity-90">{members.length} member{members.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold">₹{totalAmount}</div>
                      <Button
                        onClick={() => setCurrentStep(2)}
                        className="mt-2 bg-white text-purple-600 hover:bg-gray-100"
                        disabled={members.some(m => !m.name || !m.email || !m.college || !m.phone)}
                      >
                        Continue to Payment
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Payment Step */}
          {currentStep === 2 && (
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white text-2xl">Payment Information</CardTitle>
                <p className="text-gray-300">Complete your payment to confirm registration</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Payment QR and UPI */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-white">Scan QR Code</h3>
                    <div className="bg-white p-4 rounded-lg inline-block">
                      <QrCode className="w-48 h-48 text-gray-800" />
                      <p className="text-center text-sm text-gray-600 mt-2">
                        QR Code for ₹{totalAmount}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-white">UPI Payment</h3>
                    <div className="bg-slate-700 p-4 rounded-lg">
                      <Label className="text-gray-300">UPI ID</Label>
                      <div className="flex items-center space-x-2 mt-2">
                        <code className="bg-slate-600 px-3 py-2 rounded text-white flex-1">
                          {PAYMENT_CONFIG.upiId}
                        </code>
                        <Button
                          onClick={copyUpiId}
                          variant="outline"
                          size="sm"
                          disabled={copying}
                          className="border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white"
                        >
                          {copying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="bg-slate-700 p-4 rounded-lg">
                      <Label className="text-gray-300">Amount to Pay</Label>
                      <div className="text-3xl font-bold text-purple-400 mt-2">₹{totalAmount}</div>
                    </div>
                  </div>
                </div>

                {/* Transaction ID Input */}
                <div className="space-y-4">
                  <Label htmlFor="transaction-id" className="text-gray-300">
                    Payment Transaction ID *
                  </Label>
                  <Input
                    id="transaction-id"
                    value={paymentTransactionId}
                    onChange={(e) => setPaymentTransactionId(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Enter UPI transaction ID"
                  />
                </div>

                {/* Screenshot Upload */}
                <div className="space-y-4">
                  <Label htmlFor="payment-screenshot" className="text-gray-300">
                    Payment Screenshot *
                  </Label>
                  <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center">
                    <input
                      id="payment-screenshot"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPaymentScreenshot(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <Label
                      htmlFor="payment-screenshot"
                      className="cursor-pointer flex flex-col items-center space-y-2 text-gray-300 hover:text-white transition-colors"
                    >
                      <Upload className="w-8 h-8" />
                      <span>
                        {paymentScreenshot ? paymentScreenshot.name : 'Click to upload payment screenshot'}
                      </span>
                      <span className="text-sm opacity-75">PNG, JPG, JPEG (max 5MB)</span>
                    </Label>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6">
                  <Button
                    onClick={() => setCurrentStep(1)}
                    variant="outline"
                    className="border-slate-600 text-gray-300 hover:bg-slate-700"
                  >
                    Back to Details
                  </Button>
                  <Button
                    onClick={() => setCurrentStep(3)}
                    className="bg-purple-600 hover:bg-purple-700"
                    disabled={!paymentTransactionId || !paymentScreenshot}
                  >
                    Review & Submit
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Review Step */}
          {currentStep === 3 && (
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white text-2xl">Review & Confirm</CardTitle>
                <p className="text-gray-300">Please review your registration details before submitting</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Registration Summary */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-white">Registration Summary</h3>
                  {members.map((member, index) => (
                    <div key={index} className="bg-slate-700/50 p-4 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-white">
                            {member.name} {index === 0 && '(Group Leader)'}
                          </h4>
                          <p className="text-gray-300 text-sm">{member.email}</p>
                          <p className="text-gray-300 text-sm">{member.college}</p>
                          <p className="text-purple-400 font-medium">
                            {EnhancedPricingService.getMemberSelectionDisplay(member)}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-white">
                            ₹{EnhancedPricingService.calculateMemberAmount(member)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Payment Summary */}
                <div className="bg-slate-700/50 p-4 rounded-lg">
                  <h4 className="font-semibold text-white mb-2">Payment Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Transaction ID:</span>
                      <span className="text-white">{paymentTransactionId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Screenshot:</span>
                      <span className="text-white">{paymentScreenshot?.name}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-600">
                      <span className="text-white">Total Amount:</span>
                      <span className="text-purple-400">₹{totalAmount}</span>
                    </div>
                  </div>
                </div>

                {/* Terms and Submit */}
                <div className="space-y-4">
                  <div className="bg-yellow-900/20 border border-yellow-600/30 p-4 rounded-lg">
                    <p className="text-yellow-300 text-sm">
                      <strong>Important:</strong> Please ensure all details are correct before submitting. 
                      Registration fees are non-refundable. You will receive a confirmation email after successful registration.
                    </p>
                  </div>
                  
                  <div className="flex justify-between pt-6">
                    <Button
                      onClick={() => setCurrentStep(2)}
                      variant="outline"
                      className="border-slate-600 text-gray-300 hover:bg-slate-700"
                    >
                      Back to Payment
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Complete Registration'
                      )}
                    </Button>
                  </div>
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
