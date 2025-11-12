// Server component - Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

import ArchivePageClient from './ArchivePageClient'

export default function ArchivePage() {
  return <ArchivePageClient />
}
