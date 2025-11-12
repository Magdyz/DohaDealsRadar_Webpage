// Server component - Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

import FeedPageClient from './FeedPageClient'

export default function FeedPage() {
  return <FeedPageClient />
}
