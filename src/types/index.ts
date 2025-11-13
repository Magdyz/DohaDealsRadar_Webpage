export type DealCategory =
  | 'food_dining'
  | 'shopping_fashion'
  | 'entertainment'
  | 'home_services'
  | 'other'

export interface Deal {
  id: string
  title: string
  description: string | null
  imageUrl: string
  link: string | null
  location: string | null
  category: DealCategory
  promoCode: string | null
  hotVotes: number
  coldVotes: number
  username: string | null // posted_by username
  userId: string // submitted_by_user_id
  isApproved: boolean
  isArchived: boolean
  createdAt: string
  updatedAt: string
  expiresAt: string
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
  { id: 'entertainment', label: 'Entertainment', emoji: '🎉' },
  { id: 'home_services', label: 'Home & Services', emoji: '🏠' },
  { id: 'other', label: 'Other', emoji: '📦' },
]

export const REPORT_REASONS = [
  { value: 'spam', label: 'Spam or Advertising' },
  { value: 'scam', label: 'Scam or Fraud' },
  { value: 'expired', label: 'Deal Expired/Invalid' },
  { value: 'other', label: 'Other' },
]
