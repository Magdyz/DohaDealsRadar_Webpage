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
      router.push('/login?returnUrl=/account')
      return
    }

    if (user) {
      loadStats()
    }
  }, [user, isAuthenticated, router])

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
    <div className="min-h-screen bg-background-secondary">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/feed')}
              className="flex items-center gap-2 px-4 py-2 text-text-primary hover:bg-surface-variant rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Feed</span>
            </button>
            <h1 className="text-2xl font-bold text-text-primary">My Account</h1>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 border-2 border-border hover:bg-surface-variant text-text-primary rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
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
