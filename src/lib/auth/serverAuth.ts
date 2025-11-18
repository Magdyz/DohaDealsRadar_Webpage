/**
 * Server-side authentication utilities
 * Provides session verification and user role checking for API routes
 */

import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export interface AuthenticatedUser {
  id: string
  email: string
  role: 'user' | 'moderator' | 'admin'
  username?: string
  autoApprove: boolean
}

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

/**
 * Extracts and verifies user session from request
 * Falls back to userId from body for backwards compatibility during migration
 */
export async function verifyAuthentication(
  request: NextRequest
): Promise<AuthenticatedUser> {
  try {
    // Try to get session from Authorization header (new method)
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (token) {
      // Verify JWT token with Supabase
      const supabase = createClient(supabaseUrl, supabaseAnonKey)

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token)

      if (error || !user) {
        throw new AuthError('Invalid or expired session', 401)
      }

      // Fetch user details from database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, username, role, auto_approve')
        .eq('email', user.email)
        .single()

      if (userError || !userData) {
        throw new AuthError('User not found', 404)
      }

      return {
        id: userData.id,
        email: userData.email,
        role: userData.role as 'user' | 'moderator' | 'admin',
        username: userData.username || undefined,
        autoApprove: userData.auto_approve || false,
      }
    }

    // Fallback: Check for userId in request body (backwards compatibility)
    // This will be removed in future versions
    const body = await request.clone().json()
    const userId =
      body.userId || body.moderatorUserId || body.adminUserId || body.deviceId

    if (userId && isValidUUID(userId)) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey)

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, username, role, auto_approve')
        .eq('id', userId)
        .single()

      if (userError || !userData) {
        // If userId is provided but user doesn't exist, allow it for device_id operations
        // This maintains backwards compatibility for voting/reporting
        return {
          id: userId,
          email: '',
          role: 'user',
          autoApprove: false,
        }
      }

      return {
        id: userData.id,
        email: userData.email,
        role: userData.role as 'user' | 'moderator' | 'admin',
        username: userData.username || undefined,
        autoApprove: userData.auto_approve || false,
      }
    }

    throw new AuthError('No authentication provided', 401)
  } catch (error) {
    if (error instanceof AuthError) {
      throw error
    }
    throw new AuthError('Authentication failed', 401)
  }
}

/**
 * Verifies user has moderator or admin role
 */
export async function verifyModerator(
  request: NextRequest
): Promise<AuthenticatedUser> {
  const user = await verifyAuthentication(request)

  if (user.role !== 'moderator' && user.role !== 'admin') {
    throw new AuthError('Insufficient permissions - moderator access required', 403)
  }

  return user
}

/**
 * Verifies user has admin role
 */
export async function verifyAdmin(request: NextRequest): Promise<AuthenticatedUser> {
  const user = await verifyAuthentication(request)

  if (user.role !== 'admin') {
    throw new AuthError('Insufficient permissions - admin access required', 403)
  }

  return user
}

/**
 * Validates UUID format
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Gets user ID from request (tries session first, falls back to body)
 * Use this for non-critical operations during migration period
 */
export async function getUserId(request: NextRequest): Promise<string | null> {
  try {
    const user = await verifyAuthentication(request)
    return user.id
  } catch {
    return null
  }
}
