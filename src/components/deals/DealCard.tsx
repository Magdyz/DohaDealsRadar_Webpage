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
    <div className="bg-surface rounded-2xl overflow-hidden border border-border/30 transition-all duration-300 hover:shadow-modern-lg hover:-translate-y-1 animate-fade-in">
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
                className="object-contain transition-transform duration-300 hover:scale-105"
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
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/30 backdrop-blur-md rounded-full px-2 py-1.5 shadow-lg">
              {/* Hot Vote Button - Better touch target */}
              <button
                className="flex items-center gap-1 bg-hot-bg rounded-full px-2 py-1.5 border-2 border-hot-content/40 min-w-[44px] min-h-[32px] hover:scale-110 transition-transform active:scale-95"
                onClick={(e) => {
                  e.preventDefault()
                  // Vote handling would go here
                }}
              >
                <span className="text-sm">🔥</span>
                <span className="text-hot-content text-xs font-bold">{deal.hotVotes}</span>
              </button>

              {/* Cold Vote Button - Better touch target */}
              <button
                className="flex items-center gap-1 bg-cold-bg rounded-full px-2 py-1.5 border-2 border-cold-content/40 min-w-[44px] min-h-[32px] hover:scale-110 transition-transform active:scale-95"
                onClick={(e) => {
                  e.preventDefault()
                  // Vote handling would go here
                }}
              >
                <span className="text-sm">❄️</span>
                <span className="text-cold-content text-xs font-bold">{deal.coldVotes}</span>
              </button>
            </div>
          </div>
        </div>
      </Link>

      {/* Content Section - Better spacing */}
      <div className="px-4 pb-4 space-y-3">
        {/* Title - 2 lines max with better typography */}
        <Link href={`/deals/${deal.id}`}>
          <h3 className="text-sm md:text-base font-bold text-text-primary leading-snug line-clamp-2 min-h-[2.5rem] hover:text-primary-dark transition-colors">
            {deal.title}
          </h3>
        </Link>

        {/* View Deal Button - Modern 2025 style with better touch target */}
        <Link href={`/deals/${deal.id}`} className="block">
          <button className="w-full min-h-[44px] bg-gradient-to-r from-action-primary to-primary-dark hover:from-primary-dark hover:to-action-primary text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 shadow-purple hover:shadow-xl transform hover:-translate-y-0.5 active:scale-98">
            <Eye className="w-4.5 h-4.5" />
            <span>View Deal</span>
          </button>
        </Link>
      </div>
    </div>
  )
}
