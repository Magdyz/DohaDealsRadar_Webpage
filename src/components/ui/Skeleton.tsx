'use client'

import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'circular' | 'rectangular'
}

export default function Skeleton({
  className,
  variant = 'default',
  ...props
}: SkeletonProps) {
  const variants = {
    default: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
  }

  return (
    <div
      className={cn(
        'animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]',
        variants[variant],
        className
      )}
      style={{
        animation: 'shimmer 2s infinite linear',
      }}
      {...props}
    />
  )
}

// Deal Card Skeleton
export function DealCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        {/* Image skeleton */}
        <Skeleton className="w-full sm:w-48 h-48 sm:h-auto" variant="rectangular" />

        {/* Content skeleton */}
        <div className="flex-1 p-4 space-y-3">
          {/* Category badge and expiry */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>

          {/* Title */}
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-6 w-1/2" />

          {/* Description */}
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />

          {/* Metadata */}
          <div className="flex gap-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      </div>
    </div>
  )
}
