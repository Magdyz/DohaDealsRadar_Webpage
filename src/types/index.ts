export type DealCategory =
  | 'food_dining'
  | 'shopping_fashion'
  | 'electronics_tech'
  | 'health_beauty'
  | 'entertainment_activities'

export interface Deal {
  id: string
  title: string
  description: string | null
  image_url: string
  link: string | null
  location: string | null
  category: DealCategory
  promo_code: string | null
  hot_count: number
  cold_count: number
  posted_by: string // username
  submitted_by_user_id: string // actual user ID
  status: 'pending' | 'approved' | 'rejected'
  is_archived: boolean
  created_at: string
  expires_at: string
  approved_at?: string | null
  approved_by?: string | null
  submitted_at?: string
  auto_approved?: boolean
  report_count?: number
}

// Alias for backward compatibility
export type DealStatus = 'pending' | 'approved' | 'rejected'

export interface User {
  id: string
  email: string
  username: string | null
  role: UserRole
  auto_approve: boolean
  created_at: string
  last_login_at?: string
}

export type UserRole = 'user' | 'moderator' | 'admin'

export interface Report {
  id: string
  deal_id: string
  device_id: string
  reason: ReportReason
  note: string | null
  created_at: string
}

export type ReportReason =
  | 'spam'
  | 'scam'
  | 'expired'
  | 'other'

export interface Vote {
  id: string
  deal_id: string
  device_id: string
  vote_type: VoteType
  created_at: string
}

export type VoteType = 'hot' | 'cold'

export interface UserStats {
  total_deals: number
  approved_deals: number
  pending_deals: number
  rejected_deals: number
}

export interface CategoryInfo {
  id: DealCategory
  label: string
  emoji: string
}

export const CATEGORIES: CategoryInfo[] = [
  { id: 'food_dining', label: 'Food & Dining', emoji: '🍽️' },
  { id: 'shopping_fashion', label: 'Shopping & Fashion', emoji: '🛍️' },
  { id: 'electronics_tech', label: 'Electronics & Tech', emoji: '💻' },
  { id: 'health_beauty', label: 'Health & Beauty', emoji: '💄' },
  { id: 'entertainment_activities', label: 'Entertainment', emoji: '🎉' },
]

export const REPORT_REASONS = [
  { value: 'spam', label: 'Spam or Advertising' },
  { value: 'scam', label: 'Scam or Fraud' },
  { value: 'expired', label: 'Deal Expired/Invalid' },
  { value: 'other', label: 'Other' },
]
