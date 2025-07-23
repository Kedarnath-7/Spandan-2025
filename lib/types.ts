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
  category: 'Cultural' | 'Sports' | 'Fine Arts' | 'Literary' | 'Academic';
  info_points?: string[]; // Array of bullet points
  start_date?: string;
  end_date?: string;
  venue?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  group_name: string;
  review_status: string;
  reviewed_at?: string;
  reviewed_by?: string;
  rejection_reason?: string;
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
  'Nexus Forum Standard': 250,
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
  status: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  rejection_reason?: string;
  member_count: number;
}