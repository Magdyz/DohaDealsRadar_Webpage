'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Flame, Snowflake, Clock, MapPin, Tag as TagIcon } from 'lucide-react'
import { formatRelativeTime, getDaysUntilExpiry } from '@/lib/utils'
import { CATEGORIES } from '@/types'
import type { Deal } from '@/types'

interface DealCardProps {
  deal: Deal
}

export default function DealCard({ deal }: DealCardProps) {
  const [hotVotes, setHotVotes] = useState(deal.hotVotes)
  const [coldVotes, setColdVotes] = useState(deal.coldVotes)
  const [imageError, setImageError] = useState(false)

  const daysLeft = getDaysUntilExpiry(deal.expiresAt)
  const isExpired = daysLeft < 0
  const isExpiringSoon = daysLeft <= 2 && daysLeft >= 0

  const getCategoryInfo = () => {
    return CATEGORIES.find((c) => c.id === deal.category)
  }

  const categoryInfo = getCategoryInfo()

  // Check if image URL is valid
  const hasValidImage = deal.imageUrl && deal.imageUrl.trim() !== '' && !imageError

  return (
    <div className="bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 animate-fade-in group border border-border">
      {/* Image Section */}
      <Link href={`/deals/${deal.id}`} className="relative block">
        <div className="relative w-full h-56 bg-surface-variant overflow-hidden">
          {hasValidImage ? (
            <Image
              src={deal.imageUrl}
              alt={deal.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-purple-900/20 via-purple-800/10 to-blue-900/20">
              <TagIcon className="w-20 h-20 text-purple-500/30 mb-2" />
              <span className="text-sm text-purple-400/50 font-medium">No Image</span>
            </div>
          )}

          {/* Vote Badges Overlay */}
          <div className="absolute top-3 left-3 flex gap-2">
            {hotVotes > 0 && (
              <div className="flex items-center gap-1 bg-red-500/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-lg">
                <Flame className="w-4 h-4 text-white" fill="white" />
                <span className="text-xs font-bold text-white">{hotVotes}</span>
              </div>
            )}
            {coldVotes > 0 && (
              <div className="flex items-center gap-1 bg-blue-500/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-lg">
                <Snowflake className="w-4 h-4 text-white" fill="white" />
                <span className="text-xs font-bold text-white">{coldVotes}</span>
              </div>
            )}
          </div>

          {/* Time Badge */}
          {!isExpired && (
            <div className="absolute top-3 right-3">
              <div className="flex items-center gap-1 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-full">
                <Clock className="w-3.5 h-3.5 text-white" />
                <span className={`text-xs font-semibold ${isExpiringSoon ? 'text-red-400' : 'text-white'}`}>
                  {daysLeft}d
                </span>
              </div>
            </div>
          )}

          {/* Expired Overlay */}
          {isExpired && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
              <div className="bg-red-500 px-4 py-2 rounded-full">
                <span className="text-white font-bold text-sm">EXPIRED</span>
              </div>
            </div>
          )}
        </div>
      </Link>

      {/* Content Section */}
      <div className="p-4">
        {/* Category */}
        {categoryInfo && (
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-lg">{categoryInfo.emoji}</span>
            <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wide">
              {categoryInfo.label}
            </span>
          </div>
        )}

        {/* Title */}
        <Link href={`/deals/${deal.id}`}>
          <h3 className="text-lg font-bold text-text-primary hover:text-primary mb-2 line-clamp-2 transition-colors">
            {deal.title}
          </h3>
        </Link>

        {/* Description */}
        {deal.description && (
          <p className="text-sm text-text-secondary mb-3 line-clamp-2">
            {deal.description}
          </p>
        )}

        {/* Metadata */}
        <div className="flex flex-wrap gap-3 text-xs text-text-tertiary mb-4">
          {deal.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>{deal.location}</span>
            </div>
          )}
          {deal.promoCode && (
            <div className="flex items-center gap-1">
              <TagIcon className="w-3.5 h-3.5" />
              <span className="font-mono font-semibold">{deal.promoCode}</span>
            </div>
          )}
        </div>

        {/* View Deal Button */}
        <Link href={`/deals/${deal.id}`}>
          <button className="w-full bg-primary hover:bg-primary-light text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02]">
            View Deal
          </button>
        </Link>

        {/* Footer Info */}
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-text-tertiary">
          <span>by {deal.username || 'Anonymous'}</span>
          <span>{formatRelativeTime(deal.createdAt)}</span>
        </div>
      </div>
    </div>
  )
}
