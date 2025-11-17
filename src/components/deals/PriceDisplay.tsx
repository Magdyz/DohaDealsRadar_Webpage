interface PriceDisplayProps {
  originalPrice: number | null
  discountedPrice: number | null
  variant?: 'card' | 'details'  // New prop for size variant
}

export default function PriceDisplay({ originalPrice, discountedPrice, variant = 'card' }: PriceDisplayProps) {
  // Helper function to format price with QR prefix and thousands separator
  const formatPrice = (price: number): string => {
    // Check if it's a whole number
    const isWhole = price % 1 === 0
    const formatted = isWhole
      ? price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
      : price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

    return `QR ${formatted}`
  }

  // Calculate discount percentage
  const getDiscountPercentage = (original: number, discounted: number): number => {
    return Math.floor(((original - discounted) / original) * 100)
  }

  // Font sizes based on variant
  const sizes = variant === 'details'
    ? {
        discounted: 'text-[26px]',
        original: 'text-[16px]',
        percentage: 'text-[16px]',
        single: 'text-[24px]',
        gap: 'gap-1',
      }
    : {
        discounted: 'text-[14px]',
        original: 'text-[11px]',
        percentage: 'text-[11px]',
        single: 'text-[13px]',
        gap: 'gap-1',
      }

  // Case 4: No price
  if (!originalPrice && !discountedPrice) {
    return <div className="h-[40px]" />
  }

  // Case 1: Both prices exist (discount scenario)
  if (originalPrice && discountedPrice) {
    const discountPercentage = getDiscountPercentage(originalPrice, discountedPrice)

    return (
      <div className={`h-[40px] flex flex-col justify-center ${sizes.gap}`}>
        {/* Line 1: Discounted price (prominent) */}
        <div className={`${sizes.discounted} font-bold text-[#E91E63] leading-tight`}>
          {formatPrice(discountedPrice)}
        </div>

        {/* Line 2: Original price (strikethrough) + Discount percentage */}
        <div className="flex items-center gap-1.5">
          <span className={`${sizes.original} text-gray-500 dark:text-gray-400 line-through leading-tight`}>
            {formatPrice(originalPrice)}
          </span>
          <span className={`${sizes.percentage} font-bold text-[#10B981] leading-tight`}>
            -{discountPercentage}%
          </span>
        </div>
      </div>
    )
  }

  // Case 2: Only original price
  if (originalPrice && !discountedPrice) {
    return (
      <div className="h-[40px] flex items-center">
        <div className={`${sizes.single} font-semibold text-zinc-900 dark:text-zinc-100`}>
          {formatPrice(originalPrice)}
        </div>
      </div>
    )
  }

  // Case 3: Only discounted price
  if (!originalPrice && discountedPrice) {
    return (
      <div className="h-[40px] flex items-center">
        <div className={`${sizes.discounted} font-bold text-[#E91E63]`}>
          {formatPrice(discountedPrice)}
        </div>
      </div>
    )
  }

  // Fallback (should never reach here)
  return <div className="h-[40px]" />
}
