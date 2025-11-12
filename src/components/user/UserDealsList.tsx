'use client'

import { useState, useEffect } from 'react'
import { ExternalLink, MapPin, Tag, Calendar, Clock } from 'lucide-react'
import { Card, CardBody, Badge, Button, Spinner } from '@/components/ui'
import { getUserDeals } from '@/lib/api/deals'
import { formatRelativeTime, getDaysUntilExpiry } from '@/lib/utils'
import { CATEGORIES } from '@/types'
import type { Deal } from '@/types'
import Image from 'next/image'
import Link from 'next/link'

interface UserDealsListProps {
  userId: string
}

export default function UserDealsList({ userId }: UserDealsListProps) {
  const [deals, setDeals] = useState<Deal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  useEffect(() => {
    loadDeals()
  }, [userId, page])

  const loadDeals = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await getUserDeals(userId, page, 10)
      setDeals(response.deals)
      setHasMore(response.hasMore)
    } catch (err: any) {
      setError(err.message || 'Failed to load deals')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (deal: Deal) => {
    if (!deal.isApproved && !deal.isArchived) {
      return <Badge variant="warning">Pending</Badge>
    }
    if (deal.isArchived) {
      return <Badge variant="danger">Rejected</Badge>
    }
    return <Badge variant="success">Approved</Badge>
  }

  const getCategoryEmoji = (categoryId: string) => {
    const category = CATEGORIES.find((c) => c.id === categoryId)
    return category?.emoji || '📦'
  }

  if (isLoading && deals.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <Card variant="outlined">
        <CardBody>
          <p className="text-center text-red-600">{error}</p>
        </CardBody>
      </Card>
    )
  }

  if (deals.length === 0) {
    return (
      <Card variant="outlined">
        <CardBody>
          <div className="text-center py-8">
            <Package className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
            <p className="text-text-secondary">No deals submitted yet</p>
            <Link href="/post">
              <Button variant="primary" size="md" className="mt-4">
                Post Your First Deal
              </Button>
            </Link>
          </div>
        </CardBody>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {deals.map((deal) => {
        const daysLeft = getDaysUntilExpiry(deal.expiresAt)
        const isExpired = daysLeft < 0

        return (
          <Card key={deal.id} variant="elevated">
            <CardBody className="p-4">
              <div className="flex gap-4">
                {/* Image */}
                <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                  <Image
                    src={deal.imageUrl}
                    alt={deal.title}
                    width={96}
                    height={96}
                    unoptimized
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xl">{getCategoryEmoji(deal.category)}</span>
                      {getStatusBadge(deal)}
                      {isExpired && <Badge variant="danger">Expired</Badge>}
                    </div>
                  </div>

                  <Link href={`/deals/${deal.id}`}>
                    <h3 className="text-lg font-semibold text-text-primary hover:text-primary mb-2 line-clamp-2">
                      {deal.title}
                    </h3>
                  </Link>

                  {deal.description && (
                    <p className="text-sm text-text-secondary mb-2 line-clamp-2">
                      {deal.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-3 text-xs text-text-tertiary">
                    {deal.link && (
                      <div className="flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />
                        <span className="truncate max-w-[150px]">
                          {new URL(deal.link).hostname}
                        </span>
                      </div>
                    )}
                    {deal.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{deal.location}</span>
                      </div>
                    )}
                    {deal.promoCode && (
                      <div className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        <span className="font-mono">{deal.promoCode}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-2 text-xs text-text-tertiary">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatRelativeTime(deal.createdAt)}</span>
                    </div>
                    {!isExpired && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{daysLeft} days left</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        )
      })}

      {/* Pagination */}
      {(hasMore || page > 1) && (
        <div className="flex justify-center gap-2">
          {page > 1 && (
            <Button
              variant="outline"
              onClick={() => setPage(page - 1)}
              disabled={isLoading}
            >
              Previous
            </Button>
          )}
          {hasMore && (
            <Button
              variant="outline"
              onClick={() => setPage(page + 1)}
              disabled={isLoading}
            >
              Next
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

// Missing import
import { Package } from 'lucide-react'
