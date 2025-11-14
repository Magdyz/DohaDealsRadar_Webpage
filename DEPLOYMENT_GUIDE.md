# DohaDealsRadar - Deployment Guide

Complete guide for deploying DohaDealsRadar to Vercel with custom domain configuration.

---

## Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [Environment Variables](#2-environment-variables)
3. [Vercel Deployment](#3-vercel-deployment)
4. [Custom Domain Setup](#4-custom-domain-setup)
5. [Post-Deployment Verification](#5-post-deployment-verification)
6. [Troubleshooting](#6-troubleshooting)
7. [Continuous Deployment](#7-continuous-deployment)

---

## 1. Prerequisites

### 1.1 Required Accounts
- ✅ GitHub account with repository access
- ✅ Vercel account (free tier available)
- ✅ Supabase project (already set up)
- ⚠️ Custom domain (optional, for production)

### 1.2 Supabase Setup Checklist
Before deploying, ensure Supabase is configured:

- [ ] Database schema created (run `database/schema.sql`)
- [ ] Storage bucket created: `deal-images`
- [ ] Storage bucket is public
- [ ] RLS policies enabled on all tables
- [ ] Email authentication enabled
- [ ] Email templates configured (OTP)
- [ ] Service role key available

**Get Supabase Credentials:**
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Navigate to: **Settings** → **API**
4. Copy:
   - **Project URL**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon Public Key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Service Role Key**: `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

---

## 2. Environment Variables

### 2.1 Required Environment Variables

Create a `.env.local` file locally for testing (already gitignored):

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Supabase Service Role (PRIVATE - for server-side API routes)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# API Configuration
NEXT_PUBLIC_API_BASE_URL=/api

# Build Configuration (optional)
NODE_ENV=production
```

### 2.2 Environment Variables Breakdown

| Variable | Type | Description | Where Used |
|----------|------|-------------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL | Client & Server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anonymous key (RLS enforced) | Client & Server |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** | Bypasses RLS (admin operations only) | Server API routes |
| `NEXT_PUBLIC_API_BASE_URL` | Public | Base URL for API routes | Client |

⚠️ **Security Note**:
- `NEXT_PUBLIC_*` variables are exposed to the browser
- `SUPABASE_SERVICE_ROLE_KEY` is **server-only** and must never be exposed to the client
- RLS policies protect data even with the anon key

### 2.3 API Routes Using Service Role Key

The following API routes require the service role key:

- `/api/report-deal` - Insert reports
- `/api/cast-vote` - Insert votes
- `/api/get-deal` - Fetch single deal (including unapproved)
- `/api/get-deals` - Fetch all deals
- `/api/get-user-deals` - Fetch user's deals
- `/api/get-user-stats` - Fetch user statistics
- `/api/submit-deal` - Submit new deals
- `/api/approve-deal` - Approve deals (moderator)
- `/api/reject-deal` - Reject deals (moderator)
- `/api/delete-deal` - Delete deals (admin)
- `/api/restore-deal` - Restore archived deals (admin)

---

## 3. Vercel Deployment

### 3.1 Push Code to GitHub

Ensure all changes are committed and pushed:

```bash
# Check status
git status

# Add all changes
git add .

# Commit with descriptive message
git commit -m "feat: Add deployment configuration and testing guide"

# Push to your branch
git push -u origin claude/testing-and-deployment-01VNJdrihJM9cxZxkJzaqUgC
```

### 3.2 Connect Repository to Vercel

**Option 1: Vercel Dashboard (Recommended)**

1. **Sign in to Vercel**: https://vercel.com/login
2. **Click**: "Add New..." → "Project"
3. **Import Git Repository**:
   - Select GitHub
   - Authorize Vercel to access your GitHub account
   - Select repository: `Magdyz/DohaDealsRadar_Webpage`
4. **Configure Project**:
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./` (leave default)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)
5. **Click**: "Deploy"

**Option 2: Vercel CLI**

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (run from project root)
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? [Your account]
# - Link to existing project? No
# - What's your project's name? dohadealsradar
# - In which directory is your code located? ./
# - Want to override settings? No

# Deploy to production
vercel --prod
```

### 3.3 Configure Environment Variables in Vercel

After project creation:

1. **Go to**: Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. **Add each variable**:

   **Variable 1:**
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://your-project-id.supabase.co`
   - Environment: **Production**, **Preview**, **Development**

   **Variable 2:**
   - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: `your_supabase_anon_key_here`
   - Environment: **Production**, **Preview**, **Development**

   **Variable 3:**
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: `your_supabase_service_role_key_here`
   - Environment: **Production**, **Preview**, **Development**

   **Variable 4:**
   - Name: `NEXT_PUBLIC_API_BASE_URL`
   - Value: `/api`
   - Environment: **Production**, **Preview**, **Development**

3. **Click**: "Save"
4. **Redeploy**: Vercel Dashboard → Deployments → Click "..." → "Redeploy"

### 3.4 Vercel Auto-Deployment

Vercel automatically deploys:
- ✅ **Production**: Every push to `main` branch
- ✅ **Preview**: Every push to feature branches
- ✅ **Pull Requests**: Every PR gets a unique preview URL

**Configure Branch for Production:**
1. Go to: **Settings** → **Git**
2. **Production Branch**: Set to `main` (or your default branch)
3. All other branches create preview deployments

---

## 4. Custom Domain Setup

### 4.1 Add Domain in Vercel

1. **Go to**: Vercel Dashboard → Your Project → **Settings** → **Domains**
2. **Click**: "Add"
3. **Enter your domain**:
   - Example: `dohadealsradar.com`
   - Or subdomain: `www.dohadealsradar.com`
4. **Click**: "Add"

### 4.2 Update DNS Records

Vercel will provide DNS records to add to your domain registrar.

**For Root Domain (`dohadealsradar.com`):**

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | `76.76.19.19` | 3600 |

**For www Subdomain (`www.dohadealsradar.com`):**

| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | www | `cname.vercel-dns.com` | 3600 |

**Alternative: Use Vercel Nameservers (Recommended)**

1. Vercel provides nameservers:
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```
2. Update nameservers at your domain registrar
3. Vercel manages all DNS automatically

### 4.3 Configure Domain in Registrar

**Common Registrars:**

**GoDaddy:**
1. Go to: My Products → Domains → Manage DNS
2. Add DNS records as shown above
3. Save changes

**Namecheap:**
1. Go to: Domain List → Manage → Advanced DNS
2. Add new records
3. Save changes

**Cloudflare:**
1. Go to: DNS → Records
2. Add records (disable proxy/orange cloud)
3. Save

### 4.4 SSL Certificate (Automatic)

- ✅ Vercel automatically issues **Let's Encrypt** SSL certificates
- ✅ HTTPS enabled by default
- ✅ Auto-renewal every 90 days
- ⏱️ Takes 5-60 minutes after DNS propagation

### 4.5 DNS Propagation

- **Time**: 5 minutes to 48 hours (usually < 1 hour)
- **Check status**: https://dnschecker.org
- **Vercel status**: Dashboard shows "Valid Configuration" when ready

### 4.6 Redirect www to Root (or vice versa)

**In Vercel Dashboard:**
1. **Settings** → **Domains**
2. Add both `dohadealsradar.com` and `www.dohadealsradar.com`
3. Set one as **Primary**
4. Vercel automatically redirects the other

---

## 5. Post-Deployment Verification

### 5.1 Deployment Checklist

After deployment, verify:

**Basic Functionality:**
- [ ] Site loads at Vercel URL (e.g., `dohadealsradar.vercel.app`)
- [ ] Site loads at custom domain (if configured)
- [ ] HTTPS certificate valid (green padlock)
- [ ] Service worker registers (check DevTools → Application)
- [ ] PWA manifest loads (check DevTools → Application → Manifest)

**Authentication:**
- [ ] Login page loads (`/login`)
- [ ] OTP email sends successfully
- [ ] Verification works (`/verify`)
- [ ] Username setup works (`/username`)
- [ ] Session persists after refresh

**Core Features:**
- [ ] Feed displays approved deals (`/feed`)
- [ ] Deal submission works (`/submit`)
- [ ] Image upload works (check Supabase storage)
- [ ] Voting works (hot/cold)
- [ ] Reporting works
- [ ] Moderation page loads (moderator only)

**Database:**
- [ ] Deals fetch correctly
- [ ] New deals insert correctly
- [ ] Votes insert correctly
- [ ] Reports insert correctly
- [ ] RLS policies working (can't access unauthorized data)

**Performance:**
- [ ] Images load from Supabase CDN
- [ ] Images are optimized (Next.js Image component)
- [ ] API routes respond < 1 second
- [ ] Lighthouse score: Performance 90+

**Environment Variables:**
- [ ] All env vars set correctly in Vercel
- [ ] No errors in Vercel logs (Functions tab)
- [ ] Service role key working (API routes functional)

### 5.2 Testing in Production

Use the [TESTING_GUIDE.md](./TESTING_GUIDE.md) to thoroughly test:

1. **Screen sizes** (mobile, tablet, desktop)
2. **User roles** (anonymous, user, moderator, admin)
3. **Browsers** (Chrome, Safari, Firefox)
4. **PWA** (installation, offline mode)

### 5.3 Check Vercel Logs

1. **Go to**: Vercel Dashboard → Your Project → **Deployments**
2. Click on latest deployment
3. **View**:
   - Build Logs (check for build errors)
   - Function Logs (check API route errors)
   - Runtime Logs (check for runtime errors)

**Common Issues:**
- Missing environment variables
- Database connection errors
- Image upload failures
- Authentication errors

---

## 6. Troubleshooting

### 6.1 Build Failures

**Error: Build failed**
```bash
# Check build locally first
npm run build

# Common fixes:
npm install        # Reinstall dependencies
rm -rf .next       # Clear Next.js cache
npm run build      # Rebuild
```

**Error: Environment variables not found**
- Verify all required env vars are set in Vercel
- Ensure variable names match exactly (case-sensitive)
- Redeploy after adding env vars

### 6.2 Runtime Errors

**Error: Supabase connection failed**
- Check `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
- Verify Supabase project is active

**Error: 403 Forbidden on API routes**
- Check `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel
- Verify RLS policies in Supabase
- Check API route has correct Supabase client

**Error: Image upload fails**
- Verify `deal-images` bucket exists in Supabase
- Check bucket is public
- Verify storage policies allow uploads

### 6.3 PWA Issues

**Service worker not registering**
- PWA is disabled in development (check `next.config.js`)
- Clear browser cache and reload
- Check `/sw.js` is accessible

**Install prompt not showing**
- iOS Safari: Use "Add to Home Screen"
- Android Chrome: Prompt appears after 2+ visits
- Check manifest.json is valid

### 6.4 Domain/DNS Issues

**Domain not resolving**
- Wait for DNS propagation (up to 48 hours)
- Check DNS records at registrar
- Use https://dnschecker.org to verify

**SSL certificate not issued**
- Wait 5-60 minutes after DNS propagation
- Check domain configuration in Vercel
- Ensure CAA records allow Let's Encrypt (if using Cloudflare)

**Redirect loop**
- Check DNS proxy settings (disable Cloudflare proxy)
- Verify only one domain is set as primary in Vercel

### 6.5 Performance Issues

**Slow page loads**
- Check Vercel region (should be closest to users)
- Optimize images (use Next.js Image component)
- Enable caching (already configured in `vercel.json`)

**API routes slow**
- Check database indexes (already optimized)
- Consider Supabase connection pooling
- Monitor Vercel function execution time

---

## 7. Continuous Deployment

### 7.1 Automatic Deployments

**Production Deployments:**
```bash
# Merge to main branch
git checkout main
git merge your-feature-branch
git push origin main
# → Automatic production deployment
```

**Preview Deployments:**
```bash
# Push to any branch
git push origin feature-branch
# → Automatic preview deployment with unique URL
```

### 7.2 Deployment Notifications

**Configure Slack/Discord (Optional):**
1. **Vercel Dashboard** → **Settings** → **Notifications**
2. Add webhook URL
3. Select events:
   - Deployment succeeded
   - Deployment failed
   - Deployment ready

### 7.3 Rollback

If a deployment causes issues:

1. **Go to**: Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "..." → **Promote to Production**
4. Confirm rollback

Or via CLI:
```bash
vercel rollback
```

### 7.4 Preview URLs for Pull Requests

Every PR automatically gets a unique preview URL:

```
https://dohadealsradar-git-feature-branch-username.vercel.app
```

**Benefits:**
- Test changes before merging
- Share with team for review
- Automatic updates on every commit

---

## 8. Monitoring & Analytics

### 8.1 Vercel Analytics (Optional)

Enable Web Analytics:
1. **Vercel Dashboard** → **Analytics**
2. Click "Enable"
3. Free tier: 100k events/month

**Metrics tracked:**
- Page views
- Unique visitors
- Top pages
- Referrers
- Devices

### 8.2 Vercel Speed Insights (Optional)

Enable Real User Monitoring (RUM):
1. **Vercel Dashboard** → **Speed Insights**
2. Click "Enable"
3. Add to `app/layout.tsx`:

```tsx
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  )
}
```

### 8.3 Custom Analytics (Optional)

Add Google Analytics, Plausible, or other analytics:

**Google Analytics:**
```bash
npm install @next/third-parties
```

```tsx
// app/layout.tsx
import { GoogleAnalytics } from '@next/third-parties/google'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <GoogleAnalytics gaId="G-XXXXXXXXXX" />
      </body>
    </html>
  )
}
```

---

## 9. Cost Optimization

### 9.1 Vercel Free Tier Limits

**Included:**
- ✅ Unlimited deployments
- ✅ 100 GB bandwidth/month
- ✅ Automatic HTTPS
- ✅ Preview deployments
- ✅ 100 GB-hours serverless function execution

**Limits:**
- ⚠️ Max 12 serverless functions per deployment (we have ~15 API routes)
- ⚠️ 10 second serverless function timeout

**If you exceed free tier:**
- Upgrade to Pro ($20/month)
- Or optimize API routes (combine some routes)

### 9.2 Supabase Free Tier Limits

**Included:**
- ✅ 500 MB database
- ✅ 1 GB storage
- ✅ 50,000 monthly active users
- ✅ 2 GB bandwidth

**Monitor usage:**
- Supabase Dashboard → Usage

---

## 10. Security Best Practices

### 10.1 Environment Variables
- ✅ Never commit `.env.local` to Git (already gitignored)
- ✅ Use different keys for dev/prod
- ✅ Rotate service role key if compromised

### 10.2 CORS & Headers
- ✅ Security headers configured in `vercel.json`
- ✅ CORS handled by Next.js API routes

### 10.3 Rate Limiting (Recommended)
Consider adding rate limiting to API routes:

```bash
npm install @vercel/edge
```

See: https://vercel.com/docs/functions/edge-middleware/middleware-api#rate-limiting

### 10.4 Content Security Policy (CSP)
Add CSP headers in `next.config.js` for enhanced security.

---

## 11. Deployment Commands Quick Reference

```bash
# Local development
npm run dev                 # Start dev server

# Production build (test locally)
npm run build              # Build for production
npm run start              # Start production server

# Vercel CLI
vercel                     # Deploy preview
vercel --prod              # Deploy to production
vercel logs                # View logs
vercel env pull            # Pull env vars to .env.local
vercel domains             # Manage domains
vercel rollback            # Rollback deployment

# Git
git push origin main       # Deploy to production (auto)
git push origin feature    # Deploy preview (auto)
```

---

## 12. Support & Resources

### Documentation
- **Next.js**: https://nextjs.org/docs
- **Vercel**: https://vercel.com/docs
- **Supabase**: https://supabase.com/docs

### Vercel Support
- **Community**: https://github.com/vercel/vercel/discussions
- **Status**: https://www.vercel-status.com
- **Email**: support@vercel.com (Pro plan only)

### Project-Specific Docs
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Comprehensive testing guide
- [DEVELOPMENT_CHECKLIST.md](./DEVELOPMENT_CHECKLIST.md) - Development checklist
- [database/README.md](./database/README.md) - Database setup
- [STORAGE_SETUP.md](./STORAGE_SETUP.md) - Supabase storage setup

---

## 13. Deployment Checklist

### Pre-Deployment
- [ ] All tests passing (see TESTING_GUIDE.md)
- [ ] No console errors in development
- [ ] Environment variables documented
- [ ] Database schema up to date
- [ ] Supabase storage configured
- [ ] Code committed and pushed to GitHub

### Vercel Setup
- [ ] Repository connected to Vercel
- [ ] Environment variables configured
- [ ] Build successful
- [ ] Preview deployment works

### Production Deployment
- [ ] Main branch deployed to production
- [ ] Custom domain configured (if applicable)
- [ ] DNS records updated
- [ ] SSL certificate issued
- [ ] All features tested in production

### Post-Deployment
- [ ] Monitoring enabled
- [ ] Error tracking configured
- [ ] Analytics setup (optional)
- [ ] Team notified
- [ ] Documentation updated

---

## Summary

**Quick Deployment Steps:**

1. ✅ Push code to GitHub
2. ✅ Connect repo to Vercel
3. ✅ Add environment variables in Vercel
4. ✅ Deploy (automatic)
5. ✅ Add custom domain (optional)
6. ✅ Update DNS records
7. ✅ Verify deployment
8. ✅ Test thoroughly

**Your site will be live at:**
- Vercel URL: `https://dohadealsradar.vercel.app`
- Custom domain: `https://yourdomain.com` (after DNS propagation)

🚀 **Happy Deploying!**
