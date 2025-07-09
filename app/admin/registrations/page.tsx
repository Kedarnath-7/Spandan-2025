'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/lib/contexts/AuthContext';
import { isAdminEmailSync } from '@/lib/config/admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
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
  AlertTriangle
} from 'lucide-react';
import { UnifiedRegistrationService, type UnifiedRegistration } from '@/lib/services/unifiedRegistrationAdmin';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function AdminRegistrationsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  
  const [registrations, setRegistrations] = useState<UnifiedRegistration[]>([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState<UnifiedRegistration[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    paid: 0,
    unpaid: 0
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
      
      // Try the primary bucket first
      const { data } = supabase.storage
        .from('payment-screenshots')
        .getPublicUrl(cleanFilename);
      
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
      
      // List files in payment-screenshots bucket
      const { data: files, error } = await supabase.storage
        .from('payment-screenshots')
        .list('', { limit: 10 });
        
      if (error) {
        console.error('Storage bucket error:', error);
        toast({
          title: "Storage Access Error",
          description: `Cannot access storage bucket: ${error.message}`,
          variant: "destructive"
        });
        return;
      }
      
      console.log('Files in payment-screenshots bucket:', files);
      
      if (files && files.length > 0) {
        toast({
          title: "Storage Access Test",
          description: `Found ${files.length} files in storage bucket`,
        });
      } else {
        toast({
          title: "Storage Access Test",
          description: "Storage bucket is accessible but empty",
        });
      }
    } catch (error) {
      console.error('Storage test failed:', error);
      toast({
        title: "Storage Test Failed",
        description: "Could not access storage bucket",
        variant: "destructive"
      });
    }
  };

  // Function to view payment screenshot
  const viewPaymentScreenshot = async (filename: string | null) => {
    if (!filename) {
      toast({
        title: "Error",
        description: "No payment screenshot available",
        variant: "destructive"
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
        variant: "destructive"
      });
    }
  };

  // Check admin access
  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (!isAdminEmailSync(user.email)) {
      router.push('/');
      return;
    }
  }, [user, loading, router]);

  // Load registrations
  const loadRegistrations = async () => {
    try {
      setLoadingData(true);
      const data = await UnifiedRegistrationService.getAllUnifiedRegistrations();
      setRegistrations(data);
      
      // Debug: Log payment screenshot data (remove in production)
      console.log('Payment screenshot data loaded successfully:', data.length, 'registrations');
      
      // Update stats
      const newStats = {
        total: data.length,
        pending: data.filter((r: UnifiedRegistration) => r.status === 'pending').length,
        approved: data.filter((r: UnifiedRegistration) => r.status === 'approved').length,
        rejected: data.filter((r: UnifiedRegistration) => r.status === 'rejected').length,
        paid: data.filter((r: UnifiedRegistration) => r.payment_amount > 0).length,
        unpaid: data.filter((r: UnifiedRegistration) => r.payment_amount === 0).length
      };
      setStats(newStats);
    } catch (error) {
      console.error('Error loading registrations:', error);
      toast({
        title: "Error",
        description: "Failed to load registrations. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingData(false);
    }
  };

  const loadRegistrationsCallback = React.useCallback(loadRegistrations, [toast]);

  useEffect(() => {
    if (user && isAdminEmailSync(user.email)) {
      loadRegistrationsCallback();
    }
  }, [user, loadRegistrationsCallback]);

  // Filter and sort registrations
  useEffect(() => {
    let filtered = [...registrations];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(registration => 
        registration.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        registration.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        registration.user_phone.includes(searchTerm) ||
        registration.user_college.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(registration => registration.status === statusFilter);
    }
    
    // Apply payment filter
    if (paymentFilter !== 'all') {
      if (paymentFilter === 'paid') {
        filtered = filtered.filter(registration => registration.payment_amount > 0);
      } else {
        filtered = filtered.filter(registration => registration.payment_amount === 0);
      }
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'name':
          return a.user_name.localeCompare(b.user_name);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'payment':
          return (a.payment_amount > 0 ? 'paid' : 'unpaid').localeCompare(b.payment_amount > 0 ? 'paid' : 'unpaid');
        default:
          return 0;
      }
    });
    
    setFilteredRegistrations(filtered);
  }, [registrations, searchTerm, statusFilter, paymentFilter, sortBy]);

  // Handle approve registration
  const handleApproveRegistration = async (registrationId: string) => {
    try {
      setProcessingId(registrationId);
      await UnifiedRegistrationService.approveUnifiedRegistration(registrationId, user!.email);
      
      // Update local state
      setRegistrations(prev => prev.map(reg => 
        reg.id === registrationId 
          ? { ...reg, status: 'approved', reviewed_at: new Date().toISOString() }
          : reg
      ));
      
      toast({
        title: "Success",
        description: "Registration approved successfully!",
        variant: "default"
      });
    } catch (error) {
      console.error('Error approving registration:', error);
      toast({
        title: "Error",
        description: "Failed to approve registration. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Handle reject registration
  const handleRejectRegistration = async (registrationId: string) => {
    try {
      setProcessingId(registrationId);
      await UnifiedRegistrationService.rejectUnifiedRegistration(registrationId, user!.email, 'Rejected by admin');
      
      // Update local state
      setRegistrations(prev => prev.map(reg => 
        reg.id === registrationId 
          ? { ...reg, status: 'rejected', reviewed_at: new Date().toISOString() }
          : reg
      ));
      
      toast({
        title: "Success",
        description: "Registration rejected successfully!",
        variant: "default"
      });
    } catch (error) {
      console.error('Error rejecting registration:', error);
      toast({
        title: "Error",
        description: "Failed to reject registration. Please try again.",
        variant: "destructive"
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

  // Export CSV function
  const handleExportCSV = () => {
    const csvData = filteredRegistrations.map(reg => ({
      'Full Name': reg.user_name,
      'Email': reg.user_email,
      'Phone': reg.user_phone,
      'College': reg.user_college,
      'Year': reg.user_year,
      'Status': reg.status,
      'Payment Status': reg.payment_amount > 0 ? 'paid' : 'unpaid',
      'Amount': reg.payment_amount,
      'Events': reg.selected_events ? reg.selected_events.map(e => e.name).join(', ') : '',
      'Created At': new Date(reg.created_at).toLocaleDateString(),
      'Reviewed At': reg.reviewed_at ? new Date(reg.reviewed_at).toLocaleDateString() : ''
    }));
    
    const csv = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registrations_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-300">Loading registrations...</p>
        </div>
      </div>
    );
  }

  // Not authorized
  if (!user || !isAdminEmailSync(user.email)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <Card className="bg-gray-900/50 border-gray-600/30 backdrop-blur-sm max-w-md">
          <CardHeader>
            <CardTitle className="text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300">You don&apos;t have permission to access this page.</p>
          </CardContent>
        </Card>
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
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
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
                  <p className="text-2xl font-bold text-white">{stats.paid}</p>
                  <p className="text-sm text-gray-300">Paid</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-red-900/30 border-red-400/30 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <CreditCard className="w-6 h-6 text-red-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{stats.unpaid}</p>
                  <p className="text-sm text-gray-300">Unpaid</p>
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
                <Card key={registration.id} className="bg-gray-900/50 border-gray-600/30 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Left Column - Basic Info */}
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-white">{registration.user_name}</h3>
                            <p className="text-gray-300">{registration.user_email}</p>
                          </div>
                          <div className="flex gap-2">
                            {getStatusBadge(registration.status)}
                            {getPaymentBadge(registration.payment_amount)}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center gap-2 text-gray-300">
                            <Phone className="w-4 h-4" />
                            <span>{registration.user_phone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <GraduationCap className="w-4 h-4" />
                            <span>{registration.user_year}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <MapPin className="w-4 h-4" />
                            <span>{registration.user_college}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(registration.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        {/* Events */}
                        {registration.selected_events && registration.selected_events.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-200 mb-2">Events Registered:</h4>
                            <div className="flex flex-wrap gap-2">
                              {registration.selected_events.map((event, index) => (
                                <Badge key={index} variant="outline" className="border-blue-400 text-blue-300">
                                  {event.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Right Column - Payment & Actions */}
                      <div className="lg:w-80 space-y-4">
                        {/* Payment Info */}
                        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600/30">
                          <h4 className="text-sm font-medium text-gray-200 mb-2">Payment Details</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-300">Amount:</span>
                              <span className="text-white font-medium">₹{registration.payment_amount}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-300">Status:</span>
                              {getPaymentBadge(registration.payment_amount)}
                            </div>
                            {registration.payment_transaction_id && (
                              <div className="flex justify-between">
                                <span className="text-gray-300">Transaction ID:</span>
                                <span className="text-white font-mono text-sm">{registration.payment_transaction_id}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Payment Screenshot */}
                          {registration.payment_screenshot && (
                            <div className="mt-3 pt-3 border-t border-gray-600">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-300 text-sm">Payment Proof:</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => viewPaymentScreenshot(registration.payment_screenshot)}
                                  className="text-gray-300 hover:text-black bg-gray-800/50 px-4 py-2 h-auto rounded-full text-sm"
                                >
                                  <ImageIcon className="w-4 h-4 mr-1" />
                                  View
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Actions */}
                        {registration.status === 'pending' && (
                          <div className="space-y-2">
                            <Button
                              variant="outline"
                              className="border-green-500/50 text-green-400 hover:bg-green-600/20 hover:border-green-400 w-full"
                              onClick={() => handleApproveRegistration(registration.id)}
                              disabled={processingId === registration.id}
                            >
                              {processingId === registration.id ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              ) : (
                                <CheckCircle className="w-4 h-4 mr-2" />
                              )}
                              Approve Registration
                            </Button>
                            <Button
                              variant="outline"
                              className="border-red-500/50 text-red-400 hover:bg-red-600/20 hover:border-red-400 w-full"
                              onClick={() => handleRejectRegistration(registration.id)}
                              disabled={processingId === registration.id}
                            >
                              {processingId === registration.id ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              ) : (
                                <XCircle className="w-4 h-4 mr-2" />
                              )}
                              Reject Registration
                            </Button>
                          </div>
                        )}
                        
                        {registration.status !== 'pending' && (
                          <div className="text-sm text-gray-400">
                            <p>Reviewed on:</p>
                            <p>{registration.reviewed_at ? new Date(registration.reviewed_at).toLocaleString() : 'N/A'}</p>
                          </div>
                        )}
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

      {/* Footer */}
      <Footer />
    </div>
  );
}