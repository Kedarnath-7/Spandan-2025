/**
 * Unified Registration Service (Pure Unified System)
 * Handles complete registration workflow using only the unified tables
 */

import { supabase } from '@/lib/supabase'
import type { UnifiedRegistration } from '@/lib/types'

export interface CompleteRegistrationData {
  // Personal Information
  name: string
  email: string
  phone: string
  college: string
  year: string
  branch: string
  
  // Registration Tier
  tier: 'tier1' | 'tier2' | 'tier3'
  
  // Selected Events
  selectedEvents: {
    cultural: string[]
    sports: string[]
    fineArts: string[]
    literary: string[]
  }
  
  // Payment Information
  transactionId: string
  screenshot: File
}

export interface RegistrationResult {
  success: boolean
  registration: UnifiedRegistration | null
  message: string
}

// Tier mapping for database consistency
const TIER_MAPPING = {
  'tier1': 'Tier 1',
  'tier2': 'Tier 2',
  'tier3': 'Tier 3'
} as const

// Tier pricing
const TIER_PRICING = {
  'tier1': 375,
  'tier2': 650,
  'tier3': 950
} as const

class UnifiedRegistrationService {
  /**
   * Upload payment screenshot to Supabase Storage
   */
  private async uploadPaymentScreenshot(
    file: File,
    userEmail: string
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userEmail}_${Date.now()}.${fileExt}`
      const filePath = `payment-screenshots/${fileName}`

      const { data, error } = await supabase.storage
        .from('registrations')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Upload error:', error)
        return { success: false, error: error.message }
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('registrations')
        .getPublicUrl(filePath)

      return { success: true, url: urlData.publicUrl }
    } catch (error) {
      console.error('Upload screenshot error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      }
    }
  }

  /**
   * Register a new participant (Pure Unified System)
   */
  async registerParticipant(data: CompleteRegistrationData): Promise<RegistrationResult> {
    try {
      // Check if user already has a registration
      const existingRegistration = await this.getUserRegistrationData(data.email)
      if (existingRegistration) {
        return {
          success: false,
          registration: null,
          message: 'You have already registered for SPANDAN 2025. Multiple registrations are not allowed.'
        }
      }

      // Upload payment screenshot
      const uploadResult = await this.uploadPaymentScreenshot(data.screenshot, data.email)
      if (!uploadResult.success) {
        return {
          success: false,
          registration: null,
          message: `Failed to upload payment screenshot: ${uploadResult.error}`
        }
      }

      // Calculate total amount
      const tierAmount = TIER_PRICING[data.tier]
      
      // Prepare registration data
      const registrationData = {
        user_name: data.name,
        user_email: data.email,
        user_phone: data.phone,
        user_college: data.college,
        user_year: data.year,
        user_branch: data.branch,
        registration_tier: TIER_MAPPING[data.tier],
        tier_amount: tierAmount,
        total_amount: tierAmount,
        selected_events: data.selectedEvents,
        payment_transaction_id: data.transactionId,
        payment_screenshot_url: uploadResult.url!,
        payment_status: 'pending',
        registration_status: 'pending',
        submission_timestamp: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Insert registration
      const { data: registration, error } = await supabase
        .from('unified_registrations')
        .insert(registrationData)
        .select()
        .single()

      if (error) {
        console.error('Registration error:', error)
        return {
          success: false,
          registration: null,
          message: 'Registration failed. Please try again.'
        }
      }

      return {
        success: true,
        registration,
        message: 'Registration submitted successfully! Please wait for admin approval.'
      }
    } catch (error) {
      console.error('Registration error:', error)
      return {
        success: false,
        registration: null,
        message: error instanceof Error ? error.message : 'Registration failed. Please try again.'
      }
    }
  }

  /**
   * Get user's unified registration data by email
   */
  async getUserRegistrationData(userEmail: string): Promise<UnifiedRegistration | null> {
    try {
      const { data, error } = await supabase
        .from('admin_unified_registrations')
        .select('*')
        .eq('user_email', userEmail)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No registration found
          return null
        }
        console.error('Error fetching user registration:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Get user registration data error:', error)
      return null
    }
  }

  /**
   * Check if user already has a registration
   */
  async hasExistingRegistration(userEmail: string): Promise<boolean> {
    try {
      const registration = await this.getUserRegistrationData(userEmail)
      return registration !== null
    } catch (error) {
      console.error('Check existing registration error:', error)
      return false
    }
  }

  /**
   * Get registration statistics
   */
  async getRegistrationStats(): Promise<{
    total: number
    pending: number
    approved: number
    rejected: number
  }> {
    try {
      const { data, error } = await supabase
        .from('admin_unified_registrations')
        .select('registration_status')

      if (error) {
        console.error('Error fetching registration stats:', error)
        return { total: 0, pending: 0, approved: 0, rejected: 0 }
      }

      const stats = {
        total: data.length,
        pending: data.filter(r => r.registration_status === 'pending').length,
        approved: data.filter(r => r.registration_status === 'approved').length,
        rejected: data.filter(r => r.registration_status === 'rejected').length
      }

      return stats
    } catch (error) {
      console.error('Error calculating registration stats:', error)
      return { total: 0, pending: 0, approved: 0, rejected: 0 }
    }
  }
}

// Export singleton instance
export const unifiedRegistrationService = new UnifiedRegistrationService()
