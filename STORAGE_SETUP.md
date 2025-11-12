# Supabase Storage Setup for Images

## Problem
Images are not loading because the Supabase storage bucket has not been created and configured.

## Solution: Create and Configure Storage Bucket

### Step 1: Create Storage Bucket

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project (`nzchbnshkrkdqpcawohu`)
3. Click on **Storage** in the left sidebar
4. Click **New bucket** button
5. Enter the following details:
   - **Name:** `deals` (must be exactly this name)
   - **Public bucket:** Toggle ON (IMPORTANT!)
   - **File size limit:** 10 MB (optional)
   - **Allowed MIME types:** Leave empty or add: `image/jpeg, image/png, image/webp, image/gif`
6. Click **Create bucket**

### Step 2: Verify Bucket is Public

1. In Storage, click on the `deals` bucket
2. Check that the bucket shows "Public" badge
3. If not public, click the three dots (...) → **Edit bucket** → Toggle "Public bucket" ON → Save

### Step 3: Set Storage Policies (Optional but Recommended)

The bucket should allow:
- ✅ Public read access (anyone can view images)
- ✅ Authenticated write access (users can upload)

To set policies:
1. Click on the `deals` bucket
2. Go to **Policies** tab
3. Add these policies if they don't exist:

**For INSERT (Upload):**
- Name: "Allow authenticated uploads"
- Policy: `(bucket_id = 'deals')`
- Allowed roles: `authenticated`
- Allowed operations: `INSERT`

**For SELECT (View):**
- Name: "Allow public read"
- Policy: `(bucket_id = 'deals')`
- Allowed roles: `public`, `authenticated`
- Allowed operations: `SELECT`

### Step 4: Test the Setup

After creating the bucket, test by:
1. Restart your dev server: `npm run dev`
2. Go to `/submit` page
3. Try uploading an image
4. The image should now upload and display correctly

## Verification

You can verify the bucket is working by checking these URLs in your browser:

**Storage URL format:**
```
https://nzchbnshkrkdqpcawohu.supabase.co/storage/v1/object/public/deals/images/your-image.jpg
```

If configured correctly:
- ✅ Should return the image
- ❌ If returns 400/404 error: Bucket doesn't exist or isn't public

## What We Fixed in the Code

1. **next.config.js** - Added proper hostname pattern and disabled image optimization:
   ```js
   images: {
     unoptimized: true,
     remotePatterns: [
       {
         protocol: 'https',
         hostname: '*.supabase.co',
       },
     ],
   }
   ```

2. All Image components already have `unoptimized` prop

## Troubleshooting

### Images still not loading after bucket creation
- Clear Next.js cache: `rm -rf .next && npm run dev`
- Hard refresh browser: Ctrl+Shift+R (Cmd+Shift+R on Mac)
- Check browser console for errors

### Upload fails with "Bucket not found"
- Verify bucket is named exactly `deals`
- Check that bucket is public

### Images upload but don't display
- Verify bucket is public
- Check the image URL in browser console
- Ensure the bucket has read policies enabled
