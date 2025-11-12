'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ErrorFallback from '@/components/error/ErrorFallback'

export default function DealDetailsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error('Error loading deal:', error)
  }, [error])

  const handleGoToFeed = () => {
    router.push('/feed')
  }

  return (
    <ErrorFallback
      error={error}
      reset={reset}
      title="Failed to Load Deal"
      message="We couldn't load this deal. It may have been removed or there was a connection issue. Please try again or browse other deals."
      showHomeButton={true}
    />
  )
}
