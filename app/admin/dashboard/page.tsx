'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { AdminService } from '@/lib/services/adminService'
import type { RegistrationView } from '@/lib/types'
import { 
  Users, 
  Calendar,
  DollarSign, 
  TrendingUp, 
  LogOut, 
  Download,
  UserCheck,
  UserX,
  Search,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  FileText,
  Star,
  MapPin,
  Mail,
  Phone
} from 'lucide-react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

interface DashboardStats {
  totalRegistrations: number
  totalRevenue: number
  pendingApprovals: number
  approvedRegistrations: number
  rejectedRegistrations: number
  totalGroups: number
  totalEvents: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalRegistrations: 0,
    totalRevenue: 0,
    pendingApprovals: 0,
    approvedRegistrations: 0,
    rejectedRegistrations: 0,
    totalGroups: 0,
    totalEvents: 4 // We have 4 sample events
  })
  const [recentRegistrations, setRecentRegistrations] = useState<RegistrationView[]>([])
  const [allRegistrations, setAllRegistrations] = useState<RegistrationView[]>([])
  const [loading, setLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [showAllRegistrations, setShowAllRegistrations] = useState(false)

  // Check admin authentication
  useEffect(() => {
    const adminSession = localStorage.getItem('adminSession')
    if (!adminSession) {
      router.push('/admin')
      return
    }

    const session = JSON.parse(adminSession)
    const currentTime = Date.now()
    const sessionDuration = 24 * 60 * 60 * 1000 // 24 hours

    if (currentTime - session.loginTime > sessionDuration) {
      localStorage.removeItem('adminSession')
      toast.error('Session expired. Please login again.')
      router.push('/admin')
      return
    }

    loadDashboardData()
  }, [router])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const [statsResult, registrationsResult] = await Promise.all([
        AdminService.getDashboardStats(),
        AdminService.getAllRegistrations()
      ])

      if (statsResult.success && statsResult.data) {
        setStats({
          ...statsResult.data,
          totalEvents: 4 // We have 4 sample events
        })
      }

      if (registrationsResult.success && registrationsResult.data) {
        setAllRegistrations(registrationsResult.data)
        // Show only the 5 most recent for the dashboard overview
        setRecentRegistrations(registrationsResult.data.slice(0, 5))
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleApproveRegistration = async (groupId: string) => {
    try {
      const result = await AdminService.approveRegistration(groupId)
      if (result.success) {
        toast.success('Registration approved successfully')
        loadDashboardData()
      } else {
        toast.error(result.error || 'Failed to approve registration')
      }
    } catch (error) {
      console.error('Error approving registration:', error)
      toast.error('Failed to approve registration')
    }
  }

  const handleRejectRegistration = async (groupId: string) => {
    try {
      const reason = prompt('Please provide a reason for rejection:')
      if (!reason) return
      
      const result = await AdminService.rejectRegistration(groupId, reason)
      if (result.success) {
        toast.success('Registration rejected')
        loadDashboardData()
      } else {
        toast.error(result.error || 'Failed to reject registration')
      }
    } catch (error) {
      console.error('Error rejecting registration:', error)
      toast.error('Failed to reject registration')
    }
  }

  const handleExportData = async () => {
    setIsLoading(true)
    try {
      const result = await AdminService.getAllRegistrations()
      if (result.success && result.data) {
        const csvContent = [
          ['Group Name', 'Leader Name', 'Email', 'Phone', 'Tier', 'Total Amount', 'Status', 'Created At', 'Members Count'].join(','),
          ...result.data.map(reg => [
            `"${reg.group_name}"`,
            `"${reg.leader_name}"`,
            `"${reg.leader_email}"`,
            `"${reg.leader_phone}"`,
            `"${reg.tier}"`,
            reg.total_amount,
            `"${reg.status}"`,
            `"${new Date(reg.created_at).toLocaleDateString()}"`,
            reg.members_count
          ].join(','))
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `registrations-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        
        toast.success('Data exported successfully')
      }
    } catch (error) {
      console.error('Error exporting data:', error)
      toast.error('Failed to export data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminSession')
    toast.success('Logged out successfully')
    router.push('/admin')
  }

  const filteredRegistrations = (showAllRegistrations ? allRegistrations : recentRegistrations).filter(reg => {
    const matchesSearch = reg.group_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reg.leader_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reg.leader_email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || reg.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default'
      case 'rejected': return 'destructive'
      case 'pending': return 'secondary'
      default: return 'secondary'
    }
  }

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'TIER_1': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'TIER_2': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'TIER_3': return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-400" />
            <p className="text-white">Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-full blur-3xl" />
      </div>

      <Navigation />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
                Admin Dashboard
              </h1>
              <p className="text-slate-400">Manage group registrations and monitor event statistics</p>
            </div>
            <div className="flex gap-4">
              <Button
                onClick={handleExportData}
                disabled={isLoading}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Export Data
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="border-red-500/50 text-red-400 hover:bg-red-500/20"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-6 mb-8">
          <Card className="bg-slate-800/80 border-slate-700/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Total Groups</CardTitle>
              <Users className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalGroups}</div>
              <p className="text-xs text-slate-500">Registered groups</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/80 border-slate-700/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Total Events</CardTitle>
              <Calendar className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalEvents}</div>
              <p className="text-xs text-slate-500">Available events</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/80 border-slate-700/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Total Registrations</CardTitle>
              <UserCheck className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalRegistrations}</div>
              <p className="text-xs text-slate-500">All registrations</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/80 border-slate-700/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">₹{stats.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-slate-500">Registration fees</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/80 border-slate-700/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Pending</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.pendingApprovals}</div>
              <p className="text-xs text-slate-500">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/80 border-slate-700/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.approvedRegistrations}</div>
              <p className="text-xs text-slate-500">Approved groups</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/80 border-slate-700/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.rejectedRegistrations}</div>
              <p className="text-xs text-slate-500">Rejected groups</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-slate-800/80 border-slate-700/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Filter className="h-5 w-5 text-purple-400" />
                Filter & Search
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by group name, leader, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="w-full p-2 rounded-md bg-slate-700/50 border border-slate-600 text-white"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/80 border-slate-700/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-400" />
                View Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => setShowAllRegistrations(!showAllRegistrations)}
                variant="outline"
                className="w-full border-blue-500/50 text-blue-400 hover:bg-blue-500/20"
              >
                {showAllRegistrations ? 'Show Recent Only' : 'Show All Registrations'}
              </Button>
              <Button
                onClick={loadDashboardData}
                variant="outline"
                className="w-full border-green-500/50 text-green-400 hover:bg-green-500/20"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Data
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/80 border-slate-700/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-yellow-400" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-400 text-sm">
                Total Filtered: {filteredRegistrations.length}
              </p>
              <p className="text-slate-400 text-sm">
                Showing: {showAllRegistrations ? 'All registrations' : 'Recent 5 only'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Registrations */}
        <Card className="bg-slate-800/80 border-slate-700/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-400" />
                {showAllRegistrations ? 'All Registrations' : 'Recent Registrations'}
              </span>
              <Badge variant="secondary" className="bg-purple-500/20 text-purple-400">
                {filteredRegistrations.length} found
              </Badge>
            </CardTitle>
            <CardDescription className="text-slate-400">
              {showAllRegistrations 
                ? 'Complete list of group registrations' 
                : 'Latest group registrations for quick review'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredRegistrations.length === 0 ? (
              <div className="text-center py-12">
                <UserX className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No registrations found matching your criteria</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRegistrations.map((registration) => (
                  <div
                    key={registration.group_id}
                    className="bg-slate-700/50 rounded-lg p-6 border border-slate-600/50 hover:border-purple-500/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">{registration.group_name}</h3>
                          <Badge className={getTierBadgeColor(registration.tier)}>
                            {registration.tier}
                          </Badge>
                          <Badge variant={getStatusBadgeVariant(registration.status)}>
                            {registration.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-slate-300">
                            <UserCheck className="h-4 w-4 text-purple-400" />
                            <span>{registration.leader_name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-300">
                            <Mail className="h-4 w-4 text-blue-400" />
                            <span>{registration.leader_email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-300">
                            <Phone className="h-4 w-4 text-green-400" />
                            <span>{registration.leader_phone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-300">
                            <Users className="h-4 w-4 text-yellow-400" />
                            <span>{registration.members_count} members</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white mb-1">
                          ₹{registration.total_amount.toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-400">
                          {new Date(registration.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    {registration.status === 'pending' && (
                      <div className="flex gap-2 pt-4 border-t border-slate-600/50">
                        <Button
                          onClick={() => handleApproveRegistration(registration.group_id)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleRejectRegistration(registration.group_id)}
                          size="sm"
                          variant="destructive"
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-slate-500 text-slate-300 hover:bg-slate-600"
                          onClick={() => {
                            alert(`Group: ${registration.group_name}\nLeader: ${registration.leader_name}\nEmail: ${registration.leader_email}\nPhone: ${registration.leader_phone}\nMembers: ${registration.members_count}\nTier: ${registration.tier}\nAmount: ₹${registration.total_amount}\nStatus: ${registration.status}\nRegistered: ${new Date(registration.created_at).toLocaleString()}`)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  )
}