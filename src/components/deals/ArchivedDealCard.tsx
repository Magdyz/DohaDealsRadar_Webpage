'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, RotateCcw, Trash2 } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import type { Deal } from '@/types'

interface ArchivedDealCardProps {
  deal: Deal
  onRestore: (dealId: string) => Promise<void>
  onDelete: (dealId: string) => Promise<void>
}

export default function ArchivedDealCard({ deal, onRestore, onDelete }: ArchivedDealCardProps) {
  const [imageError, setImageError] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const hasValidImage = deal.imageUrl && deal.imageUrl.trim() !== '' && !imageError

  const handleRestore = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isRestoring || isDeleting) return

    const confirmed = window.confirm('Are you sure you want to restore this deal to the feed?')
    if (!confirmed) return

    setIsRestoring(true)
    try {
      await onRestore(deal.id)
    } finally {
      setIsRestoring(false)
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isRestoring || isDeleting) return

    const confirmed = window.confirm(
      'Are you sure you want to permanently delete this deal? This action cannot be undone.'
    )
    if (!confirmed) return

    setIsDeleting(true)
    try {
      await onDelete(deal.id)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="bg-surface rounded-2xl overflow-hidden border border-border/20 opacity-75 hover:opacity-100 transition-opacity">
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

            {/* Archived Badge */}
            <div className="absolute top-1.5 right-1.5 bg-text-secondary/90 rounded-full px-2 py-1">
              <span className="text-white text-[11px] font-bold tracking-wide">Archived</span>
            </div>

            {/* Vote Buttons - Bottom Center */}
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/25 backdrop-blur-sm rounded-full px-1.5 py-1">
              <div className="flex items-center gap-1 bg-hot-bg rounded-full px-1.5 py-1 border border-hot-content/30 min-w-[40px] h-6">
                <span className="text-[11px]">🔥</span>
                <span className="text-hot-content text-[10px] font-medium">{deal.hotVotes}</span>
              </div>
              <div className="flex items-center gap-1 bg-cold-bg rounded-full px-1.5 py-1 border border-cold-content/30 min-w-[40px] h-6">
                <span className="text-[11px]">❄️</span>
                <span className="text-cold-content text-[10px] font-medium">{deal.coldVotes}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>

      <div className="px-4 pb-4 pt-3 space-y-3">
        <Link href={`/deals/${deal.id}`}>
          <h3 className="text-sm font-bold text-text-primary leading-[1.4] line-clamp-2 break-words hover:text-primary-dark min-h-[2.8em]">
            {deal.title}
          </h3>
        </Link>

        {/* Admin Action Buttons - 2025 Touch-Friendly */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleRestore}
            disabled={isRestoring || isDeleting}
            className="min-h-[44px] bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            {isRestoring ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                <span>Restore</span>
              </>
            )}
          </button>

          <button
            onClick={handleDelete}
            disabled={isRestoring || isDeleting}
            className="min-h-[44px] bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            {isDeleting ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </>
            )}
          </button>
        </div>

        <Link href={`/deals/${deal.id}`} className="block">
          <button className="w-full min-h-[44px] bg-action-primary/70 hover:bg-action-primary text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95">
            <Eye className="w-4 h-4" />
            <span>View Details</span>
          </button>
        </Link>
      </div>
    </div>
  )
}
