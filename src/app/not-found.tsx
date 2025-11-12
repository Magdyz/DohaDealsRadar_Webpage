import Link from 'next/link'
import { Home, Search, ArrowLeft } from 'lucide-react'

export default function RootNotFound() {
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
            {/* 404 Illustration */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h1
                style={{
                  fontSize: '5rem',
                  fontWeight: 'bold',
                  color: '#C57AF7',
                  marginBottom: '0.5rem',
                }}
              >
                404
              </h1>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
            </div>

            {/* Title */}
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#0F1419',
                marginBottom: '1rem',
              }}
            >
              Page Not Found
            </h2>

            {/* Message */}
            <p
              style={{
                color: '#5B7083',
                marginBottom: '1.5rem',
                lineHeight: '1.6',
              }}
            >
              We couldn't find the page you're looking for. It may have been removed, renamed, or
              doesn't exist.
            </p>

            {/* Action Button */}
            <Link
              href="/feed"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#9046CF',
                color: '#FFFFFF',
                borderRadius: '0.75rem',
                fontWeight: '600',
                textDecoration: 'none',
                fontSize: '1rem',
              }}
            >
              <Home style={{ width: '1rem', height: '1rem' }} />
              <span>Go to Feed</span>
            </Link>
          </div>
        </div>
      </body>
    </html>
  )
}
