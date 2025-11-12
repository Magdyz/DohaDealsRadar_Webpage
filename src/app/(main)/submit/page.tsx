// Server component - Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

import SubmitPageClient from './SubmitPageClient'

export default function SubmitPage() {
  return <SubmitPageClient />
}
