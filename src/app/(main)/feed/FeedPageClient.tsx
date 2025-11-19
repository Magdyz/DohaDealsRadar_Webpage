'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Plus, User, Package, Shield, Archive } from 'lucide-react'
import { Button, Spinner, Card, CardBody, DealCardSkeleton } from '@/components/ui'
import { DealCard, SearchBar, CategoryFilter } from '@/components/deals'
import { getDeals } from '@/lib/api/deals'
import { useAuthStore } from '@/lib/store/authStore'
import { useInfiniteScroll } from '@/lib/hooks/useInfiniteScroll'
import type { Deal, DealCategory } from '@/types'

export default function FeedPage() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<DealCategory | ''>('')

  // PERFORMANCE: Use React Query for automatic caching, deduplication, and background refetching
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ['deals', search, category],
    queryFn: ({ pageParam = 1 }) =>
      getDeals({
        page: pageParam,
        limit: 20,
        search,
        category,
        isArchived: false,
      }),
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.page + 1 : undefined
    },
    initialPageParam: 1,
    staleTime: 1000 * 60 * 2, // Data fresh for 2 minutes
    gcTime: 1000 * 60 * 5, // Cache for 5 minutes
  })

  // Flatten all pages into single deals array
  const deals = data?.pages.flatMap((page) => page.deals) ?? []

  const handleSearchChange = (value: string) => {
    setSearch(value)
  }

  const handleCategoryChange = (value: DealCategory | '') => {
    setCategory(value)
  }

  // Infinite scroll - automatically load more when scrolling near bottom
  const { observerTarget } = useInfiniteScroll({
    onLoadMore: () => {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    },
    hasMore: hasNextPage ?? false,
    isLoading: isFetchingNextPage,
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Header - 2025 Modern Design */}
      <div className="bg-surface shadow-md sticky top-0 z-20 border-b border-border/50 backdrop-blur-sm bg-surface/95">
        <div className="max-w-7xl mx-auto px-3 py-3 md:px-6 md:py-5">
          {/* Top Bar - Title & Icons */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight">
              Doha Deals Radar
            </h1>
            <div className="hidden md:flex gap-3">
              {user && (user.role === 'moderator' || user.role === 'admin') && (
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => router.push('/moderation')}
                >
                  <Shield className="w-5 h-5" />
                </Button>
              )}
              {user && user.role === 'admin' && (
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => router.push('/archive')}
                >
                  <Archive className="w-5 h-5" />
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

      {/* Content - 2025 Modern Mobile-first grid with optimized spacing */}
      <div className="max-w-7xl mx-auto px-3 py-4 md:px-6 md:py-8">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5 auto-rows-fr">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <DealCardSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <div className="bg-card rounded-2xl p-10 md:p-12 border-2 border-error/20 shadow-lg text-center max-w-md mx-auto animate-scale-in">
            <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <p className="text-error text-base font-semibold mb-6">
              {error instanceof Error ? error.message : 'Failed to load deals'}
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        ) : deals.length === 0 ? (
          <div className="bg-card rounded-2xl p-10 md:p-16 border-2 border-border/30 shadow-lg text-center max-w-lg mx-auto animate-scale-in">
            <Package className="w-20 md:w-24 h-20 md:h-24 text-text-tertiary mx-auto mb-6 opacity-40" />
            <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-3">
              No deals found
            </h2>
            <p className="text-base md:text-lg text-text-secondary mb-8 leading-relaxed">
              {search || category
                ? 'Try adjusting your search or filters'
                : 'Be the first to post a deal!'}
            </p>
            {!search && !category && (
              <Button
                variant="primary"
                size="lg"
                onClick={() => router.push('/submit')}
              >
                <Plus className="w-5 h-5 mr-2" />
                Post Deal
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Deals Grid - 2025 Mobile-first with optimized spacing */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5 auto-rows-fr">
              {deals.map((deal, index) => (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  priority={index < 2} // Only prioritize first 2 images (truly above-the-fold on mobile)
                />
              ))}
            </div>

            {/* Infinite Scroll Trigger */}
            {hasNextPage && (
              <>
                {/* Observer target - triggers load when visible */}
                <div ref={observerTarget} className="h-4" />

                {/* Loading indicator */}
                {isFetchingNextPage && (
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
            {!hasNextPage && deals.length > 0 && (
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

      {/* Floating Action Buttons (Mobile) - 2025 Modern Design */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-4 md:hidden z-30">
        <button
          className="w-14 h-14 rounded-full bg-surface border-2 border-border shadow-lg flex items-center justify-center text-text-primary hover:bg-background-secondary hover:scale-110 transition-all duration-300 active:scale-95"
          onClick={() => router.push('/account')}
          aria-label="Account"
        >
          <User className="w-6 h-6" />
        </button>
        <button
          className="w-16 h-16 rounded-full bg-gradient-to-br from-action-primary to-primary-dark shadow-purple flex items-center justify-center text-white hover:shadow-xl hover:scale-110 transition-all duration-300 active:scale-95 animate-pulse-slow"
          onClick={() => router.push('/submit')}
          aria-label="Post Deal"
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>
    </div>
  )
}
