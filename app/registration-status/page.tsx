'use client'

import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Search, User, Users, Calendar, CreditCard, CheckCircle, AlertCircle, Clock, Download } from 'lucide-react'
import { toast } from 'sonner'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'

interface RegistrationData {
  id: string
  groupId: string
  registrationType: 'individual' | 'group'
  members: Array<{
    name: string
    email: string
    college: string
    phone: string
    collegeLocation: string
    selectionType: 'tier' | 'pass'
    tier?: string
    passType?: string
    passTier?: string
  }>
  totalAmount: number
  paymentTransactionId: string
  status: 'pending' | 'confirmed' | 'rejected'
  createdAt: string
  paymentVerificationDate?: string
}

export default function RegistrationStatusPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchId, setSearchId] = useState(searchParams.get('id') || '')
  const [isLoading, setIsLoading] = useState(false)
  const [registration, setRegistration] = useState<RegistrationData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const searchRegistration = async () => {
    if (!searchId.trim()) {
      toast.error('Please enter a Group ID or User ID')
      return
    }

    setIsLoading(true)
    setError(null)
    setRegistration(null)

    try {
      const trimmedId = searchId.trim()
      console.log('Searching for ID:', trimmedId)

      let targetGroupId = null
      let registrationResult = null

      // Step 1: Check if it's a Group ID (starts with GRP-)
      if (trimmedId.startsWith('GRP-')) {
        console.log('Searching by Group ID:', trimmedId)
        const { data: groupResult, error: groupError } = await supabase
          .from('group_registrations')
          .select('*')
          .eq('group_id', trimmedId)
          .maybeSingle()

        console.log('Group ID search result:', { groupResult, groupError })

        if (groupError && groupError.code !== 'PGRST116') {
          console.error('Group search error:', groupError)
          setError(`Database error: ${groupError.message}`)
          return
        }

        if (groupResult) {
          registrationResult = groupResult
          targetGroupId = groupResult.group_id
        }
      } 
      // Step 2: Check if it's a User ID (starts with USER-)
      else if (trimmedId.startsWith('USER-')) {
        console.log('Searching by User ID:', trimmedId)
        
        // First find which group this user belongs to
        const { data: userResult, error: userError } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', trimmedId)
          .maybeSingle()

        console.log('User ID search result:', { userResult, userError })

        if (userError && userError.code !== 'PGRST116') {
          console.error('User search error:', userError)
          setError(`Database error: ${userError.message}`)
          return
        }

        if (!userResult) {
          console.log('No user found for ID:', trimmedId)
          setError('User ID not found. Please check your User ID.')
          return
        }

        targetGroupId = userResult.group_id
        console.log('Found user belongs to group:', targetGroupId)

        // Now get the registration details for that group
        const { data: groupResult, error: groupError } = await supabase
          .from('group_registrations')
          .select('*')
          .eq('group_id', targetGroupId)
          .maybeSingle()

        console.log('Group registration search result:', { groupResult, groupError })

        if (groupError) {
          console.error('Group registration error:', groupError)
          setError(`Error fetching registration: ${groupError.message}`)
          return
        }

        registrationResult = groupResult
      }
      // Step 3: If it doesn't match expected patterns
      else {
        console.log('Invalid ID format:', trimmedId)
        setError('Invalid ID format. Please enter a Group ID (starting with GRP-) or User ID (starting with USER-).')
        return
      }

      if (!registrationResult || !targetGroupId) {
        console.log('No registration found for ID:', trimmedId)
        setError('Registration not found. Please check your Group ID or User ID.')
        return
      }

      console.log('Found registration:', registrationResult)

      // Step 4: Fetch the members for that registration
      const { data: membersResult, error: membersError } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', targetGroupId)

      console.log('Members query result:', { membersResult, membersError })

      if (membersError) {
        console.error('Members error:', membersError)
        setError(`Error fetching participants: ${membersError.message}`)
        return
      }

      // Step 5: Combine the data
      const registrationData: RegistrationData = {
        id: registrationResult.id,
        groupId: registrationResult.group_id,
        registrationType: registrationResult.registration_type || 'group',
        totalAmount: registrationResult.total_amount,
        paymentTransactionId: registrationResult.payment_transaction_id,
        status: registrationResult.status,
        createdAt: registrationResult.created_at,
        paymentVerificationDate: registrationResult.payment_verification_date,
        members: (membersResult || []).map(member => ({
          name: member.name || '',
          email: member.email || '',
          college: member.college || '',
          phone: member.phone || '',
          collegeLocation: member.college_location || '',
          selectionType: member.selection_type || 'tier',
          tier: member.tier,
          passType: member.pass_type,
          passTier: member.pass_tier,
        })),
      }

      console.log('Final registration data:', registrationData)
      setRegistration(registrationData)
      
      // Update URL with the search ID
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.set('id', trimmedId)
      window.history.replaceState(null, '', newUrl.toString())

    } catch (error) {
      console.error('Unexpected error searching registration:', error)
      setError(`An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'rejected':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getMemberSelectionDisplay = (member: any) => {
    if (member.selectionType === 'tier') {
      return member.tier || 'Not selected'
    } else {
      let display = member.passType || 'Not selected'
      if (member.passType === 'Nexus Forum' && member.passTier) {
        display += ` (${member.passTier})`
      }
      return display
    }
  }

  const getMemberAmount = (member: any) => {
    // This should match the pricing logic from your EnhancedPricingService
    if (member.selectionType === 'tier') {
      switch (member.tier) {
        case 'Issue #1': return 375
        case 'Deluxe Edition': return 650
        case 'Collectors Print': return 850
        default: return 0
      }
    } else {
      switch (member.passType) {
        case 'Nexus Arena': return 250
        case 'Nexus Spotlight': return 250
        case 'Nexus Forum':
          return member.passTier === 'Premium' ? 750 : 250
        default: return 0
      }
    }
  }

  // Auto-search on page load if ID is provided in URL
  React.useEffect(() => {
    const initialSearch = async () => {
      if (searchId && !registration && !isLoading) {
        await searchRegistration()
      }
    }
    
    initialSearch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Run only on mount

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-32 pb-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent mb-4">
              Registration Status
            </h1>
            <p className="text-xl text-gray-300">
              Check your Spandan 2025 registration details
            </p>
          </div>

          {/* Search Section */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm mb-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Search className="w-5 h-5 mr-2" />
                Find Your Registration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="search-id" className="text-gray-300">
                  Enter your Group ID or User ID
                </Label>
                <div className="flex space-x-3">
                  <Input
                    id="search-id"
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    placeholder="e.g., GRP-CAFCC477 or USER-DEED-9308B5"
                    className="bg-slate-700 border-slate-600 text-white flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && searchRegistration()}
                  />
                  <Button
                    onClick={searchRegistration}
                    disabled={isLoading}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              {error && (
                <Alert className="border-red-600 bg-red-900/20">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-300">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Registration Details */}
          {registration && (
            <div className="space-y-6">
              {/* Status Card */}
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-white flex items-center">
                        {registration.registrationType === 'group' ? (
                          <Users className="w-5 h-5 mr-2" />
                        ) : (
                          <User className="w-5 h-5 mr-2" />
                        )}
                        Registration Details
                      </CardTitle>
                      <p className="text-gray-300 mt-1">Group ID: {registration.groupId}</p>
                    </div>
                    <Badge className={`${getStatusColor(registration.status)} flex items-center space-x-1`}>
                      {getStatusIcon(registration.status)}
                      <span className="capitalize">{registration.status}</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Registration Type:</span>
                      <span className="text-white ml-2 capitalize">{registration.registrationType}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Registration Date:</span>
                      <span className="text-white ml-2">
                        {new Date(registration.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Total Amount:</span>
                      <span className="text-white ml-2 font-bold">₹{registration.totalAmount}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Transaction ID:</span>
                      <span className="text-white ml-2 font-mono">{registration.paymentTransactionId}</span>
                    </div>
                  </div>

                  {registration.status === 'confirmed' && registration.paymentVerificationDate && (
                    <div className="bg-green-900/20 border border-green-600/30 p-3 rounded-lg">
                      <p className="text-green-300 text-sm">
                        <CheckCircle className="w-4 h-4 inline mr-2" />
                        Payment verified on {new Date(registration.paymentVerificationDate).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  )}

                  {registration.status === 'pending' && (
                    <div className="bg-yellow-900/20 border border-yellow-600/30 p-3 rounded-lg">
                      <p className="text-yellow-300 text-sm">
                        <Clock className="w-4 h-4 inline mr-2" />
                        Your registration is being reviewed. You will receive a confirmation email once verified.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Participant Details */}
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Participant Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {registration.members.map((member, index) => (
                    <div key={index} className="bg-slate-700/50 p-4 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-gray-400 text-xs">Name</Label>
                          <p className="text-white font-medium">{member.name}</p>
                        </div>
                        <div>
                          <Label className="text-gray-400 text-xs">Email</Label>
                          <p className="text-white font-medium">{member.email}</p>
                        </div>
                        <div>
                          <Label className="text-gray-400 text-xs">Phone</Label>
                          <p className="text-white font-medium">{member.phone}</p>
                        </div>
                        <div className="md:col-span-2">
                          <Label className="text-gray-400 text-xs">College</Label>
                          <p className="text-white font-medium">{member.college}</p>
                        </div>
                        <div>
                          <Label className="text-gray-400 text-xs">Selection</Label>
                          <p className="text-purple-400 font-medium">
                            {member.selectionType === 'tier' ? member.tier : `${member.passType} - ${member.passTier || ''}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="text-center">
                <Button
                  onClick={() => setRegistration(null)}
                  variant="outline"
                  className="border-slate-600 text-gray-300 hover:bg-slate-700"
                >
                  Search Another Registration
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <Footer ctaText="JOIN THE COMIC CHRONICLES ADVENTURE!" />
    </div>
  )
}
