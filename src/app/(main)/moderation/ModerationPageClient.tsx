'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Eye, AlertTriangle } from 'lucide-react'
import { Button, Card, CardBody, Badge, Spinner } from '@/components/ui'
import { useAuthStore } from '@/lib/store/authStore'
import { supabase } from '@/lib/supabase/client'
import { formatRelativeTime, getDaysUntilExpiry } from '@/lib/utils'
import { CATEGORIES } from '@/types'
import type { Deal } from '@/types'

function ModerationContent() {
  const router = useRouter()
  const { user } = useAuthStore()

  const [pendingDeals, setPendingDeals] = useState<Deal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)

  // Check if user is moderator or admin
  useEffect(() => {
    if (!user || (user.role !== 'moderator' && user.role !== 'admin')) {
      router.push('/feed')
    }
  }, [user, router])

  useEffect(() => {
    loadPendingDeals()
  }, [])

  const loadPendingDeals = async () => {
    setIsLoading(true)
    setError('')

    try {
      const { data, error: fetchError } = await supabase
        .from('deals')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      // Transform to camelCase
      const transformed = data?.map((deal: any) => ({
        id: deal.id,
        title: deal.title,
        description: deal.description,
        imageUrl: deal.image_url,
        link: deal.link,
        location: deal.location,
        category: deal.category,
        promoCode: deal.promo_code,
        hotVotes: deal.hot_count ?? 0,
        coldVotes: deal.cold_count ?? 0,
        userId: deal.submitted_by_user_id ?? '',
        username: deal.posted_by ?? 'Anonymous',
        isApproved: deal.status === 'approved',
        isArchived: deal.is_archived ?? false,
        createdAt: deal.created_at,
        updatedAt: deal.updated_at ?? deal.created_at,
        expiresAt: deal.expires_at,
      })) || []

      setPendingDeals(transformed)
    } catch (err: any) {
      console.error('Error loading pending deals:', err)
      setError('Failed to load pending deals')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (dealId: string) => {
    if (!user) return

    setProcessingId(dealId)
    try {
      const response = await fetch('/api/approve-deal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moderatorUserId: user.id,
          dealId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to approve deal')
      }

      // Remove from pending list
      setPendingDeals(prev => prev.filter(d => d.id !== dealId))
    } catch (err: any) {
      console.error('Approve error:', err)
      alert(err.message || 'Failed to approve deal')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (dealId: string) => {
    if (!user) return

    const reason = prompt('Please provide a reason for rejection:')
    if (!reason) return

    setProcessingId(dealId)
    try {
      const response = await fetch('/api/reject-deal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moderatorUserId: user.id,
          dealId,
          reason,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reject deal')
      }

      // Remove from pending list
      setPendingDeals(prev => prev.filter(d => d.id !== dealId))
    } catch (err: any) {
      console.error('Reject error:', err)
      alert(err.message || 'Failed to reject deal')
    } finally {
      setProcessingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-secondary pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Moderation Panel</h1>
              <p className="text-sm text-text-tertiary mt-1">
                {pendingDeals.length} pending deal{pendingDeals.length !== 1 ? 's' : ''} awaiting review
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push('/feed')}>
              Back to Feed
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {pendingDeals.length === 0 ? (
          <Card variant="outlined">
            <CardBody className="p-12 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-text-primary mb-2">
                All Caught Up!
              </h2>
              <p className="text-text-secondary">
                There are no pending deals to review at this time.
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingDeals.map((deal) => {
              const categoryInfo = CATEGORIES.find(c => c.id === deal.category)
              const daysLeft = getDaysUntilExpiry(deal.expiresAt)
              const isProcessing = processingId === deal.id

              return (
                <Card key={deal.id} variant="elevated">
                  <CardBody className="p-0">
                    <div className="flex flex-col md:flex-row">
                      {/* Image */}
                      <div className="relative w-full md:w-64 h-48 flex-shrink-0 bg-gray-100">
                        {deal.imageUrl ? (
                          <img
                            src={deal.imageUrl}
                            alt={deal.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100">
                            <AlertTriangle className="w-12 h-12 text-purple-400" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-6">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="warning" size="sm">
                              Pending Review
                            </Badge>
                            {categoryInfo && (
                              <Badge variant="purple" size="sm">
                                <span className="flex items-center gap-1">
                                  <span>{categoryInfo.emoji}</span>
                                  <span>{categoryInfo.label}</span>
                                </span>
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-text-tertiary">
                            {formatRelativeTime(deal.createdAt)}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-bold text-text-primary mb-2">
                          {deal.title}
                        </h3>

                        {/* Description */}
                        {deal.description && (
                          <p className="text-sm text-text-secondary mb-4 line-clamp-2">
                            {deal.description}
                          </p>
                        )}

                        {/* Metadata */}
                        <div className="flex flex-wrap gap-4 text-xs text-text-tertiary mb-4">
                          <span>By: {deal.username}</span>
                          {deal.location && <span>📍 {deal.location}</span>}
                          {deal.promoCode && <span>🏷️ {deal.promoCode}</span>}
                          <span>⏰ Expires in {daysLeft} days</span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/deals/${deal.id}`)}
                            disabled={isProcessing}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleApprove(deal.id)}
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <Spinner size="sm" className="mr-2" />
                            ) : (
                              <CheckCircle className="w-4 h-4 mr-2" />
                            )}
                            Approve
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleReject(deal.id)}
                            disabled={isProcessing}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ModerationPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Spinner size="lg" /></div>}>
      <ModerationContent />
    </Suspense>
  )
}
