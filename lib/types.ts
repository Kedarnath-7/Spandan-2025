export interface User {
  id: string;
  email: string;
  name: string;
  college: string;
  phone: string;
  year?: string;
  branch?: string;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  name: string;
  description: string;
  category: 'Cultural' | 'Sports' | 'Fine Arts' | 'Literary' | 'Academic';
  price: number;
  max_participants?: number;
  info_points?: string[]; // Array of bullet points
  start_date?: string;
  end_date?: string;
  venue?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UnifiedRegistration {
  id: string;
  
  // User information (stored directly)
  user_email: string;
  user_name: string;
  user_phone: string;
  user_college: string;
  user_year?: string;
  user_branch?: string;
  
  // Registration details
  registration_tier: string;
  total_amount: number;
  
  // Payment information (stored directly)
  payment_transaction_id: string;
  payment_screenshot: string; // From admin view (aliased from payment_screenshot_path)
  payment_amount: number;
  
  // Registration status and management
  status: 'pending' | 'approved' | 'rejected';
  delegate_id?: string;
  
  // Admin review information
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Selected events
  selected_events?: Array<{
    id: string;
    name: string;
    category: string;
    price: number;
  }>;
}

export interface RegistrationTier {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  icon?: any;
  bgColor?: string;
}

export interface CartItem {
  event: Event;
  quantity: number;
}

export const TIER_PRICES = {
  'Tier 1': 375,
  'Tier 2': 650,
  'Tier 3': 850
} as const;

export const TIER_DESCRIPTIONS = {
  'Tier 1': 'Basic Access - Entry to general events and competitions',
  'Tier 2': 'Premium Access - Includes workshops, main stage events, and exclusive sessions',
  'Tier 3': 'VIP Access - All events, VIP seating, exclusive networking, and special privileges'
} as const;

export interface Payment {
  id: string;
  user_id: string;
  type: string;
  payment_screenshot: string;
  transaction_id: string;
  amount: number;
  status: string;
  created_at: string;
  updated_at: string;
}