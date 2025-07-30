'use client'

import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Search, User, Users, Calendar, CreditCard, CheckCircle, AlertCircle, Clock, Download, Mail, UserCheck, Trophy } from 'lucide-react'
import { toast } from 'sonner'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'

interface MemberData {
  userId: string
  name: string
  email: string
  college: string
  phone: string
  collegeLocation?: string
  selectionType: 'tier' | 'pass'
  tier?: string
  passType?: string
  passTier?: string
  selectionDisplay: string
  amount: number
}

interface RegistrationData {
  id: string
  groupId: string
  registrationType: 'individual' | 'group'
  type: 'tier_pass' | 'event'
  eventName?: string
  eventPrice?: number
  members: MemberData[]
  totalAmount: number
  paymentTransactionId: string
  status: 'pending' | 'approved' | 'confirmed' | 'rejected'
  createdAt: string
  paymentVerificationDate?: string
  contactName: string
  contactEmail: string
  contactPhone: string
}

interface SearchResult {
  registrations: RegistrationData[]
  searchType: 'email' | 'group_id' | 'user_id'
  searchTerm: string
}

export default function RegistrationStatusPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchInput, setSearchInput] = useState(searchParams.get('id') || '')
  const [isLoading, setIsLoading] = useState(false)
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Auto-detect search type based on input format
  const detectSearchType = (input: string): 'email' | 'group_id' | 'user_id' | 'unknown' => {
    const trimmed = input.trim()
    
    // Email detection
    if (trimmed.includes('@') && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return 'email'
    }
    
    // Group ID detection (GRP- prefix)
    if (trimmed.startsWith('GRP-')) {
      return 'group_id'
    }
    
    // User ID detection (USER- prefix)
    if (trimmed.startsWith('USER-')) {
      return 'user_id'
    }
    
    return 'unknown'
  }

  const getMemberAmount = (member: any) => {
    if (member.selection_type === 'tier') {
      switch (member.tier) {
        case 'Issue #1': return 375
        case 'Deluxe Edition': return 650
        case 'Collectors Print': return 850
        default: return 0
      }
    } else {
      switch (member.pass_type) {
        case 'Nexus Arena': return 250
        case 'Nexus Spotlight': return 250
        case 'Nexus Forum':
          return member.pass_tier === 'Premium' ? 750 : 500
        default: return 0
      }
    }
  }

  const getMemberSelectionDisplay = (member: any) => {
    if (member.selection_type === 'tier') {
      return member.tier || 'Not selected'
    } else {
      let display = member.pass_type || 'Not selected'
      if (member.pass_type === 'Nexus Forum' && member.pass_tier) {
        display += ` (${member.pass_tier})`
      }
      return display
    }
  }

  const searchRegistrations = async () => {
    if (!searchInput.trim()) {
      toast.error('Please enter an Email, Group ID, or User ID')
      return
    }

    setIsLoading(true)
    setError(null)
    setSearchResult(null)

    try {
      const trimmedInput = searchInput.trim()
      const searchType = detectSearchType(trimmedInput)
      
      console.log('Search input:', trimmedInput, 'Type:', searchType)

      if (searchType === 'unknown') {
        setError('Invalid search format. Please enter a valid Email, Group ID (GRP-XXXXXX), or User ID (USER-XXXXXX).')
        return
      }

      let allRegistrations: RegistrationData[] = []

      if (searchType === 'email') {
        // Search by email in both tier/pass and event registrations
        await searchByEmail(trimmedInput, allRegistrations)
      } else if (searchType === 'group_id') {
        // Search by Group ID in both systems
        await searchByGroupId(trimmedInput, allRegistrations)
      } else if (searchType === 'user_id') {
        // Search by User ID in both systems
        await searchByUserId(trimmedInput, allRegistrations)
      }

      if (allRegistrations.length === 0) {
        setError(`No registrations found for ${searchType === 'email' ? 'email' : searchType === 'group_id' ? 'Group ID' : 'User ID'}: ${trimmedInput}`)
        return
      }

      setSearchResult({
        registrations: allRegistrations,
        searchType,
        searchTerm: trimmedInput
      })
      
      // Update URL with the search input
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.set('id', trimmedInput)
      window.history.replaceState(null, '', newUrl.toString())

    } catch (error) {
      console.error('Unexpected error searching registrations:', error)
      setError(`An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const searchByEmail = async (email: string, allRegistrations: RegistrationData[]) => {
    // Search in tier/pass registrations
    const { data: tierPassMembers, error: tierPassError } = await supabase
      .from('group_members')
      .select(`
        *,
        group_registrations (*)
      `)
      .eq('email', email)

    if (tierPassError) {
      console.error('Tier/pass email search error:', tierPassError)
    } else if (tierPassMembers && tierPassMembers.length > 0) {
      for (const member of tierPassMembers) {
        const registration = member.group_registrations
        if (registration) {
          // Get all members for this group
          const { data: allMembers } = await supabase
            .from('group_members')
            .select('*')
            .eq('group_id', registration.group_id)

          const registrationData: RegistrationData = {
            id: registration.id,
            groupId: registration.group_id,
            registrationType: registration.member_count > 1 ? 'group' : 'individual',
            type: 'tier_pass',
            members: (allMembers || []).map(m => ({
              userId: m.user_id,
              name: m.name,
              email: m.email,
              college: m.college,
              phone: m.phone,
              collegeLocation: m.college_location,
              selectionType: m.selection_type,
              tier: m.tier,
              passType: m.pass_type,
              passTier: m.pass_tier,
              selectionDisplay: getMemberSelectionDisplay(m),
              amount: getMemberAmount(m)
            })),
            totalAmount: registration.total_amount,
            paymentTransactionId: registration.payment_transaction_id,
            status: registration.status === 'approved' ? 'approved' : registration.status,
            createdAt: registration.created_at,
            paymentVerificationDate: registration.reviewed_at,
            contactName: registration.contact_name,
            contactEmail: registration.contact_email,
            contactPhone: registration.contact_phone
          }
          
          // Avoid duplicates
          if (!allRegistrations.find(r => r.groupId === registration.group_id)) {
            allRegistrations.push(registrationData)
          }
        }
      }
    }

    // Search in event registrations
    const { data: eventMembers, error: eventError } = await supabase
      .from('event_registration_members')
      .select(`
        *,
        event_registrations (
          *,
          events (name)
        )
      `)
      .eq('email', email)

    if (eventError) {
      console.error('Event email search error:', eventError)
    } else if (eventMembers && eventMembers.length > 0) {
      for (const member of eventMembers) {
        const registration = member.event_registrations
        if (registration) {
          // Get all members for this event registration
          const { data: allEventMembers } = await supabase
            .from('event_registration_members')
            .select('*')
            .eq('group_id', registration.group_id)

          const registrationData: RegistrationData = {
            id: registration.id,
            groupId: registration.group_id,
            registrationType: registration.member_count > 1 ? 'group' : 'individual',
            type: 'event',
            eventName: registration.event_name,
            eventPrice: registration.event_price,
            members: (allEventMembers || []).map(m => ({
              userId: m.user_id,
              name: m.name,
              email: m.email,
              college: m.college,
              phone: m.phone,
              selectionType: 'tier', // Event members come from tier/pass users
              selectionDisplay: 'Event Participant',
              amount: registration.event_price / registration.member_count
            })),
            totalAmount: registration.total_amount,
            paymentTransactionId: registration.payment_transaction_id,
            status: registration.status === 'approved' ? 'approved' : registration.status,
            createdAt: registration.created_at,
            paymentVerificationDate: registration.reviewed_at,
            contactName: registration.contact_name,
            contactEmail: registration.contact_email,
            contactPhone: registration.contact_phone
          }
          
          // Avoid duplicates
          if (!allRegistrations.find(r => r.groupId === registration.group_id)) {
            allRegistrations.push(registrationData)
          }
        }
      }
    }
  }

  const searchByGroupId = async (groupId: string, allRegistrations: RegistrationData[]) => {
    // Search in tier/pass registrations
    const { data: tierPassReg, error: tierPassError } = await supabase
      .from('group_registrations')
      .select('*')
      .eq('group_id', groupId)
      .maybeSingle()

    if (tierPassError && tierPassError.code !== 'PGRST116') {
      console.error('Tier/pass group search error:', tierPassError)
    } else if (tierPassReg) {
      // Get all members for this group
      const { data: allMembers } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupId)

      const registrationData: RegistrationData = {
        id: tierPassReg.id,
        groupId: tierPassReg.group_id,
        registrationType: tierPassReg.member_count > 1 ? 'group' : 'individual',
        type: 'tier_pass',
        members: (allMembers || []).map(m => ({
          userId: m.user_id,
          name: m.name,
          email: m.email,
          college: m.college,
          phone: m.phone,
          collegeLocation: m.college_location,
          selectionType: m.selection_type,
          tier: m.tier,
          passType: m.pass_type,
          passTier: m.pass_tier,
          selectionDisplay: getMemberSelectionDisplay(m),
          amount: getMemberAmount(m)
        })),
        totalAmount: tierPassReg.total_amount,
        paymentTransactionId: tierPassReg.payment_transaction_id,
        status: tierPassReg.status === 'approved' ? 'approved' : tierPassReg.status,
        createdAt: tierPassReg.created_at,
        paymentVerificationDate: tierPassReg.reviewed_at,
        contactName: tierPassReg.contact_name,
        contactEmail: tierPassReg.contact_email,
        contactPhone: tierPassReg.contact_phone
      }

      allRegistrations.push(registrationData)
    }

    // Search in event registrations
    const { data: eventReg, error: eventError } = await supabase
      .from('event_registrations')
      .select(`
        *,
        events (name)
      `)
      .eq('group_id', groupId)
      .maybeSingle()

    if (eventError && eventError.code !== 'PGRST116') {
      console.error('Event group search error:', eventError)
    } else if (eventReg) {
      // Get all members for this event registration
      const { data: allEventMembers } = await supabase
        .from('event_registration_members')
        .select('*')
        .eq('group_id', groupId)

      const registrationData: RegistrationData = {
        id: eventReg.id,
        groupId: eventReg.group_id,
        registrationType: eventReg.member_count > 1 ? 'group' : 'individual',
        type: 'event',
        eventName: eventReg.event_name,
        eventPrice: eventReg.event_price,
        members: (allEventMembers || []).map(m => ({
          userId: m.user_id,
          name: m.name,
          email: m.email,
          college: m.college,
          phone: m.phone,
          selectionType: 'tier', // Event members come from tier/pass users
          selectionDisplay: 'Event Participant',
          amount: eventReg.event_price / eventReg.member_count
        })),
        totalAmount: eventReg.total_amount,
        paymentTransactionId: eventReg.payment_transaction_id,
        status: eventReg.status === 'approved' ? 'approved' : eventReg.status,
        createdAt: eventReg.created_at,
        paymentVerificationDate: eventReg.reviewed_at,
        contactName: eventReg.contact_name,
        contactEmail: eventReg.contact_email,
        contactPhone: eventReg.contact_phone
      }

      allRegistrations.push(registrationData)
    }
  }

  const searchByUserId = async (userId: string, allRegistrations: RegistrationData[]) => {
    // Search in tier/pass registrations
    const { data: tierPassMember, error: tierPassError } = await supabase
      .from('group_members')
      .select(`
        *,
        group_registrations (*)
      `)
      .eq('user_id', userId)
      .maybeSingle()

    if (tierPassError && tierPassError.code !== 'PGRST116') {
      console.error('Tier/pass user search error:', tierPassError)
    } else if (tierPassMember && tierPassMember.group_registrations) {
      const registration = tierPassMember.group_registrations
      
      // Get all members for this group
      const { data: allMembers } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', registration.group_id)

      const registrationData: RegistrationData = {
        id: registration.id,
        groupId: registration.group_id,
        registrationType: registration.member_count > 1 ? 'group' : 'individual',
        type: 'tier_pass',
        members: (allMembers || []).map(m => ({
          userId: m.user_id,
          name: m.name,
          email: m.email,
          college: m.college,
          phone: m.phone,
          collegeLocation: m.college_location,
          selectionType: m.selection_type,
          tier: m.tier,
          passType: m.pass_type,
          passTier: m.pass_tier,
          selectionDisplay: getMemberSelectionDisplay(m),
          amount: getMemberAmount(m)
        })),
        totalAmount: registration.total_amount,
        paymentTransactionId: registration.payment_transaction_id,
        status: registration.status === 'approved' ? 'approved' : registration.status,
        createdAt: registration.created_at,
        paymentVerificationDate: registration.reviewed_at,
        contactName: registration.contact_name,
        contactEmail: registration.contact_email,
        contactPhone: registration.contact_phone
      }

      allRegistrations.push(registrationData)
    }

    // Search in event registrations
    const { data: eventMember, error: eventError } = await supabase
      .from('event_registration_members')
      .select(`
        *,
        event_registrations (
          *,
          events (name)
        )
      `)
      .eq('user_id', userId)

    if (eventError) {
      console.error('Event user search error:', eventError)
    } else if (eventMember && eventMember.length > 0) {
      for (const member of eventMember) {
        const registration = member.event_registrations
        if (registration) {
          // Get all members for this event registration
          const { data: allEventMembers } = await supabase
            .from('event_registration_members')
            .select('*')
            .eq('group_id', registration.group_id)

          const registrationData: RegistrationData = {
            id: registration.id,
            groupId: registration.group_id,
            registrationType: registration.member_count > 1 ? 'group' : 'individual',
            type: 'event',
            eventName: registration.event_name,
            eventPrice: registration.event_price,
            members: (allEventMembers || []).map(m => ({
              userId: m.user_id,
              name: m.name,
              email: m.email,
              college: m.college,
              phone: m.phone,
              selectionType: 'tier', // Event members come from tier/pass users
              selectionDisplay: 'Event Participant',
              amount: registration.event_price / registration.member_count
            })),
            totalAmount: registration.total_amount,
            paymentTransactionId: registration.payment_transaction_id,
            status: registration.status === 'approved' ? 'approved' : registration.status,
            createdAt: registration.created_at,
            paymentVerificationDate: registration.reviewed_at,
            contactName: registration.contact_name,
            contactEmail: registration.contact_email,
            contactPhone: registration.contact_phone
          }
          
          // Avoid duplicates
          if (!allRegistrations.find(r => r.groupId === registration.group_id)) {
            allRegistrations.push(registrationData)
          }
        }
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
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
      case 'approved':
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

  const getSearchTypeIcon = (searchType: string) => {
    switch (searchType) {
      case 'email':
        return <Mail className="w-4 h-4" />
      case 'group_id':
        return <Users className="w-4 h-4" />
      case 'user_id':
        return <User className="w-4 h-4" />
      default:
        return <Search className="w-4 h-4" />
    }
  }

  const getRegistrationTypeIcon = (type: string) => {
    switch (type) {
      case 'event':
        return <Calendar className="w-5 h-5" />
      case 'tier_pass':
        return <Trophy className="w-5 h-5" />
      default:
        return <UserCheck className="w-5 h-5" />
    }
  }

  // Auto-search on page load if ID is provided in URL
  React.useEffect(() => {
    const initialSearch = async () => {
      if (searchInput && !searchResult && !isLoading) {
        await searchRegistrations()
      }
    }
    
    initialSearch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Run only on mount

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-32 pb-8">
        <div className="max-w-6xl mx-auto">
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
                <Label htmlFor="search-input" className="text-gray-300">
                  Enter your Email, Group ID, or User ID
                </Label>
                <div className="flex space-x-3">
                  <Input
                    id="search-input"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="e.g., user@email.com, GRP-ABC123, or USER-DEED-9308B5"
                    className="bg-slate-700 border-slate-600 text-white flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && searchRegistrations()}
                  />
                  <Button
                    onClick={searchRegistrations}
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

          {/* Search Results */}
          {searchResult && searchResult.registrations.length > 0 && (
            <div className="space-y-6">
              {/* Search Summary */}
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-300">
                      <span className="text-white">
                        {getSearchTypeIcon(searchResult.searchType)}
                      </span>
                      <span className="ml-2">
                        Found {searchResult.registrations.length} registration{searchResult.registrations.length > 1 ? 's' : ''} for 
                        <span className="font-mono ml-1 text-white">{searchResult.searchTerm}</span>
                      </span>
                    </div>
                    <Badge variant="outline" className="text-purple-400 border-purple-400 bg-purple-900/20">
                      {searchResult.searchType === 'email' ? 'Email Search' : 
                       searchResult.searchType === 'group_id' ? 'Group ID Search' : 'User ID Search'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Registrations List */}
              {searchResult.registrations.map((registration, index) => (
                <Card key={registration.id} className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-start space-x-3">
                        <div className="text-white">
                          {getRegistrationTypeIcon(registration.type)}
                        </div>
                        <div>
                          <CardTitle className="text-white flex items-center space-x-2">
                            <span>
                              {registration.type === 'event' ? `Event Registration` : 'Tier/Pass Registration'}
                            </span>
                            {registration.eventName && (
                              <Badge className="bg-blue-600 text-white border-blue-500 px-2 py-1 text-sm font-medium">
                                {registration.eventName}
                              </Badge>
                            )}
                          </CardTitle>
                          <p className="text-gray-300 mt-1">Group ID: {registration.groupId}</p>
                          <p className="text-gray-400 text-sm">
                            {registration.registrationType === 'group' ? 
                              `Group of ${registration.members.length} member${registration.members.length > 1 ? 's' : ''}` : 
                              'Individual Registration'
                            }
                          </p>
                        </div>
                      </div>
                      <Badge className={`${getStatusColor(registration.status)} flex items-center space-x-1`}>
                        {getStatusIcon(registration.status)}
                        <span className="capitalize">{registration.status}</span>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="overview" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 bg-slate-700">
                        <TabsTrigger value="overview" className="text-gray-300 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                          Registration Overview
                        </TabsTrigger>
                        <TabsTrigger value="members" className="text-gray-300 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                          Member Details ({registration.members.length})
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="overview" className="space-y-4 mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">Contact Person:</span>
                            <span className="text-white ml-2 font-medium">{registration.contactName}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Contact Email:</span>
                            <span className="text-white ml-2 font-medium">{registration.contactEmail}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Contact Phone:</span>
                            <span className="text-white ml-2 font-medium">{registration.contactPhone}</span>
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
                            <span className="text-white ml-2 font-mono text-xs break-all">{registration.paymentTransactionId}</span>
                          </div>
                        </div>

                        {registration.status === 'approved' && registration.paymentVerificationDate && (
                          <div className="bg-green-900/20 border border-green-600/30 p-3 rounded-lg">
                            <p className="text-green-300 text-sm">
                              <CheckCircle className="w-4 h-4 inline mr-2" />
                              Registration approved on {new Date(registration.paymentVerificationDate).toLocaleDateString('en-IN')}
                            </p>
                          </div>
                        )}

                        {registration.status === 'pending' && (
                          <div className="bg-yellow-900/20 border border-yellow-600/30 p-3 rounded-lg">
                            <p className="text-yellow-300 text-sm">
                              <Clock className="w-4 h-4 inline mr-2" />
                              Your registration is being reviewed and will be approved within 24 hrs. For any further delay, please contact the organising team.
                            </p>
                          </div>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="members" className="space-y-4 mt-4">
                        <div className="space-y-3">
                          {registration.members.map((member, memberIndex) => (
                            <div key={memberIndex} className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center space-x-2">
                                  <Badge className="text-xs bg-slate-600 text-white border-slate-500 px-2 py-1">
                                    Member {memberIndex + 1}
                                  </Badge>
                                </div>
                                <Badge className="bg-purple-600 text-white text-sm px-3 py-1 font-medium">
                                  ₹{member.amount}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
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
                                <div>
                                  <Label className="text-gray-400 text-xs">User ID</Label>
                                  <p className="text-purple-400 font-medium text-sm">{member.userId}</p>
                                </div>
                                <div>
                                  <Label className="text-gray-400 text-xs">College</Label>
                                  <p className="text-white font-medium">{member.college}</p>
                                  {member.collegeLocation && (
                                    <p className="text-gray-400 text-xs">Location: {member.collegeLocation}</p>
                                  )}
                                </div>
                                <div>
                                  <Label className="text-gray-400 text-xs">
                                    {registration.type === 'event' ? 'Registration Type' : 'Selection'}
                                  </Label>
                                  <p className="text-green-400 font-medium">
                                    {member.selectionDisplay}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              ))}

              {/* Actions */}
              <div className="text-center">
                <Button
                  onClick={() => setSearchResult(null)}
                  variant="outline"
                  className="border-purple-500 text-purple-400 hover:bg-purple-600 hover:text-white bg-slate-800/50"
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
