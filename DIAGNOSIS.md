# DohaDealsRadar Image Loading Issue - Diagnosis

## Problem Summary
Images are not loading in the Next.js web app, but work perfectly in the Android app using the same Supabase storage.

## Investigation Results

### 1. Image URLs in Database ✅ CORRECT
Sample URLs from database:
```
https://nzchbnshkrkdqpcawohu.supabase.co/storage/v1/object/public/deals/images/cd33aabc-b07f-4bbf-9ad6-4ff979134259.jpg
https://nzchbnshkrkdqpcawohu.supabase.co/storage/v1/object/public/deals/images/573e5c71-e1e3-48fc-984c-5b65b6baa004.jpg
```

**Format:** `https://nzchbnshkrkdqpcawohu.supabase.co/storage/v1/object/public/deals/images/{uuid}.jpg`

### 2. Android App Configuration ✅ CORRECT
From `/Users/magz/Documents/Coding/DohaDealsRadar/local.properties`:
```properties
SUPABASE_PUBLIC_URL=https://nzchbnshkrkdqpcawohu.supabase.co/storage/v1/object/public/deals/images
SUPABASE_STORAGE_URL=https://nzchbnshkrkdqpcawohu.supabase.co/storage/v1/object/deals/images
```

Android `StorageUploader.kt` creates URLs:
```kotlin
val publicUrl = "$PUBLIC_BASE_URL/$fileName"
// Results in: https://nzchbnshkrkdqpcawohu.supabase.co/storage/v1/object/public/deals/images/{uuid}.jpg
```

### 3. Web App Image Upload ✅ CORRECT
`/Users/magz/Documents/Coding/DohaDealsRadar_Webpage/src/app/api/upload-image/route.ts`:
```typescript
const filePath = `images/${uniqueFilename}`
const { data: urlData } = supabase.storage
  .from('deals')
  .getPublicUrl(filePath)

return NextResponse.json({
  url: urlData.publicUrl,  // This generates the correct URL format
})
```

Web app generates same format as Android.

### 4. Image Accessibility ✅ WORKING
Tested via curl:
```
curl -I "https://nzchbnshkrkdqpcawohu.supabase.co/storage/v1/object/public/deals/images/cd33aabc-b07f-4bbf-9ad6-4ff979134259.jpg"
HTTP/2 200
content-type: image/jpeg
access-control-allow-origin: *
```

Images ARE publicly accessible with correct CORS headers!

### 5. Next.js Configuration ❌ ISSUE FOUND
`/Users/magz/Documents/Coding/DohaDealsRadar_Webpage/next.config.js`:
```javascript
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',  // ❌ WILDCARD PATTERN
      },
    ],
  },
}
```

**PROBLEM:** Next.js `remotePatterns` does NOT support wildcard hostnames like `*.supabase.co`.

According to Next.js docs, wildcards are only supported in `pathname`, not in `hostname`.

### 6. Web App Image Rendering
`/Users/magz/Documents/Coding/DohaDealsRadar_Webpage/src/components/deals/DealCard.tsx`:
```tsx
<Image
  src={deal.imageUrl}
  alt={deal.title}
  fill
  unoptimized
  className="object-contain"
  sizes="(max-width: 768px) 50vw, 33vw"
  onError={() => setImageError(true)}
/>
```

Uses Next.js Image component which requires proper `remotePatterns` configuration.

## Root Cause Analysis

**PRIMARY ISSUE:** The `hostname: '*.supabase.co'` wildcard pattern in `next.config.js` is INVALID for Next.js remotePatterns. Next.js is likely rejecting these image sources, causing them to fail loading.

**Why Android works:** Android uses native HTTP requests with OkHttp - no hostname validation.

**Why Web fails:** Next.js Image component validates remote image sources against `remotePatterns` and rejects wildcard hostnames.

## Solution

Replace the wildcard pattern with the exact hostname:

```javascript
// next.config.js
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nzchbnshkrkdqpcawohu.supabase.co',  // ✅ EXACT HOSTNAME
        pathname: '/storage/v1/object/public/**',      // ✅ WILDCARD PATH
      },
    ],
  },
}
```

## Alternative Solutions

### Option 1: Use Multiple Domains (if needed)
```javascript
remotePatterns: [
  {
    protocol: 'https',
    hostname: 'nzchbnshkrkdqpcawohu.supabase.co',
    pathname: '/storage/v1/object/public/**',
  },
  // Add more if you have multiple Supabase projects
]
```

### Option 2: Disable Image Domain Validation (NOT RECOMMENDED)
```javascript
images: {
  unoptimized: true,
  domains: ['nzchbnshkrkdqpcawohu.supabase.co'],
}
```
Note: `domains` is deprecated in favor of `remotePatterns`.

### Option 3: Use Regular HTML img Tag
If you don't need Next.js Image optimization:
```tsx
<img
  src={deal.imageUrl}
  alt={deal.title}
  className="object-contain w-full h-full"
/>
```

## Verification Steps

After fixing `next.config.js`:

1. Restart Next.js dev server (required for config changes)
2. Check browser console for any Image errors
3. Verify images load in DealCard components
4. Test on deal detail pages
5. Check browser Network tab for failed image requests

## Additional Notes

- All image URLs in database use correct format
- CORS is properly configured on Supabase
- Image files are accessible and valid
- No database or storage configuration needed
- Fix is purely in Next.js configuration
