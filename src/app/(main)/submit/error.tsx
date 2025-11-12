'use client'

import { useEffect } from 'react'
import ErrorFallback from '@/components/error/ErrorFallback'

export default function SubmitPageError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Error in submit page:', error)
  }, [error])

  return (
    <ErrorFallback
      error={error}
      reset={reset}
      title="Submission Error"
      message="We encountered an error while loading the submission form. Your draft may have been saved. Please try again."
    />
  )
}
