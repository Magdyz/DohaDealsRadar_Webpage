'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Eye } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import type { Deal } from '@/types'

interface DealCardProps {
  deal: Deal
}

export default function DealCard({ deal }: DealCardProps) {
  const [imageError, setImageError] = useState(false)

  // Check if deal is new (within 48 hours)
  const isNewDeal = useMemo(() => {
    const createdAt = new Date(deal.createdAt)
    const now = new Date()
    const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
    return hoursDiff <= 48
  }, [deal.createdAt])

  // Check if image URL is valid
  const hasValidImage = deal.imageUrl && deal.imageUrl.trim() !== '' && !imageError

  return (
    <div className="bg-surface rounded-2xl overflow-hidden border border-border/30 transition-all duration-300 hover:shadow-modern-lg hover:-translate-y-1 animate-fade-in flex flex-col h-full">
      {/* Image Section with Vote Buttons Overlay */}
      <Link href={`/deals/${deal.id}`} className="block">
        <div className="relative w-full aspect-square p-2.5">
          <div className="relative w-full h-full rounded-xl overflow-hidden bg-background-secondary">
            {hasValidImage ? (
              <Image
                src={deal.imageUrl}
                alt={deal.title}
                fill
                unoptimized
                className="object-cover transition-transform duration-300 hover:scale-105"
                sizes="(max-width: 768px) 50vw, 33vw"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-background-secondary">
                <span className="text-7xl text-text-tertiary/30">📷</span>
              </div>
            )}

            {/* New Badge - Top Right - 2025 Modern Style */}
            {isNewDeal && (
              <div className="absolute top-2 right-2 bg-gradient-to-r from-action-primary to-primary-dark rounded-full px-3 py-1.5 shadow-purple">
                <span className="text-white text-xs font-bold tracking-wide">NEW</span>
              </div>
            )}

            {/* Vote Buttons - Bottom Center with Enhanced Glass-morphism */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-surface/95 backdrop-blur-md rounded-full px-3 py-2 shadow-lg border border-border/30">
              {/* Hot Vote Button - Better touch target */}
              <button
                className="flex items-center gap-1.5 bg-gradient-to-br from-hot-bg to-hot-bg/80 rounded-full px-3 py-1.5 border border-hot-content/30 min-w-[52px] min-h-[36px] hover:scale-105 hover:border-hot-content/50 transition-all active:scale-95 shadow-sm"
                onClick={(e) => {
                  e.preventDefault()
                  // Vote handling would go here
                }}
              >
                <span className="text-base">🔥</span>
                <span className="text-hot-content text-sm font-bold">{deal.hotVotes}</span>
              </button>

              {/* Divider */}
              <div className="w-px h-6 bg-border/40"></div>

              {/* Cold Vote Button - Better touch target */}
              <button
                className="flex items-center gap-1.5 bg-gradient-to-br from-cold-bg to-cold-bg/80 rounded-full px-3 py-1.5 border border-cold-content/30 min-w-[52px] min-h-[36px] hover:scale-105 hover:border-cold-content/50 transition-all active:scale-95 shadow-sm"
                onClick={(e) => {
                  e.preventDefault()
                  // Vote handling would go here
                }}
              >
                <span className="text-base">❄️</span>
                <span className="text-cold-content text-sm font-bold">{deal.coldVotes}</span>
              </button>
            </div>
          </div>
        </div>
      </Link>

      {/* Content Section - Standardized height */}
      <div className="px-4 pb-4 space-y-3 flex-1 flex flex-col">
        {/* Title - Fixed 2 lines with consistent height */}
        <Link href={`/deals/${deal.id}`} className="flex-1">
          <h3 className="text-sm md:text-base font-bold text-text-primary leading-snug line-clamp-2 h-[2.8rem] hover:text-primary-dark transition-colors">
            {deal.title}
          </h3>
        </Link>

        {/* View Deal Button - Modern 2025 style with better touch target */}
        <Link href={`/deals/${deal.id}`} className="block mt-auto">
          <button className="w-full min-h-[44px] bg-gradient-to-r from-action-primary to-primary-dark hover:from-primary-dark hover:to-action-primary text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 shadow-purple hover:shadow-xl transform hover:-translate-y-0.5 active:scale-98">
            <Eye className="w-4 h-4" />
            <span>View Deal</span>
          </button>
        </Link>
      </div>
    </div>
  )
}
