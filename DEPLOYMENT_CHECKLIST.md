# DohaDealsRadar - Quick Deployment Checklist

Use this checklist to ensure a smooth deployment to production.

---

## Pre-Deployment Setup

### 1. Supabase Configuration
- [ ] Database schema created (run `database/schema.sql` in Supabase SQL Editor)
- [ ] RLS policies enabled on all tables
- [ ] Storage bucket `deal-images` created and set to public
- [ ] Email authentication enabled
- [ ] Email OTP templates configured
- [ ] Test email delivery works

### 2. Gather Supabase Credentials
Go to: **Supabase Dashboard → Settings → API**

- [ ] Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Copy **Anon Public Key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Copy **Service Role Key** → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ Keep secret!

### 3. Local Testing
- [ ] Create `.env.local` file with all environment variables
- [ ] Run `npm install` to install dependencies
- [ ] Run `npm run dev` to test locally
- [ ] Test login flow (OTP email should arrive)
- [ ] Test deal submission with image upload
- [ ] Test voting and reporting
- [ ] Run `npm run build` to ensure production build works
- [ ] Fix any build errors

---

## Vercel Deployment

### 4. Push Code to GitHub
```bash
git status                    # Check current changes
git add .                     # Stage all changes
git commit -m "feat: Add deployment configuration"
git push -u origin [your-branch-name]
```

