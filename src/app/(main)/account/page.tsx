'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, ArrowLeft } from 'lucide-react'
import { Button, Spinner } from '@/components/ui'
import { ProtectedRoute } from '@/components/auth'
import { UserProfile, UserStats, UserDealsList } from '@/components/user'
import { useAuthStore } from '@/lib/store/authStore'
import { getUserStats } from '@/lib/api/deals'
import type { UserStats as UserStatsType } from '@/types'
import Link from 'next/link'

function AccountPageContent() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [stats, setStats] = useState<UserStatsType | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  useEffect(() => {
    if (user) {
      loadStats()
    }
  }, [user])

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

  if (!user) {
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
            <Link href="/feed">
              <Button variant="ghost" size="md">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Feed
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-text-primary">My Account</h1>
            <Button variant="outline" size="md" onClick={handleLogout}>
              <LogOut className="w-5 h-5 mr-2" />
              Logout
            </Button>
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

export default function AccountPage() {
  return (
    <ProtectedRoute requireAuth={true}>
      <AccountPageContent />
    </ProtectedRoute>
  )
}
