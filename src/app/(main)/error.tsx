'use client'

import { useEffect } from 'react'
import ErrorFallback from '@/components/error/ErrorFallback'

export default function MainLayoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Error in main layout:', error)
  }, [error])

  return (
    <ErrorFallback
      error={error}
      reset={reset}
      title="Page Error"
      message="We encountered an error loading this page. Please try refreshing or return to the home page."
    />
  )
}
