'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { isAdminEmailSync } from '@/lib/config/admin';
import { useAuth } from '@/lib/contexts/AuthContext';
import { UnifiedRegistrationService } from '@/lib/services/unifiedRegistrationAdmin';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  LogOut, 
  Download,
  UserCheck,
  FileText,
  Star,
  MapPin,
  Mail,
  Phone
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

interface DashboardStats {
  totalRegistrations: number;
  totalRevenue: number;
  pendingApprovals: number;
  totalEvents: number;
}

interface Registration {
  id: string;
  user_name: string;
  user_email: string;
  registration_tier: string;
  status: string;
  created_at: string;
  total_amount: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, session, loading } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    totalRegistrations: 0,
    totalRevenue: 0,
    pendingApprovals: 0,
    totalEvents: 0
  });
  const [recentRegistrations, setRecentRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication and admin privileges
  useEffect(() => {
    if (!loading) {
      if (!session || !user) {
        toast({
          title: 'Authentication Required',
          description: 'Please login to access admin panel',
          variant: 'destructive'
        });
        router.push('/login');
        return;
      }

      // Check if user is admin
      if (!user.isAdmin) {
        toast({
          title: 'Access Denied',
          description: 'You do not have admin privileges',
          variant: 'destructive'
        });
        router.push('/profile');
        return;
      }
    }
  }, [loading, session, user, toast, router]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Load real stats from database
        const stats = await UnifiedRegistrationService.getRegistrationStats();
        
        // Get total events count
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('id', { count: 'exact' });
        
        if (eventsError) {
          console.error('Error fetching events count:', eventsError);
        }
        
        setStats({
          totalRegistrations: stats.total,
          totalRevenue: stats.approvedRevenue, // Show only approved revenue
          pendingApprovals: stats.pending,
          totalEvents: eventsData?.length || 0
        });

        // Load recent registrations from database
        const registrations = await UnifiedRegistrationService.getAllUnifiedRegistrations();
        
        // Get the 5 most recent registrations
        const recentRegs = registrations.slice(0, 5).map(reg => ({
          id: reg.id,
          user_name: reg.user_name,
          user_email: reg.user_email,
          registration_tier: reg.registration_tier,
          status: reg.status,
          created_at: reg.created_at,
          total_amount: reg.total_amount
        }));
        
        setRecentRegistrations(recentRegs);

      } catch (error) {
        console.error('Error loading dashboard data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [toast]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: 'Success',
        description: 'Logged out successfully'
      });
      // Use window.location for reliable navigation after logout
      window.location.href = '/admin';
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: 'Error',
        description: 'Failed to log out',
        variant: 'destructive'
      });
    }
  };

  const handleExportData = async () => {
    try {
      const registrations = await UnifiedRegistrationService.getAllUnifiedRegistrations();
      
      // Prepare CSV data
      const csvData = registrations.map(reg => ({
        'Registration ID': reg.id,
        'User Name': reg.user_name,
        'Email': reg.user_email,
        'Phone': reg.user_phone,
        'College': reg.user_college,
        'Year': reg.user_year,
        'Branch': reg.user_branch,
        'Registration Tier': reg.registration_tier,
        'Status': reg.status,
        'Total Amount': reg.total_amount,
        'Created At': new Date(reg.created_at).toLocaleDateString(),
        'Events Count': reg.selected_events?.length || 0
      }));
      
      // Convert to CSV
      const csvContent = [
        Object.keys(csvData[0]).join(','),
        ...csvData.map(row => Object.values(row).join(','))
      ].join('\n');
      
      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `spandan_registrations_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Success',
        description: 'Registration data exported successfully'
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: 'Error',
        description: 'Failed to export data',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500 text-white">Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 text-white">Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500 text-white">Rejected</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">Unknown</Badge>;
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'Hero':
        return <Badge className="bg-blue-500 text-white">Hero</Badge>;
      case 'Hero Plus':
        return <Badge className="bg-purple-500 text-white">Hero Plus</Badge>;
      case 'Super Hero':
        return <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">Super Hero</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">{tier}</Badge>;
    }
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0F1A] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated or not admin (will redirect)
  if (!session || !user || !user.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0A0F1A] text-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute top-20 left-10 text-6xl font-bold text-white transform -rotate-12">ADMIN</div>
        <div className="absolute top-40 right-20 text-4xl font-bold text-white transform rotate-12">DASH</div>
        <div className="absolute bottom-40 left-20 w-16 h-16 border-4 border-white transform rotate-45"></div>
        <div className="absolute bottom-20 right-10 w-12 h-12 border-4 border-white transform rotate-12"></div>
      </div>

      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <main className="relative z-10 pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-gray-300 mt-2">SPANDAN 2025 Management Portal</p>
            </div>
            <div className="flex space-x-4">
              <Button 
                variant="outline" 
                className=" bg-blue-600/20 border-blue-200/50 text-white hover:border-blue-300 hover:text-black"
                onClick={handleExportData}
                disabled={isLoading}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-slate-800/80 border-2 border-slate-600">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Total Registrations</CardTitle>
                <Users className="h-4 w-4 text-cyan-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {isLoading ? '...' : stats.totalRegistrations}
                </div>
                <p className="text-xs text-gray-400">All time registrations</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/80 border-2 border-slate-600">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {isLoading ? '...' : `₹${stats.totalRevenue.toLocaleString()}`}
                </div>
                <p className="text-xs text-gray-400">From approved registrations</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/80 border-2 border-slate-600">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Pending Approvals</CardTitle>
                <UserCheck className="h-4 w-4 text-yellow-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {isLoading ? '...' : stats.pendingApprovals}
                </div>
                <p className="text-xs text-gray-400">
                  {stats.pendingApprovals > 0 ? 'Requires attention' : 'All caught up!'}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/80 border-2 border-slate-600">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Total Events</CardTitle>
                <Calendar className="h-4 w-4 text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {isLoading ? '...' : stats.totalEvents}
                </div>
                <p className="text-xs text-gray-400">Across all categories</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Registrations */}
          <Card className="bg-slate-800/80 border-2 border-slate-600">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-cyan-400">Recent Registrations</CardTitle>
              <CardDescription className="text-gray-400">
                Latest participant registrations and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-gray-400">Loading registrations...</div>
              ) : recentRegistrations.length > 0 ? (
                <div className="space-y-4">
                  {recentRegistrations.map((registration) => (
                    <div 
                      key={registration.id} 
                      className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-white">{registration.user_name}</div>
                          <div className="text-sm text-gray-400">{registration.user_email}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        {getTierBadge(registration.registration_tier)}
                        {getStatusBadge(registration.status)}
                        <div className="text-right">
                          <div className="font-medium text-white">₹{registration.total_amount}</div>
                          <div className="text-xs text-gray-400">
                            {new Date(registration.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-slate-600">
                    <Link href="/admin/registrations">
                      <Button variant="outline" className="w-full bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600">
                        View All Registrations →
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <div className="text-gray-400 mb-2">No registrations yet</div>
                  <div className="text-sm text-gray-500">Registrations will appear here once users start signing up</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Card className="bg-slate-800/80 border-2 border-slate-600 hover:border-cyan-500 transition-colors cursor-pointer">
              <CardHeader>
                <Link href="/admin/registrations">
                  <CardTitle className="text-lg font-bold text-cyan-400 flex items-center hover:text-cyan-300 transition-colors">
                    <FileText className="w-5 h-5 mr-2" />
                    Manage Registrations
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    View, approve, or reject participant registrations
                  </CardDescription>
                </Link>
              </CardHeader>
            </Card>

            <Card className="bg-slate-800/80 border-2 border-slate-600 hover:border-purple-500 transition-colors cursor-pointer">
              <CardHeader>
                <Link href="/admin/events">
                  <CardTitle className="text-lg font-bold text-purple-400 flex items-center hover:text-purple-300 transition-colors">
                    <Calendar className="w-5 h-5 mr-2" />
                    Event Management
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Create, edit, and manage SPANDAN 2025 events
                  </CardDescription>
                </Link>
              </CardHeader>
            </Card>

            <Card className="bg-slate-800/80 border-2 border-slate-600 hover:border-green-500 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-green-400 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Analytics
                </CardTitle>
                <CardDescription className="text-gray-400">
                  View detailed reports and registration analytics
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

        </div>
      </main>

      <Footer ctaText="MANAGING SPANDAN 2025 WITH SUPERHERO EFFICIENCY!" />
    </div>
  );
}