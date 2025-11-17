interface PriceDisplayProps {
  originalPrice: number | null
  discountedPrice: number | null
}

export default function PriceDisplay({ originalPrice, discountedPrice }: PriceDisplayProps) {
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

  // Case 4: No price
  if (!originalPrice && !discountedPrice) {
    return <div className="h-[40px]" />
  }

  // Case 1: Both prices exist (discount scenario)
  if (originalPrice && discountedPrice) {
    const discountPercentage = getDiscountPercentage(originalPrice, discountedPrice)

    return (
      <div className="h-[40px] flex flex-col justify-center gap-1">
        {/* Line 1: Discounted price (prominent) */}
        <div className="text-[14px] font-bold text-[#E91E63]">
          {formatPrice(discountedPrice)}
        </div>

        {/* Line 2: Original price (strikethrough) + Discount percentage */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-gray-500 dark:text-gray-400 line-through">
            {formatPrice(originalPrice)}
          </span>
          <span className="text-[11px] font-bold text-[#10B981]">
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
        <div className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">
          {formatPrice(originalPrice)}
        </div>
      </div>
    )
  }

  // Case 3: Only discounted price
  if (!originalPrice && discountedPrice) {
    return (
      <div className="h-[40px] flex items-center">
        <div className="text-[14px] font-bold text-[#E91E63]">
          {formatPrice(discountedPrice)}
        </div>
      </div>
    )
  }

  // Fallback (should never reach here)
  return <div className="h-[40px]" />
}
