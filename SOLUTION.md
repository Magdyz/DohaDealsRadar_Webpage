# DohaDealsRadar Image Loading Issue - SOLUTION

## Problem Identified

The images aren't loading because the `next.config.js` uses an **invalid wildcard pattern** for the hostname:

```javascript
// ❌ WRONG - Single asterisk not supported for hostname wildcards
remotePatterns: [
  {
    protocol: 'https',
    hostname: '*.supabase.co',  // INVALID PATTERN
  },
]
```

## Root Cause

According to Next.js documentation:
- **Single asterisk (`*`)**: NOT allowed for hostname wildcards (security risk)
- **Double asterisk (`**`)**: Required for wildcard subdomains
- Next.js uses picomatch's `makeRe` for pattern matching

## The Fix

You have two options:

### Option 1: Use Exact Hostname (RECOMMENDED)

Replace the wildcard with the exact Supabase project hostname:

```javascript
// /Users/magz/Documents/Coding/DohaDealsRadar_Webpage/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nzchbnshkrkdqpcawohu.supabase.co',  // ✅ EXACT HOSTNAME
        pathname: '/storage/v1/object/public/**',       // Wildcard for paths
      },
    ],
  },
}

module.exports = nextConfig
```

**Pros:**
- More secure (only allows your specific Supabase project)
- No risk of loading images from other Supabase projects
- Explicit and clear

**Cons:**
- If you change Supabase projects, you need to update config

### Option 2: Use Double Asterisk for Wildcard Subdomain

If you need to support multiple Supabase projects:

```javascript
// /Users/magz/Documents/Coding/DohaDealsRadar_Webpage/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',  // ✅ DOUBLE ASTERISK for wildcard
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

module.exports = nextConfig
```

**Pros:**
- Works with any Supabase project
- More flexible for multi-project setups

**Cons:**
- Less secure (allows images from ANY Supabase project)
- Not recommended unless you need this flexibility

## Implementation Steps

1. **Stop the Next.js development server**
   ```bash
   # Press Ctrl+C in the terminal where Next.js is running
   ```

2. **Update next.config.js**
   ```bash
   # Choose Option 1 (recommended) or Option 2 above
   # Edit: /Users/magz/Documents/Coding/DohaDealsRadar_Webpage/next.config.js
   ```

3. **Restart Next.js development server**
   ```bash
   npm run dev
   ```
   **IMPORTANT:** You MUST restart for config changes to take effect!

4. **Clear browser cache** (optional but recommended)
   - Chrome/Edge: Press Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
   - Or open DevTools → Network tab → Check "Disable cache"

5. **Verify images load**
   - Open http://localhost:3000 (or 3001)
   - Check the deals feed
   - Open browser DevTools → Console tab
   - Look for any Image-related errors

## Expected Behavior After Fix

### Before (Broken)
- Images show placeholder (📷 emoji)
- Browser console shows: "Error: Invalid src prop (...) hostname is not configured"
- Network tab shows no image requests

### After (Fixed)
- Images load and display properly
- No console errors
- Network tab shows successful image requests (HTTP 200)

## Verification Checklist

- [ ] Updated `next.config.js` with correct pattern
- [ ] Restarted Next.js dev server
- [ ] Cleared browser cache
- [ ] Images load on deals feed page
- [ ] Images load on deal detail page
- [ ] No console errors related to images
- [ ] Image URLs match format: `https://nzchbnshkrkdqpcawohu.supabase.co/storage/v1/object/public/deals/images/*.jpg`

## Why This Worked in Android

The Android app works because:
1. Uses native OkHttp for image loading
2. No hostname validation or allowlist
3. Direct HTTP GET requests to Supabase storage
4. CORS headers don't affect native apps

## Additional Notes

### If Images Still Don't Load

1. **Check browser console** for specific error messages
2. **Check Network tab** to see if requests are being made
3. **Verify image URLs** in database match expected format
4. **Test with curl** to ensure images are accessible:
   ```bash
   curl -I "https://nzchbnshkrkdqpcawohu.supabase.co/storage/v1/object/public/deals/images/{filename}.jpg"
   ```

### Alternative: Use Regular img Tag

If you don't need Next.js Image optimization, you can use regular HTML img tags:

```tsx
// In DealCard.tsx or any component
<img
  src={deal.imageUrl}
  alt={deal.title}
  className="w-full h-full object-contain"
  onError={(e) => {
    e.currentTarget.src = '/placeholder.jpg'  // Fallback image
  }}
/>
```

This bypasses Next.js image validation entirely.

## Summary

**The Issue:** Single asterisk wildcard `*.supabase.co` is invalid in Next.js remotePatterns

**The Fix:** Use either:
- Exact hostname: `nzchbnshkrkdqpcawohu.supabase.co` (recommended)
- Double asterisk: `**.supabase.co` (if multi-project support needed)

**Must Restart:** Config changes require server restart to take effect
