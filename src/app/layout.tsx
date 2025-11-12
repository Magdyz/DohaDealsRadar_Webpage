import type { Metadata, Viewport } from 'next'
import QueryProvider from '@/lib/providers/QueryProvider'
import ToastContainer from '@/components/ui/ToastContainer'
import PWAInstallPrompt from '@/components/PWAInstallPrompt' // PWA: Install prompt component
import '../styles/globals.css'

// ========================================
// METADATA CONFIGURATION
// ========================================
// IMPORTANT: All existing metadata preserved, PWA metadata added below
export const metadata: Metadata = {
  title: 'Doha Deals Radar',
  description: 'Discover and share the best deals in Doha, Qatar',
  keywords: ['deals', 'Qatar', 'Doha', 'shopping', 'discounts', 'offers'],
  authors: [{ name: 'Doha Deals Radar' }],

  // Existing OpenGraph metadata - DO NOT MODIFY
  openGraph: {
    title: 'Doha Deals Radar',
    description: 'Discover and share the best deals in Doha, Qatar',
    type: 'website',
  },

  // PWA: Web App Manifest
  manifest: '/manifest.json',

  // PWA: Apple-specific meta tags
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Deals Radar',
  },

  // PWA: Additional icons
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },

  // PWA: Other metadata
  applicationName: 'Doha Deals Radar',
  formatDetection: {
    telephone: false,
  },
}

// ========================================
// VIEWPORT CONFIGURATION
// ========================================
// IMPORTANT: Existing viewport settings preserved, PWA settings added
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true, // PWA: Allow user scaling for accessibility
  themeColor: '#9046CF', // PWA: Theme color matching app's primary purple
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-background text-text-primary antialiased">
        <QueryProvider>{children}</QueryProvider>
        {/* Existing ToastContainer - DO NOT MODIFY */}
        <ToastContainer />
        {/* PWA: Install prompt - shows on supported browsers after delay */}
        <PWAInstallPrompt />
      </body>
    </html>
  )
}
