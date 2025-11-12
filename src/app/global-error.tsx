'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to error reporting service
    console.error('Global error:', error)
  }, [error])

  return (
    <html>
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, sans-serif' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#FAFBFC',
            padding: '1rem',
          }}
        >
          <div
            style={{
              maxWidth: '32rem',
              width: '100%',
              backgroundColor: '#FFFFFF',
              borderRadius: '1rem',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              border: '1px solid #E8EAED',
              padding: '2rem',
              textAlign: 'center',
            }}
          >
            {/* Error Icon */}
            <div
              style={{
                width: '4rem',
                height: '4rem',
                backgroundColor: '#FEE2E2',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
              }}
            >
              <AlertTriangle style={{ width: '2rem', height: '2rem', color: '#DC2626' }} />
            </div>

            {/* Title */}
            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#0F1419',
                marginBottom: '1rem',
              }}
            >
              Critical Error
            </h1>

            {/* Message */}
            <p
              style={{
                color: '#5B7083',
                marginBottom: '1.5rem',
                lineHeight: '1.6',
              }}
            >
              A critical error occurred in the application. Please reload the page to continue.
            </p>

            {/* Error Details (development only) */}
            {process.env.NODE_ENV === 'development' && (
              <div
                style={{
                  marginBottom: '1.5rem',
                  padding: '1rem',
                  backgroundColor: '#FEE2E2',
                  borderRadius: '0.5rem',
                  border: '1px solid #FCA5A5',
                  textAlign: 'left',
                }}
              >
                <p
                  style={{
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    color: '#991B1B',
                    wordBreak: 'break-all',
                  }}
                >
                  {error.message}
                </p>
                {error.digest && (
                  <p style={{ fontSize: '0.75rem', color: '#DC2626', marginTop: '0.5rem' }}>
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={reset}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                width: '100%',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#9046CF',
                color: '#FFFFFF',
                borderRadius: '0.75rem',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#7C3AAE'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#9046CF'
              }}
            >
              <RefreshCw style={{ width: '1rem', height: '1rem' }} />
              <span>Reload Page</span>
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
