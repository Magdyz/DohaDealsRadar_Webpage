// Server component - Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

import ModerationPageClient from './ModerationPageClient'

export default function ModerationPage() {
  return <ModerationPageClient />
}
