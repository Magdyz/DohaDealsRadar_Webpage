'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, ExternalLink, MapPin, Tag, Calendar, Clock, Share2, Copy, Flag, User } from 'lucide-react'
import { Button, Badge, Card, CardBody, Spinner } from '@/components/ui'
import VoteButtons from '@/components/deals/VoteButtons'
import { ReportModal } from '@/components/modals'
import { getDealById } from '@/lib/api/deals'
import { formatDate, formatRelativeTime, getDaysUntilExpiry } from '@/lib/utils'
import { CATEGORIES } from '@/types'
import type { Deal } from '@/types'

export default function DealDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const dealId = params.id as string

  const [deal, setDeal] = useState<Deal | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [copySuccess, setCopySuccess] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)

  useEffect(() => {
    if (dealId) {
      loadDeal()
    }
  }, [dealId])

  const loadDeal = async () => {
    setIsLoading(true)
    setError('')

    try {
      const dealData = await getDealById(dealId)
      setDeal(dealData)
    } catch (err: any) {
      setError(err.message || 'Failed to load deal')
    } finally {
      setIsLoading(false)
    }
  }

  const handleShare = async () => {
    if (!deal) return

    const shareData = {
      title: deal.title,
      text: deal.description || deal.title,
      url: window.location.href,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        // Fallback: copy link to clipboard
        await navigator.clipboard.writeText(window.location.href)
        alert('Link copied to clipboard!')
      }
    } catch (error) {
      console.error('Share failed:', error)
    }
  }

  const handleCopyPromoCode = async () => {
    if (!deal?.promoCode) return

    try {
      await navigator.clipboard.writeText(deal.promoCode)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (error) {
      console.error('Copy failed:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !deal) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card variant="outlined">
          <CardBody>
            <p className="text-center text-red-600">{error || 'Deal not found'}</p>
            <Button
              variant="primary"
              size="md"
              className="mx-auto mt-4"
              onClick={() => router.push('/feed')}
            >
              Back to Feed
            </Button>
          </CardBody>
        </Card>
      </div>
    )
  }

  const daysLeft = getDaysUntilExpiry(deal.expiresAt)
  const isExpired = daysLeft < 0
  const isExpiringSoon = daysLeft <= 2 && daysLeft >= 0

  const getCategoryInfo = () => {
    return CATEGORIES.find((c) => c.id === deal.category)
  }

  const categoryInfo = getCategoryInfo()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-surface shadow-md sticky top-0 z-20 border-b border-border/50 backdrop-blur-sm bg-surface/95">
        <div className="max-w-4xl mx-auto px-4 py-4 md:px-6 md:py-5">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-text-primary hover:bg-surface-variant rounded-xl transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>
            <div className="flex gap-2">
              <button
                onClick={handleShare}
                className="p-3 min-h-[44px] min-w-[44px] hover:bg-surface-variant rounded-xl transition-all"
                title="Share deal"
              >
                <Share2 className="w-5 h-5 text-text-secondary" />
              </button>
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="p-3 min-h-[44px] min-w-[44px] hover:bg-surface-variant rounded-xl transition-all"
                title="Report deal"
              >
                <Flag className="w-5 h-5 text-text-secondary" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 md:px-6 md:py-8">
        <div className="bg-surface rounded-2xl overflow-hidden shadow-lg border-2 border-border/30">
          {/* Image */}
          <div className="relative w-full aspect-square md:aspect-video bg-white">
            {deal.imageUrl && deal.imageUrl.trim() !== '' ? (
              <Image
                src={deal.imageUrl}
                alt={deal.title}
                fill
                unoptimized
                className="object-contain"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                <Tag className="w-24 h-24 text-gray-300" />
              </div>
            )}
            {isExpired && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="bg-red-500 px-6 py-3 rounded-full">
                  <span className="text-white font-bold">EXPIRED</span>
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4 md:p-6">
            {/* Category & Expiry */}
            <div className="flex items-center justify-between mb-4">
              {categoryInfo && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-light rounded-full">
                  <span className="text-lg">{categoryInfo.emoji}</span>
                  <span className="text-sm font-semibold text-action-primary">{categoryInfo.label}</span>
                </div>
              )}
              {!isExpired && (
                <div className="flex items-center gap-1 text-sm text-text-tertiary">
                  <Clock className="w-4 h-4" />
                  <span className={isExpiringSoon ? 'text-red-600 font-semibold' : ''}>
                    {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
                  </span>
                </div>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
              {deal.title}
            </h1>

            {/* Description */}
            {deal.description && (
              <p className="text-base text-text-secondary mb-6 whitespace-pre-wrap leading-relaxed">
                {deal.description}
              </p>
            )}

            {/* Metadata Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              {deal.link && (
                <a
                  href={deal.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-background-secondary rounded-xl hover:bg-border-light transition-colors"
                >
                  <ExternalLink className="w-5 h-5 text-action-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-text-tertiary mb-1">Visit Deal</div>
                    <div className="text-sm font-medium text-text-primary truncate">
                      {new URL(deal.link).hostname}
                    </div>
                  </div>
                </a>
              )}

              {deal.location && (
                <div className="flex items-center gap-3 p-4 bg-background-secondary rounded-xl">
                  <MapPin className="w-5 h-5 text-action-primary flex-shrink-0" />
                  <div>
                    <div className="text-xs text-text-tertiary mb-1">Location</div>
                    <div className="text-sm font-medium text-text-primary">
                      {deal.location}
                    </div>
                  </div>
                </div>
              )}

              {deal.promoCode && (
                <button
                  onClick={handleCopyPromoCode}
                  className="flex items-center gap-3 p-4 bg-background-secondary rounded-xl hover:bg-border-light transition-colors"
                >
                  <Tag className="w-5 h-5 text-action-primary flex-shrink-0" />
                  <div className="flex-1 text-left">
                    <div className="text-xs text-text-tertiary mb-1">Promo Code</div>
                    <div className="text-sm font-mono font-semibold text-text-primary">
                      {deal.promoCode}
                    </div>
                  </div>
                  {copySuccess ? (
                    <div className="bg-green-500 px-2 py-1 rounded-full">
                      <span className="text-xs font-bold text-white">Copied!</span>
                    </div>
                  ) : (
                    <Copy className="w-4 h-4 text-text-tertiary" />
                  )}
                </button>
              )}
            </div>

            {/* Vote Section */}
            {!isExpired && (
              <div className="flex items-center justify-between py-4 border-t border-b border-border mb-6">
                <div className="text-sm text-text-secondary">
                  Vote if this deal is hot or cold
                </div>
                <VoteButtons
                  dealId={deal.id}
                  initialHotVotes={deal.hotVotes}
                  initialColdVotes={deal.coldVotes}
                />
              </div>
            )}

            {/* Posted By & Date */}
            <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-text-tertiary">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>
                  Posted by <strong className="text-text-secondary">{deal.username || 'Anonymous'}</strong>
                </span>
              </div>
              <span className="hidden md:inline">•</span>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{formatRelativeTime(deal.createdAt)}</span>
              </div>
              <span className="hidden md:inline">•</span>
              <span>Expires {formatDate(deal.expiresAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {deal && (
        <ReportModal
          dealId={deal.id}
          dealTitle={deal.title}
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}
    </div>
  )
}
