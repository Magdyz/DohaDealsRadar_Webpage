-- ========================================
-- FIX USER ID MISMATCH - CRITICAL MIGRATION
-- ========================================
-- This script fixes the ID mismatch between auth.users and public.users
-- for the admin user ahmadmgdy@gmail.com
--
-- PROBLEM:
-- - auth.users.id = 889e8a7f-08d9-4ba2-aaad-576aa8b88059
-- - public.users.id = 454c7e37-9a6d-4366-b496-6b038692b452
-- - RLS policies check auth.uid() which doesn't match public.users.id
--
-- SOLUTION:
-- 1. Update all foreign key references to use the new auth user ID
-- 2. Delete the old user row
-- 3. Create new user row with correct ID
--
-- ========================================

-- STEP 1: Begin transaction
BEGIN;

-- STEP 2: Update all deals submitted by this user
-- Replace old user ID with auth user ID
UPDATE deals
SET submitted_by_user_id = '889e8a7f-08d9-4ba2-aaad-576aa8b88059'
WHERE submitted_by_user_id = '454c7e37-9a6d-4366-b496-6b038692b452';

-- STEP 3: Update all votes by this user (if votes table has user_id)
-- Check if votes table exists and has user_id column first
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'votes'
    ) THEN
        IF EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'votes'
            AND column_name = 'user_id'
        ) THEN
            UPDATE votes
            SET user_id = '889e8a7f-08d9-4ba2-aaad-576aa8b88059'
            WHERE user_id = '454c7e37-9a6d-4366-b496-6b038692b452';
        END IF;
    END IF;
END $$;

-- STEP 4: Update all reports by this user (if reports table has user_id)
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'reports'
    ) THEN
        IF EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'reports'
            AND column_name = 'user_id'
        ) THEN
            UPDATE reports
            SET user_id = '889e8a7f-08d9-4ba2-aaad-576aa8b88059'
            WHERE user_id = '454c7e37-9a6d-4366-b496-6b038692b452';
        END IF;
    END IF;
END $$;

-- STEP 5: Get the current user data before deleting
-- Store in temporary table
CREATE TEMP TABLE temp_admin_user AS
SELECT
    email,
    username,
    device_id,
    email_verified,
    last_login_at,
    total_deals_posted,
    approved_deals_count,
    rejected_deals_count,
    trust_level,
    submitted_deals_count,
    role,
    auto_approve
FROM users
WHERE id = '454c7e37-9a6d-4366-b496-6b038692b452';

-- STEP 6: Delete the old user row
DELETE FROM users
WHERE id = '454c7e37-9a6d-4366-b496-6b038692b452';

-- STEP 7: Create new user row with correct auth user ID
INSERT INTO users (
    id,
    email,
    username,
    device_id,
    email_verified,
    last_login_at,
    total_deals_posted,
    approved_deals_count,
    rejected_deals_count,
    trust_level,
    submitted_deals_count,
    role,
    auto_approve,
    created_at
)
SELECT
    '889e8a7f-08d9-4ba2-aaad-576aa8b88059'::uuid, -- Use auth user ID
    email,
    username,
    device_id,
    email_verified,
    last_login_at,
    total_deals_posted,
    approved_deals_count,
    rejected_deals_count,
    trust_level,
    submitted_deals_count,
    role,
    auto_approve,
    '2025-10-23 02:45:13.166414+00'::timestamptz -- Use auth.users created_at
FROM temp_admin_user;

-- STEP 8: Verify the migration
DO $$
DECLARE
    auth_id uuid := '889e8a7f-08d9-4ba2-aaad-576aa8b88059';
    user_count int;
    deals_count int;
BEGIN
    -- Check user was created with correct ID
    SELECT COUNT(*) INTO user_count
    FROM users
    WHERE id = auth_id AND email = 'ahmadmgdy@gmail.com';

    IF user_count = 0 THEN
        RAISE EXCEPTION 'Migration failed: User not found with auth ID';
    END IF;

    -- Check deals were migrated
    SELECT COUNT(*) INTO deals_count
    FROM deals
    WHERE submitted_by_user_id = auth_id;

    RAISE NOTICE 'Migration successful! User has % deals', deals_count;
END $$;

-- STEP 9: Commit transaction
COMMIT;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================
-- Run these after migration to verify everything worked:

-- 1. Check user exists with correct ID
SELECT id, email, role, created_at
FROM users
WHERE email = 'ahmadmgdy@gmail.com';

-- 2. Check deals are associated correctly
SELECT COUNT(*) as deal_count
FROM deals
WHERE submitted_by_user_id = '889e8a7f-08d9-4ba2-aaad-576aa8b88059';

-- 3. Verify auth.uid() matches
-- (Run this when logged in as this user)
SELECT
    auth.uid() as current_auth_id,
    u.id as user_table_id,
    auth.uid() = u.id as ids_match
FROM users u
WHERE u.email = 'ahmadmgdy@gmail.com';

-- Expected result: ids_match = true
