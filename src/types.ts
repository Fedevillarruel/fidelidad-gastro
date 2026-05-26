export type UserRole = 'restaurant' | 'client' | 'super_admin'

export type LoyaltyMode = 'stamps' | 'points'

export interface Restaurant {
  id: string
  slug: string
  name: string
  logo_url?: string
  primary_color: string
  secondary_color: string
  typography: string
  loyalty_goal: number
  loyalty_reward: string
  loyalty_unit: string
}

export interface Customer {
  id: string
  restaurant_id: string
  full_name: string
  phone?: string
  points: number
  visits: number
  last_visit?: string
}

export interface Whokey {
  id: string
  restaurant_id: string
  customer_id: string
  uid: string
  public_code: string
  is_active: boolean
  created_at: string
}

export interface Promotion {
  id: string
  restaurant_id: string
  title: string
  description: string
  banner_url?: string
  expires_at?: string
}

export interface PointEvent {
  id: string
  restaurant_id: string
  customer_id: string
  source: 'nfc' | 'qr' | 'manual'
  type: 'add' | 'subtract' | 'reset'
  amount: number
  item_label: string
  created_at: string
}

export interface DashboardMetrics {
  activeCustomers: number
  visitsThisWeek: number
  avgRecurrenceDays: number
  loyaltyRedemptions: number
}
