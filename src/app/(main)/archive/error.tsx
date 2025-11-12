'use client'

import { useEffect } from 'react'
import ErrorFallback from '@/components/error/ErrorFallback'

export default function ArchivePageError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Error in archive page:', error)
  }, [error])

  return (
    <ErrorFallback
      error={error}
      reset={reset}
      title="Archive Loading Error"
      message="We couldn't load the archived deals. This may be a temporary issue. Please try again."
    />
  )
}
