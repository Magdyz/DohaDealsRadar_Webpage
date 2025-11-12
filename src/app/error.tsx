'use client'

import { useEffect } from 'react'
import ErrorFallback from '@/components/error/ErrorFallback'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <ErrorFallback
      error={error}
      reset={reset}
      title="Oops! Something went wrong"
      message="We encountered an unexpected error. Don't worry, your data is safe. Please try again."
    />
  )
}
