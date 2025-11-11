'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, ExternalLink, MapPin, Tag, Calendar, Clock, Share2, Copy, Flag, User } from 'lucide-react'
import { Button, Badge, Card, CardBody, Spinner } from '@/components/ui'
import VoteButtons from '@/components/deals/VoteButtons'
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
    <div className="min-h-screen bg-background-secondary">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="md" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="md" onClick={handleShare}>
                <Share2 className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => router.push(`/report/${dealId}`)}
              >
                <Flag className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Card variant="elevated">
          <CardBody className="p-0">
            {/* Image */}
            <div className="relative w-full h-96 bg-gray-100">
              {deal.imageUrl && deal.imageUrl.trim() !== '' ? (
                <Image
                  src={deal.imageUrl}
                  alt={deal.title}
                  fill
                  className="object-contain"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100">
                  <Tag className="w-24 h-24 text-purple-400" />
                </div>
              )}
              {isExpired && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Badge variant="danger" size="lg">
                    This deal has expired
                  </Badge>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Category & Expiry */}
              <div className="flex items-center justify-between mb-4">
                {categoryInfo && (
                  <Badge variant="purple" size="md">
                    <span className="flex items-center gap-2">
                      <span className="text-lg">{categoryInfo.emoji}</span>
                      <span>{categoryInfo.label}</span>
                    </span>
                  </Badge>
                )}
                {!isExpired && (
                  <div className="flex items-center gap-1 text-sm text-text-tertiary">
                    <Clock className="w-4 h-4" />
                    <span
                      className={isExpiringSoon ? 'text-red-600 font-semibold' : ''}
                    >
                      {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
                    </span>
                  </div>
                )}
              </div>

              {/* Title */}
              <h1 className="text-3xl font-bold text-text-primary mb-4">
                {deal.title}
              </h1>

              {/* Description */}
              {deal.description && (
                <p className="text-base text-text-secondary mb-6 whitespace-pre-wrap">
                  {deal.description}
                </p>
              )}

              {/* Metadata Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {deal.link && (
                  <a
                    href={deal.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-background-secondary rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <ExternalLink className="w-5 h-5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-text-tertiary mb-1">Visit Deal</div>
                      <div className="text-sm font-medium text-text-primary truncate">
                        {new URL(deal.link).hostname}
                      </div>
                    </div>
                  </a>
                )}

                {deal.location && (
                  <div className="flex items-center gap-3 p-4 bg-background-secondary rounded-lg">
                    <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
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
                    className="flex items-center gap-3 p-4 bg-background-secondary rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Tag className="w-5 h-5 text-primary flex-shrink-0" />
                    <div className="flex-1 text-left">
                      <div className="text-xs text-text-tertiary mb-1">Promo Code</div>
                      <div className="text-sm font-mono font-semibold text-text-primary">
                        {deal.promoCode}
                      </div>
                    </div>
                    {copySuccess ? (
                      <Badge variant="success" size="sm">
                        Copied!
                      </Badge>
                    ) : (
                      <Copy className="w-4 h-4 text-text-tertiary" />
                    )}
                  </button>
                )}
              </div>

              {/* Vote Section */}
              {!isExpired && (
                <div className="flex items-center justify-between py-4 border-t border-b border-gray-200 mb-6">
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
              <div className="flex items-center gap-4 text-sm text-text-tertiary">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>
                    Posted by <strong>{deal.username || 'Anonymous'}</strong>
                  </span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatRelativeTime(deal.createdAt)}</span>
                </div>
                <span>•</span>
                <span>Expires {formatDate(deal.expiresAt)}</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
