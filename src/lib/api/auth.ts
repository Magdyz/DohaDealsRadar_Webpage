import type { User } from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ''

export interface SendVerificationCodeResponse {
  success: boolean
  message: string
}

export interface VerifyCodeResponse {
  success: boolean
  message: string
  user?: User
  isNewUser?: boolean
}

export interface RegisterUsernameResponse {
  success: boolean
  message: string
  username?: string
}

export async function sendVerificationCode(
  email: string
): Promise<SendVerificationCodeResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/send-verification-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send verification code')
    }

    return data
  } catch (error) {
    console.error('Send verification code error:', error)
    throw error
  }
}

export async function verifyCode(
  email: string,
  code: string,
  deviceId: string
): Promise<VerifyCodeResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/verify-code-and-get-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, code, deviceId }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to verify code')
    }

    return data
  } catch (error) {
    console.error('Verify code error:', error)
    throw error
  }
}

export async function registerUsername(
  userId: string,
  username: string
): Promise<RegisterUsernameResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/manage_username`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, username }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to register username')
    }

    return data
  } catch (error) {
    console.error('Register username error:', error)
    throw error
  }
}

export async function getUserProfile(userId: string): Promise<User> {
  try {
    const response = await fetch(`${API_BASE_URL}/get-user-profile?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get user profile')
    }

    return data.user
  } catch (error) {
    console.error('Get user profile error:', error)
    throw error
  }
}