### 5. Connect to Vercel
- [ ] Sign in to Vercel: https://vercel.com/login
- [ ] Click "Add New..." → "Project"
- [ ] Import repository: `Magdyz/DohaDealsRadar_Webpage`
- [ ] Framework: Next.js (auto-detected)
- [ ] Click "Deploy" (initial deployment will fail without env vars - that's OK!)

### 6. Add Environment Variables
Go to: **Vercel Dashboard → Project → Settings → Environment Variables**

Add these 4 variables (for Production, Preview, and Development):

| Variable Name | Value | Environments |
|---------------|-------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | All 3 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon key | All 3 |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key ⚠️ | All 3 |
| `NEXT_PUBLIC_API_BASE_URL` | `/api` | All 3 |

- [ ] All 4 environment variables added
- [ ] Click "Save" after each variable

### 7. Redeploy
- [ ] Go to: Deployments → Latest deployment → "..." → "Redeploy"
- [ ] Wait for build to complete
- [ ] Check build logs for errors

---

## Post-Deployment Verification

### 8. Test Vercel URL
Visit your Vercel URL (e.g., `https://dohadealsradar.vercel.app`)

**Basic Checks:**
- [ ] Site loads successfully
- [ ] No console errors (open DevTools → Console)
- [ ] HTTPS is enabled (green padlock)
- [ ] Service worker registers (DevTools → Application → Service Workers)

**Authentication:**
- [ ] Navigate to `/login`
- [ ] Request OTP code
- [ ] Check email for OTP
- [ ] Enter OTP and verify login works
- [ ] Set username if new user
- [ ] Session persists after page refresh

**Core Features:**
- [ ] Feed loads with deals (`/feed`)
- [ ] Can vote on deals (🔥/❄️)
- [ ] Can report deals
- [ ] Can submit new deal (`/submit`)
- [ ] Image upload works
- [ ] Deal submission appears in account page

**User Roles:**
Create test users with different roles:

```sql
-- Regular user
INSERT INTO public.users (email, username, role, auto_approve)
VALUES ('testuser@example.com', 'testuser', 'user', false);

-- Moderator
INSERT INTO public.users (email, username, role, auto_approve)
VALUES ('moderator@example.com', 'moderator', 'moderator', false);

-- Admin
INSERT INTO public.users (email, username, role, auto_approve)
VALUES ('admin@example.com', 'admin', 'admin', true);
```

- [ ] Regular user: Can submit (requires approval)
- [ ] Moderator: Can access `/moderation` and approve/reject deals
- [ ] Admin: Deals auto-approved

**Performance:**
- [ ] Run Lighthouse audit (Target: 90+ performance)
- [ ] Images load from Supabase CDN
- [ ] API routes respond quickly (< 1s)

### 9. Check Vercel Logs
- [ ] Go to: Deployments → Latest → Function Logs
- [ ] No errors in logs
- [ ] API routes executing successfully

---

## Custom Domain Setup (Optional)

### 10. Add Domain to Vercel
- [ ] Go to: Settings → Domains
- [ ] Click "Add"
- [ ] Enter your domain (e.g., `dohadealsradar.com`)
- [ ] Click "Add"

### 11. Update DNS Records
At your domain registrar, add these DNS records:

**For root domain:**
```
Type: A
Name: @
Value: 76.76.19.19
TTL: 3600
```

**For www subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

- [ ] DNS records added at registrar
- [ ] Wait 5-60 minutes for DNS propagation
- [ ] Check status: https://dnschecker.org

### 12. Verify Domain
- [ ] Custom domain loads successfully
- [ ] HTTPS certificate issued automatically
- [ ] www redirects to root (or vice versa)

---

## Production Testing

### 13. Comprehensive Testing
Use [TESTING_GUIDE.md](./TESTING_GUIDE.md) for detailed testing:

**Screen Sizes:**
- [ ] Mobile (320px, 375px, 414px)
- [ ] Tablet (768px, 820px, 1024px)
- [ ] Desktop (1366px, 1920px)

**Browsers:**
- [ ] Chrome
- [ ] Safari
- [ ] Firefox
- [ ] Mobile browsers

**PWA:**
- [ ] Install prompt appears
- [ ] App installs to home screen
- [ ] Works offline (cached images)

### 14. Monitor & Optimize
- [ ] Enable Vercel Analytics (optional)
- [ ] Enable Speed Insights (optional)
- [ ] Set up error monitoring (optional)
- [ ] Monitor Supabase usage

---

## Continuous Deployment

### 15. Configure Auto-Deployment
- [ ] Main branch → Production (automatic)
- [ ] Feature branches → Preview deployments (automatic)
- [ ] Pull requests → Unique preview URLs (automatic)

**Test Auto-Deployment:**
```bash
# Make a small change
echo "# Test" >> README.md
git add .
git commit -m "test: Verify auto-deployment"
git push origin main
# → Should trigger automatic deployment
```

- [ ] Automatic deployment triggered
- [ ] Build successful
- [ ] Changes live on production

---

## Rollback Plan

If something goes wrong:

### Option 1: Vercel Dashboard
1. Go to: Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"

### Option 2: Git Revert
```bash
git revert HEAD
git push origin main
```

### Option 3: Vercel CLI
```bash
vercel rollback
```

---

## Final Checklist

**All Systems Go:**
- [ ] ✅ Supabase configured and tested
- [ ] ✅ Code deployed to Vercel
- [ ] ✅ Environment variables set
- [ ] ✅ All features tested and working
- [ ] ✅ Custom domain configured (if applicable)
- [ ] ✅ HTTPS enabled
- [ ] ✅ PWA functional
- [ ] ✅ Performance optimized
- [ ] ✅ Team notified
- [ ] ✅ Documentation updated

**Monitoring:**
- [ ] 🔍 Vercel logs clear of errors
- [ ] 🔍 Supabase database healthy
- [ ] 🔍 Email delivery working
- [ ] 🔍 No security issues

---

## Troubleshooting Common Issues

### Build Fails
**Error:** Environment variables not found
- **Fix:** Add all 4 env vars in Vercel settings, then redeploy

### 403 Forbidden on API Routes
**Error:** Supabase returns 403
- **Fix:** Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly in Vercel

### Image Upload Fails
**Error:** Storage insert failed
- **Fix:** Ensure `deal-images` bucket exists and is public in Supabase

### OTP Email Not Received
**Error:** Email not arriving
- **Fix:** Check Supabase auth settings and email templates

### Domain Not Resolving
**Error:** DNS not found
- **Fix:** Wait for DNS propagation (up to 48 hours), verify DNS records

### PWA Not Installing
**Error:** Install prompt missing
- **Fix:** PWA disabled in dev mode, ensure testing production build

---

## Support Resources

- **Full Deployment Guide:** [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Testing Guide:** [TESTING_GUIDE.md](./TESTING_GUIDE.md)
- **Vercel Docs:** https://vercel.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs

---

## Next Steps After Deployment

1. **Monitor:** Check Vercel logs and Supabase usage regularly
2. **Optimize:** Review Lighthouse scores and improve performance
3. **Scale:** Monitor free tier limits, upgrade if needed
4. **Market:** Share your app with users!
5. **Iterate:** Collect feedback and add new features

---

## Deployment Status

**Project:** DohaDealsRadar
**Repository:** `Magdyz/DohaDealsRadar_Webpage`
**Branch:** `claude/testing-and-deployment-01VNJdrihJM9cxZxkJzaqUgC`
**Framework:** Next.js 16 with PWA
**Database:** Supabase (PostgreSQL)
**Hosting:** Vercel

**Deployment URL:** _[Fill in after deployment]_
**Custom Domain:** _[Fill in if applicable]_
**Deployed By:** _[Your name]_
**Deployed On:** _[Date]_

---

🚀 **Ready to Deploy!**

Follow this checklist step-by-step, and you'll have DohaDealsRadar live in production within 30 minutes!

**Questions?** See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed explanations.
