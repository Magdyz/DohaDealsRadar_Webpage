# Email-Based Voting Migration Plan

## Executive Summary

This document outlines a comprehensive plan to migrate from **device-id based voting** to **email-based voting**, requiring user authentication to cast votes. This is a **major architectural change** that will impact user experience, database schema, API endpoints, frontend components, and existing data.

---

## Table of Contents

1. [Current Implementation Analysis](#1-current-implementation-analysis)
2. [Proposed Architecture](#2-proposed-architecture)
3. [Migration Strategy](#3-migration-strategy)
4. [Database Changes](#4-database-changes)
5. [API Changes](#5-api-changes)
6. [Frontend Changes](#6-frontend-changes)
7. [Security Improvements](#7-security-improvements)
8. [Risks & Mitigation](#8-risks--mitigation)
9. [Implementation Phases](#9-implementation-phases)
10. [Testing Strategy](#10-testing-strategy)
11. [Rollback Plan](#11-rollback-plan)

---

## 1. Current Implementation Analysis

### 1.1 Voting Flow (Current)

```
User views deal → Clicks vote button →
Frontend checks localStorage for deviceId →
API validates device hasn't voted →
Vote stored with device_id →
Vote counts updated
```

**Key Characteristics:**
- ✅ **Anonymous voting** - No login required
- ✅ **Fast user experience** - Low friction
- ❌ **Easy to manipulate** - Users can clear localStorage and re-vote
- ❌ **No accountability** - Can't track voting patterns per user
- ❌ **Device-locked** - Users can't vote from multiple devices

### 1.2 Current Database Schema

```sql
CREATE TABLE public.votes (
    id UUID PRIMARY KEY,
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    vote_type TEXT CHECK (vote_type IN ('hot', 'cold')),
    created_at TIMESTAMPTZ,
    UNIQUE(deal_id, device_id)  -- Prevents duplicate votes per device
);
```

### 1.3 Current Components

| Component | File | Responsibility |
|-----------|------|----------------|
| VoteButtons | `src/components/deals/VoteButtons.tsx` | Standalone voting UI |
| DealCard | `src/components/deals/DealCard.tsx` | Inline voting in deal cards |
| API Route | `src/app/api/cast-vote/route.ts` | Vote processing |
| Device ID Hook | `src/lib/hooks/useDeviceId.ts` | Device ID management |
| Local Storage | `src/lib/utils/localStorage.ts` | Vote state persistence |

### 1.4 Current Vote Statistics

Based on provided data sample:
- **Votes table**: Uses `device_id` as voter identifier
- **Users table**: Has `device_id` but independent of voting
- **No linkage**: Device IDs in votes table don't necessarily correspond to users

---

## 2. Proposed Architecture

### 2.1 New Voting Flow

```
User views deal → Clicks vote button →
[IF NOT LOGGED IN] → Show login modal → User logs in →
Frontend checks user's email →
API validates user_id/email hasn't voted →
Vote stored with user_id and email →
Vote counts updated
```

**Key Changes:**
- ✅ **Authenticated voting** - Login required
- ✅ **Fraud prevention** - Email verification required
- ✅ **User accountability** - Track voting patterns
- ✅ **Cross-device** - Vote from any device with same account
- ❌ **Higher friction** - May reduce casual engagement
- ❌ **Email requirement** - Anonymous users can't vote

### 2.2 New Database Schema

```sql
CREATE TABLE public.votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,  -- Denormalized for quick lookups
    vote_type TEXT NOT NULL CHECK (vote_type IN ('hot', 'cold')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Legacy fields (for migration period)
    device_id TEXT,  -- Keep during transition, nullable
    migrated_from_device BOOLEAN DEFAULT false,

    -- Constraints
    UNIQUE(deal_id, user_id),  -- One vote per user per deal
    UNIQUE(deal_id, email)     -- Backup constraint using email
);

-- Indexes
CREATE INDEX idx_votes_user_id ON votes(user_id);
CREATE INDEX idx_votes_email ON votes(email);
CREATE INDEX idx_votes_deal_id ON votes(deal_id);
CREATE INDEX idx_votes_created_at ON votes(created_at DESC);
```

### 2.3 Hybrid Approach (Optional Transition Period)

To minimize user disruption, consider a **hybrid period** where both systems work:

```sql
-- During transition: Allow either device_id OR user_id
ALTER TABLE votes
    ALTER COLUMN device_id DROP NOT NULL,
    ADD COLUMN user_id UUID REFERENCES users(id),
    ADD COLUMN email TEXT;

-- Add check constraint: Must have either device_id OR (user_id AND email)
ALTER TABLE votes
    ADD CONSTRAINT vote_identifier_check
    CHECK (
        (device_id IS NOT NULL AND user_id IS NULL) OR
        (device_id IS NULL AND user_id IS NOT NULL AND email IS NOT NULL)
    );
```

---

## 3. Migration Strategy

### 3.1 Data Migration Approaches

#### Option A: **Fresh Start** (Recommended)

**Approach:**
1. Archive existing votes to `votes_archive` table
2. Reset all vote counts to 0
3. Deploy new email-based system
4. Users re-vote with authenticated accounts

**Pros:**
- ✅ Clean data - No ambiguous device→user mappings
- ✅ Simpler implementation
- ✅ All votes have verified emails
- ✅ Fresh engagement opportunity

**Cons:**
- ❌ Lose historical voting data
- ❌ Vote counts reset (may affect deal rankings)
- ❌ User confusion - "Where did my votes go?"

**Mitigation:**
- Keep archived votes for analytics
- Announce the change prominently
- Explain security/fraud prevention benefits

---

#### Option B: **Best-Effort Migration**

**Approach:**
1. Match device_id to users table where possible
2. Migrate matched votes to email-based system
3. Archive unmatched anonymous votes
4. Update vote counts based on migrated votes

**SQL Migration:**
```sql
-- Step 1: Add new columns
ALTER TABLE votes
    ADD COLUMN user_id UUID,
    ADD COLUMN email TEXT,
    ADD COLUMN migrated_from_device BOOLEAN DEFAULT false;

-- Step 2: Migrate votes where device_id matches users table
UPDATE votes v
SET
    user_id = u.id,
    email = u.email,
    migrated_from_device = true
FROM users u
WHERE v.device_id = u.device_id
    AND u.email_verified = true  -- Only migrate verified users
    AND v.user_id IS NULL;

-- Step 3: Check migration success rate
SELECT
    COUNT(*) FILTER (WHERE user_id IS NOT NULL) as migrated_votes,
    COUNT(*) FILTER (WHERE user_id IS NULL) as orphaned_votes,
    ROUND(100.0 * COUNT(*) FILTER (WHERE user_id IS NOT NULL) / COUNT(*), 2) as migration_percentage
FROM votes;

-- Step 4: Archive orphaned votes
INSERT INTO votes_archive
SELECT * FROM votes WHERE user_id IS NULL;

-- Step 5: Remove orphaned votes and update constraints
DELETE FROM votes WHERE user_id IS NULL;

ALTER TABLE votes
    ALTER COLUMN user_id SET NOT NULL,
    ALTER COLUMN email SET NOT NULL,
    DROP COLUMN device_id,
    ADD CONSTRAINT unique_user_deal UNIQUE(deal_id, user_id);
```

**Pros:**
- ✅ Preserve some historical votes
- ✅ Maintain vote counts where possible
- ✅ Less user confusion

**Cons:**
- ❌ Complex migration logic
- ❌ Partial data loss still occurs
- ❌ Risk of duplicate votes if device_id→user mapping is wrong
- ❌ Orphaned votes still need handling

**Estimated Success Rate:**
- Depends on how many users have logged in vs. anonymous voters
- Likely 30-50% of votes can be migrated
- Anonymous voters' votes will be lost

---

#### Option C: **Hybrid System** (Most Complex)

**Approach:**
Keep both systems running simultaneously with migration path.

**NOT RECOMMENDED** due to:
- High complexity
- Ongoing maintenance burden
- Data consistency issues
- User confusion

---

### 3.2 Recommended Approach: **Option A (Fresh Start)**

**Rationale:**
1. **Data Integrity** - All new votes tied to verified emails
2. **Simplicity** - Cleaner codebase and database
3. **Security** - Eliminates legacy device-based vulnerabilities
4. **Fresh Engagement** - Users re-engage with content
5. **Clear Migration** - No ambiguous state

**User Communication Plan:**
```
Subject: Important Update: Verified Voting System

Hi [Username],

We're upgrading our voting system to prevent fraud and ensure fair deal rankings!

What's changing:
• You'll need to log in to vote on deals
• This helps us prevent fake votes and spam
• Your votes will sync across all your devices
• More reliable and secure voting experience

Your previous votes:
• Will be archived for our records
• Vote counts will reset for a fresh start
• You can re-vote on your favorite deals

Thank you for being part of Doha Deals Radar!
```

---

## 4. Database Changes

### 4.1 Schema Modifications

**File:** `database/schema.sql`

```sql
-- 1. Archive existing votes
CREATE TABLE IF NOT EXISTS public.votes_archive (
    LIKE public.votes INCLUDING ALL
);

INSERT INTO votes_archive SELECT * FROM votes;

-- 2. Drop existing votes table
DROP TABLE IF EXISTS public.votes CASCADE;

-- 3. Create new votes table
CREATE TABLE public.votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('hot', 'cold')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_user_deal_vote UNIQUE(deal_id, user_id),
    CONSTRAINT unique_email_deal_vote UNIQUE(deal_id, email),
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- 4. Create indexes
CREATE INDEX idx_votes_user_id ON votes(user_id);
CREATE INDEX idx_votes_email ON votes(email);
CREATE INDEX idx_votes_deal_id ON votes(deal_id);
CREATE INDEX idx_votes_vote_type ON votes(vote_type);
CREATE INDEX idx_votes_created_at ON votes(created_at DESC);

-- 5. Reset vote counts in deals table
UPDATE deals
SET hot_count = 0, cold_count = 0
WHERE hot_count > 0 OR cold_count > 0;

-- 6. Update RLS policies
DROP POLICY IF EXISTS "Enable read access for all users" ON votes;
DROP POLICY IF EXISTS "Enable insert for all users" ON votes;

-- New RLS policies (more restrictive)
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Users can read all votes
CREATE POLICY "Anyone can view votes"
    ON votes FOR SELECT
    USING (true);

-- Users can only insert their own votes
CREATE POLICY "Users can insert their own votes"
    ON votes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own votes (if we allow vote changes)
CREATE POLICY "Users can delete their own votes"
    ON votes FOR DELETE
    USING (auth.uid() = user_id);

-- 7. Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_votes_updated_at
    BEFORE UPDATE ON votes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 4.2 Migration Script

**File:** `database/migrations/001_email_based_voting.sql`

```sql
-- Migration: Device-based to Email-based Voting
-- Date: 2025-11-18
-- Description: Migrate from device_id voting to user_id/email voting

BEGIN;

-- Archive existing votes
CREATE TABLE IF NOT EXISTS public.votes_archive (
    id UUID PRIMARY KEY,
    deal_id UUID,
    device_id TEXT,
    vote_type TEXT,
    created_at TIMESTAMPTZ,
    archived_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO votes_archive (id, deal_id, device_id, vote_type, created_at)
SELECT id, deal_id, device_id, vote_type, created_at
FROM votes;

-- Drop old table and constraints
DROP TABLE IF EXISTS votes CASCADE;

-- Create new table (see schema above)
-- ... (include full schema from 4.1)

-- Log migration
INSERT INTO migration_log (migration_name, executed_at, votes_archived)
VALUES ('email_based_voting', NOW(), (SELECT COUNT(*) FROM votes_archive));

COMMIT;
```

### 4.3 Rollback Script

**File:** `database/migrations/rollback_001_email_based_voting.sql`

```sql
BEGIN;

-- Drop new table
DROP TABLE IF EXISTS votes CASCADE;

-- Restore from archive
CREATE TABLE public.votes (
    id UUID PRIMARY KEY,
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    vote_type TEXT CHECK (vote_type IN ('hot', 'cold')),
    created_at TIMESTAMPTZ,
    UNIQUE(deal_id, device_id)
);

INSERT INTO votes (id, deal_id, device_id, vote_type, created_at)
SELECT id, deal_id, device_id, vote_type, created_at
FROM votes_archive;

-- Recreate indexes
CREATE INDEX idx_votes_deal_id ON votes(deal_id);
CREATE INDEX idx_votes_device_id ON votes(device_id);

-- Restore RLS policies
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
    ON votes FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users"
    ON votes FOR INSERT WITH CHECK (true);

COMMIT;
```

---

## 5. API Changes

### 5.1 Updated Cast Vote Endpoint

**File:** `src/app/api/cast-vote/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAuthentication } from '@/lib/auth/serverAuth'
import { rateLimit, voteLimit } from '@/lib/utils/rateLimit'

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting (NOW ENFORCED)
    const rateLimitResult = await rateLimit(request, voteLimit)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: rateLimitResult.message },
        { status: 429 }
      )
    }

    // 2. Verify authentication (REQUIRED)
    const user = await verifyAuthentication(request)

    // 3. Verify email is confirmed
    if (!user.emailVerified) {
      return NextResponse.json(
        {
          error: 'Email verification required to vote',
          code: 'EMAIL_NOT_VERIFIED'
        },
        { status: 403 }
      )
    }

    // 4. Parse request body
    const body = await request.json()
    const { dealId, voteType } = body

    // 5. Validate input
    if (!dealId || !voteType) {
      return NextResponse.json(
        { error: 'dealId and voteType are required' },
        { status: 400 }
      )
    }

    if (!['hot', 'cold'].includes(voteType)) {
      return NextResponse.json(
        { error: 'voteType must be "hot" or "cold"' },
        { status: 400 }
      )
    }

    // 6. Create Supabase client
    const supabase = createClient()

    // 7. Check if user already voted
    const { data: existingVote } = await supabase
      .from('votes')
      .select('id, vote_type')
      .eq('deal_id', dealId)
      .eq('user_id', user.id)
      .single()

    if (existingVote) {
      // User already voted - check if same vote type
      if (existingVote.vote_type === voteType) {
        return NextResponse.json(
          {
            error: 'You have already voted on this deal',
            code: 'DUPLICATE_VOTE'
          },
          { status: 400 }
        )
      } else {
        // User changing vote - handle vote update
        return await handleVoteChange(supabase, existingVote.id, dealId, voteType, user)
      }
    }

    // 8. Insert new vote
    const { error: voteError } = await supabase
      .from('votes')
      .insert({
        deal_id: dealId,
        user_id: user.id,
        email: user.email,
        vote_type: voteType
      })

    if (voteError) {
      console.error('Vote insert error:', voteError)
      return NextResponse.json(
        { error: 'Failed to cast vote' },
        { status: 500 }
      )
    }

    // 9. Update vote counts in deals table
    const incrementField = voteType === 'hot' ? 'hot_count' : 'cold_count'

    const { data: deal, error: updateError } = await supabase
      .from('deals')
      .select('hot_count, cold_count')
      .eq('id', dealId)
      .single()

    if (updateError || !deal) {
      console.error('Deal fetch error:', updateError)
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      )
    }

    const newCounts = {
      hot_count: deal.hot_count + (voteType === 'hot' ? 1 : 0),
      cold_count: deal.cold_count + (voteType === 'cold' ? 1 : 0)
    }

    await supabase
      .from('deals')
      .update(newCounts)
      .eq('id', dealId)

    // 10. Return success
    return NextResponse.json({
      success: true,
      message: 'Vote cast successfully',
      hotVotes: newCounts.hot_count,
      coldVotes: newCounts.cold_count
    })

  } catch (error: any) {
    console.error('Cast vote error:', error)

    // Handle auth errors
    if (error.name === 'AuthError') {
      return NextResponse.json(
        {
          error: 'Authentication required to vote',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to handle vote changes
async function handleVoteChange(
  supabase: any,
  voteId: string,
  dealId: string,
  newVoteType: string,
  user: any
) {
  // Option A: Allow vote changes (delete old, insert new)
  // Option B: Prevent vote changes (return error)
  // RECOMMENDED: Option B - votes are permanent

  return NextResponse.json(
    {
      error: 'You cannot change your vote. Delete your existing vote first.',
      code: 'VOTE_CHANGE_NOT_ALLOWED'
    },
    { status: 400 }
  )
}
```

### 5.2 New Delete Vote Endpoint (Optional)

**File:** `src/app/api/delete-vote/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAuthentication } from '@/lib/auth/serverAuth'

export async function DELETE(request: NextRequest) {
  try {
    // 1. Verify authentication
    const user = await verifyAuthentication(request)

    // 2. Get dealId from query params
    const { searchParams } = new URL(request.url)
    const dealId = searchParams.get('dealId')

    if (!dealId) {
      return NextResponse.json(
        { error: 'dealId is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // 3. Find and delete user's vote
    const { data: vote, error: fetchError } = await supabase
      .from('votes')
      .select('vote_type')
      .eq('deal_id', dealId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !vote) {
      return NextResponse.json(
        { error: 'Vote not found' },
        { status: 404 }
      )
    }

    const { error: deleteError } = await supabase
      .from('votes')
      .delete()
      .eq('deal_id', dealId)
      .eq('user_id', user.id)

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to delete vote' },
        { status: 500 }
      )
    }

    // 4. Update vote counts
    const decrementField = vote.vote_type === 'hot' ? 'hot_count' : 'cold_count'

    const { data: deal } = await supabase
      .from('deals')
      .select('hot_count, cold_count')
      .eq('id', dealId)
      .single()

    if (deal) {
      const newCounts = {
        hot_count: Math.max(0, deal.hot_count - (vote.vote_type === 'hot' ? 1 : 0)),
        cold_count: Math.max(0, deal.cold_count - (vote.vote_type === 'cold' ? 1 : 0))
      }

      await supabase
        .from('deals')
        .update(newCounts)
        .eq('id', dealId)

      return NextResponse.json({
        success: true,
        hotVotes: newCounts.hot_count,
        coldVotes: newCounts.cold_count
      })
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Delete vote error:', error)

    if (error.name === 'AuthError') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### 5.3 New Get User Votes Endpoint

**File:** `src/app/api/user-votes/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAuthentication } from '@/lib/auth/serverAuth'

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuthentication(request)
    const supabase = createClient()

    // Get all votes by this user
    const { data: votes, error } = await supabase
      .from('votes')
      .select('deal_id, vote_type, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch votes' },
        { status: 500 }
      )
    }

    // Convert to map for frontend
    const voteMap: Record<string, string> = {}
    votes?.forEach(vote => {
      voteMap[vote.deal_id] = vote.vote_type
    })

    return NextResponse.json({ votes: voteMap })

  } catch (error: any) {
    if (error.name === 'AuthError') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

## 6. Frontend Changes

### 6.1 Updated VoteButtons Component

**File:** `src/components/deals/VoteButtons.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store/authStore'
import { castVote, deleteVote, getUserVotes } from '@/lib/api/deals'
import { toast } from 'sonner'
import { LoginRequiredModal } from '@/components/auth/LoginRequiredModal'

interface VoteButtonsProps {
  dealId: string
  initialHotCount: number
  initialColdCount: number
  className?: string
}

export function VoteButtons({
  dealId,
  initialHotCount,
  initialColdCount,
  className = ''
}: VoteButtonsProps) {
  const { isAuthenticated, user } = useAuthStore()
  const [hotCount, setHotCount] = useState(initialHotCount)
  const [coldCount, setColdCount] = useState(initialColdCount)
  const [userVote, setUserVote] = useState<'hot' | 'cold' | null>(null)
  const [isVoting, setIsVoting] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)

  // Fetch user's votes on mount (if authenticated)
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserVote()
    }
  }, [isAuthenticated, dealId])

  const fetchUserVote = async () => {
    try {
      const { votes } = await getUserVotes()
      setUserVote(votes[dealId] || null)
    } catch (error) {
      console.error('Failed to fetch user votes:', error)
    }
  }

  const handleVote = async (voteType: 'hot' | 'cold') => {
    // Check authentication
    if (!isAuthenticated) {
      setShowLoginModal(true)
      return
    }

    // Check email verification
    if (!user?.emailVerified) {
      toast.error('Please verify your email to vote')
      return
    }

    // Prevent voting while in progress
    if (isVoting) return

    // If user already voted the same way, do nothing
    if (userVote === voteType) {
      toast.info('You have already voted')
      return
    }

    // If user wants to change vote, must delete first
    if (userVote) {
      toast.error('Delete your current vote to change it')
      return
    }

    setIsVoting(true)

    // Optimistic update
    const previousHotCount = hotCount
    const previousColdCount = coldCount

    if (voteType === 'hot') {
      setHotCount(prev => prev + 1)
    } else {
      setColdCount(prev => prev + 1)
    }
    setUserVote(voteType)

    try {
      const result = await castVote(dealId, voteType)

      if (result.success) {
        // Update with actual counts from server
        setHotCount(result.hotVotes)
        setColdCount(result.coldVotes)
        toast.success(`Voted ${voteType === 'hot' ? '🔥' : '❄️'}`)
      }
    } catch (error: any) {
      // Revert optimistic update
      setHotCount(previousHotCount)
      setColdCount(previousColdCount)
      setUserVote(null)

      if (error.code === 'AUTH_REQUIRED') {
        setShowLoginModal(true)
      } else if (error.code === 'EMAIL_NOT_VERIFIED') {
        toast.error('Please verify your email to vote')
      } else {
        toast.error(error.message || 'Failed to cast vote')
      }
    } finally {
      setIsVoting(false)
    }
  }

  const handleDeleteVote = async () => {
    if (!userVote || isVoting) return

    setIsVoting(true)

    // Optimistic update
    const previousHotCount = hotCount
    const previousColdCount = coldCount
    const previousVote = userVote

    if (userVote === 'hot') {
      setHotCount(prev => Math.max(0, prev - 1))
    } else {
      setColdCount(prev => Math.max(0, prev - 1))
    }
    setUserVote(null)

    try {
      const result = await deleteVote(dealId)

      if (result.success) {
        setHotCount(result.hotVotes)
        setColdCount(result.coldVotes)
        toast.success('Vote removed')
      }
    } catch (error: any) {
      // Revert
      setHotCount(previousHotCount)
      setColdCount(previousColdCount)
      setUserVote(previousVote)
      toast.error('Failed to remove vote')
    } finally {
      setIsVoting(false)
    }
  }

  return (
    <>
      <div className={`flex items-center gap-2 ${className}`}>
        <button
          onClick={() => handleVote('hot')}
          disabled={isVoting || userVote === 'hot'}
          className={`
            flex items-center gap-1 px-3 py-2 rounded-lg
            transition-all duration-200
            ${userVote === 'hot'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 hover:bg-orange-100 text-gray-700'
            }
            ${isVoting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          aria-label="Vote hot"
        >
          🔥 {hotCount}
        </button>

        <button
          onClick={() => handleVote('cold')}
          disabled={isVoting || userVote === 'cold'}
          className={`
            flex items-center gap-1 px-3 py-2 rounded-lg
            transition-all duration-200
            ${userVote === 'cold'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 hover:bg-blue-100 text-gray-700'
            }
            ${isVoting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          aria-label="Vote cold"
        >
          ❄️ {coldCount}
        </button>

        {userVote && (
          <button
            onClick={handleDeleteVote}
            disabled={isVoting}
            className="text-sm text-red-500 hover:text-red-700 underline"
          >
            Remove vote
          </button>
        )}
      </div>

      {showLoginModal && (
        <LoginRequiredModal
          onClose={() => setShowLoginModal(false)}
          message="Please log in to vote on deals"
        />
      )}
    </>
  )
}
```

### 6.2 New LoginRequiredModal Component

**File:** `src/components/auth/LoginRequiredModal.tsx`

```typescript
'use client'

import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'

interface LoginRequiredModalProps {
  onClose: () => void
  message?: string
}

export function LoginRequiredModal({
  onClose,
  message = 'Please log in to continue'
}: LoginRequiredModalProps) {
  const router = useRouter()

  const handleLogin = () => {
    onClose()
    router.push('/login?returnUrl=' + encodeURIComponent(window.location.pathname))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Login Required</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-gray-600 mb-6">{message}</p>

        <div className="flex gap-3">
          <button
            onClick={handleLogin}
            className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Log In
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
```

### 6.3 Updated API Service Layer

**File:** `src/lib/api/deals.ts`

Add new functions:

```typescript
/**
 * Cast a vote on a deal (requires authentication)
 */
export async function castVote(
  dealId: string,
  voteType: 'hot' | 'cold'
): Promise<{ success: boolean; hotVotes: number; coldVotes: number; message?: string }> {
  const response = await fetch('/api/cast-vote', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders() // Includes Authorization: Bearer <token>
    },
    body: JSON.stringify({ dealId, voteType })
  })

  const data = await response.json()

  if (!response.ok) {
    throw {
      message: data.error,
      code: data.code,
      status: response.status
    }
  }

  return data
}

/**
 * Delete user's vote on a deal
 */
export async function deleteVote(
  dealId: string
): Promise<{ success: boolean; hotVotes: number; coldVotes: number }> {
  const response = await fetch(`/api/delete-vote?dealId=${dealId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Failed to delete vote')
  }

  return data
}

/**
 * Get all votes by current user
 */
export async function getUserVotes(): Promise<{ votes: Record<string, 'hot' | 'cold'> }> {
  const response = await fetch('/api/user-votes', {
    method: 'GET',
    headers: getAuthHeaders()
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch user votes')
  }

  return data
}
```

### 6.4 Remove Device ID Dependencies

**Files to update:**
- `src/lib/hooks/useDeviceId.ts` - Can be removed or marked as deprecated
- `src/lib/utils/localStorage.ts` - Remove vote-related functions (keep other utilities)

---

## 7. Security Improvements

### 7.1 Rate Limiting

**Now Enforced on `/api/cast-vote`:**
```typescript
export const voteLimit: RateLimitConfig = {
  max: 100, // 100 votes per hour per IP
  windowMs: 60 * 60 * 1000,
  message: 'Too many votes. Please slow down.',
}
```

### 7.2 Email Verification Requirement

**Prevents bots and fake accounts:**
```typescript
if (!user.emailVerified) {
  return NextResponse.json(
    { error: 'Email verification required to vote' },
    { status: 403 }
  )
}
```

### 7.3 Enhanced RLS Policies

**More restrictive database policies:**
- Users can only insert votes with their own `user_id`
- Uses Supabase `auth.uid()` to verify ownership
- Prevents vote manipulation at database level

### 7.4 Audit Trail

**Track voting behavior:**
```sql
-- Add voting analytics table
CREATE TABLE vote_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    email TEXT NOT NULL,
    action TEXT NOT NULL, -- 'cast', 'delete', 'attempt_duplicate'
    deal_id UUID REFERENCES deals(id),
    vote_type TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 7.5 IP-Based Rate Limiting (Enhanced)

Consider adding:
```typescript
// Track votes per IP + user_id combination
const ipVoteKey = `vote:${ip}:${userId}`
// Allow max 50 votes per IP per hour
```

---

## 8. Risks & Mitigation

### 8.1 User Experience Degradation

**Risk:** Forcing login will reduce engagement and vote counts

**Impact:** HIGH
- Casual users may not vote at all
- Lower engagement metrics
- Fewer votes = less accurate deal rankings

**Mitigation:**
- ✅ **Streamlined login** - OTP is already fast (no passwords)
- ✅ **Clear messaging** - Explain why login is required (fraud prevention)
- ✅ **Social proof** - Show "X verified users voted"
- ✅ **Quick registration** - Emphasize "Takes 30 seconds"
- ✅ **Benefits highlight** - "Your votes sync across devices"
- ⚠️ **Monitor metrics** - Track vote counts pre/post migration
- ⚠️ **A/B testing** - Consider testing with subset of users first

---

### 8.2 Data Loss

**Risk:** Existing votes will be archived/lost

**Impact:** MEDIUM
- Historical vote counts reset
- User confusion - "Where did my votes go?"
- Deal rankings change significantly

**Mitigation:**
- ✅ **Archive table** - Keep historical data for analytics
- ✅ **Announce change** - Email users in advance
- ✅ **Grace period** - Allow re-voting on previously voted deals
- ✅ **Show archived votes** - Display in user profile: "You voted on this deal on [date] (archived)"
- ⚠️ **Export data** - Provide CSV export of archived votes for transparency

---

### 8.3 Duplicate Votes (Transition Period)

**Risk:** If using hybrid approach, users might vote twice (once with device, once with email)

**Impact:** MEDIUM
- Inflated vote counts
- Unfair deal rankings
- Data integrity issues

**Mitigation:**
- ✅ **Fresh start approach** - Eliminates this risk entirely
- ✅ **Unique constraints** - Database prevents duplicates
- ⚠️ **If hybrid:** Merge device_id votes with user_id before allowing new votes

---

### 8.4 Authentication System Overload

**Risk:** Increased login requests may strain auth system

**Impact:** LOW
- Supabase Auth handles high load well
- OTP email delivery delays possible

**Mitigation:**
- ✅ **Rate limiting** - Already in place for OTP sending
- ✅ **Email provider** - Ensure Supabase email quota is sufficient
- ⚠️ **Monitor** - Track OTP success rates and delivery times
- ⚠️ **Fallback** - Consider SMS verification as backup (future)

---

### 8.5 localStorage vs. Database Sync

**Risk:** Frontend caches votes in localStorage, but database is source of truth

**Impact:** LOW
- Possible UI inconsistencies
- User sees wrong vote state briefly

**Mitigation:**
- ✅ **Remove localStorage voting** - Fetch from `/api/user-votes` instead
- ✅ **Server-side rendering** - Include user votes in initial page load
- ✅ **Optimistic updates** - Update UI immediately, revert on error
- ⚠️ **Cache busting** - Clear localStorage on migration

---

### 8.6 Email as Unique Identifier

**Risk:** Users can have multiple accounts, emails can be changed

**Impact:** LOW
- Possible vote manipulation (create multiple accounts)
- Email changes orphan votes

**Mitigation:**
- ✅ **Use user_id as primary** - Email is denormalized for quick lookups
- ✅ **Email verification** - Required before voting
- ✅ **UNIQUE constraint on user_id** - Prevents duplicates even if email changes
- ⚠️ **Monitor** - Track accounts created per IP/day
- ⚠️ **Future:** Add phone verification for high-trust users

---

### 8.7 Breaking Changes for Existing Features

**Risk:** Other features depend on device_id voting system

**Impact:** Needs Investigation

**Check these areas:**

#### A. Reporting System
**File:** `src/app/api/report/route.ts`
- Currently uses `deviceId` for anonymous reporting
- **No conflict** - Can keep device-based reporting separate from voting
- Reporting can remain anonymous while voting requires auth

#### B. User Profile - Voting History
**File:** Unknown - needs investigation
- If users can view their voting history, this needs updating
- Change from device_id lookup to user_id lookup

#### C. Deal Analytics
- If analytics track votes by device, update to track by user
- May need to rebuild analytics queries

#### D. Admin Dashboard
- If admins view voting patterns by device, update UI
- Switch to user-based analytics

**Mitigation:**
- ✅ **Comprehensive testing** - Test all features that touch votes table
- ✅ **Search codebase** - Grep for `device_id` references
- ⚠️ **Staged rollout** - Deploy to staging environment first

---

### 8.8 Vote Count Recalculation

**Risk:** hot_count/cold_count in deals table may be out of sync after migration

**Impact:** MEDIUM
- Incorrect vote counts displayed
- Deal rankings wrong

**Mitigation:**
```sql
-- Recalculate all vote counts from votes table
WITH vote_counts AS (
  SELECT
    deal_id,
    COUNT(*) FILTER (WHERE vote_type = 'hot') as hot_total,
    COUNT(*) FILTER (WHERE vote_type = 'cold') as cold_total
  FROM votes
  GROUP BY deal_id
)
UPDATE deals d
SET
  hot_count = COALESCE(vc.hot_total, 0),
  cold_count = COALESCE(vc.cold_total, 0)
FROM vote_counts vc
WHERE d.id = vc.deal_id;
```

Run this script:
- After migration
- Weekly as a maintenance job (detect discrepancies)
- On-demand if issues reported

---

## 9. Implementation Phases

### Phase 1: Preparation (1-2 days)

**Tasks:**
- [x] Create comprehensive migration plan (this document)
- [ ] Review plan with stakeholders
- [ ] Create database migration scripts
- [ ] Create rollback scripts
- [ ] Set up staging environment matching production
- [ ] Backup production database
- [ ] Write tests for new voting API

**Deliverables:**
- Migration plan approved
- Test suite ready
- Staging environment ready

---

### Phase 2: Backend Implementation (2-3 days)

**Tasks:**
- [ ] Update database schema in staging
  - [ ] Create `votes_archive` table
  - [ ] Modify `votes` table
  - [ ] Update RLS policies
  - [ ] Create indexes
- [ ] Update API routes
  - [ ] Modify `/api/cast-vote` to require auth
  - [ ] Create `/api/delete-vote` endpoint
  - [ ] Create `/api/user-votes` endpoint
- [ ] Add rate limiting to voting endpoint
- [ ] Add email verification check
- [ ] Update TypeScript types
- [ ] Write API tests

**Testing:**
- Test voting with authenticated users
- Test error cases (not logged in, email not verified)
- Test rate limiting
- Test concurrent votes
- Test RLS policies

---

### Phase 3: Frontend Implementation (2-3 days)

**Tasks:**
- [ ] Create `LoginRequiredModal` component
- [ ] Update `VoteButtons` component
  - [ ] Add authentication checks
  - [ ] Fetch user votes from API
  - [ ] Show login modal if not authenticated
  - [ ] Update optimistic UI logic
- [ ] Update `DealCard` component (same changes)
- [ ] Update API service layer (`deals.ts`)
  - [ ] Add `castVote` with auth headers
  - [ ] Add `deleteVote` function
  - [ ] Add `getUserVotes` function
- [ ] Remove device ID dependencies
  - [ ] Update `useDeviceId` hook (deprecate or remove)
  - [ ] Remove vote functions from `localStorage.ts`
- [ ] Add "Email verification required" banner
- [ ] Update user profile to show voting history

**Testing:**
- Test voting flow (logged in vs. not logged in)
- Test optimistic updates
- Test error handling
- Test on mobile devices
- Test cross-browser compatibility

---

### Phase 4: User Communication (1-2 days)

**Tasks:**
- [ ] Draft announcement email
- [ ] Create in-app notification banner
- [ ] Update FAQ/Help documentation
- [ ] Create social media announcements
- [ ] Prepare customer support responses

**Messaging:**
- Emphasize security and fraud prevention
- Highlight benefits (cross-device sync, verified votes)
- Explain why change is needed
- Set expectations (vote counts reset)
- Provide support contact

---

### Phase 5: Migration Execution (1 day)

**Tasks:**
- [ ] Schedule maintenance window (low traffic time)
- [ ] Notify users of upcoming maintenance
- [ ] Deploy to staging and final testing
- [ ] Create final production backup
- [ ] Execute migration script
- [ ] Verify data integrity
- [ ] Deploy new frontend code
- [ ] Monitor for errors
- [ ] Run smoke tests on production

**Rollback Criteria:**
- Migration script fails
- Vote counts incorrect after migration
- Critical bugs in production
- User complaints exceed threshold

---

### Phase 6: Monitoring & Optimization (1-2 weeks)

**Tasks:**
- [ ] Monitor error logs
- [ ] Track vote conversion rates (before/after)
- [ ] Monitor API performance
- [ ] Collect user feedback
- [ ] Fix bugs as they arise
- [ ] Optimize database queries if needed
- [ ] A/B test messaging if engagement drops

**Metrics to Track:**
- Votes per day (before vs. after)
- Login conversion rate (clicks vote → completes login)
- Email verification rate
- API error rates
- Page load times
- User complaints/support tickets

---

## 10. Testing Strategy

### 10.1 Unit Tests

**API Routes:**
```typescript
// tests/api/cast-vote.test.ts
describe('POST /api/cast-vote', () => {
  it('should reject unauthenticated requests', async () => {
    const response = await fetch('/api/cast-vote', {
      method: 'POST',
      body: JSON.stringify({ dealId: 'test', voteType: 'hot' })
    })
    expect(response.status).toBe(401)
  })

  it('should reject unverified email accounts', async () => {
    const token = getUnverifiedUserToken()
    const response = await fetch('/api/cast-vote', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ dealId: 'test', voteType: 'hot' })
    })
    expect(response.status).toBe(403)
  })

  it('should prevent duplicate votes', async () => {
    // Vote once
    await castVote(token, dealId, 'hot')

    // Try to vote again
    const response = await castVote(token, dealId, 'hot')
    expect(response.status).toBe(400)
    expect(response.body.code).toBe('DUPLICATE_VOTE')
  })

  it('should increment vote counts correctly', async () => {
    const response = await castVote(token, dealId, 'hot')
    expect(response.body.hotVotes).toBe(1)
  })
})
```

**Components:**
```typescript
// tests/components/VoteButtons.test.tsx
describe('VoteButtons', () => {
  it('should show login modal when not authenticated', () => {
    render(<VoteButtons dealId="test" />)
    fireEvent.click(screen.getByLabelText('Vote hot'))
    expect(screen.getByText('Login Required')).toBeInTheDocument()
  })

  it('should call API when authenticated user votes', async () => {
    const { castVote } = useVoting()
    render(<VoteButtons dealId="test" />)
    fireEvent.click(screen.getByLabelText('Vote hot'))
    await waitFor(() => expect(castVote).toHaveBeenCalled())
  })
})
```

### 10.2 Integration Tests

**End-to-End Voting Flow:**
```typescript
// tests/integration/voting.test.ts
describe('Voting Flow', () => {
  it('should complete full voting journey', async () => {
    // 1. User not logged in
    await page.goto('/deals')
    await page.click('[aria-label="Vote hot"]')
    await expect(page.locator('text=Login Required')).toBeVisible()

    // 2. User logs in
    await page.click('button:has-text("Log In")')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.click('button:has-text("Send Code")')

    // 3. Enter OTP
    await page.fill('input[placeholder="Enter 6-digit code"]', '123456')
    await page.click('button:has-text("Verify")')

    // 4. Redirect back and vote
    await expect(page).toHaveURL('/deals')
    await page.click('[aria-label="Vote hot"]')

    // 5. Verify vote registered
    await expect(page.locator('[aria-label="Vote hot"]')).toHaveClass(/bg-orange-500/)
  })
})
```

### 10.3 Database Tests

**Schema Validation:**
```sql
-- Test unique constraints
BEGIN;
INSERT INTO votes (deal_id, user_id, email, vote_type)
VALUES ('deal-1', 'user-1', 'test@example.com', 'hot');

-- This should fail
INSERT INTO votes (deal_id, user_id, email, vote_type)
VALUES ('deal-1', 'user-1', 'test@example.com', 'hot');
-- Expected: ERROR duplicate key value violates unique constraint

ROLLBACK;
```

**RLS Policy Tests:**
```sql
-- Test users can only insert their own votes
SET request.jwt.claim.sub = 'user-1';

-- This should succeed
INSERT INTO votes (deal_id, user_id, email, vote_type)
VALUES ('deal-1', 'user-1', 'test@example.com', 'hot');

-- This should fail (different user_id)
INSERT INTO votes (deal_id, user_id, email, vote_type)
VALUES ('deal-1', 'user-2', 'test@example.com', 'hot');
```

### 10.4 Load Tests

**Concurrent Voting:**
```typescript
// Simulate 100 users voting simultaneously
const results = await Promise.all(
  Array.from({ length: 100 }, (_, i) =>
    castVote(`user-${i}`, dealId, 'hot')
  )
)

// All should succeed
expect(results.every(r => r.success)).toBe(true)

// Vote count should be exactly 100
const deal = await getDeal(dealId)
expect(deal.hot_count).toBe(100)
```

### 10.5 Manual Testing Checklist

- [ ] Vote as logged-in user with verified email
- [ ] Vote as logged-in user with unverified email (should fail)
- [ ] Try to vote without logging in (should show modal)
- [ ] Vote, then try to vote again (should show error)
- [ ] Delete vote, then vote again (should succeed)
- [ ] Vote on mobile device
- [ ] Vote with slow network (optimistic updates)
- [ ] Vote with network disconnected (error handling)
- [ ] Log out and vote (should require login)
- [ ] Vote on one device, check on another (should sync)

---

## 11. Rollback Plan

### 11.1 Immediate Rollback (Within 1 Hour)

**If critical issues detected during deployment:**

```bash
# 1. Stop new deployments
git revert HEAD

# 2. Restore previous frontend build
vercel rollback

# 3. Restore database schema
psql -U postgres -d doha_deals < rollback_001_email_based_voting.sql

# 4. Verify vote counts
psql -U postgres -d doha_deals -c "SELECT SUM(hot_count), SUM(cold_count) FROM deals;"

# 5. Clear CDN cache
cloudflare purge --all

# 6. Monitor error logs
tail -f /var/log/app.log
```

**Rollback SQL:** (See section 4.3)

---

### 11.2 Partial Rollback (1-24 Hours)

**If issues discovered after deployment:**

**Option A: Keep database changes, revert frontend**
- Use case: API works but frontend has bugs
- Action: Deploy previous frontend version
- Database: No changes needed

**Option B: Keep frontend, revert database**
- Use case: Database performance issues
- Action: Restore database schema
- Frontend: Show maintenance message

**Option C: Feature flag rollback**
- Add feature flag: `ENABLE_EMAIL_VOTING=false`
- Frontend checks flag and uses old logic
- Allows gradual rollback

---

### 11.3 Data Recovery

**If votes lost during migration:**

```sql
-- Restore from votes_archive
BEGIN;

DELETE FROM votes; -- Clear new (potentially corrupted) votes

INSERT INTO votes (id, deal_id, device_id, vote_type, created_at)
SELECT id, deal_id, device_id, vote_type, created_at
FROM votes_archive;

-- Recalculate vote counts
WITH vote_counts AS (
  SELECT
    deal_id,
    COUNT(*) FILTER (WHERE vote_type = 'hot') as hot,
    COUNT(*) FILTER (WHERE vote_type = 'cold') as cold
  FROM votes
  GROUP BY deal_id
)
UPDATE deals d
SET hot_count = vc.hot, cold_count = vc.cold
FROM vote_counts vc
WHERE d.id = vc.deal_id;

COMMIT;
```

---

## 12. Success Criteria

### 12.1 Technical Metrics

- [ ] Zero data loss (all votes archived)
- [ ] Vote counts accurate (manual verification)
- [ ] API response time < 300ms (p95)
- [ ] Error rate < 1%
- [ ] Zero security vulnerabilities
- [ ] All tests passing
- [ ] Database queries optimized (< 50ms)

### 12.2 User Metrics

- [ ] Vote conversion rate > 60% (users who click vote → complete vote)
- [ ] Login-to-vote completion > 70%
- [ ] Votes per day within 80% of pre-migration levels
- [ ] Support tickets < 10/day related to voting
- [ ] User satisfaction score > 4/5

### 12.3 Business Metrics

- [ ] Fraud votes reduced by > 90%
- [ ] Deal quality scores more accurate
- [ ] User trust improved (survey)
- [ ] Moderation time reduced

---

## 13. Timeline Summary

| Phase | Duration | Start Date | End Date |
|-------|----------|------------|----------|
| 1. Preparation | 2 days | TBD | TBD |
| 2. Backend Implementation | 3 days | TBD | TBD |
| 3. Frontend Implementation | 3 days | TBD | TBD |
| 4. User Communication | 2 days | TBD | TBD |
| 5. Migration Execution | 1 day | TBD | TBD |
| 6. Monitoring & Optimization | 14 days | TBD | TBD |
| **TOTAL** | **~25 days** | TBD | TBD |

---

## 14. Open Questions / Decisions Needed

1. **Should we allow users to change their vote?**
   - Option A: Votes are permanent (recommended)
   - Option B: Allow delete + re-vote
   - Option C: Allow direct vote change

2. **Should we migrate any existing votes?**
   - Option A: Fresh start (recommended)
   - Option B: Best-effort migration
   - Option C: Hybrid system

3. **What happens to deals with 0 votes after reset?**
   - Option A: Keep them visible
   - Option B: Archive deals with 0 votes after 7 days
   - Option C: Show "No votes yet" badge

4. **Should we add vote weighting based on user trust level?**
   - Trusted users' votes count more
   - Prevents new account spam
   - Implementation: `vote_weight` column

5. **Email change handling:**
   - What happens when user changes email?
   - Should we update `votes.email` retroactively?
   - Or keep historical email?

6. **Analytics:**
   - Should we track vote changes over time?
   - Create `vote_history` table for audit trail?

---

## 15. Conclusion

This migration from device-based to email-based voting is a **significant architectural change** that will:

**Benefits:**
- ✅ Eliminate vote fraud and manipulation
- ✅ Improve data integrity and user accountability
- ✅ Enable cross-device voting
- ✅ Better analytics and insights
- ✅ Stronger security posture

**Challenges:**
- ⚠️ Increased friction (login required)
- ⚠️ Potential engagement drop
- ⚠️ Loss of historical vote data
- ⚠️ User confusion during transition

**Recommendation:**
Proceed with **Option A (Fresh Start)** migration approach:
- Clean implementation
- No data ambiguity
- Clear user communication
- Gradual re-engagement

**Next Steps:**
1. Review and approve this plan
2. Set migration date
3. Begin Phase 1 (Preparation)
4. Execute phases sequentially
5. Monitor and optimize post-migration

---

**Document Version:** 1.0
**Created:** 2025-11-18
**Author:** Claude (AI Assistant)
**Status:** Draft - Pending Review
