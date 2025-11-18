'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, ArrowLeft } from 'lucide-react'
import { Spinner } from '@/components/ui'
import { UserProfile, UserStats, UserDealsList } from '@/components/user'
import { useAuthStore } from '@/lib/store/authStore'
import { getUserStats } from '@/lib/api/deals'
import type { UserStats as UserStatsType } from '@/types'

export default function AccountPageClient() {
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuthStore()
  const [stats, setStats] = useState<UserStatsType | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  // Prevent SSR/SSG - only render on client
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated) {
      router.replace('/login?returnUrl=/account')
      return
    }

    // SECURITY FIX: Check if user has JWT token stored
    // Users who logged in before JWT token storage was implemented won't have tokens
    // Force them to re-login to get new tokens
    const { getAccessToken } = useAuthStore.getState()
    const token = getAccessToken()

    if (!token) {
      console.warn('No JWT token found - user needs to re-login')
      logout()
      router.replace('/login?returnUrl=/account&message=session-expired')
      return
    }

    if (user) {
      loadStats()
    }
  }, [user, isAuthenticated, router, logout])

  const loadStats = async () => {
    if (!user) return

    setIsLoadingStats(true)
    try {
      const userStats = await getUserStats(user.id)
      setStats(userStats)
    } catch (error) {
      console.error('Failed to load user stats:', error)
    } finally {
      setIsLoadingStats(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/feed')
  }

  // Prevent rendering until client-side mounted
  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header - 2025 Modern Design */}
      <div className="bg-surface shadow-md sticky top-0 z-20 border-b border-border/50 backdrop-blur-sm bg-surface/95">
        <div className="max-w-4xl mx-auto px-4 py-4 md:px-6 md:py-5">
          <div className="grid grid-cols-3 items-center gap-2">
            {/* Left: Back Button */}
            <button
              onClick={() => router.push('/feed')}
              className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2.5 min-h-[44px] text-text-primary hover:bg-surface-variant rounded-xl transition-all hover:scale-105 justify-self-start"
            >
              <ArrowLeft className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium hidden sm:inline">Back</span>
              <span className="font-medium hidden md:inline">to Feed</span>
            </button>

            {/* Center: Title */}
            <h1 className="text-lg md:text-2xl lg:text-3xl font-bold text-text-primary tracking-tight text-center">
              My Account
            </h1>

            {/* Right: Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2.5 min-h-[44px] border-2 border-border hover:bg-error/5 hover:border-error/50 text-text-primary hover:text-error rounded-xl transition-all justify-self-end"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content - 2025 Modern Layout */}
      <div className="max-w-4xl mx-auto px-4 py-6 md:px-6 md:py-8 space-y-8">
        {/* User Profile */}
        <UserProfile user={user} />

        {/* Stats */}
        {stats ? (
          <UserStats stats={stats} isLoading={isLoadingStats} />
        ) : (
          <div className="flex justify-center py-8">
            <Spinner size="md" />
          </div>
        )}

        {/* User Deals */}
        <div>
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            My Submitted Deals
          </h2>
          <UserDealsList userId={user.id} />
        </div>
      </div>
    </div>
  )
}
