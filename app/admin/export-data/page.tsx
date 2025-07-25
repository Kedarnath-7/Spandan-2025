'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Download,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  Database,
  BarChart3
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { exportService } from '@/lib/services/exportService';
import { supabase } from '@/lib/supabase';

interface QuickStats {
  totalTierPassRegistrations: number;
  totalEventRegistrations: number;
  totalRevenue: number;
  pendingApprovals: number;
  approvedRegistrations: number;
  rejectedRegistrations: number;
  totalEvents: number;
  todayRegistrations: number;
}

interface EventOption {
  event_name: string;
  registration_count: number;
}

export default function ExportDataPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [stats, setStats] = useState<QuickStats>({
    totalTierPassRegistrations: 0,
    totalEventRegistrations: 0,
    totalRevenue: 0,
    pendingApprovals: 0,
    approvedRegistrations: 0,
    rejectedRegistrations: 0,
    totalEvents: 0,
    todayRegistrations: 0
  });
  
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);

  // Load quick stats and event options
  useEffect(() => {
    loadDashboardData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadQuickStats(),
        loadEventOptions()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadQuickStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get tier/pass registrations stats
      const { data: tierPassData, error: tierPassError } = await supabase
        .from('registration_view')
        .select('status, total_amount, created_at');
      
      if (tierPassError) throw tierPassError;

      // Get event registrations stats
      const { data: eventData, error: eventError } = await supabase
        .from('event_registration_view')
        .select('status, total_amount, created_at');
      
      if (eventError) throw eventError;

      // Get unique events count
      const { data: eventsCount, error: eventsError } = await supabase
        .from('event_registration_view')
        .select('event_name')
        .eq('status', 'approved');
      
      if (eventsError) throw eventsError;

      const uniqueEvents = new Set(eventsCount?.map(item => item.event_name) || []);

      // Calculate stats
      const tierPassStats = tierPassData || [];
      const eventStats = eventData || [];
      const allRegistrations = [...tierPassStats, ...eventStats];

      const totalRevenue = allRegistrations
        .filter(item => item.status === 'approved')
        .reduce((sum, item) => sum + (item.total_amount || 0), 0);

      const todayRegistrations = allRegistrations
        .filter(item => item.created_at?.startsWith(today))
        .length;

      const newStats: QuickStats = {
        totalTierPassRegistrations: tierPassStats.length,
        totalEventRegistrations: eventStats.length,
        totalRevenue,
        pendingApprovals: allRegistrations.filter(item => item.status === 'pending').length,
        approvedRegistrations: allRegistrations.filter(item => item.status === 'approved').length,
        rejectedRegistrations: allRegistrations.filter(item => item.status === 'rejected').length,
        totalEvents: uniqueEvents.size,
        todayRegistrations
      };

      setStats(newStats);
    } catch (error) {
      console.error('Error loading quick stats:', error);
      throw error;
    }
  };

  const loadEventOptions = async () => {
    try {
      const { data, error } = await supabase
        .from('event_registration_view')
        .select('event_name')
        .order('event_name');
      
      if (error) throw error;

      // Group by event and count registrations
      const eventCounts = (data || []).reduce((acc: Record<string, number>, item) => {
        acc[item.event_name] = (acc[item.event_name] || 0) + 1;
        return acc;
      }, {});

      const eventOptions = Object.entries(eventCounts).map(([event_name, count]) => ({
        event_name,
        registration_count: count
      }));

      setEvents(eventOptions);
    } catch (error) {
      console.error('Error loading event options:', error);
      throw error;
    }
  };

  // Export functions
  const handleExportTierPass = async () => {
    setExporting('tier-pass');
    try {
      await exportService.exportRegistrationsCSV();
      toast({
        title: "Export Successful",
        description: "Tier/Pass registrations data has been downloaded",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export tier/pass registrations data",
        variant: "destructive",
      });
    } finally {
      setExporting(null);
    }
  };

  const handleExportAllEvents = async () => {
    setExporting('all-events');
    try {
      await exportService.exportEventRegistrationsCSV();
      toast({
        title: "Export Successful",
        description: "All event registrations data has been downloaded",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export event registrations data",
        variant: "destructive",
      });
    } finally {
      setExporting(null);
    }
  };

  const handleExportEventSpecific = async () => {
    if (!selectedEvent) {
      toast({
        title: "Event Required",
        description: "Please select an event to export its data",
        variant: "destructive",
      });
      return;
    }

    setExporting('event-specific');
    try {
      await exportService.exportEventSpecificCSV(selectedEvent);
      toast({
        title: "Export Successful",
        description: `${selectedEvent} registrations data has been downloaded`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: `Failed to export ${selectedEvent} registrations data`,
        variant: "destructive",
      });
    } finally {
      setExporting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0F1A] text-white relative overflow-hidden">
        <Navigation />
        <div className="relative z-10 pt-32 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-cyan-400 mx-auto mb-4" />
                <p className="text-gray-300">Loading export data...</p>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F1A] text-white relative overflow-hidden">
      <Navigation />
      
      <div className="relative z-10 pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <Button
                onClick={() => router.push('/admin/dashboard')}
                variant="outline"
                className="border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
            
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
                Export Data Center
              </h1>
              <p className="text-gray-300 text-lg">
                Download registration data and analytics reports
              </p>
            </div>
          </div>

          {/* Quick Stats Dashboard */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-cyan-400" />
              Quick Stats Overview
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-blue-900/30 border-blue-400/30 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="text-center">
                    <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{stats.totalTierPassRegistrations}</p>
                    <p className="text-sm text-gray-300">Tier/Pass Registrations</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-purple-900/30 border-purple-400/30 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="text-center">
                    <Calendar className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{stats.totalEventRegistrations}</p>
                    <p className="text-sm text-gray-300">Event Registrations</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-green-900/30 border-green-400/30 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="text-center">
                    <DollarSign className="w-6 h-6 text-green-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">₹{stats.totalRevenue.toLocaleString()}</p>
                    <p className="text-sm text-gray-300">Total Revenue</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-orange-900/30 border-orange-400/30 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="text-center">
                    <TrendingUp className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{stats.todayRegistrations}</p>
                    <p className="text-sm text-gray-300">Today&#39;s Registrations</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-yellow-900/30 border-yellow-400/30 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="text-center">
                    <Clock className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{stats.pendingApprovals}</p>
                    <p className="text-sm text-gray-300">Pending Approvals</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-green-900/30 border-green-400/30 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="text-center">
                    <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{stats.approvedRegistrations}</p>
                    <p className="text-sm text-gray-300">Approved</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-red-900/30 border-red-400/30 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="text-center">
                    <XCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{stats.rejectedRegistrations}</p>
                    <p className="text-sm text-gray-300">Rejected</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-cyan-900/30 border-cyan-400/30 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="text-center">
                    <Calendar className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{stats.totalEvents}</p>
                    <p className="text-sm text-gray-300">Active Events</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Export Options */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
              <Database className="w-6 h-6 text-purple-400" />
              Export Options
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Tier/Pass Registrations Export */}
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-400" />
                    Tier/Pass Registrations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-gray-300">
                    <p>Download all tier and pass registration data from registration_view</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="outline" className="text-blue-400 border-blue-400">
                        {stats.totalTierPassRegistrations} Records
                      </Badge>
                    </div>
                  </div>
                  <Button
                    onClick={handleExportTierPass}
                    disabled={exporting === 'tier-pass'}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {exporting === 'tier-pass' ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* All Event Registrations Export */}
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-400" />
                    All Event Registrations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-gray-300">
                    <p>Download all event registration data from event_registration_view</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="outline" className="text-purple-400 border-purple-400">
                        {stats.totalEventRegistrations} Records
                      </Badge>
                    </div>
                  </div>
                  <Button
                    onClick={handleExportAllEvents}
                    disabled={exporting === 'all-events'}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {exporting === 'all-events' ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Event-Specific Export */}
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-400" />
                    Event-Specific Data
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-gray-300">
                    <p>Download registration data for a specific event</p>
                  </div>
                  
                  <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Select an event..." />
                    </SelectTrigger>
                    <SelectContent>
                      {events.map((event) => (
                        <SelectItem key={event.event_name} value={event.event_name}>
                          {event.event_name} ({event.registration_count} registrations)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button
                    onClick={handleExportEventSpecific}
                    disabled={exporting === 'event-specific' || !selectedEvent}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {exporting === 'event-specific' ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Export Instructions */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                Export Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-300">
                <div>
                  <h4 className="font-semibold text-white mb-2">Tier/Pass Registrations</h4>
                  <ul className="space-y-1">
                    <li>• Includes tier selections and pass purchases</li>
                    <li>• Contains user details and payment info</li>
                    <li>• Shows approval status and review details</li>
                    <li>• Includes delegate information</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Event Registrations</h4>
                  <ul className="space-y-1">
                    <li>• Contains all event participation data</li>
                    <li>• Includes team/group information</li>
                    <li>• Shows event categories and pricing</li>
                    <li>• Contains payment and approval status</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Export Details</h4>
                  <ul className="space-y-1">
                    <li>• Files are in CSV format</li>
                    <li>• Date-stamped filenames</li>
                    <li>• All data includes timestamps</li>
                    <li>• Compatible with Excel/Google Sheets</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}
