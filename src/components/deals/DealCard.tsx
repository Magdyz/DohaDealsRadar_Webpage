'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ExternalLink, MapPin, Tag, Clock, User } from 'lucide-react'
import { Card, CardBody, Badge } from '@/components/ui'
import VoteButtons from './VoteButtons'
import { formatRelativeTime, getDaysUntilExpiry, truncateText } from '@/lib/utils'
import { CATEGORIES } from '@/types'
import type { Deal } from '@/types'

interface DealCardProps {
  deal: Deal
}

export default function DealCard({ deal }: DealCardProps) {
  const [hotVotes, setHotVotes] = useState(deal.hot_count)
  const [coldVotes, setColdVotes] = useState(deal.cold_count)

  const daysLeft = getDaysUntilExpiry(deal.expires_at)
  const isExpired = daysLeft < 0
  const isExpiringSoon = daysLeft <= 2 && daysLeft >= 0

  const getCategoryInfo = () => {
    return CATEGORIES.find((c) => c.id === deal.category)
  }

  const categoryInfo = getCategoryInfo()

  const handleVoteSuccess = (newHotVotes: number, newColdVotes: number) => {
    setHotVotes(newHotVotes)
    setColdVotes(newColdVotes)
  }

  // Check if image URL is valid
  const hasValidImage = deal.image_url && deal.image_url.trim() !== ''

  return (
    <Card variant="elevated" className="hover:shadow-xl transition-shadow">
      <CardBody className="p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Image */}
          <Link
            href={`/deals/${deal.id}`}
            className="relative w-full sm:w-48 h-48 sm:h-auto flex-shrink-0 bg-gray-100"
          >
            {hasValidImage ? (
              <Image
                src={deal.image_url}
                alt={deal.title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 192px"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100">
                <Tag className="w-12 h-12 text-purple-400" />
              </div>
            )}
            {isExpired && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Badge variant="danger" size="lg">
                  Expired
                </Badge>
              </div>
            )}
          </Link>

          {/* Content */}
          <div className="flex-1 p-4">
            {/* Category & Expiry */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {categoryInfo && (
                  <Badge variant="purple" size="sm">
                    <span className="flex items-center gap-1">
                      <span>{categoryInfo.emoji}</span>
                      <span>{categoryInfo.label}</span>
                    </span>
                  </Badge>
                )}
              </div>
              {!isExpired && (
                <div className="flex items-center gap-1 text-xs text-text-tertiary">
                  <Clock className="w-3 h-3" />
                  <span
                    className={isExpiringSoon ? 'text-red-600 font-semibold' : ''}
                  >
                    {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
                  </span>
                </div>
              )}
            </div>

            {/* Title */}
            <Link href={`/deals/${deal.id}`}>
              <h3 className="text-lg font-semibold text-text-primary hover:text-primary mb-2 line-clamp-2">
                {deal.title}
              </h3>
            </Link>

            {/* Description */}
            {deal.description && (
              <p className="text-sm text-text-secondary mb-3 line-clamp-2">
                {truncateText(deal.description, 120)}
              </p>
            )}

            {/* Metadata */}
            <div className="flex flex-wrap gap-3 text-xs text-text-tertiary mb-3">
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
              {deal.promo_code && (
                <div className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  <span className="font-mono font-semibold">{deal.promo_code}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
              {/* Posted by */}
              <div className="flex items-center gap-2 text-xs text-text-tertiary">
                <User className="w-3 h-3" />
                <span>
                  by <span className="font-medium">{deal.posted_by || 'Anonymous'}</span>
                </span>
                <span>•</span>
                <span>{formatRelativeTime(deal.created_at)}</span>
              </div>

              {/* Vote buttons */}
              {!isExpired && (
                <VoteButtons
                  dealId={deal.id}
                  initialHotVotes={hotVotes}
                  initialColdVotes={coldVotes}
                  onVoteSuccess={handleVoteSuccess}
                />
              )}
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
