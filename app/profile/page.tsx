'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/contexts/AuthContext';
import { updatePasswordSafely } from '@/lib/auth/auth-utils';
import { getUserProfile, upsertUserProfile, type UserProfile } from '@/lib/services/userProfile';
import { UnifiedRegistrationService, type UnifiedRegistration } from '@/lib/services/unifiedRegistrationAdmin';
import type { User as UserType } from '@/lib/types';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Calendar, 
  CreditCard, 
  Settings, 
  Lock, 
  LogOut,
  Eye,
  EyeOff,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    college: '',
  });
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Real registration data state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [unifiedRegistration, setUnifiedRegistration] = useState<UnifiedRegistration | null>(null);
  const [registrationDataLoading, setRegistrationDataLoading] = useState(true);

  // Load real user profile and registration data
  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.id || !user?.email) return;

      try {
        setRegistrationDataLoading(true);
        
        // Get user profile from users table
        const profile = await getUserProfile(user.id);
        setUserProfile(profile);

        // Get unified registration data using email
        const registration = await UnifiedRegistrationService.getUserUnifiedRegistration(user.email);
        setUnifiedRegistration(registration);

        // Update profile form with user data from users table (primary source)
        if (profile) {
          setProfileData({
            name: profile.name || '',
            email: profile.email || user.email,
            phone: profile.phone || '',
            college: profile.college || '',
          });
        } else if (registration) {
          // Fallback to registration data if no profile exists
          setProfileData({
            name: registration.user_name || '',
            email: registration.user_email || user.email,
            phone: registration.user_phone || '',
            college: registration.user_college || '',
          });
        } else {
          // If neither exists, set default email from auth
          setProfileData(prev => ({
            ...prev,
            email: user.email || ''
          }));
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        // Only show error toast for critical errors, not for missing data
        if (error instanceof Error && !error.message.includes('not found')) {
          toast({
            title: "Loading Error", 
            description: "User data could not be loaded.",
            variant: "destructive",
          });
        }
      } finally {
        setRegistrationDataLoading(false);
      }
    };

    if (user?.id && user?.email) {
      loadUserData();
    }
  }, [user?.id, user?.email, toast]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    // Populate profile data when user is loaded
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email,
        phone: '', // Will be fetched from database later
        college: '', // Will be fetched from database later
      });
    }
  }, [user, loading, router]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);

    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Validate required fields
      if (!profileData.name.trim()) {
        throw new Error('Full name is required');
      }

      if (!profileData.phone.trim()) {
        throw new Error('Phone number is required');
      }

      if (!profileData.college.trim()) {
        throw new Error('College/Institution is required');
      }

      // Update user profile in database
      const updatedProfile = await upsertUserProfile({
        id: user.id,
        email: user.email!,
        name: profileData.name.trim(),
        phone: profileData.phone.trim(),
        college: profileData.college.trim(),
      });

      if (updatedProfile) {
        setUserProfile(updatedProfile);
        toast({
          title: "Profile Updated",
          description: "Your profile has been updated successfully.",
        });
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate current password is provided
    if (!passwordData.currentPassword.trim()) {
      toast({
        title: "Current Password Required",
        description: "Please enter your current password to verify your identity.",
        variant: "destructive",
      });
      return;
    }

    // Validate new password
    if (!passwordData.newPassword.trim()) {
      toast({
        title: "New Password Required",
        description: "Please enter a new password.",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    // Validate password confirmation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    // Check if new password is different from current (client-side check)
    if (passwordData.currentPassword === passwordData.newPassword) {
      toast({
        title: "Same Password",
        description: "New password must be different from your current password.",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);

    try {
      // Use the safer password update function
      await updatePasswordSafely(passwordData.newPassword);

      toast({
        title: "Password Changed Successfully",
        description: "Your password has been updated. You'll need to log in with your new password next time.",
      });

      // Clear form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      console.error('Password change error:', error);
      
      let errorMessage = "Failed to change password. Please try again.";
      
      // Handle specific error cases
      if (error.message?.includes('New password must be different')) {
        errorMessage = "New password must be different from your current password.";
      } else if (error.message?.includes('Password must be at least 6 characters')) {
        errorMessage = "Password must be at least 6 characters long.";
      } else if (error.message?.includes('session has expired') || error.message?.includes('log in again')) {
        errorMessage = "Your session has expired. Please log in again to change your password.";
      } else if (error.message?.includes('Authentication failed')) {
        errorMessage = "Authentication failed. Please log out and log in again to change your password.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Password Change Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
      toast({
        title: "Signed Out",
        description: "You have been signed out successfully.",
      });
    } catch (error) {
      toast({
        title: "Sign Out Failed",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'rejected':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0F1A] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-[#0A0F1A] text-white relative overflow-hidden">
      {/* Comic book style background elements */}
      <div className="absolute inset-0 opacity-[0.08]">
        <div className="absolute top-20 left-10 text-6xl font-black text-blue-400 transform -rotate-12 select-none">PROFILE!</div>
        <div className="absolute top-40 right-20 text-4xl font-black text-yellow-400 transform rotate-12 select-none">MANAGE!</div>
        <div className="absolute bottom-40 left-20 text-5xl font-black text-red-400 transform -rotate-6 select-none">UPDATE!</div>
        <div className="absolute bottom-20 right-10 text-3xl font-black text-green-400 transform rotate-6 select-none">SECURE!</div>
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
      <main className="relative z-10 pt-32 pb-16">
        <div className="max-w-6xl mx-auto px-4">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">Profile Dashboard</h1>
              <p className="text-gray-300">Welcome back, {user.name || user.email.split('@')[0]}!</p>
            </div>
            
            <div className="flex items-center space-x-3">
              {user.isAdmin && (
                <Link href="/admin/dashboard">
                  <Button variant="outline" className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10">
                    Admin Dashboard
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Profile Content */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-slate-800/50 border border-slate-700">
              <TabsTrigger value="overview" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                Overview
              </TabsTrigger>
              <TabsTrigger value="registrations" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                Registrations
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Profile Summary */}
                <Card className="bg-slate-900/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-white">
                      <User className="w-5 h-5 text-cyan-400" />
                      <span>Profile Info</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300 text-sm">{user.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-green-400 text-sm">Email Verified</span>
                    </div>
                    {user.isAdmin && (
                      <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                        Admin Access
                      </Badge>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card className="bg-slate-900/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-white">
                      <Calendar className="w-5 h-5 text-cyan-400" />
                      <span>Quick Stats</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-300 text-sm">SPANDAN Registration</span>
                      <span className="text-white font-medium">{unifiedRegistration ? '1' : '0'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300 text-sm">Status</span>
                      <span className={`font-medium ${
                        unifiedRegistration?.status === 'approved' ? 'text-green-400' : 
                        unifiedRegistration?.status === 'pending' ? 'text-yellow-400' : 
                        unifiedRegistration?.status === 'rejected' ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        {unifiedRegistration?.status ? unifiedRegistration.status.charAt(0).toUpperCase() + unifiedRegistration.status.slice(1) : 'Not Registered'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300 text-sm">Events Registered</span>
                      <span className="text-cyan-400 font-medium">
                        {unifiedRegistration?.selected_events?.length || 0}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="bg-slate-900/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-white">
                      <Settings className="w-5 h-5 text-cyan-400" />
                      <span>Quick Actions</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Link href="/events">
                      <Button variant="outline" className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
                        Browse Events
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
                        Register for Pass
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Registrations Tab */}
            <TabsContent value="registrations" className="space-y-6">
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Registration History</CardTitle>
                  <CardDescription className="text-gray-300">
                    Track your delegate passes and event registrations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {registrationDataLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                      <span className="ml-2 text-gray-400">Loading registration data...</span>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Unified Registration */}
                      {unifiedRegistration ? (
                        <div>
                          <h4 className="text-lg font-semibold text-white mb-4">My SPANDAN 2025 Registration</h4>
                          <div className="space-y-6">
                            {/* Registration Overview */}
                            <div className="p-6 bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-500/20 rounded-lg">
                              <div className="flex items-center justify-between mb-4">
                                <div>
                                  <h5 className="text-xl font-semibold text-white">
                                    {unifiedRegistration.registration_tier} Pass
                                  </h5>
                                  <p className="text-gray-300">
                                    Registered on {new Date(unifiedRegistration.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <Badge className={`text-sm ${getStatusColor(unifiedRegistration.status)}`}>
                                    {unifiedRegistration.status}
                                  </Badge>
                                  <p className="text-lg font-semibold text-white mt-1">
                                    ₹{unifiedRegistration.total_amount}
                                  </p>
                                </div>
                              </div>
                              
                              {/* Status Information */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div className="flex items-center space-x-3">
                                  <div className="flex-shrink-0">
                                    {getStatusIcon(unifiedRegistration.status)}
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-300">Registration Status</p>
                                    <p className="text-white font-medium capitalize">{unifiedRegistration.status}</p>
                                  </div>
                                </div>
                                
                                {unifiedRegistration.delegate_id && (
                                  <div className="flex items-center space-x-3">
                                    <div className="flex-shrink-0">
                                      <User className="w-5 h-5 text-cyan-400" />
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-300">Delegate ID</p>
                                      <p className="text-white font-medium">{unifiedRegistration.delegate_id}</p>
                                    </div>
                                  </div>
                                )}
                                
                                {unifiedRegistration.payment_transaction_id && (
                                  <div className="flex items-center space-x-3">
                                    <div className="flex-shrink-0">
                                      <CreditCard className="w-5 h-5 text-green-400" />
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-300">Transaction ID</p>
                                      <p className="text-white font-medium">{unifiedRegistration.payment_transaction_id}</p>
                                    </div>
                                  </div>
                                )}
                                
                                <div className="flex items-center space-x-3">
                                  <div className="flex-shrink-0">
                                    <Calendar className="w-5 h-5 text-purple-400" />
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-300">Events Registered</p>
                                    <p className="text-white font-medium">
                                      {unifiedRegistration.selected_events?.length || 0} Events
                                    </p>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Review Information */}
                              {unifiedRegistration.reviewed_at && (
                                <div className="mt-4 pt-4 border-t border-gray-600">
                                  <p className="text-sm text-gray-400">
                                    Reviewed on {new Date(unifiedRegistration.reviewed_at).toLocaleString()}
                                  </p>
                                  {unifiedRegistration.rejection_reason && (
                                    <div className="mt-2 p-3 bg-red-900/20 border border-red-500/30 rounded">
                                      <p className="text-sm text-red-300">
                                        <strong>Rejection Reason:</strong> {unifiedRegistration.rejection_reason}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            {/* Selected Events */}
                            {unifiedRegistration.selected_events && unifiedRegistration.selected_events.length > 0 && (
                              <div className="p-4 bg-slate-800/30 border border-slate-700 rounded-lg">
                                <h6 className="text-lg font-medium text-white mb-3">Selected Events</h6>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {unifiedRegistration.selected_events.map((event) => (
                                    <div key={event.id} className="p-3 bg-slate-700/50 rounded border border-slate-600">
                                      <p className="text-white font-medium">{event.name}</p>
                                      <p className="text-sm text-gray-400">{event.category}</p>
                                      {event.price > 0 && (
                                        <p className="text-sm text-cyan-400">₹{event.price}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-3">
                              {unifiedRegistration.status === 'approved' && (
                                <Button 
                                  variant="outline" 
                                  className="border-green-600 text-green-400 hover:bg-green-600/20"
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Download Pass
                                </Button>
                              )}
                              
                              {unifiedRegistration.payment_amount > 0 && (
                                <Button 
                                  variant="outline" 
                                  className="border-blue-600 text-blue-400 hover:bg-blue-600/20"
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Payment Receipt
                                </Button>
                              )}
                              
                              {unifiedRegistration.status === 'pending' && (
                                <Button 
                                  variant="outline" 
                                  className="border-yellow-600 text-yellow-400 hover:bg-yellow-600/20"
                                  disabled
                                >
                                  <Clock className="w-4 h-4 mr-2" />
                                  Awaiting Approval
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* No registration state */
                        <div className="text-center py-12">
                          <Calendar className="mx-auto h-16 w-16 text-gray-400 mb-6" />
                          <h3 className="text-xl font-medium text-white mb-3">No Registration Found</h3>
                          <div className="text-gray-400 mb-6 max-w-md mx-auto">
                            <p>You haven&apos;t registered for SPANDAN 2025 yet.</p>
                            <p className="text-sm mt-2">
                              Register now to secure your delegate pass and participate in amazing events!
                            </p>
                          </div>
                          <Link href="/register">
                            <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 px-8 py-3">
                              Register for SPANDAN 2025
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Profile Settings */}
                <Card className="bg-slate-900/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Profile Information</CardTitle>
                    <CardDescription className="text-gray-300">
                      Update your personal information
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-gray-300">
                          Full Name <span className="text-red-400">*</span>
                        </Label>
                        <Input
                          id="name"
                          value={profileData.name}
                          onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                          className="bg-slate-800/50 border-slate-600 text-white"
                          placeholder="Enter your full name"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-gray-300">Email</Label>
                        <Input
                          id="email"
                          value={profileData.email}
                          disabled
                          className="bg-slate-800/30 border-slate-600 text-gray-400"
                        />
                        <p className="text-xs text-gray-500">Email cannot be changed</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-gray-300">
                          Phone Number <span className="text-red-400">*</span>
                        </Label>
                        <Input
                          id="phone"
                          value={profileData.phone}
                          onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                          className="bg-slate-800/50 border-slate-600 text-white"
                          placeholder="Enter your phone number"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="college" className="text-gray-300">
                          College/Institution <span className="text-red-400">*</span>
                        </Label>
                        <Input
                          id="college"
                          value={profileData.college}
                          onChange={(e) => setProfileData(prev => ({ ...prev, college: e.target.value }))}
                          className="bg-slate-800/50 border-slate-600 text-white"
                          placeholder="Enter your college or institution"
                          required
                        />
                      </div>
                      
                      <Button
                        type="submit"
                        disabled={isUpdatingProfile}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                      >
                        {isUpdatingProfile ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                            Updating...
                          </>
                        ) : (
                          'Update Profile'
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Password Settings */}
                <Card className="bg-slate-900/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Change Password</CardTitle>
                    <CardDescription className="text-gray-300">
                      Update your account password
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword" className="text-gray-300">Current Password</Label>
                        <div className="relative">
                          <Input
                            id="currentPassword"
                            type={showPasswords.current ? 'text' : 'password'}
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                            className="bg-slate-800/50 border-slate-600 text-white pr-10"
                            placeholder="Enter current password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                          >
                            {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="newPassword" className="text-gray-300">New Password</Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            type={showPasswords.new ? 'text' : 'password'}
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                            className="bg-slate-800/50 border-slate-600 text-white pr-10"
                            placeholder="Enter new password (min. 6 characters)"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                          >
                            {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-gray-300">Confirm New Password</Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showPasswords.confirm ? 'text' : 'password'}
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            className="bg-slate-800/50 border-slate-600 text-white pr-10"
                            placeholder="Confirm new password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                          >
                            {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      
                      <Button
                        type="submit"
                        disabled={isChangingPassword}
                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                      >
                        {isChangingPassword ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                            Changing...
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4 mr-2" />
                            Change Password
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer ctaText="MANAGE YOUR SPANDAN JOURNEY!" />
    </div>
  );
}
