import { useEffect, useRef, useCallback } from 'react'

interface UseInfiniteScrollOptions {
  /**
   * Function to call when user scrolls near the bottom
   */
  onLoadMore: () => void | Promise<void>

  /**
   * Whether there are more items to load
   */
  hasMore: boolean

  /**
   * Whether currently loading
   */
  isLoading: boolean

  /**
   * Distance from bottom to trigger load (in pixels)
   * @default 200
   */
  threshold?: number

  /**
   * Whether the hook is enabled
   * @default true
   */
  enabled?: boolean
}

/**
 * Custom hook for implementing infinite scroll using Intersection Observer
 *
 * @example
 * ```tsx
 * const loadMore = async () => {
 *   const newDeals = await fetchDeals(page + 1)
 *   setDeals([...deals, ...newDeals])
 *   setPage(page + 1)
 * }
 *
 * const { observerTarget } = useInfiniteScroll({
 *   onLoadMore: loadMore,
 *   hasMore: hasMoreDeals,
 *   isLoading: isLoadingMore,
 * })
 *
 * return (
 *   <div>
 *     {deals.map(deal => <DealCard key={deal.id} deal={deal} />)}
 *     <div ref={observerTarget} />
 *   </div>
 * )
 * ```
 */
export function useInfiniteScroll({
  onLoadMore,
  hasMore,
  isLoading,
  threshold = 200,
  enabled = true,
}: UseInfiniteScrollOptions) {
  const observerTarget = useRef<HTMLDivElement>(null)

  // Track loading state synchronously to prevent race conditions
  const isLoadingRef = useRef(false)
  const hasMoreRef = useRef(hasMore)

  // Update refs when props change
  useEffect(() => {
    isLoadingRef.current = isLoading
  }, [isLoading])

  useEffect(() => {
    hasMoreRef.current = hasMore
  }, [hasMore])

  const handleIntersection = useCallback(
    async (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries

      // Only load more if:
      // 1. Target is intersecting (visible)
      // 2. Not currently loading (check ref for immediate value)
      // 3. There are more items to load (check ref for immediate value)
      // 4. Hook is enabled
      if (
        entry.isIntersecting &&
        !isLoadingRef.current &&
        hasMoreRef.current &&
        enabled
      ) {
        // Set loading flag immediately to prevent duplicate calls
        isLoadingRef.current = true
        try {
          await onLoadMore()
        } finally {
          // Reset will happen when isLoading state updates via useEffect above
        }
      }
    },
    [onLoadMore, enabled]
  )

  useEffect(() => {
    const currentTarget = observerTarget.current

    if (!currentTarget || !enabled || !hasMore) {
      return
    }

    // Create Intersection Observer
    const observer = new IntersectionObserver(handleIntersection, {
      root: null, // Use viewport as root
      rootMargin: `${threshold}px`, // Trigger when within threshold pixels
      threshold: 0.1, // Trigger when 10% of target is visible
    })

    // Start observing
    observer.observe(currentTarget)

    // Cleanup
    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
      observer.disconnect()
    }
  }, [handleIntersection, threshold, enabled, hasMore])

  return { observerTarget }
}
