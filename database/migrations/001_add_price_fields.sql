-- ============================================
-- Migration: Add Price Fields to Deals Table
-- Date: 2025-11-17
-- Description: Add original_price and discounted_price columns to support deal pricing
-- ============================================

-- Add price columns to deals table
ALTER TABLE public.deals
ADD COLUMN IF NOT EXISTS original_price NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS discounted_price NUMERIC(10, 2);

-- Add comment for documentation
COMMENT ON COLUMN public.deals.original_price IS 'Original price before discount (optional)';
COMMENT ON COLUMN public.deals.discounted_price IS 'Discounted/sale price (optional)';

-- Add check constraint to ensure discounted price is less than original price when both exist
ALTER TABLE public.deals
ADD CONSTRAINT check_discount_logic CHECK (
    discounted_price IS NULL
    OR original_price IS NULL
    OR discounted_price < original_price
);

-- If you have existing data with string prices, convert them:
-- UPDATE public.deals SET original_price = original_price::numeric WHERE original_price IS NOT NULL;
-- UPDATE public.deals SET discounted_price = discounted_price::numeric WHERE discounted_price IS NOT NULL;

-- ============================================
-- Migration Complete!
-- ============================================
