import type { Metadata } from 'next'
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-background text-text-primary">{children}</body>
    </html>
  )
}
