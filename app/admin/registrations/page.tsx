'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { exportService } from '@/lib/services/exportService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Search,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Calendar,
  Mail,
  Phone,
  GraduationCap,
  MapPin,
  CreditCard,
  ImageIcon,
  Download,
  Loader2,
  RefreshCw,
  AlertTriangle,
  X,
  Copy,
  Eye
} from 'lucide-react';
import { AdminService } from '@/lib/services/adminService';
import type { EnhancedRegistrationView } from '@/lib/types';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function AdminRegistrationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [registrations, setRegistrations] = useState<EnhancedRegistrationView[]>([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState<EnhancedRegistrationView[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalRevenue: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  
  // Registration details modal state
  const [selectedRegistration, setSelectedRegistration] = useState<EnhancedRegistrationView | null>(null);
  const [showRegistrationDetails, setShowRegistrationDetails] = useState(false);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Function to copy text to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Success",
        description: "Copied to clipboard!",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  // Function to fetch group members
  const fetchGroupMembers = async (groupId: string) => {
    setLoadingMembers(true);
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupId)
        .order('member_order');

      if (error) throw error;
      
      console.log('Group members data:', data); // Debug log to see what fields we get
      setGroupMembers(data || []);
    } catch (error) {
      console.error('Error fetching group members:', error);
      toast({
        title: "Error",
        description: "Failed to load group members",
        variant: "destructive",
      });
      setGroupMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Handle view details with group members
  const handleViewDetails = async (registration: EnhancedRegistrationView) => {
    setSelectedRegistration(registration);
    setShowRegistrationDetails(true);
    await fetchGroupMembers(registration.group_id);
  };

  // Load registrations using AdminService
  const loadRegistrations = useCallback(async () => {
    try {
      setLoadingData(true);
      const result = await AdminService.getAllRegistrations();
      
      if (result.success && result.data) {
        setRegistrations(result.data);
        
        // Update stats
        const newStats = {
          total: result.data.length,
          pending: result.data.filter((r: EnhancedRegistrationView) => r.status === 'pending').length,
          approved: result.data.filter((r: EnhancedRegistrationView) => r.status === 'approved').length,
          rejected: result.data.filter((r: EnhancedRegistrationView) => r.status === 'rejected').length,
          totalRevenue: result.data.reduce((sum: number, r: EnhancedRegistrationView) => sum + (r.total_amount || 0), 0)
        };
        setStats(newStats);
      } else {
        toast({
          title: "Error",
          description: "Failed to load registrations",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error loading registrations:', error);
      toast({
        title: "Error", 
        description: "Failed to load registrations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  }, [toast]);

  // Check authentication using simple localStorage session
  useEffect(() => {
    const adminSession = localStorage.getItem('adminSession');
    if (!adminSession) {
      toast({
        title: "Authentication Required",
        description: "Please login to access admin panel",
        variant: "destructive",
      });
      router.push('/admin');
      return;
    }

    const session = JSON.parse(adminSession);
    const currentTime = Date.now();
    const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours

    if (currentTime - session.loginTime > sessionDuration) {
      localStorage.removeItem('adminSession');
      toast({
        title: "Session Expired",
        description: "Session expired. Please login again.",
        variant: "destructive",
      });
      router.push('/admin');
      return;
    }

    loadRegistrations();
  }, [router, loadRegistrations, toast]);

  // Helper function to get the correct Supabase storage URL
  const getPaymentScreenshotUrl = (filename: string | null): string | null => {
    if (!filename) return null;
    
    try {
      // If it's already a full URL, return as is
      if (filename.startsWith('http')) {
        return filename;
      }
      
      // Remove any leading slashes and clean the filename
      const cleanFilename = filename.replace(/^\/+/, '');
      
      console.log('Attempting to get public URL for:', cleanFilename);
      
      // Use the correct bucket name: spandan-assets
      // Don't add payment-screenshots if filename already includes it
      const filePath = cleanFilename.startsWith('payment-screenshots/') 
        ? cleanFilename 
        : `payment-screenshots/${cleanFilename}`;
      
      const { data } = supabase.storage
        .from('spandan-assets')
        .getPublicUrl(filePath);
      
      return data.publicUrl;
    } catch (error) {
      console.error('Error generating image URL:', error);
      return null;
    }
  };

  // Function to test storage bucket access
  const testStorageAccess = async () => {
    try {
      console.log('Testing storage bucket access...');
      
      // List files in spandan-assets bucket
      const { data: files, error } = await supabase.storage
        .from('spandan-assets')
        .list('payment-screenshots', { limit: 10 });
        
      if (error) {
        console.error('Storage bucket error:', error);
        toast({
          title: "Error",
          description: `Cannot access storage bucket: ${error.message}`,
          variant: "destructive",
        });
        return;
      }
      
      console.log('Files in spandan-assets/payment-screenshots:', files);
      
      if (files && files.length > 0) {
        toast({
          title: "Success",
          description: `Found ${files.length} files in storage bucket`,
        });
      } else {
        toast({
          title: "Success",
          description: "Storage bucket is accessible but empty",
        });
      }
    } catch (error) {
      console.error('Storage test failed:', error);
      toast({
        title: "Error",
        description: "Could not access storage bucket",
        variant: "destructive",
      });
    }
  };

  // Function to view payment screenshot
  const viewPaymentScreenshot = async (filename: string | null) => {
    if (!filename) {
      toast({
        title: "Error",
        description: "No payment screenshot available",
        variant: "destructive",
      });
      return;
    }
    
    console.log('Viewing payment screenshot:', filename);
    
    // Get the image URL
    let imageUrl = getPaymentScreenshotUrl(filename);
    
    // If that fails, try alternative approaches
    if (!imageUrl || imageUrl.includes('404')) {
      // Try direct Supabase URL construction
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nqradrvcababsofnbitm.supabase.co';
      const cleanFilename = filename.replace(/^\/+/, '');
      imageUrl = `${supabaseUrl}/storage/v1/object/public/payment-screenshots/${cleanFilename}`;
      console.log('Fallback URL:', imageUrl);
    }
    
    if (imageUrl) {
      setSelectedImage(imageUrl);
      setImageLoadError(false); // Reset error state
      setImageLoading(true); // Set loading state
      setImageModalOpen(true);
    } else {
      toast({
        title: "Error",
        description: "Could not generate image URL",
        variant: "destructive",
      });
    }
  };


  // Filter and sort registrations
  useEffect(() => {
    let filtered = [...registrations];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(registration => 
        (registration.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (registration.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (registration.phone || '').includes(searchTerm) ||
        (registration.college || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (registration.group_id || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(registration => registration.status === statusFilter);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case 'oldest':
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'status':
          return (a.status || '').localeCompare(b.status || '');
        default:
          return 0;
      }
    });
    
    setFilteredRegistrations(filtered);
  }, [registrations, searchTerm, statusFilter, sortBy]);

  // Handle approve registration
  const handleApproveRegistration = async (registrationId: string) => {
    try {
      setProcessingId(registrationId);
      await AdminService.approveRegistration(registrationId);
      // Fetch registration details for email
      const reg = registrations.find(r => r.group_id === registrationId);
      if (reg) {
        // Fetch email template
        const { getEmailTemplate } = await import('@/lib/services/emailTemplateService');
        const { sendApprovalEmail } = await import('@/lib/services/emailService');
        const template = await getEmailTemplate('approval_tier');
        try {
          await sendApprovalEmail({ user: reg, template });
        } catch (emailError) {
          console.error('Error sending approval email:', emailError);
        }
      }
      // Update local state
      setRegistrations(prev => prev.map(reg => 
        reg.group_id === registrationId 
          ? { ...reg, status: 'approved', reviewed_at: new Date().toISOString() }
          : reg
      ));
      toast({
        title: "Success",
        description: "Registration approved and email sent!",
      });
    } catch (error) {
      console.error('Error approving registration:', error);
      toast({
        title: "Error",
        description: "Failed to approve registration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Handle reject registration
  const handleRejectRegistration = async (registrationId: string) => {
    try {
      setProcessingId(registrationId);
      await AdminService.rejectRegistration(registrationId, 'Rejected by admin');
      
      // Update local state
      setRegistrations(prev => prev.map(reg => 
        reg.group_id === registrationId 
          ? { ...reg, status: 'rejected', reviewed_at: new Date().toISOString() }
          : reg
      ));
      
      toast({
        title: "Success",
        description: "Registration rejected successfully!",
      });
    } catch (error) {
      console.error('Error rejecting registration:', error);
      toast({
        title: "Error",
        description: "Failed to reject registration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRegistrations();
    setRefreshing(false);
  };

  // Export CSV function using database view
  const handleExportCSV = async () => {
    try {
      await exportService.exportRegistrationsCSV();
      toast({
        title: "Export Successful",
        description: "Registration data has been exported to CSV.",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export registration data. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500 text-white"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500 text-white"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 text-white"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Get payment badge
  const getPaymentBadge = (amount: number) => {
    if (amount > 0) {
      return <Badge className="bg-green-500 text-white"><CreditCard className="w-3 h-3 mr-1" />Paid</Badge>;
    } else {
      return <Badge className="bg-red-500 text-white"><CreditCard className="w-3 h-3 mr-1" />Unpaid</Badge>;
    }
  };

  // Loading state
  if (loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-300">Loading registrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 relative overflow-hidden">
      {/* Comic book style background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 text-6xl font-black text-blue-400 transform -rotate-12 select-none">POW!</div>
        <div className="absolute top-40 right-20 text-4xl font-black text-yellow-400 transform rotate-12 select-none">BOOM!</div>
        <div className="absolute bottom-40 left-20 text-5xl font-black text-red-400 transform -rotate-6 select-none">ZAP!</div>
        <div className="absolute bottom-20 right-10 text-3xl font-black text-green-400 transform rotate-6 select-none">BANG!</div>
      </div>

      {/* Geometric shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-32 right-32 w-16 h-16 border-4 border-blue-400 transform rotate-45 opacity-20"></div>
        <div className="absolute bottom-32 left-32 w-12 h-12 border-4 border-yellow-400 transform rotate-12 opacity-20"></div>
        <div className="absolute top-1/2 left-10 w-8 h-8 bg-red-400 transform rotate-45 opacity-20"></div>
        <div className="absolute top-1/4 right-10 w-10 h-10 bg-green-400 transform rotate-12 opacity-20"></div>
      </div>

      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <div className="relative z-10 pt-24 pb-16">
        {/* Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => router.push('/admin/dashboard')}
                className=" bg-blue-600/20 border-blue-200/50 text-white hover:border-blue-300 hover:text-black"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-white">Registration Management</h1>
                <p className="text-gray-300">Unified view of all registrations</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing}
                className=" bg-blue-600/20 border-blue-200/50 text-white hover:border-blue-300 hover:text-black"
              >
                {refreshing ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" /> 
                )}
                Refresh
              </Button>
              <Button
                variant="outline"
                onClick={handleExportCSV}
                className=" bg-blue-600/20 border-blue-200/50 text-white hover:border-blue-300 hover:text-black"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <Card className="bg-blue-900/30 border-blue-400/30 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                  <p className="text-sm text-gray-300">Total</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-yellow-900/30 border-yellow-400/30 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <Clock className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{stats.pending}</p>
                  <p className="text-sm text-gray-300">Pending</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-green-900/30 border-green-400/30 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{stats.approved}</p>
                  <p className="text-sm text-gray-300">Approved</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-red-900/30 border-red-400/30 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <XCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{stats.rejected}</p>
                  <p className="text-sm text-gray-300">Rejected</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-green-900/30 border-green-400/30 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <DollarSign className="w-6 h-6 text-green-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">₹{stats.totalRevenue}</p>
                  <p className="text-sm text-gray-300">Total Revenue</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-purple-900/30 border-purple-400/30 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <GraduationCap className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{stats.approved > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}%</p>
                  <p className="text-sm text-gray-300">Approval Rate</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="bg-gray-900/50 border-gray-600/30 backdrop-blur-sm mb-8">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search registrations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-gray-800/50 border-gray-600 text-white">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger className="bg-gray-800/50 border-gray-600 text-white">
                    <SelectValue placeholder="Filter by payment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payments</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="bg-gray-800/50 border-gray-600 text-white">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="name">Name A-Z</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="payment">Payment Status</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setPaymentFilter('all');
                      setSortBy('newest');
                    }}
                    className="bg-gray-800/50 border-gray-600 text-white"
                  >
                    Clear Filters
                  </Button>
                  <div className="text-sm text-gray-400">
                    {filteredRegistrations.length} of {registrations.length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Registrations List */}
          <div className="space-y-6">
            {filteredRegistrations.length === 0 ? (
              <Card className="bg-gray-900/50 border-gray-600/30 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <Users className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">No registrations found</h3>
                  <p className="text-gray-500">
                    {searchTerm || statusFilter !== 'all' || paymentFilter !== 'all' 
                      ? 'Try adjusting your search or filters' 
                      : 'No registrations have been submitted yet'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredRegistrations.map((registration) => (
                <Card key={registration.group_id} className="bg-gray-900/50 border-gray-600/30 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Left Column - Basic Info */}
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-white">Group: {registration.group_id}</h3>
                            <p className="text-gray-300">{registration.name || 'Unknown'} (Leader)</p>
                            <p className="text-sm text-gray-400 mt-1">{registration.email || 'No email provided'}</p>
                          </div>
                          <div className="flex gap-2">
                            {getStatusBadge(registration.status || 'unknown')}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center gap-2 text-gray-300">
                            <Phone className="w-4 h-4" />
                            <span>{registration.phone || 'No phone provided'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <Users className="w-4 h-4" />
                            <span>{registration.member_count || 0} members</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <MapPin className="w-4 h-4" />
                            <span>{registration.college || 'No college provided'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <Calendar className="w-4 h-4" />
                            <span>{registration.created_at ? new Date(registration.created_at).toLocaleDateString() : 'Unknown date'}</span>
                          </div>
                        </div>

                        {/* Member Selections */}
                        <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-600/20">
                          <h4 className="text-sm font-medium text-gray-200 mb-3">Members & Selections</h4>
                          {registration.members && registration.members.length > 0 ? (
                            (() => {
                              const tierSelections = registration.members.filter((m: any) => 
                                m.tier && ['Collectors Print', 'Deluxe Edition', 'Issue #1'].includes(m.tier)
                              );
                              const passSelections = registration.members.filter((m: any) => 
                                m.pass_type && ['Nexus Arena', 'Nexus Spotlight', 'Nexus Forum'].includes(m.pass_type)
                              );
                              const tierAmount = tierSelections.reduce((sum: number, m: any) => sum + (m.amount || 0), 0);
                              const passAmount = passSelections.reduce((sum: number, m: any) => sum + (m.amount || 0), 0);
                              
                              return (
                                <div className="flex items-center justify-between">
                                  {/* Tiers */}
                                  <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                    <div>
                                      <span className="text-white text-sm font-medium">No. of Tiers: </span>
                                      <span className="text-blue-400 text-sm font-bold">{tierSelections.length}</span>
                                      {tierAmount > 0 && (
                                        <span className="text-green-400 text-sm font-medium ml-2">(₹{tierAmount})</span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Passes */}
                                  <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                                    <div>
                                      <span className="text-white text-sm font-medium">No. of Passes: </span>
                                      <span className="text-purple-400 text-sm font-bold">{passSelections.length}</span>
                                      {passAmount > 0 && (
                                        <span className="text-green-400 text-sm font-medium ml-2">(₹{passAmount})</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })()
                          ) : (
                            <div className="text-center py-2">
                              <span className="text-gray-400 text-sm">No member data available</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Right Column - Payment & Actions */}
                      <div className="lg:w-80 space-y-4">
                        {/* Payment Info */}
                        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600/30">
                          <h4 className="text-sm font-medium text-gray-200 mb-3 flex items-center gap-2">
                            <CreditCard className="w-4 h-4" />
                            Payment Details
                          </h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300 font-medium">Total Amount:</span>
                              <span className="text-green-400 font-medium text-lg">₹{registration.total_amount || 0}</span>
                            </div>
                            
                            <div className="pt-2 border-t border-gray-600/30">
                              {registration.payment_transaction_id ? (
                                <div className="space-y-2">
                                  <div className="flex justify-between items-start">
                                    <span className="text-gray-300 text-sm">Transaction ID:</span>
                                    <div className="flex items-center gap-1">
                                      <span className="text-white font-mono text-xs text-right max-w-[120px] break-all">
                                        {registration.payment_transaction_id}
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="p-1 h-6 w-6 text-gray-400 hover:text-white hover:bg-gray-700"
                                        onClick={() => copyToClipboard(registration.payment_transaction_id)}
                                      >
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                                  <span className="text-red-400 text-sm">No Payment Information</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="space-y-3">
                          {/* View Details Button */}
                          <Button
                            variant="outline"
                            className="border-purple-500/50 text-black hover:bg-purple-600/20 hover:border-purple-400 w-full hover:text-white"
                            onClick={() => handleViewDetails(registration)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                          
                          {/* View Payment Proof Button - Always show */}
                          <Button
                            variant="outline"
                            className="border-blue-500/50 text-black hover:bg-blue-600/20 hover:border-blue-400 w-full hover:text-white"
                            onClick={() => viewPaymentScreenshot(registration.payment_screenshot_path || null)}
                          >
                            <ImageIcon className="w-4 h-4 mr-2" />
                            {registration.payment_screenshot_path ? 'View Payment Proof' : 'No Payment Proof Available'}
                          </Button>
                          
                          {/* Approve/Reject Buttons - Only for pending registrations */}
                          {registration.status === 'pending' && (
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                variant="outline"
                                className="bg-green-600 border-green-500/50 text-white hover:bg-green-600/20 hover:border-green-400 hover:text-white"
                                onClick={() => handleApproveRegistration(registration.group_id)}
                                disabled={processingId === registration.group_id}
                              >
                                {processingId === registration.group_id ? (
                                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                )}
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                className="bg-red-600 border-red-500/50 text-white hover:bg-red-600/20 hover:border-red-400 hover:text-white"
                                onClick={() => handleRejectRegistration(registration.group_id)}
                                disabled={processingId === registration.group_id}
                              >
                                {processingId === registration.group_id ? (
                                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                  <XCircle className="w-4 h-4 mr-2" />
                                )}
                                Reject
                              </Button>
                            </div>
                          )}
                          
                          {/* Status info for non-pending registrations */}
                          {registration.status !== 'pending' && (
                            <div className="text-sm text-gray-400 bg-slate-800/30 rounded-lg p-3">
                              <p className="font-medium">Status: <span className={`${registration.status === 'approved' ? 'text-green-400' : 'text-red-400'}`}>
                                {registration.status ? registration.status.charAt(0).toUpperCase() + registration.status.slice(1) : 'Unknown'}
                              </span></p>
                              <p>Reviewed on:</p>
                              <p>{registration.reviewed_at ? new Date(registration.reviewed_at).toLocaleString() : 'N/A'}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Payment Screenshot Modal */}
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="max-w-4xl w-full bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Payment Screenshot</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center p-4">
            {selectedImage && !imageLoadError ? (
              <div className="relative max-w-full max-h-[70vh] overflow-auto">
                {imageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-800/80 rounded-lg">
                    <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                  </div>
                )}
                <Image
                  src={selectedImage}
                  alt="Payment Screenshot"
                  width={800}
                  height={600}
                  className="max-w-full h-auto rounded-lg shadow-lg"
                  style={{ objectFit: 'contain' }}
                  onError={() => {
                    setImageLoadError(true);
                    setImageLoading(false);
                  }}
                  onLoad={() => setImageLoading(false)}
                  priority
                />
              </div>
            ) : imageLoadError ? (
              <div className="flex items-center justify-center p-8 bg-red-900/20 rounded-lg border border-red-500/50">
                <div className="text-center">
                  <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                  <p className="text-red-400">Failed to load payment screenshot</p>
                  <p className="text-red-300 text-sm mt-2">The image may be corrupted or no longer available</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4 text-red-400 border-red-500/50 hover:bg-red-600/20"
                    onClick={() => selectedImage && window.open(selectedImage, '_blank')}
                  >
                    Try opening in new tab
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center p-8 bg-gray-800/50 rounded-lg">
                <div className="text-center">
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">No image selected</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Registration Details Dialog */}
      <Dialog open={showRegistrationDetails} onOpenChange={setShowRegistrationDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Registration Details</DialogTitle>
          </DialogHeader>
          
          {selectedRegistration && (
            <div className="space-y-6">
              {/* Registration Information */}
              <Card className="bg-slate-700/50 border-slate-600">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Registration Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Group ID:</span>
                      <p className="text-white font-semibold">{selectedRegistration.group_id}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Registration Date:</span>
                      <p className="text-white">{new Date(selectedRegistration.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Status:</span>
                      <p className={`font-semibold ${
                        selectedRegistration.status === 'approved' ? 'text-green-400' :
                        selectedRegistration.status === 'rejected' ? 'text-red-400' : 'text-yellow-400'
                      }`}>{selectedRegistration.status.charAt(0).toUpperCase() + selectedRegistration.status.slice(1)}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Member Count:</span>
                      <p className="text-white">{selectedRegistration.member_count}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Leader Information */}
              <Card className="bg-slate-700/50 border-slate-600">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Leader Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Leader Name:</span>
                      <p className="text-white font-semibold">{selectedRegistration.name}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Email:</span>
                      <p className="text-white">{selectedRegistration.email}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Phone:</span>
                      <p className="text-white">{selectedRegistration.phone}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">College:</span>
                      <p className="text-white">{selectedRegistration.college}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Group Members */}
              <Card className="bg-slate-700/50 border-slate-600">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Group Members ({selectedRegistration.member_count})</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingMembers ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-purple-400 mr-2" />
                      <span className="text-gray-400">Loading group members...</span>
                    </div>
                  ) : selectedRegistration.members && selectedRegistration.members.length > 0 ? (
                    <div className="space-y-3">
                      {selectedRegistration.members.map((member: any, index: number) => (
                        <div key={member.id || index} className="p-3 bg-slate-600/50 rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                            <div>
                              <span className="text-gray-400">Name:</span>
                              <p className="text-white font-semibold">{member.name}</p>
                            </div>
                            <div>
                              <span className="text-gray-400">User ID:</span>
                              <p className="text-white font-semibold">{member.user_id || member.delegate_user_id || member.pass_id || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-gray-400">Selection:</span>
                              <p className="text-cyan-400 font-semibold">
                                {member.tier || 
                                  (member.pass_type && member.pass_tier ? `${member.pass_type} ${member.pass_tier}` : member.pass_type) || 
                                  'N/A'
                                }
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-400">Amount:</span>
                              <p className="text-green-400 font-semibold">₹{member.amount || 0}</p>
                            </div>
                          </div>
                          <div className="mt-2 text-xs grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-gray-400">Email: </span>
                              <span className="text-blue-400">{member.email}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">College: </span>
                              <span className="text-purple-400">{member.college}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : groupMembers && groupMembers.length > 0 ? (
                    <div className="space-y-3">
                      {groupMembers.map((member: any, index: number) => (
                        <div key={member.id || index} className="p-3 bg-slate-600/50 rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                            <div>
                              <span className="text-gray-400">Name:</span>
                              <p className="text-white font-semibold">{member.name}</p>
                            </div>
                            <div>
                              <span className="text-gray-400">User ID:</span>
                              <p className="text-white font-semibold">{member.user_id || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-gray-400">Selection:</span>
                              <p className="text-cyan-400 font-semibold">
                                {member.selection_type === 'tier' 
                                  ? member.tier 
                                  : member.selection_type === 'pass' 
                                    ? `${member.pass_type}${member.pass_tier ? ` - ${member.pass_tier}` : ''}`
                                    : member.selection || member.pass_tier || member.tier || 'N/A'
                                }
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-400">Amount:</span>
                              <p className="text-green-400 font-semibold">₹{member.amount || selectedRegistration?.amount}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">No member details available</p>
                      <p className="text-xs text-gray-500 mt-2">Member data may not be available for this registration</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Information */}
              <Card className="bg-slate-700/50 border-slate-600">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Payment Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Transaction ID:</span>
                        <p className="text-white font-mono">{selectedRegistration.payment_transaction_id}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Amount:</span>
                        <p className="text-green-400 font-bold">₹{selectedRegistration.total_amount.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    {selectedRegistration.payment_screenshot_path && (
                      <div>
                        <span className="text-gray-400 block mb-2">Payment Screenshot:</span>
                        <Button
                          onClick={() => viewPaymentScreenshot(selectedRegistration.payment_screenshot_path!)}
                          variant="outline"
                          className="border-blue-500 text-black hover:bg-blue-500 hover:text-white"
                        >
                          <ImageIcon className="w-4 h-4 mr-2" />
                          View Payment Proof
                        </Button>
                      </div>
                    )}
                    
                    {selectedRegistration.status !== 'pending' && (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Reviewed By:</span>
                          <p className="text-white">{selectedRegistration.reviewed_by || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Reviewed At:</span>
                          <p className="text-white">
                            {selectedRegistration.reviewed_at 
                              ? new Date(selectedRegistration.reviewed_at).toLocaleString()
                              : 'N/A'
                            }
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {selectedRegistration.rejection_reason && (
                      <div>
                        <span className="text-gray-400 block mb-2">Rejection Reason:</span>
                        <p className="text-red-400 bg-red-900/20 p-3 rounded-lg border border-red-500/20">
                          {selectedRegistration.rejection_reason}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <Footer ctaText="WITH GREAT POWER COMES GREAT RESPONSIBILITY" />
    </div>
  );
}