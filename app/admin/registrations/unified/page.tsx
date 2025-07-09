'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { isAdminEmailSync } from '@/lib/config/admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  AlertTriangle
} from 'lucide-react';
import { UnifiedRegistrationService, type UnifiedRegistration } from '@/lib/services/unifiedRegistrationAdmin';

export default function UnifiedRegistrationsPage() {
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
    totalRevenue: 0,
    approvedRevenue: 0
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [tierFilter, setTierFilter] = useState<'all' | 'tier1' | 'tier2' | 'tier3'>('all');

  // Check admin access
  useEffect(() => {
    if (!loading && (!user || !isAdminEmailSync(user.email))) {
      router.push('/admin');
      return;
    }
  }, [user, loading, router]);

  // Load registration data
  useEffect(() => {
    const loadData = async () => {
      if (!user || !isAdminEmailSync(user.email)) return;

      try {
        setLoadingData(true);
        
        console.log('Loading unified registrations for admin:', user.email);
        
        const [registrationsData, statsData] = await Promise.all([
          UnifiedRegistrationService.getAllUnifiedRegistrations(),
          UnifiedRegistrationService.getRegistrationStats()
        ]);
        
        console.log('Loaded registrations:', registrationsData);
        console.log('Loaded stats:', statsData);
        
        setRegistrations(registrationsData);
        setStats(statsData);
      } catch (error) {
        console.error('Error loading unified registrations:', error);
        toast({
          title: "Loading Error",
          description: `Failed to load registrations: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
      } finally {
        setLoadingData(false);
      }
    };

    if (user && isAdminEmailSync(user.email)) {
      loadData();
    }
  }, [user, toast]);

  // Filter registrations
  useEffect(() => {
    let filtered = registrations;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(reg => 
        reg.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.user_phone?.includes(searchTerm) ||
        reg.user_college?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.delegate_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(reg => reg.status === statusFilter);
    }

    // Apply tier filter
    if (tierFilter !== 'all') {
      filtered = filtered.filter(reg => reg.registration_tier.toLowerCase().includes(tierFilter));
    }

    setFilteredRegistrations(filtered);
  }, [registrations, searchTerm, statusFilter, tierFilter]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rejected':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
  };

  const handleApproveRegistration = async (registrationId: string) => {
    if (!user) return;

    setProcessingId(registrationId);
    try {
      await UnifiedRegistrationService.approveUnifiedRegistration(registrationId, user.id);
      
      // Update local state
      setRegistrations(prev => prev.map(reg => 
        reg.id === registrationId 
          ? { ...reg, status: 'approved' as const, reviewed_by: user.id, reviewed_at: new Date().toISOString() }
          : reg
      ));
      
      toast({
        title: "Registration Approved",
        description: "The complete registration has been approved successfully.",
        className: "bg-green-500/20 border-green-500/30",
      });
    } catch (error) {
      console.error('Error approving registration:', error);
      toast({
        title: "Approval Failed",
        description: "Failed to approve registration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectRegistration = async (registrationId: string) => {
    if (!user) return;

    setProcessingId(registrationId);
    try {
      await UnifiedRegistrationService.rejectUnifiedRegistration(registrationId, user.id, 'Rejected by admin');
      
      // Update local state
      setRegistrations(prev => prev.map(reg => 
        reg.id === registrationId 
          ? { ...reg, status: 'rejected' as const, reviewed_by: user.id, reviewed_at: new Date().toISOString() }
          : reg
      ));
      
      toast({
        title: "Registration Rejected",
        description: "The registration has been rejected.",
        className: "bg-red-500/20 border-red-500/30",
      });
    } catch (error) {
      console.error('Error rejecting registration:', error);
      toast({
        title: "Rejection Failed",
        description: "Failed to reject registration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const exportData = () => {
    const csvData = filteredRegistrations.map(reg => ({
      'User Name': reg.user_name,
      'Email': reg.user_email,
      'Phone': reg.user_phone,
      'College': reg.user_college,
      'Year': reg.user_year,
      'Branch': reg.user_branch,
      'Tier': reg.registration_tier,
      'Total Amount': reg.total_amount,
      'Status': reg.status,
      'Registration Date': new Date(reg.created_at).toLocaleDateString(),
      'Selected Events': reg.selected_events?.map(e => e.name).join(', ') || 'None'
    }));

    const csv = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spandan-registrations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-400" />
          <p className="text-white">Loading registrations...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdminEmailSync(user.email)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <Card className="bg-slate-900/50 border-slate-700 max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-400 mb-4" />
              <h2 className="text-lg font-semibold text-white mb-2">Access Denied</h2>
              <p className="text-gray-400 mb-4">You don&apos;t have permission to access this page.</p>
              <Button onClick={() => router.push('/admin')}>Go Back</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.push('/admin')}
              className="border-slate-600 text-gray-300 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Registration Management</h1>
              <p className="text-gray-400">Unified view of all registrations</p>
            </div>
          </div>
          <Button
            onClick={exportData}
            variant="outline"
            className="border-green-600 text-green-400 hover:bg-green-600 hover:text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card className="bg-slate-900/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                  <p className="text-sm text-gray-400">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-yellow-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{stats.pending}</p>
                  <p className="text-sm text-gray-400">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{stats.approved}</p>
                  <p className="text-sm text-gray-400">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <XCircle className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{stats.rejected}</p>
                  <p className="text-sm text-gray-400">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-2xl font-bold text-white">₹{stats.totalRevenue}</p>
                  <p className="text-sm text-gray-400">Total Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-2xl font-bold text-white">₹{stats.approvedRevenue}</p>
                  <p className="text-sm text-gray-400">Approved Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-slate-900/50 border-slate-700 mb-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by name, email, or tier..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-800/50 border-slate-600 text-white"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Status Filter</label>
                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Tier Filter</label>
                <Select value={tierFilter} onValueChange={(value: any) => setTierFilter(value)}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tiers</SelectItem>
                    <SelectItem value="tier1">Tier 1</SelectItem>
                    <SelectItem value="tier2">Tier 2</SelectItem>
                    <SelectItem value="tier3">Tier 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setTierFilter('all');
                  }}
                  className="border-slate-600 text-gray-300 hover:text-white"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Registrations List */}
        <div className="space-y-4">
          {filteredRegistrations.length === 0 ? (
            <Card className="bg-slate-900/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No Registrations Found</h3>
                  <p className="text-gray-400">No registrations match your current filters.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredRegistrations.map((registration) => (
              <Card key={registration.id} className="bg-slate-900/50 border-slate-700">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* User Information */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white">
                          {registration.user_name || 'Unknown User'}
                        </h3>
                        <Badge className={`${getStatusColor(registration.status)} flex items-center space-x-1`}>
                          {getStatusIcon(registration.status)}
                          <span className="capitalize">{registration.status}</span>
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2 text-gray-300">
                          <Mail className="w-4 h-4" />
                          <span>{registration.user_email}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-300">
                          <Phone className="w-4 h-4" />
                          <span>{registration.user_phone}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-300">
                          <GraduationCap className="w-4 h-4" />
                          <span>{registration.user_college}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-300">
                          <MapPin className="w-4 h-4" />
                          <span>{registration.user_year} Year, {registration.user_branch}</span>
                        </div>
                      </div>
                      
                      <div className="pt-2 border-t border-slate-700">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Registered:</span>
                          <span className="text-sm text-gray-300">
                            {new Date(registration.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Registration Details */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-white mb-2">Registration Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Tier:</span>
                            <Badge variant="outline" className="border-blue-500/30 text-blue-400">
                              {registration.registration_tier}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Delegate ID:</span>
                            <span className="text-gray-300">{registration.delegate_id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Total Amount:</span>
                            <span className="text-green-400 font-medium">₹{registration.total_amount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Payment TXN:</span>
                            <span className="text-gray-300">{registration.payment_transaction_id}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Selected Events */}
                      <div>
                        <h4 className="font-medium text-white mb-2">Selected Events</h4>
                        <div className="space-y-1">
                          {registration.selected_events && registration.selected_events.length > 0 ? (
                            registration.selected_events.map((event, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span className="text-gray-300">{event.name}</span>
                                <span className="text-gray-400">₹{event.price}</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-gray-400 text-sm">No events selected</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        {registration.payment_screenshot && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-slate-600 text-gray-300 hover:text-white"
                            onClick={() => window.open(registration.payment_screenshot, '_blank')}
                          >
                            <ImageIcon className="w-4 h-4 mr-1" />
                            View Payment
                          </Button>
                        )}
                      </div>
                      
                      {registration.status === 'pending' && (
                        <div className="flex flex-col space-y-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 w-full"
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
                            size="sm"
                            variant="outline"
                            className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white w-full"
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
  );
}
