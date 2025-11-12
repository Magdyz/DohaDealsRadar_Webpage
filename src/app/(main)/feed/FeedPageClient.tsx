'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, User, Package, Shield } from 'lucide-react'
import { Button, Spinner, Card, CardBody, DealCardSkeleton } from '@/components/ui'
import { DealCard, SearchBar, CategoryFilter } from '@/components/deals'
import { getDeals } from '@/lib/api/deals'
import { useAuthStore } from '@/lib/store/authStore'
import { useInfiniteScroll } from '@/lib/hooks/useInfiniteScroll'
import type { Deal, DealCategory } from '@/types'

export default function FeedPage() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()

  const [deals, setDeals] = useState<Deal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<DealCategory | ''>('')

  useEffect(() => {
    loadDeals(true)
  }, [search, category])

  const loadDeals = async (reset: boolean = false) => {
    const currentPage = reset ? 1 : page

    if (reset) {
      setIsLoading(true)
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
        isArchived: false,
      })

      if (reset) {
        setDeals(response.deals)
      } else {
        setDeals([...deals, ...response.deals])
      }

      setHasMore(response.hasMore)
      setPage(currentPage + 1)
    } catch (err: any) {
      setError(err.message || 'Failed to load deals')
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      loadDeals()
    }
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleCategoryChange = (value: DealCategory | '') => {
    setCategory(value)
    setPage(1)
  }

  // Infinite scroll - automatically load more when scrolling near bottom
  const { observerTarget } = useInfiniteScroll({
    onLoadMore: () => loadDeals(),
    hasMore,
    isLoading: isLoadingMore,
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Compact, mobile-first */}
      <div className="bg-surface shadow-sm sticky top-0 z-20 border-b border-border">
        <div className="max-w-7xl mx-auto px-3 py-3 md:px-4 md:py-4">
          {/* Top Bar - Title & Icons */}
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl md:text-2xl font-bold text-text-primary">
              Doha Deals Radar
            </h1>
            <div className="hidden md:flex gap-2">
              {user && (user.role === 'moderator' || user.role === 'admin') && (
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => router.push('/moderation')}
                >
                  <Shield className="w-5 h-5" />
                </Button>
              )}
              <Button
                variant="outline"
                size="md"
                onClick={() => router.push('/account')}
              >
                <User className="w-5 h-5" />
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => router.push('/submit')}
                className="bg-action-primary hover:bg-primary-dark"
              >
                <Plus className="w-5 h-5 mr-2" />
                Post Deal
              </Button>
            </div>
          </div>

          {/* Search */}
          <SearchBar value={search} onChange={handleSearchChange} />
        </div>

        {/* Category Filter - Horizontal Scroll */}
        <div className="overflow-x-auto scrollbar-hide">
          <CategoryFilter selected={category} onChange={handleCategoryChange} />
        </div>
      </div>

      {/* Content - Mobile-first 2-column grid */}
      <div className="max-w-7xl mx-auto px-2 py-3 md:px-4 md:py-6">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <DealCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="bg-card rounded-2xl p-8 border border-border text-center max-w-md mx-auto">
            <p className="text-red-500 mb-4">{error}</p>
            <Button
              variant="primary"
              size="md"
              className="mx-auto bg-action-primary hover:bg-primary-dark"
              onClick={() => loadDeals(true)}
            >
              Try Again
            </Button>
          </div>
        ) : deals.length === 0 ? (
          <div className="bg-card rounded-2xl p-8 md:p-12 border border-border text-center max-w-md mx-auto">
            <Package className="w-16 md:w-20 h-16 md:h-20 text-text-tertiary mx-auto mb-4 opacity-50" />
            <h3 className="text-lg md:text-xl font-bold text-text-primary mb-2">
              No deals found
            </h3>
            <p className="text-sm md:text-base text-text-secondary mb-6">
              {search || category
                ? 'Try adjusting your search or filters'
                : 'Be the first to post a deal!'}
            </p>
            {!search && !category && (
              <Button
                variant="primary"
                size="md"
                onClick={() => router.push('/submit')}
                className="bg-action-primary hover:bg-primary-dark"
              >
                <Plus className="w-5 h-5 mr-2" />
                Post Deal
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Deals Grid - Mobile-first 2 columns */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
              {deals.map((deal) => (
                <DealCard key={deal.id} deal={deal} />
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
                  {deals.length} deal{deals.length !== 1 ? 's' : ''} loaded
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating Action Buttons (Mobile) */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-3 md:hidden">
        <button
          className="w-14 h-14 rounded-full bg-surface border-2 border-border shadow-lg flex items-center justify-center text-text-primary hover:bg-background-secondary transition-colors"
          onClick={() => router.push('/account')}
        >
          <User className="w-6 h-6" />
        </button>
        <button
          className="w-14 h-14 rounded-full bg-action-primary shadow-lg flex items-center justify-center text-white hover:bg-primary-dark transition-colors"
          onClick={() => router.push('/submit')}
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </div>
  )
}
