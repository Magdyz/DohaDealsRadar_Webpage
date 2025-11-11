'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Package } from 'lucide-react'
import { Button, Spinner, Card, CardBody } from '@/components/ui'
import { DealCard, SearchBar, CategoryFilter } from '@/components/deals'
import { ProtectedRoute } from '@/components/auth'
import { getDeals } from '@/lib/api/deals'
import { useIsAdmin } from '@/lib/store/authStore'
import type { Deal, DealCategory } from '@/types'

function ArchivePageContent() {
  const router = useRouter()
  const isAdmin = useIsAdmin()

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
        isArchived: true,
      })

      if (reset) {
        setDeals(response.deals)
      } else {
        setDeals([...deals, ...response.deals])
      }

      setHasMore(response.hasMore)
      setPage(currentPage + 1)
    } catch (err: any) {
      setError(err.message || 'Failed to load archived deals')
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
            {/* Deals List */}
            <div className="space-y-4">
              {deals.map((deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center mt-6">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleLoadMore}
                  isLoading={isLoadingMore}
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
