-- ============================================
-- DOHA DEALS RADAR - Database Schema
-- ============================================
-- This file contains the complete database schema for the DohaDealsRadar application.
-- Run this in your Supabase SQL Editor to set up all required tables.
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    username TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    auto_approve BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- ============================================
-- DEALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    link TEXT,
    location TEXT,
    category TEXT NOT NULL,
    promo_code TEXT,
    original_price NUMERIC(10, 2),
    discounted_price NUMERIC(10, 2),
    hot_votes INTEGER NOT NULL DEFAULT 0,
    cold_votes INTEGER NOT NULL DEFAULT 0,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    is_approved BOOLEAN NOT NULL DEFAULT false,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_deals_user_id ON public.deals(user_id);
CREATE INDEX IF NOT EXISTS idx_deals_is_approved ON public.deals(is_approved);
CREATE INDEX IF NOT EXISTS idx_deals_is_archived ON public.deals(is_archived);
CREATE INDEX IF NOT EXISTS idx_deals_category ON public.deals(category);
CREATE INDEX IF NOT EXISTS idx_deals_expires_at ON public.deals(expires_at);
CREATE INDEX IF NOT EXISTS idx_deals_created_at ON public.deals(created_at DESC);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_deals_approved_archived_expires
    ON public.deals(is_approved, is_archived, expires_at);

-- ============================================
-- VOTES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('hot', 'cold')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(deal_id, device_id)
);

-- Create indexes for votes
CREATE INDEX IF NOT EXISTS idx_votes_deal_id ON public.votes(deal_id);
CREATE INDEX IF NOT EXISTS idx_votes_device_id ON public.votes(device_id);

-- ============================================
-- REPORTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for reports
CREATE INDEX IF NOT EXISTS idx_reports_deal_id ON public.reports(deal_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for users table
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for deals table
DROP TRIGGER IF EXISTS update_deals_updated_at ON public.deals;
CREATE TRIGGER update_deals_updated_at
    BEFORE UPDATE ON public.deals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Users: Allow public read access
CREATE POLICY "Allow public read access to users" ON public.users
    FOR SELECT USING (true);

-- Users: Allow users to update their own data
CREATE POLICY "Allow users to update own data" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Deals: Allow public read access to approved, non-archived deals
CREATE POLICY "Allow public read access to active deals" ON public.deals
    FOR SELECT USING (
        is_approved = true
        AND is_archived = false
        AND expires_at > NOW()
    );

-- Deals: Allow authenticated users to insert deals
CREATE POLICY "Allow authenticated users to insert deals" ON public.deals
    FOR INSERT WITH CHECK (true);

-- Deals: Allow users to update their own deals
CREATE POLICY "Allow users to update own deals" ON public.deals
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Votes: Allow public read and insert
CREATE POLICY "Allow public read access to votes" ON public.votes
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert votes" ON public.votes
    FOR INSERT WITH CHECK (true);

-- Reports: Allow public insert
CREATE POLICY "Allow public insert reports" ON public.reports
    FOR INSERT WITH CHECK (true);

-- Reports: Allow moderators to read
CREATE POLICY "Allow moderators to read reports" ON public.reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('moderator', 'admin')
        )
    );

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Create a test user (uncomment to use)
-- INSERT INTO public.users (email, username, role, auto_approve) VALUES
--     ('test@example.com', 'testuser', 'user', true);

-- Create sample deals (uncomment to use)
-- INSERT INTO public.deals (
--     title,
--     description,
--     image_url,
--     link,
--     location,
--     category,
--     promo_code,
--     user_id,
--     is_approved,
--     expires_at
-- ) VALUES
--     (
--         'Amazing Deal on Electronics',
--         'Get 50% off on all electronics this weekend only!',
--         'https://via.placeholder.com/400x300',
--         'https://example.com/deal',
--         'Doha Mall',
--         'Electronics',
--         'SAVE50',
--         (SELECT id FROM public.users LIMIT 1),
--         true,
--         NOW() + INTERVAL '7 days'
--     ),
--     (
--         'Restaurant Special',
--         'Buy 1 Get 1 Free on all main courses',
--         'https://via.placeholder.com/400x300',
--         'https://example.com/restaurant',
--         'The Pearl',
--         'Food',
--         'BOGO2024',
--         (SELECT id FROM public.users LIMIT 1),
--         true,
--         NOW() + INTERVAL '14 days'
--     );

-- ============================================
-- DONE!
-- ============================================
-- Your database schema is now set up!
-- You can start using the application.
-- ============================================
