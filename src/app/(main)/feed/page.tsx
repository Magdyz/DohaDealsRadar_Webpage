'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, User, Package, Shield } from 'lucide-react'
import { Button, Spinner, Card, CardBody, DealCardSkeleton } from '@/components/ui'
import { DealCard, SearchBar, CategoryFilter } from '@/components/deals'
import { getDeals } from '@/lib/api/deals'
import { useAuthStore } from '@/lib/store/authStore'
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-surface shadow-lg sticky top-0 z-20 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary">
              Doha Deals Radar
            </h1>
            <div className="flex gap-2">
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
              >
                <Plus className="w-5 h-5 mr-2" />
                Post Deal
              </Button>
            </div>
          </div>

          {/* Search */}
          <SearchBar value={search} onChange={handleSearchChange} />

          {/* Category Filter */}
          <div className="mt-4">
            <CategoryFilter selected={category} onChange={handleCategoryChange} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              className="mx-auto"
              onClick={() => loadDeals(true)}
            >
              Try Again
            </Button>
          </div>
        ) : deals.length === 0 ? (
          <div className="bg-card rounded-2xl p-12 border border-border text-center max-w-md mx-auto">
            <Package className="w-20 h-20 text-text-tertiary mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-text-primary mb-2">
              No deals found
            </h3>
            <p className="text-text-secondary mb-6">
              {search || category
                ? 'Try adjusting your search or filters'
                : 'Be the first to post a deal!'}
            </p>
            {!search && !category && (
              <Button
                variant="primary"
                size="md"
                onClick={() => router.push('/submit')}
              >
                <Plus className="w-5 h-5 mr-2" />
                Post Deal
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Deals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {deals.map((deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>

            {/* Load More Loading Skeletons */}
            {isLoadingMore && (
              <div className="space-y-4 mt-6">
                {[1, 2, 3].map((i) => (
                  <DealCardSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Load More */}
            {hasMore && !isLoadingMore && (
              <div className="flex justify-center mt-6">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleLoadMore}
                  className="hover:bg-primary hover:text-white transition-all duration-300"
                >
                  Load More Deals
                </Button>
              </div>
            )}

            {!hasMore && deals.length > 0 && (
              <p className="text-center text-text-tertiary mt-6">
                You've reached the end!
              </p>
            )}
          </>
        )}
      </div>

      {/* Floating Action Buttons (Mobile) */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 md:hidden">
        <Button
          variant="secondary"
          size="lg"
          className="rounded-full w-14 h-14 p-0 shadow-lg"
          onClick={() => router.push('/account')}
        >
          <User className="w-6 h-6" />
        </Button>
        <Button
          variant="primary"
          size="lg"
          className="rounded-full w-14 h-14 p-0 shadow-lg"
          onClick={() => router.push('/submit')}
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>
    </div>
  )
}
