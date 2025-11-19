# Authorization Issues Analysis & Fixes

## Executive Summary

After analyzing the codebase and recent git history, I've identified **3 critical authorization issues** that need to be fixed:

1. **Users can't see their posted deals** - Authorization logic bug in `/api/get-user-deals`
2. **Submit deal cancel button unreliable** - Uses `router.back()` instead of explicit navigation
3. **Database schema mismatch** - Production database has columns not in schema.sql

---

## Issue #1: Users Can't See Their Posted Deals

### Root Cause

The `/api/get-user-deals` endpoint has an **authorization bug** where it fails to properly authenticate users viewing their own deals.

**File:** `src/app/api/get-user-deals/route.ts`

**Problem Code (Lines 26-49):**
```typescript
if (token) {
  const authSupabase = createClient(supabaseUrl, supabaseAnonKey)
  const { data: { user: authUser }, error: authError } =
    await authSupabase.auth.getUser(token)

  if (!authError && authUser && authUser.email) {
    const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data: userData, error: userLookupError } = await serviceSupabase
      .from('users')
      .select('role, id')
      .eq('email', authUser.email) // EMAIL-BASED LOOKUP
      .maybeSingle()

    if (userData) {
      isAuthorized =
        userData.id === userId ||  // BUG: String comparison issue
        userData.role === 'moderator' ||
        userData.role === 'admin'
    }
  }
}
```

### Specific Bugs Identified:

#### A. No Error Logging
When `userData` is null (user not found by email), the code silently fails. There's no logging to debug why authorization failed.

#### B. Email Matching Fragility
If the email in `auth.users` doesn't **exactly** match the email in `public.users`, the lookup fails:
- Case sensitivity issues
- Whitespace differences
- Email not yet synced to public.users

#### C. Silent Failure on User Lookup Error
If `userLookupError` occurs, it's ignored. The error should be logged and handled.

#### D. Type Coercion Issues
UUID comparison `userData.id === userId` might fail due to type differences (UUID vs string).

### How This Breaks:

1. User logs in successfully
2. JWT token is valid
3. Email lookup in public.users fails OR returns wrong user
4. `userData` is null or has wrong ID
5. `isAuthorized` stays `false`
6. API returns 403: "You do not have permission to view these deals"
7. User sees empty deals list on account page

---

## Issue #2: Submit Deal Cancel Button Unreliable

### Root Cause

The cancel button uses browser history navigation (`router.back()`) which is unpredictable.

**File:** `src/app/(main)/submit/SubmitPageClient.tsx` (Line 179)

**Problem Code:**
```typescript
<Button
  variant="ghost"
  size="sm"
  onClick={() => router.back()}  // UNRELIABLE!
  disabled={isSubmitting}
>
  Cancel
</Button>
```

### Why This is Bad:

1. **Unpredictable Destination**:
   - If user navigates directly to `/submit` (bookmark, URL, external link), there's no history
   - Might go to unexpected page
   - Might do nothing

2. **Poor UX for Logged-In Users**:
   - Users expect Cancel to return to a safe, known location (the feed)
   - Inconsistent experience across sessions

3. **Pattern Repeated**:
   - Same issue in `/login` page
   - Same issue in `/post` page
   - Same issue in deal detail pages

### Expected Behavior:

- Cancel should **always** navigate to `/feed` (the main page)
- Predictable and consistent user experience

---

## Issue #3: Database Schema Mismatch

### Root Cause

The `database/schema.sql` file is **out of date** and doesn't match the production database.

**Missing Columns in schema.sql (users table):**
```sql
-- These columns exist in production but not in schema.sql:
device_id TEXT
email_verified BOOLEAN
last_login_at TIMESTAMPTZ
total_deals_posted INTEGER
approved_deals_count INTEGER
rejected_deals_count INTEGER
trust_level TEXT
submitted_deals_count INTEGER
```

**Evidence:**
User-provided data shows these fields exist:
```json
{
  "device_id": "dh-f21044d4-3270-40af-b3f4-c0a829883b88",
  "email_verified": true,
  "last_login_at": "2025-11-17 14:00:10.78+00",
  "total_deals_posted": 5,
  ...
}
```

But `verify-code-and-get-user/route.ts` tries to update these fields (lines 103-104):
```typescript
.update({
  last_login_at: new Date().toISOString(),
  device_id: deviceId,  // Field doesn't exist in schema.sql!
})
```

### Impact:

- **Development vs Production Drift**: New developers can't set up correct database
- **Migration Confusion**: Can't reliably deploy schema changes
- **Potential Runtime Errors**: Code expects columns that might not exist

---

## Fixes Required

### Fix #1: Improve `/api/get-user-deals` Authorization

**Changes:**
1. Add comprehensive error logging
2. Normalize emails before comparison
3. Handle user lookup errors explicitly
4. Add fallback authorization check using JWT user ID directly
5. Log authorization decisions for debugging

**Implementation:** See code changes below

### Fix #2: Fix Cancel Button Navigation

**Changes:**
1. Replace `router.back()` with `router.push('/feed')`
2. Apply to all pages: submit, login, post
3. Consistent UX across application

**Implementation:** See code changes below

### Fix #3: Update Database Schema Documentation

**Changes:**
1. Document actual production schema
2. Create migration for missing columns
3. Update schema.sql to match reality

**Implementation:** See database migration below

---

## Additional Issues Found

### A. Inconsistent Supabase Client Usage

**submit-deal API (Line 131-141):**
```typescript
// CORRECT: Passes user's JWT token to Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: { Authorization: `Bearer ${userToken}` }
  }
})
```

**get-user-deals API (Line 59):**
```typescript
// Uses service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey)
```

**Impact:** Inconsistent patterns. Should use service role key where RLS needs to be bypassed (which is correct for get-user-deals since it checks all statuses).

### B. No JWT Token Refresh

**Problem:** JWT tokens expire, but there's no automatic refresh logic.

**Current Behavior:**
- User's JWT expires
- API calls start failing with 401
- User must manually log out and log back in

**Recommendation:** Implement automatic token refresh using the refresh token stored in authStore.

---

## Testing Checklist

After applying fixes, test:

- [ ] User can view their own posted deals on account page
- [ ] Moderators can view any user's deals
- [ ] Admins can view any user's deals
- [ ] Non-authenticated users get proper error
- [ ] Cancel button in submit page goes to /feed
- [ ] Cancel button works when navigating directly to /submit URL
- [ ] Cancel button works on mobile
- [ ] Authorization errors are logged to console
- [ ] Email case differences don't break authorization
- [ ] JWT token expiration is handled gracefully

---

## Implementation Priority

1. **HIGH - Fix #1 (get-user-deals authorization)** - Users can't use account page
2. **MEDIUM - Fix #2 (cancel button)** - Poor UX but not blocking
3. **LOW - Fix #3 (schema documentation)** - Documentation issue, not runtime

---

## Rollback Plan

If fixes cause issues:

```bash
# Revert to previous commit
git revert HEAD

# Or restore specific file
git checkout HEAD~1 -- src/app/api/get-user-deals/route.ts
```

---

**Document Version:** 1.0
**Date:** 2025-11-19
**Author:** Claude Code Analysis
