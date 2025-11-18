import type { Deal, DealCategory, VoteType, UserStats } from '@/types'
import { useAuthStore } from '@/lib/store/authStore'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api'

/**
 * Get authentication headers for API calls
 * Returns Authorization header with JWT token if user is authenticated
 */
function getAuthHeaders(): HeadersInit {
  const token = useAuthStore.getState().getAccessToken()

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  return headers
}

export interface GetDealsParams {
  page?: number
  limit?: number
  search?: string
  category?: DealCategory | ''
  isArchived?: boolean
}

export interface GetDealsResponse {
  deals: Deal[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface SubmitDealData {
  title: string
  description?: string
  imageUrl: string
  link?: string
  location?: string
  category: DealCategory
  promoCode?: string
  originalPrice?: string
  discountedPrice?: string
  expiryDays: number
  userId: string
}

export interface SubmitDealResponse {
  success: boolean
  message: string
  deal?: Deal
  autoApproved?: boolean
}

export interface VoteResponse {
  success: boolean
  message: string
  hotVotes: number
  coldVotes: number
}

export interface ReportDealData {
  dealId: string
  deviceId: string
  reason: string
  note?: string
}

export interface ReportResponse {
  success: boolean
  message: string
}

// Get deals with pagination and filters
export async function getDeals(params: GetDealsParams = {}): Promise<GetDealsResponse> {
  const { page = 1, limit = 20, search = '', category = '', isArchived = false } = params

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
    ...(category && { category }),
    isArchived: isArchived.toString(),
  })

  try {
    const response = await fetch(`${API_BASE_URL}/get-deals?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch deals')
    }

    return data
  } catch (error) {
    console.error('Get deals error:', error)
    throw error
  }
}

// Get single deal by ID
export async function getDealById(dealId: string): Promise<Deal> {
  try {
    const response = await fetch(`${API_BASE_URL}/get-deal?dealId=${dealId}`, {
      method: 'GET',
      headers: getAuthHeaders(), // Include auth token for viewing pending/archived deals
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch deal')
    }

    return data.deal
  } catch (error) {
    console.error('Get deal by ID error:', error)
    throw error
  }
}

// Submit new deal
export async function submitDeal(dealData: SubmitDealData): Promise<SubmitDealResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/submit-deal`, {
      method: 'POST',
      headers: getAuthHeaders(), // Requires authentication
      body: JSON.stringify(dealData),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to submit deal')
    }

    return data
  } catch (error) {
    console.error('Submit deal error:', error)
    throw error
  }
}

// Cast vote on deal
export async function castVote(
  dealId: string,
  deviceId: string,
  voteType: VoteType
): Promise<VoteResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/cast-vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ dealId, deviceId, voteType }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to cast vote')
    }

    return data
  } catch (error) {
    console.error('Cast vote error:', error)
    throw error
  }
}

// Report deal
export async function reportDeal(reportData: ReportDealData): Promise<ReportResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/report-deal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reportData),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to report deal')
    }

    return data
  } catch (error) {
    console.error('Report deal error:', error)
    throw error
  }
}

// Get user's submitted deals
export async function getUserDeals(
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<GetDealsResponse> {
  const queryParams = new URLSearchParams({
    userId,
    page: page.toString(),
    limit: limit.toString(),
  })

  try {
    const response = await fetch(`${API_BASE_URL}/get-user-deals?${queryParams}`, {
      method: 'GET',
      headers: getAuthHeaders(), // Requires authentication
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch user deals')
    }

    return data
  } catch (error) {
    console.error('Get user deals error:', error)
    throw error
  }
}

// Get user statistics
export async function getUserStats(userId: string): Promise<UserStats> {
  try {
    const response = await fetch(`${API_BASE_URL}/get-user-stats?userId=${userId}`, {
      method: 'GET',
      headers: getAuthHeaders(), // Requires authentication
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch user stats')
    }

    return data.stats
  } catch (error) {
    console.error('Get user stats error:', error)
    throw error
  }
}

// Upload image
export async function uploadImage(file: File): Promise<{ url: string }> {
  try {
    // PERFORMANCE: Use multipart/form-data instead of base64 (3-4x faster, 33% less overhead)
    const formData = new FormData()
    formData.append('file', file)

    // Get auth token separately since we can't set Content-Type with FormData
    const token = useAuthStore.getState().getAccessToken()
    const headers: HeadersInit = {}

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    // Note: Don't set Content-Type header - browser will set it automatically with boundary for multipart/form-data

    const response = await fetch(`${API_BASE_URL}/upload-image`, {
      method: 'POST',
      headers, // Don't include Content-Type, let browser set it
      body: formData,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to upload image')
    }

    return { url: data.url }
  } catch (error) {
    console.error('Upload image error:', error)
    throw error
  }
}

// Moderator functions
export async function approveDeal(dealId: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/approve-deal`, {
      method: 'POST',
      headers: getAuthHeaders(), // Requires moderator authentication
      body: JSON.stringify({ dealId }), // Remove moderatorUserId, use token
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to approve deal')
    }

    return data
  } catch (error) {
    console.error('Approve deal error:', error)
    throw error
  }
}

export async function rejectDeal(
  dealId: string,
  reason: string
): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/reject-deal`, {
      method: 'POST',
      headers: getAuthHeaders(), // Requires moderator authentication
      body: JSON.stringify({ dealId, reason }), // Remove moderatorUserId, use token
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to reject deal')
    }

    return data
  } catch (error) {
    console.error('Reject deal error:', error)
    throw error
  }
}

export async function deleteDeal(
  dealId: string
): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/delete-deal`, {
      method: 'POST',
      headers: getAuthHeaders(), // Requires admin authentication
      body: JSON.stringify({ dealId }), // Remove moderatorUserId, use token
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete deal')
    }

    return data
  } catch (error) {
    console.error('Delete deal error:', error)
    throw error
  }
}

export async function getPendingDeals(
  page: number = 1,
  limit: number = 20
): Promise<GetDealsResponse> {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  })

  try {
    const response = await fetch(`${API_BASE_URL}/get-pending-deals?${queryParams}`, {
      method: 'GET',
      headers: getAuthHeaders(), // Requires moderator authentication
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch pending deals')
    }

    return data
  } catch (error) {
    console.error('Get pending deals error:', error)
    throw error
  }
}

// Admin functions
export async function returnToFeed(
  dealId: string,
  newExpiryDays: number
): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/return-to-feed`, {
      method: 'POST',
      headers: getAuthHeaders(), // Requires admin authentication
      body: JSON.stringify({ dealId, newExpiryDays }), // Remove adminUserId, use token
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to return deal to feed')
    }

    return data
  } catch (error) {
    console.error('Return to feed error:', error)
    throw error
  }
}

export async function permanentDeleteDeal(dealId: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/permanent-delete-deal`, {
      method: 'POST',
      headers: getAuthHeaders(), // Requires admin authentication
      body: JSON.stringify({ dealId }), // Remove adminUserId, use token
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to permanently delete deal')
    }

    return data
  } catch (error) {
    console.error('Permanent delete deal error:', error)
    throw error
  }
}
