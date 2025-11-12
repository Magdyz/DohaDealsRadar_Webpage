'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Package } from 'lucide-react'
import { Button, Spinner, Card, CardBody } from '@/components/ui'
import { ArchivedDealCard, SearchBar, CategoryFilter } from '@/components/deals'
import { ProtectedRoute } from '@/components/auth'
import { getDeals } from '@/lib/api/deals'
import { useIsAdmin, useUser } from '@/lib/store/authStore'
import { useToast } from '@/lib/hooks/useToast'
import { useInfiniteScroll } from '@/lib/hooks/useInfiniteScroll'
import type { Deal, DealCategory } from '@/types'

// Force dynamic rendering to prevent prerendering issues
export const dynamic = 'force-dynamic'

function ArchivePageContent() {
  const router = useRouter()
  const isAdmin = useIsAdmin()
  const user = useUser()
  const { toast } = useToast()

  const [deals, setDeals] = useState<Deal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [hasMore, setHasMore] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<DealCategory | ''>('')

  // Use ref to track next page - updates immediately, no async issues
  const nextPageRef = useRef(1)

  // Prevent SSR/SSG - only render on client
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const loadDeals = useCallback(async (reset: boolean = false) => {
    // Use ref for immediate, synchronous page tracking
    const currentPage = reset ? 1 : nextPageRef.current

    if (reset) {
      setIsLoading(true)
      nextPageRef.current = 1 // Reset to page 1
    } else {
      setIsLoadingMore(true)
    }

    setError('')

    try {
      const response = await getDeals({
        page: currentPage,
        limit: 20,
        search,
        category,
        isArchived: true,
      })

      if (reset) {
        setDeals(response.deals)
        nextPageRef.current = 2 // Next page will be 2
      } else {
        // Use functional update to avoid stale closure
        setDeals(prevDeals => [...prevDeals, ...response.deals])
        nextPageRef.current = currentPage + 1 // Increment immediately
      }

      setHasMore(response.hasMore)
    } catch (err: any) {
      setError(err.message || 'Failed to load archived deals')
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [search, category])

  useEffect(() => {
    loadDeals(true)
  }, [search, category, loadDeals])

  const handleRestore = async (dealId: string) => {
    try {
      const response = await fetch('/api/restore-deal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId,
          moderatorUserId: user?.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to restore deal')
      }

      toast.success('Deal restored to feed successfully!')

      // Remove the deal from the list
      setDeals(deals.filter((deal) => deal.id !== dealId))
    } catch (err: any) {
      toast.error(err.message || 'Failed to restore deal')
    }
  }

  const handleDelete = async (dealId: string) => {
    try {
      const response = await fetch('/api/delete-deal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId,
          moderatorUserId: user?.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete deal')
      }

      toast.success('Deal permanently deleted')

      // Remove the deal from the list
      setDeals(deals.filter((deal) => deal.id !== dealId))
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete deal')
    }
  }

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      loadDeals()
    }
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    nextPageRef.current = 1 // Reset page on search change
  }

  const handleCategoryChange = (value: DealCategory | '') => {
    setCategory(value)
    nextPageRef.current = 1 // Reset page on category change
  }

  // Infinite scroll - automatically load more when scrolling near bottom
  const { observerTarget } = useInfiniteScroll({
    onLoadMore: loadDeals,
    hasMore,
    isLoading: isLoadingMore,
  })

  // Prevent rendering until client-side mounted
  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card variant="outlined">
          <CardBody>
            <p className="text-center text-red-600">
              You need admin privileges to access this page
            </p>
            <Button
              variant="primary"
              size="md"
              className="mx-auto mt-4"
              onClick={() => router.push('/feed')}
            >
              Back to Feed
            </Button>
          </CardBody>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-secondary">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="md" onClick={() => router.push('/feed')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-2xl font-bold text-text-primary">Archive</h1>
            </div>
          </div>

          {/* Search */}
          <SearchBar value={search} onChange={handleSearchChange} placeholder="Search archived deals..." />

          {/* Category Filter */}
          <div className="mt-4">
            <CategoryFilter selected={category} onChange={handleCategoryChange} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <Card variant="outlined">
            <CardBody>
              <p className="text-center text-red-600">{error}</p>
              <Button
                variant="primary"
                size="md"
                className="mx-auto mt-4"
                onClick={() => loadDeals(true)}
              >
                Try Again
              </Button>
            </CardBody>
          </Card>
        ) : deals.length === 0 ? (
          <Card variant="outlined">
            <CardBody>
              <div className="text-center py-8">
                <Package className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  No archived deals found
                </h3>
                <p className="text-text-secondary">
                  {search || category
                    ? 'Try adjusting your search or filters'
                    : 'All archived and rejected deals will appear here'}
                </p>
              </div>
            </CardBody>
          </Card>
        ) : (
          <>
            {/* Deals Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {deals.map((deal) => (
                <ArchivedDealCard
                  key={deal.id}
                  deal={deal}
                  onRestore={handleRestore}
                  onDelete={handleDelete}
                />
              ))}
            </div>

            {/* Infinite Scroll Trigger */}
            {hasMore && (
              <>
                {/* Observer target - triggers load when visible */}
                <div ref={observerTarget} className="h-4" />

                {/* Loading indicator */}
                {isLoadingMore && (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Spinner size="md" />
                    <p className="text-text-secondary text-sm mt-3">
                      Loading more deals...
                    </p>
                  </div>
                )}
              </>
            )}

            {/* End of content message */}
            {!hasMore && deals.length > 0 && (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-12 h-12 rounded-full bg-background-secondary border-2 border-border flex items-center justify-center mb-3">
                  <Package className="w-6 h-6 text-text-tertiary" />
                </div>
                <p className="text-text-tertiary text-sm font-medium">
                  You've reached the end!
                </p>
                <p className="text-text-tertiary text-xs mt-1">
                  {deals.length} archived deal{deals.length !== 1 ? 's' : ''} loaded
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function ArchivePage() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <ArchivePageContent />
    </ProtectedRoute>
  )
}
