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
    <div className="bg-surface rounded-2xl overflow-hidden border border-border/20 transition-all duration-200 hover:shadow-lg">
      {/* Image Section with Vote Buttons Overlay */}
      <Link href={`/deals/${deal.id}`} className="block">
        <div className="relative w-full aspect-square p-2">
          <div className="relative w-full h-full rounded-xl overflow-hidden bg-white">
            {hasValidImage ? (
              <Image
                src={deal.imageUrl}
                alt={deal.title}
                fill
                unoptimized
                className="object-contain"
                sizes="(max-width: 768px) 50vw, 33vw"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                <span className="text-6xl text-gray-300">📷</span>
              </div>
            )}

            {/* New Badge - Top Right */}
            {isNewDeal && (
              <div className="absolute top-1.5 right-1.5 bg-action-primary/90 rounded-full px-2 py-1">
                <span className="text-white text-[11px] font-bold tracking-wide">New</span>
              </div>
            )}

            {/* Vote Buttons - Bottom Center with Glass-morphism */}
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/25 backdrop-blur-sm rounded-full px-1.5 py-1">
              {/* Hot Vote Button */}
              <button
                className="flex items-center gap-1 bg-hot-bg rounded-full px-1.5 py-1 border border-hot-content/30 min-w-[40px] h-6"
                onClick={(e) => {
                  e.preventDefault()
                  // Vote handling would go here
                }}
              >
                <span className="text-[11px]">🔥</span>
                <span className="text-hot-content text-[10px] font-medium">{deal.hotVotes}</span>
              </button>

              {/* Cold Vote Button */}
              <button
                className="flex items-center gap-1 bg-cold-bg rounded-full px-1.5 py-1 border border-cold-content/30 min-w-[40px] h-6"
                onClick={(e) => {
                  e.preventDefault()
                  // Vote handling would go here
                }}
              >
                <span className="text-[11px]">❄️</span>
                <span className="text-cold-content text-[10px] font-medium">{deal.coldVotes}</span>
              </button>
            </div>
          </div>
        </div>
      </Link>

      {/* Content Section */}
      <div className="px-3 pb-3 space-y-2.5">
        {/* Title - 2 lines max, fixed height */}
        <Link href={`/deals/${deal.id}`}>
          <h3 className="text-[13px] font-bold text-text-primary leading-5 line-clamp-2 h-10 hover:text-primary-dark transition-colors">
            {deal.title}
          </h3>
        </Link>

        {/* View Deal Button - Full width, prominent */}
        <Link href={`/deals/${deal.id}`} className="block">
          <button className="w-full h-11 bg-action-primary hover:bg-primary-dark text-white rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md">
            <Eye className="w-4.5 h-4.5" />
            <span>View Deal</span>
          </button>
        </Link>
      </div>
    </div>
  )
}
