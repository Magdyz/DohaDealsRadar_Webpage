// Server component - Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

import PostPageClient from './PostPageClient'

export default function PostPage() {
  return <PostPageClient />
}
