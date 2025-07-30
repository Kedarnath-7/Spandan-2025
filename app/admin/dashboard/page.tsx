'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { AdminService } from '@/lib/services/adminService';
import type { EnhancedRegistrationView } from '@/lib/types';
import { 
  getEventRegistrations
} from '@/lib/services/eventRegistrationService';
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
  // Enhanced breakdown stats
  tierPassRegistrations: number;
  eventRegistrations: number;
  tierPassRevenue: number;
  eventRevenue: number;
}

interface UnifiedRegistration {
  id: string;
  groupId: string;
  contactName: string;
  contactEmail: string;
  memberCount: number;
  status: string;
  createdAt: string;
  totalAmount: number;
  type: 'tier_pass' | 'event';
  eventName?: string;
  college?: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalRegistrations: 0,
    totalRevenue: 0,
    pendingApprovals: 0,
    totalEvents: 0,
    tierPassRegistrations: 0,
    eventRegistrations: 0,
    tierPassRevenue: 0,
    eventRevenue: 0
  });
  const [recentRegistrations, setRecentRegistrations] = useState<UnifiedRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Check admin authentication using simple localStorage session
  useEffect(() => {
    const adminSession = localStorage.getItem('adminSession');
    if (!adminSession) {
      router.push('/admin');
      return;
    }

    const session = JSON.parse(adminSession);
    const currentTime = Date.now();
    const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours

    if (currentTime - session.loginTime > sessionDuration) {
      localStorage.removeItem('adminSession');
      toast.error('Session expired. Please login again.');
      router.push('/admin');
      return;
    }

    loadDashboardData();
  }, [router]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load tier/pass registrations
      const tierPassResult = await AdminService.getAllRegistrations();
      const tierPassData = tierPassResult.success ? tierPassResult.data || [] : [];
      
      // Load event registrations
      const eventRegResult = await getEventRegistrations();
      const eventData = eventRegResult.success ? eventRegResult.data || [] : [];

      // Calculate unified stats
      const tierPassStats = {
        total: tierPassData.length,
        pending: tierPassData.filter(r => r.status === 'pending').length,
        revenue: tierPassData.reduce((sum, r) => sum + (r.total_amount || 0), 0)
      };

      const eventStats = {
        total: eventData.length,
        pending: eventData.filter((r: any) => r.status === 'pending').length,
        revenue: eventData.reduce((sum: number, r: any) => sum + (r.total_amount || 0), 0)
      };

      setStats({
        totalRegistrations: tierPassStats.total + eventStats.total,
        totalRevenue: tierPassStats.revenue + eventStats.revenue,
        pendingApprovals: tierPassStats.pending + eventStats.pending,
        totalEvents: eventData.length,
        tierPassRegistrations: tierPassStats.total,
        eventRegistrations: eventStats.total,
        tierPassRevenue: tierPassStats.revenue,
        eventRevenue: eventStats.revenue
      });

      // Create unified recent registrations (last 5 from both systems)
      const tierPassRecent: UnifiedRegistration[] = tierPassData
        .slice(0, 3)
        .map((reg: EnhancedRegistrationView) => ({
          id: reg.group_id,
          groupId: reg.group_id,
          contactName: reg.name,
          contactEmail: reg.email,
          memberCount: reg.member_count,
          status: reg.status,
          createdAt: reg.created_at,
          totalAmount: reg.total_amount,
          type: 'tier_pass' as const,
          college: reg.college
        }));

      const eventRecent: UnifiedRegistration[] = eventData
        .slice(0, 3)
        .map((reg: any) => ({
          id: reg.group_id,
          groupId: reg.group_id,
          contactName: reg.contact_name,
          contactEmail: reg.contact_email,
          memberCount: reg.member_count,
          status: reg.status,
          createdAt: reg.created_at,
          totalAmount: reg.total_amount,
          type: 'event' as const,
          eventName: reg.event_name
        }));

      // Combine and sort by date, take latest 5
      const allRecent = [...tierPassRecent, ...eventRecent]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      setRecentRegistrations(allRecent);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminSession');
    toast.success('Logged out successfully');
    router.push('/admin');
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-32 pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-gray-300 mt-2">
                Manage Spandan 2025 registrations and events
              </p>
            </div>
            <Button 
              onClick={handleLogout}
              variant="outline" 
              className=" bg-blue-600/20 border-blue-200/50 text-white hover:border-blue-300 hover:text-black"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>

          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">
                  Total Registrations
                </CardTitle>
                <Users className="h-4 w-4 text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.totalRegistrations}</div>
                <div className="flex gap-4 mt-2 text-xs">
                  <span className="text-blue-400">Tier/Pass: {stats.tierPassRegistrations}</span>
                  <span className="text-orange-400">Events: {stats.eventRegistrations}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">
                  Total Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">₹{stats.totalRevenue.toLocaleString()}</div>
                <div className="flex gap-4 mt-2 text-xs">
                  <span className="text-blue-400">Tier/Pass: ₹{stats.tierPassRevenue.toLocaleString()}</span>
                  <span className="text-orange-400">Events: ₹{stats.eventRevenue.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">
                  Pending Approvals
                </CardTitle>
                <UserCheck className="h-4 w-4 text-yellow-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.pendingApprovals}</div>
                <p className="text-xs text-gray-400">
                  Awaiting review
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">
                  Event Registrations
                </CardTitle>
                <Calendar className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.eventRegistrations}</div>
                <p className="text-xs text-gray-400">
                  Event participants
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <Link href="/admin/registrations">
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-700/50 transition-all duration-300 cursor-pointer h-full">
                <CardHeader className="text-center">
                  <div className="mx-auto w-12 h-12 bg-purple-600/20 rounded-full flex items-center justify-center mb-3">
                    <Users className="w-6 h-6 text-purple-400" />
                  </div>
                  <CardTitle className="text-white text-lg">
                    Tier/Pass Registrations
                  </CardTitle>
                  <CardDescription className="text-gray-300 text-sm">
                    Review and approve tier/pass registrations
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/admin/event-registrations">
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-700/50 transition-all duration-300 cursor-pointer h-full">
                <CardHeader className="text-center">
                  <div className="mx-auto w-12 h-12 bg-orange-600/20 rounded-full flex items-center justify-center mb-3">
                    <Calendar className="w-6 h-6 text-orange-400" />
                  </div>
                  <CardTitle className="text-white text-lg">
                    Event Registrations
                  </CardTitle>
                  <CardDescription className="text-gray-300 text-sm">
                    Manage event participant registrations
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/admin/events">
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-700/50 transition-all duration-300 cursor-pointer h-full">
                <CardHeader className="text-center">
                  <div className="mx-auto w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center mb-3">
                    <Calendar className="w-6 h-6 text-blue-400" />
                  </div>
                  <CardTitle className="text-white text-lg">
                    Manage Events
                  </CardTitle>
                  <CardDescription className="text-gray-300 text-sm">
                    Create and edit event information
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/admin/export-data">
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-700/50 transition-all duration-300 cursor-pointer h-full">
                <CardHeader className="text-center">
                  <div className="mx-auto w-12 h-12 bg-green-600/20 rounded-full flex items-center justify-center mb-3">
                    <Download className="w-6 h-6 text-green-400" />
                  </div>
                  <CardTitle className="text-white text-lg">
                    Export Data
                  </CardTitle>
                  <CardDescription className="text-gray-300 text-sm">
                    Download registration reports
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
            {/* Email Management Card */}
            <Link href="/admin/email">
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-blue-700/50 transition-all duration-300 cursor-pointer h-full">
                <CardHeader className="text-center">
                  <div className="mx-auto w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center mb-3">
                    <Mail className="w-6 h-6 text-blue-400" />
                  </div>
                  <CardTitle className="text-white text-lg">
                    Email Management
                  </CardTitle>
                  <CardDescription className="text-gray-300 text-sm">
                    Manage & Send Emails
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>

          {/* Recent Registrations */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Recent Registrations</CardTitle>
                  <CardDescription className="text-gray-300">
                    Latest registrations from all systems
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Link href="/admin/registrations">
                    <Button variant="outline" size="sm" className="border-blue-600 text-blue-400 hover:bg-blue-600/20">
                      Tier/Pass
                    </Button>
                  </Link>
                  <Link href="/admin/event-registrations">
                    <Button variant="outline" size="sm" className="border-orange-600 text-orange-400 hover:bg-orange-600/20">
                      Events
                    </Button>
                  </Link>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {recentRegistrations.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No registrations found
                </div>
              ) : (
                <div className="space-y-4">
                  {recentRegistrations.map((registration) => (
                    <div 
                      key={registration.id}
                      className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600/30"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-full ${
                          registration.type === 'tier_pass' 
                            ? 'bg-blue-600/20 text-blue-400' 
                            : 'bg-orange-600/20 text-orange-400'
                        }`}>
                          {registration.type === 'tier_pass' ? (
                            <Star className="w-4 h-4" />
                          ) : (
                            <Calendar className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-white font-medium">{registration.contactName}</h4>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                registration.type === 'tier_pass' 
                                  ? 'border-blue-400 text-blue-400' 
                                  : 'border-orange-400 text-orange-400'
                              }`}
                            >
                              {registration.type === 'tier_pass' ? 'Tier/Pass' : 'Event'}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                            <span className="flex items-center">
                              <Mail className="w-3 h-3 mr-1" />
                              {registration.contactEmail}
                            </span>
                            <span className="flex items-center">
                              <Users className="w-3 h-3 mr-1" />
                              {registration.memberCount} members
                            </span>
                            {registration.eventName && (
                              <span className="flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                {registration.eventName}
                              </span>
                            )}
                            {registration.college && (
                              <span className="flex items-center">
                                <MapPin className="w-3 h-3 mr-1" />
                                {registration.college}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-white font-medium">₹{registration.totalAmount.toLocaleString()}</div>
                          <div className="text-xs text-gray-400">
                            {new Date(registration.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <Badge 
                          variant={getStatusBadgeVariant(registration.status)}
                          className="capitalize"
                        >
                          {registration.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer ctaText="WITH GREAT POWER COMES GREAT RESPONSIBILITY" />
    </div>
  );
}
