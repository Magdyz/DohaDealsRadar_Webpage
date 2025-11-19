'use client'

import { useState, useMemo, memo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Eye } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import { getShimmerDataURL } from '@/lib/utils/imageUtils'
import { castVote } from '@/lib/api/deals'
import { getDeviceId } from '@/lib/utils/deviceId'
import { getVote, setVote, hasVoted } from '@/lib/utils/localStorage'
import type { Deal, VoteType } from '@/types'
import PriceDisplay from './PriceDisplay'

interface DealCardProps {
  deal: Deal
  priority?: boolean // For above-the-fold images
}

function DealCard({ deal, priority = false }: DealCardProps) {
  const router = useRouter()
  const [imageError, setImageError] = useState(false)
  const [hotVotes, setHotVotes] = useState(deal.hotVotes)
  const [coldVotes, setColdVotes] = useState(deal.coldVotes)
  const [isVoting, setIsVoting] = useState(false)
  const prefetchedRef = useRef(false)

  // Check if deal is new (within 48 hours)
  const isNewDeal = useMemo(() => {
    const createdAt = new Date(deal.createdAt)
    const now = new Date()
    const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
    return hoursDiff <= 48
  }, [deal.createdAt])

  // Check if image URL is valid
  const hasValidImage = deal.imageUrl && deal.imageUrl.trim() !== '' && !imageError

  // Prefetch deal details on hover for instant navigation
  const handleMouseEnter = () => {
    if (!prefetchedRef.current) {
      router.prefetch(`/deals/${deal.id}`)
      prefetchedRef.current = true
    }
  }

  // Handle voting
  const handleVote = async (e: React.MouseEvent, voteType: VoteType) => {
    e.preventDefault()
    e.stopPropagation()

    if (hasVoted(deal.id) || isVoting) return

    setIsVoting(true)

    // Optimistic update
    const prevHotVotes = hotVotes
    const prevColdVotes = coldVotes
    if (voteType === 'hot') {
      setHotVotes(hotVotes + 1)
    } else {
      setColdVotes(coldVotes + 1)
    }

    try {
      const deviceId = getDeviceId()
      const response = await castVote(deal.id, deviceId, voteType)

      if (response.success) {
        // Update with actual counts from server
        setHotVotes(response.hotVotes)
        setColdVotes(response.coldVotes)

        // Store vote in localStorage
        setVote(deal.id, voteType)
      }
    } catch (error) {
      // Revert optimistic update on error
      setHotVotes(prevHotVotes)
      setColdVotes(prevColdVotes)
      console.error('Vote failed:', error)
    } finally {
      setIsVoting(false)
    }
  }

  return (
    <div
      className="bg-surface rounded-2xl overflow-hidden border border-border/30 transition-all duration-300 hover:shadow-modern-lg hover:-translate-y-1 animate-fade-in flex flex-col h-full"
      onMouseEnter={handleMouseEnter}
    >
      {/* Image Section with Vote Buttons Overlay */}
      <Link href={`/deals/${deal.id}`} className="block">
        <div className="relative w-full aspect-square p-2.5">
          <div className="relative w-full h-full rounded-xl overflow-hidden bg-background-secondary">
            {hasValidImage ? (
              <Image
                src={deal.imageUrl}
                alt={deal.title}
                fill
                priority={priority}
                loading={priority ? 'eager' : 'lazy'} // Lazy load non-priority images for better performance
                placeholder="blur"
                blurDataURL={getShimmerDataURL(400, 400)}
                className="object-cover transition-transform duration-300 hover:scale-105"
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
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

            {/* Vote Buttons - Bottom Center - Optimized Compact Design */}
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-surface/90 backdrop-blur-md rounded-full px-1.5 py-1 shadow-md border border-border/20">
              {/* Hot Vote Button - Compact & Touch-Friendly */}
              <button
                className="flex items-center gap-0.5 bg-gradient-to-br from-hot-bg to-hot-bg/80 rounded-full px-2 py-0.5 border border-hot-content/30 min-w-[36px] min-h-[28px] hover:scale-105 hover:border-hot-content/50 transition-all active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={(e) => handleVote(e, 'hot')}
                disabled={hasVoted(deal.id) || isVoting}
              >
                <span className="text-xs">🔥</span>
                <span className="text-hot-content text-xs font-semibold">{hotVotes}</span>
              </button>

              {/* Divider */}
              <div className="w-px h-4 bg-border/30"></div>

              {/* Cold Vote Button - Compact & Touch-Friendly */}
              <button
                className="flex items-center gap-0.5 bg-gradient-to-br from-cold-bg to-cold-bg/80 rounded-full px-2 py-0.5 border border-cold-content/30 min-w-[36px] min-h-[28px] hover:scale-105 hover:border-cold-content/50 transition-all active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={(e) => handleVote(e, 'cold')}
                disabled={hasVoted(deal.id) || isVoting}
              >
                <span className="text-xs">❄️</span>
                <span className="text-cold-content text-xs font-semibold">{coldVotes}</span>
              </button>
            </div>
          </div>
        </div>
      </Link>

      {/* Content Section - Improved Text Flow */}
      <div className="px-4 pb-4 pt-3 space-y-3 flex-1 flex flex-col">
        {/* Title - Proper Text Wrapping with 2025 Typography */}
        <Link href={`/deals/${deal.id}`} className="flex-1">
          <h3 className="text-sm md:text-base font-bold text-text-primary leading-[1.4] line-clamp-2 break-words hover:text-primary-dark transition-colors min-h-[2.8em]">
            {deal.title}
          </h3>
        </Link>

        {/* Price Display */}
        <PriceDisplay originalPrice={deal.originalPrice} discountedPrice={deal.discountedPrice} />

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

// Memoize the component to prevent unnecessary re-renders
export default memo(DealCard, (prevProps, nextProps) => {
  // Only re-render if the deal data actually changed
  return (
    prevProps.deal.id === nextProps.deal.id &&
    prevProps.deal.hotVotes === nextProps.deal.hotVotes &&
    prevProps.deal.coldVotes === nextProps.deal.coldVotes &&
    prevProps.deal.originalPrice === nextProps.deal.originalPrice &&
    prevProps.deal.discountedPrice === nextProps.deal.discountedPrice &&
    prevProps.priority === nextProps.priority
  )
})
