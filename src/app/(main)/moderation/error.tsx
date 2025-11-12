'use client'

import { useEffect } from 'react'
import ErrorFallback from '@/components/error/ErrorFallback'

export default function ModerationPageError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Error in moderation page:', error)
  }, [error])

  return (
    <ErrorFallback
      error={error}
      reset={reset}
      title="Moderation Panel Error"
      message="We encountered an error loading the moderation panel. Your session is still active. Please try again."
    />
  )
}
