// Admin user interface (simplified authentication)
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  name: string;
  description: string;
  category: string; // Allow any string to support custom categories
  info_points?: string[]; // Array of bullet points
  start_date?: string;
  end_date?: string;
  venue?: string;
  price: number;
  max_participants: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Cart item for shopping cart functionality
export interface CartItem {
  event: Event;
  quantity: number;
}

// Group registration interface (group-level data)
export interface GroupRegistration {
  id: string;
  group_id: string; // e.g., GRP-TIER-A1B2C3
  
  // Group totals
  total_amount: number;
  member_count: number;
  
  // Payment information
  payment_transaction_id: string;
  payment_screenshot_path: string;
  
  // Registration status and management
  status: 'pending' | 'approved' | 'rejected';
  
  // Admin review information
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  
  // Contact person (first member details)
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

// Group member interface (individual member data)
export interface GroupMember {
  id: string;
  group_id: string;
  delegate_user_id: string; // e.g., USER-COPR-A1B2C3
  
  // Member personal information
  name: string;
  email: string;
  college: string;
  phone: string;
  college_location?: string;
  
  // Tier selection (individual per member)
  tier: 'Collectors Print' | 'Deluxe Edition' | 'Issue #1';
  tier_amount: 375 | 650 | 850;
  
  // Order in group
  member_order: number;
  
  // Timestamps
  created_at: string;
}

// Combined view for admin dashboard
export interface RegistrationView {
  group_id: string;
  delegate_user_id: string;
  leader_name: string;
  leader_email: string;
  leader_phone: string;
  college: string;
  college_location?: string;
  tier: string;
  tier_amount: number;
  members_count: number;
  total_amount: number;
  payment_transaction_id: string;
  payment_screenshot_path?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
  member_selections?: Array<{
    name: string;
    selection: string;
    pass_tier?: string;
    amount: number;
  }>;
}

// Event Registration interfaces
export interface EventRegistration {
  id: string;
  group_id: string; // EVT-XXXXXXXX format
  
  // Event information
  event_id: string;
  event_name: string;
  event_price: number;
  
  // Group summary
  total_amount: number;
  member_count: number;
  
  // Payment information
  payment_transaction_id: string;
  payment_screenshot_path?: string;
  
  // Contact person
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  contact_user_id: string; // Valid tier/pass user_id
  
  // Registration status
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

// Event Registration Member interface
export interface EventRegistrationMember {
  id: string;
  group_id: string;
  
  // Member identification
  user_id: string; // delegate_user_id or pass_id from approved registration
  
  // Member personal information
  name: string;
  email: string;
  college: string;
  phone: string;
  
  // Original registration reference
  original_group_id: string; // tier/pass group_registrations.group_id
  
  // Order in group
  member_order: number;
  
  // Timestamps
  created_at: string;
}

// Combined view for event registration admin dashboard
export interface EventRegistrationView {
  group_id: string;
  user_id: string;
  name: string;
  email: string;
  college: string;
  phone: string;
  college_location: string;
  event_name: string;
  event_category: string;
  event_price: number;
  member_count: number;
  amount: number; // Individual member amount (same as event_price)
  total_amount: number;
  status: 'pending' | 'approved' | 'rejected';
  payment_transaction_id: string;
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  // Additional formatted fields from the view
  status_display: string;
  formatted_created_at: string;
  formatted_reviewed_at?: string;
  formatted_updated_at?: string;
}

// Admin UI interface for event registration list (different from CSV export view)
export interface EventRegistrationAdmin {
  group_id: string;
  event_id: string;
  event_name: string;
  event_category: string;
  event_price: number;
  leader_name: string;
  leader_email: string;
  leader_phone: string;
  contact_user_id: string;
  member_count: number;
  total_amount: number;
  payment_transaction_id: string;
  payment_screenshot_path?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

// Registration tier interface
export interface RegistrationTier {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  icon: string;
  bgColor: string;
}

// Form data interfaces for registration flow
export interface RegistrationFormData {
  registrationType: 'individual' | 'group';
  members: MemberFormData[];
  paymentTransactionId: string;
  paymentScreenshot: File | null;
}

export interface MemberFormData {
  name: string;
  email: string;
  college: string;
  phone: string;
  collegeLocation: string;
  tier: 'Collectors Print' | 'Deluxe Edition' | 'Issue #1';
}

// Tier pricing constants
export const TIER_PRICES = {
  'Issue #1': 375,
  'Deluxe Edition': 650,
  'Collectors Print': 850,
} as const;

// Pass pricing constants
export const PASS_PRICES = {
  'Nexus Arena': 250,
  'Nexus Spotlight': 250,
  'Nexus Forum Standard': 500,
  'Nexus Forum Premium': 750,
} as const;

// Pass types
export type PassType = 'Nexus Arena' | 'Nexus Spotlight' | 'Nexus Forum';
export type PassTier = 'Standard' | 'Premium';
export type SelectionType = 'tier' | 'pass';
export type TierType = 'Collectors Print' | 'Deluxe Edition' | 'Issue #1';

// Enhanced member form data (supports both tiers and passes)
export interface EnhancedMemberFormData {
  name: string;
  email: string;
  college: string;
  phone: string;
  collegeLocation: string;
  selectionType: SelectionType;
  
  // Tier selection (mutually exclusive with pass)
  tier?: TierType;
  
  // Pass selection (mutually exclusive with tier)
  passType?: PassType;
  passTier?: PassTier; // Only for Nexus Forum
}

// Enhanced registration form data
export interface EnhancedRegistrationFormData {
  registrationType: 'individual' | 'group';
  members: EnhancedMemberFormData[];
  paymentTransactionId: string;
  paymentScreenshot: File | null;
}

// Enhanced group member (database record)
export interface EnhancedGroupMember {
  id: string;
  group_id: string;
  user_id: string;
  name: string;
  email: string;
  college: string;
  phone: string;
  college_location: string;
  selection_type: SelectionType;
  
  // Tier fields
  tier?: TierType;
  delegate_user_id?: string;
  
  // Pass fields  
  pass_type?: PassType;
  pass_tier?: PassTier;
  pass_id?: string;
  
  amount: number;
  member_order: number;
  created_at: string;
}

// Enhanced registration view (for admin)
export interface EnhancedRegistrationView {
  group_id: string;
  user_id: string;
  name: string;
  email: string;
  college: string;
  phone: string;
  college_location: string;
  selection_type: SelectionType;
  tier?: TierType;
  delegate_user_id?: string;
  pass_type?: PassType;
  pass_tier?: PassTier;
  pass_id?: string;
  amount: number;
  total_amount: number;
  payment_transaction_id: string;
  payment_screenshot_path?: string;
  status: string;
  created_at: string;
  updated_at?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  rejection_reason?: string;
  member_count: number;
  // Enhanced members array with full member details including emails
  members?: EnhancedGroupMember[];
}