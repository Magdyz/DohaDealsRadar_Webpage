import type { Metadata, Viewport } from 'next'
import QueryProvider from '@/lib/providers/QueryProvider'
import ToastContainer from '@/components/ui/ToastContainer'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: 'Doha Deals Radar',
  description: 'Discover and share the best deals in Doha, Qatar',
  keywords: ['deals', 'Qatar', 'Doha', 'shopping', 'discounts', 'offers'],
  authors: [{ name: 'Doha Deals Radar' }],
  openGraph: {
    title: 'Doha Deals Radar',
    description: 'Discover and share the best deals in Doha, Qatar',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
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
        <ToastContainer />
      </body>
    </html>
  )
}
