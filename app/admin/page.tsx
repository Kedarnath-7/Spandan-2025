'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Shield, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import Navigation from '@/components/Navigation'
import { AdminService } from '@/lib/services/adminService'

export default function AdminLoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email.trim() || !formData.password.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    setIsLoading(true)
    
    try {
      const result = await AdminService.authenticateAdmin(formData.email, formData.password)
      
      if (result.success) {
        toast.success('Admin login successful!')
        // Store admin session in localStorage for simplicity
        localStorage.setItem('adminSession', JSON.stringify({
          email: formData.email,
          loginTime: Date.now()
        }))
        router.push('/admin/dashboard')
      } else {
        toast.error(result.error || 'Invalid admin credentials')
      }
    } catch (error) {
      console.error('Admin login error:', error)
      toast.error('Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0F1A] text-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute top-20 left-10 text-6xl font-bold text-white transform -rotate-12">ADMIN</div>
        <div className="absolute top-40 right-20 text-4xl font-bold text-white transform rotate-12">ACCESS</div>
        <div className="absolute bottom-40 left-20 w-16 h-16 border-4 border-white transform rotate-45"></div>
        <div className="absolute bottom-20 right-10 w-12 h-12 border-4 border-white transform rotate-12"></div>
      </div>

      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <main className="relative z-10 pt-32 pb-16">
        <div className="max-w-md mx-auto px-4">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-full mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Admin Portal
            </h1>
            <p className="text-gray-300">
              SPANDAN 2025 Administration
            </p>
          </div>

          {/* Login Form */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-center">Admin Login</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-gray-300">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Enter admin email"
                    disabled={isLoading}
                  />
                </div>
                
                <div>
                  <Label htmlFor="password" className="text-gray-300">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleInputChange}
                      className="bg-slate-700 border-slate-600 text-white pr-10"
                      placeholder="Enter admin password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Login to Admin Portal
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-400 text-sm">
                  Authorized personnel only
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}