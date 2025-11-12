'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ErrorFallbackProps {
  error: Error & { digest?: string }
  reset?: () => void
  showHomeButton?: boolean
  title?: string
  message?: string
}

export default function ErrorFallback({
  error,
  reset,
  showHomeButton = true,
  title = 'Something went wrong',
  message,
}: ErrorFallbackProps) {
  const router = useRouter()

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Error caught by boundary:', error)

    // You can integrate with error tracking services here
    // Example: Sentry.captureException(error)
  }, [error])

  const handleReset = () => {
    if (reset) {
      reset()
    } else {
      // Fallback: reload the page
      window.location.reload()
    }
  }

  const handleGoHome = () => {
    router.push('/feed')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full">
        <div className="bg-surface rounded-2xl shadow-lg border border-border p-8 text-center">
          {/* Error Icon */}
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-text-primary mb-3">
            {title}
          </h1>

          {/* Message */}
          <p className="text-text-secondary mb-6 leading-relaxed">
            {message ||
              "We're sorry, but something unexpected happened. Please try again or return to the home page."}
          </p>

          {/* Error Details (only in development) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200 text-left">
              <p className="text-xs font-mono text-red-800 break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-red-600 mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {reset && (
              <button
                onClick={handleReset}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-action-primary hover:bg-primary-dark text-white rounded-xl font-semibold transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </button>
            )}

            {showHomeButton && (
              <button
                onClick={handleGoHome}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-border hover:bg-surface-variant text-text-primary rounded-xl font-semibold transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>Go Home</span>
              </button>
            )}
          </div>

          {/* Support Message */}
          <p className="text-xs text-text-tertiary mt-6">
            If this problem persists, please contact support
          </p>
        </div>
      </div>
    </div>
  )
}
