'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MapPin, Phone, AlertCircle, GraduationCap, BookOpen } from 'lucide-react';
import { upsertUserProfile, type UserProfile } from '@/lib/services/userProfile';
import { useToast } from '@/hooks/use-toast';

interface ProfileCompletionProps {
  userId: string;
  email: string;
  name: string;
  onComplete: (profile: UserProfile) => void;
}

export default function ProfileCompletion({ userId, email, name, onComplete }: ProfileCompletionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: name || '',
    college: '',
    phone: '',
    year: '',
    branch: ''
  });
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.college.trim() || !formData.phone.trim() || !formData.year.trim() || !formData.branch.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields to continue with registration.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const profile = await upsertUserProfile({
        id: userId,
        email,
        name: formData.name.trim(),
        college: formData.college.trim(),
        phone: formData.phone.trim(),
        year: formData.year.trim(),
        branch: formData.branch.trim()
      });

      if (profile) {
        toast({
          title: "Profile Updated",
          description: "Your profile has been completed successfully!"
        });
        onComplete(profile);
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Card className="bg-slate-800/40 backdrop-blur-sm border-2 border-yellow-400/50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-yellow-400" />
          </div>
          <CardTitle className="text-xl font-bold text-white">Complete Your Profile</CardTitle>
          <p className="text-gray-300 text-sm">
            Please complete your profile information to proceed with event registration.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex items-center mb-2">
                <Users className="w-4 h-4 text-gray-400 mr-2" />
                <Label htmlFor="name" className="text-gray-300 font-medium">Full Name *</Label>
              </div>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Enter your full name"
                className="bg-slate-700/60 border-slate-600 text-white placeholder-gray-500 focus:border-yellow-400 focus:ring-yellow-400"
              />
            </div>

            <div>
              <div className="flex items-center mb-2">
                <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                <Label htmlFor="college" className="text-gray-300 font-medium">College/Institution *</Label>
              </div>
              <Input
                id="college"
                name="college"
                value={formData.college}
                onChange={handleInputChange}
                required
                placeholder="Enter your college name"
                className="bg-slate-700/60 border-slate-600 text-white placeholder-gray-500 focus:border-yellow-400 focus:ring-yellow-400"
              />
            </div>

            <div>
              <div className="flex items-center mb-2">
                <Phone className="w-4 h-4 text-gray-400 mr-2" />
                <Label htmlFor="phone" className="text-gray-300 font-medium">Phone Number *</Label>
              </div>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                required
                placeholder="Enter your phone number"
                className="bg-slate-700/60 border-slate-600 text-white placeholder-gray-500 focus:border-yellow-400 focus:ring-yellow-400"
              />
            </div>

            <div>
              <div className="flex items-center mb-2">
                <GraduationCap className="w-4 h-4 text-gray-400 mr-2" />
                <Label htmlFor="year" className="text-gray-300 font-medium">Year of Study *</Label>
              </div>
              <Select 
                name="year" 
                value={formData.year} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, year: value }))}
                required
              >
                <SelectTrigger className="bg-slate-700/60 border-slate-600 text-white focus:border-yellow-400 focus:ring-yellow-400">
                  <SelectValue placeholder="Select your year of study" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="1st Year">1st Year</SelectItem>
                  <SelectItem value="2nd Year">2nd Year</SelectItem>
                  <SelectItem value="3rd Year">3rd Year</SelectItem>
                  <SelectItem value="4th Year">4th Year</SelectItem>
                  <SelectItem value="5th Year">5th Year</SelectItem>
                  <SelectItem value="6th Year">6th Year</SelectItem>
                  <SelectItem value="Postgraduate">Postgraduate</SelectItem>
                  <SelectItem value="PhD">PhD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center mb-2">
                <BookOpen className="w-4 h-4 text-gray-400 mr-2" />
                <Label htmlFor="branch" className="text-gray-300 font-medium">Branch/Department *</Label>
              </div>
              <Input
                id="branch"
                name="branch"
                value={formData.branch}
                onChange={handleInputChange}
                required
                placeholder="e.g., Computer Science, Medicine, etc."
                className="bg-slate-700/60 border-slate-600 text-white placeholder-gray-500 focus:border-yellow-400 focus:ring-yellow-400"
              />
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold mt-6"
            >
              {isSubmitting ? 'Saving...' : 'Complete Profile & Continue'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
