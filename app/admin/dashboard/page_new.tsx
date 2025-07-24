'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { AdminService } from '@/lib/services/adminService';
import type { RegistrationView } from '@/lib/types';
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
  groupId: string;
  contactName: string;
  contactEmail: string;
  memberCount: number;
  status: string;
  createdAt: string;
  totalAmount: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalRegistrations: 0,
    totalRevenue: 0,
    pendingApprovals: 0,
    totalEvents: 0
  });
  const [recentRegistrations, setRecentRegistrations] = useState<Registration[]>([]);
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
      // Load dashboard statistics
      const statsResult = await AdminService.getDashboardStats();
      if (statsResult.success && statsResult.data) {
        setStats({
          totalRegistrations: statsResult.data.totalRegistrations,
          totalRevenue: statsResult.data.totalRevenue,
          pendingApprovals: statsResult.data.pendingApprovals,
          totalEvents: 0 // Will be updated when events management is connected
        });
      }

      // Load recent registrations (limit to 5 for dashboard)
      const registrationsResult = await AdminService.getAllRegistrations();
      if (registrationsResult.success && registrationsResult.data) {
        const formattedRegistrations: Registration[] = registrationsResult.data
          .slice(0, 5)
          .map((reg: RegistrationView) => ({
            id: reg.group_id, // Using group_id as id
            groupId: reg.group_id,
            contactName: reg.leader_name,
            contactEmail: reg.leader_email,
            memberCount: reg.members_count,
            status: reg.status,
            createdAt: reg.created_at,
            totalAmount: reg.total_amount
          }));
        
        setRecentRegistrations(formattedRegistrations);
      }
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
              className="border-slate-600 text-gray-300 hover:bg-slate-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">
                  Total Registrations
                </CardTitle>
                <Users className="h-4 w-4 text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.totalRegistrations}</div>
                <p className="text-xs text-gray-400">
                  Active participants
                </p>
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
                <p className="text-xs text-gray-400">
                  Registration fees collected
                </p>
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
                  Total Events
                </CardTitle>
                <Calendar className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.totalEvents}</div>
                <p className="text-xs text-gray-400">
                  Available events
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Link href="/admin/registrations">
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-700/50 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Users className="w-5 h-5 mr-2 text-purple-400" />
                    Manage Registrations
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Review and approve participant registrations
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/admin/events">
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-700/50 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-blue-400" />
                    Manage Events
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Create and edit event information
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-700/50 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Download className="w-5 h-5 mr-2 text-green-400" />
                  Export Data
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Download registration reports
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Recent Registrations */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Recent Registrations</CardTitle>
                  <CardDescription className="text-gray-300">
                    Latest participant registrations
                  </CardDescription>
                </div>
                <Link href="/admin/registrations">
                  <Button variant="outline" className="border-slate-600 text-gray-300 hover:bg-slate-700">
                    View All
                  </Button>
                </Link>
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
                      className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="bg-purple-600 p-2 rounded-full">
                          <Users className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h4 className="text-white font-medium">{registration.contactName}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span className="flex items-center">
                              <Mail className="w-3 h-3 mr-1" />
                              {registration.contactEmail}
                            </span>
                            <span className="flex items-center">
                              <Users className="w-3 h-3 mr-1" />
                              {registration.memberCount} members
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-white font-medium">₹{registration.totalAmount}</div>
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
      
      <Footer ctaText="ADMIN PANEL - SPANDAN 2025" />
    </div>
  );
}
