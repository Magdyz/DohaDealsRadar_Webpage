'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { Spinner } from '@/components/ui'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireModerator?: boolean
  requireAdmin?: boolean
}

export default function ProtectedRoute({
  children,
  requireAuth = true,
  requireModerator = false,
  requireAdmin = false,
}: ProtectedRouteProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (requireAuth && !isAuthenticated) {
      // Redirect to login with return URL
      router.replace(`/login?returnUrl=${encodeURIComponent(pathname)}`)
      return
    }

    if (requireModerator && user?.role !== 'moderator' && user?.role !== 'admin') {
      // Redirect to feed if not a moderator
      router.replace('/feed')
      return
    }

    if (requireAdmin && user?.role !== 'admin') {
      // Redirect to feed if not an admin
      router.replace('/feed')
      return
    }
  }, [isAuthenticated, user, requireAuth, requireModerator, requireAdmin, router, pathname])

  // Show loading state while checking auth
  if (requireAuth && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (requireModerator && user?.role !== 'moderator' && user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (requireAdmin && user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return <>{children}</>
}
