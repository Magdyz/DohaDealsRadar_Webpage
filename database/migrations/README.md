# Database Migrations

This directory contains database migrations for DohaDealsRadar.

## How to Apply Migrations

### If you have existing data with TEXT price columns:

1. **First, check your current column types:**
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'deals'
AND column_name IN ('original_price', 'discounted_price');
```

2. **If they are TEXT/VARCHAR, convert them to NUMERIC:**
```sql
-- Convert existing TEXT columns to NUMERIC
ALTER TABLE public.deals
ALTER COLUMN original_price TYPE NUMERIC(10, 2) USING original_price::numeric;

ALTER TABLE public.deals
ALTER COLUMN discounted_price TYPE NUMERIC(10, 2) USING discounted_price::numeric;
```

3. **If columns don't exist yet, run the migration:**
```sql
-- Run the migration file in Supabase SQL Editor
-- Copy contents of 001_add_price_fields.sql and execute
```

4. **Add the validation constraint:**
```sql
ALTER TABLE public.deals
ADD CONSTRAINT check_discount_logic CHECK (
    discounted_price IS NULL
    OR original_price IS NULL
    OR discounted_price < original_price
);
```

### For fresh installations:

Just run the main `schema.sql` file which includes these columns.

## Migration Order

1. `001_add_price_fields.sql` - Adds original_price and discounted_price columns

## Verification

After running migrations, verify with:
```sql
-- Check column types
SELECT column_name, data_type, numeric_precision, numeric_scale
FROM information_schema.columns
WHERE table_name = 'deals'
AND column_name IN ('original_price', 'discounted_price');

-- Should return:
-- original_price  | numeric | 10 | 2
-- discounted_price | numeric | 10 | 2
```

## Notes

- Prices are stored as NUMERIC(10, 2) - allows up to 99,999,999.99
- Both fields are nullable (optional)
- Frontend sends numbers, backend stores as numeric
- Constraint ensures discounted_price < original_price when both exist
