# DohaDealsRadar - Testing Guide

## Overview
This guide provides comprehensive testing procedures for all screen sizes and user roles before deployment.

---

## 1. Screen Size Testing

### 1.1 Mobile Testing (320px - 767px)

#### Test Devices/Viewports:
- **Small Mobile**: 320px × 568px (iPhone SE)
- **Standard Mobile**: 375px × 667px (iPhone 8)
- **Large Mobile**: 414px × 896px (iPhone 11 Pro Max)

#### Pages to Test:

**Feed Page (`/feed`)**
- [ ] Deals display in single column
- [ ] Images are properly sized and not distorted
- [ ] Vote buttons (🔥/❄️) are easily tappable (min 44px)
- [ ] Category badges are visible and readable
- [ ] Location and promo code display correctly
- [ ] Report button is accessible
- [ ] Infinite scroll works smoothly

**Submit Deal Page (`/submit`)**
- [ ] Image upload button is easily accessible
- [ ] Form fields stack vertically
- [ ] Image preview displays correctly
- [ ] Category dropdown is easy to select
- [ ] Date picker is mobile-friendly
- [ ] Submit button is clearly visible
- [ ] Validation errors display properly

**Deal Details Page (`/post`)**
- [ ] Deal image displays full-width
- [ ] Title and description are readable
- [ ] Vote buttons are easily accessible
- [ ] Promo code (if exists) is copyable
- [ ] Link button works correctly
- [ ] Report modal fits screen

**Moderation Page (`/moderation`)** (Moderator/Admin only)
- [ ] Pending deals list displays correctly
- [ ] Deal preview cards are readable
- [ ] Approve/Reject buttons are easily tappable
- [ ] Deal details expand properly

**Archive Page (`/archive`)**
- [ ] Archived deals display in list
- [ ] Restore button is accessible
- [ ] Search/filter (if implemented) works
- [ ] Pagination/infinite scroll works

**Account Page (`/account`)**
- [ ] Profile information displays correctly
- [ ] Stats cards stack vertically
- [ ] User deals list is readable
- [ ] Logout button is accessible

**Authentication Pages**
- [ ] Login form (`/login`) is properly sized
- [ ] OTP input fields are easy to tap
- [ ] Username form is accessible
- [ ] Error messages are visible

### 1.2 Tablet Testing (768px - 1023px)

#### Test Devices/Viewports:
- **iPad Mini**: 768px × 1024px
- **iPad Air**: 820px × 1180px
- **iPad Pro 11"**: 834px × 1194px

#### Key Checks:
- [ ] Deals display in 2-column grid
- [ ] Navigation remains accessible
- [ ] Forms utilize available space without stretching too much
- [ ] Modal dialogs are centered and properly sized
- [ ] Touch targets remain at least 44px

### 1.3 Desktop Testing (1024px+)

#### Test Viewports:
- **Laptop**: 1366px × 768px
- **Desktop**: 1920px × 1080px
- **Large Display**: 2560px × 1440px

#### Key Checks:
- [ ] Deals display in 3-column grid (or appropriate grid)
- [ ] Maximum content width is enforced (prevent excessive stretching)
- [ ] Mouse hover states work on interactive elements
- [ ] Keyboard navigation is functional
- [ ] Forms are centered and well-proportioned

### 1.4 PWA Testing

**Installation**
- [ ] Install prompt appears on mobile
- [ ] App installs correctly
- [ ] App icon displays on home screen
- [ ] Splash screen appears on launch

**Offline Functionality**
- [ ] Previously viewed images load from cache
- [ ] API requests fall back gracefully
- [ ] Appropriate offline messages display

**Performance**
- [ ] Service worker registers successfully
- [ ] Images are cached properly
- [ ] API responses use NetworkFirst strategy
- [ ] No stale data issues

---

## 2. User Role Testing

### 2.1 Anonymous User (Not Logged In)

**Allowed Actions:**
- [ ] View approved deals on feed page
- [ ] View deal details
- [ ] Vote on deals (tracked by device_id)
- [ ] Report deals (tracked by device_id)
- [ ] Filter/search deals (if implemented)

**Restricted Actions:**
- [ ] Cannot access `/submit` - redirects to `/login`
- [ ] Cannot access `/moderation` - redirects to `/login`
- [ ] Cannot access `/account` - redirects to `/login`
- [ ] Cannot access `/archive` - redirects to `/login`

**Test Scenarios:**
1. **View Feed**: Navigate to `/feed` and verify deals display
2. **Vote**: Click 🔥 or ❄️ and verify vote count updates
3. **Report**: Click report button and submit report
4. **Access Restricted**: Try accessing `/submit`, `/moderation`, `/account` - should redirect to login

### 2.2 Regular User (Role: `user`)

**User Creation:**
```sql
-- Run in Supabase SQL Editor
INSERT INTO public.users (email, username, role, auto_approve)
VALUES ('testuser@example.com', 'testuser', 'user', false);
```

**Allowed Actions:**
- [ ] All anonymous actions
- [ ] Submit new deals
- [ ] View submitted deals in account page
- [ ] Edit own deals (if implemented)
- [ ] View deal statistics

**Restricted Actions:**
- [ ] Cannot access moderation page
- [ ] Cannot approve/reject deals
- [ ] Deals require moderation approval

**Test Scenarios:**
1. **Login**: Login with OTP → Set username (if new)
2. **Submit Deal**:
   - Navigate to `/submit`
   - Fill all required fields
   - Upload image (< 5MB)
   - Submit deal
   - Verify deal appears in "Pending" on account page
3. **View Account**:
   - Check stats (total, approved, pending, rejected)
   - Verify submitted deals list displays correctly
4. **Restricted Access**:
   - Try accessing `/moderation` - should show "unauthorized" or redirect

### 2.3 Moderator (Role: `moderator`)

**User Creation:**
```sql
-- Run in Supabase SQL Editor
INSERT INTO public.users (email, username, role, auto_approve)
VALUES ('moderator@example.com', 'moderator', 'moderator', false);
```

**Allowed Actions:**
- [ ] All regular user actions
- [ ] Access moderation page
- [ ] View pending deals
- [ ] Approve deals
- [ ] Reject deals
- [ ] View reports (if implemented)

**Test Scenarios:**
1. **Login as Moderator**
2. **Access Moderation**:
   - Navigate to `/moderation`
   - Verify pending deals display
3. **Approve Deal**:
   - Select a pending deal
   - Click approve
   - Verify deal appears in feed
   - Verify deal removed from pending list
4. **Reject Deal**:
   - Select a pending deal
   - Click reject
   - Verify deal is removed from pending
   - Verify deal is marked as rejected (check archive or database)
5. **Submit Own Deal**:
   - Submit a deal
   - Verify it still requires approval (moderators can't approve their own deals)

### 2.4 Admin (Role: `admin`)

**User Creation:**
```sql
-- Run in Supabase SQL Editor
INSERT INTO public.users (email, username, role, auto_approve)
VALUES ('admin@example.com', 'admin', 'admin', true);
```

**Allowed Actions:**
- [ ] All moderator actions
- [ ] Auto-approve enabled (deals auto-approved on submission)
- [ ] Full access to all features

**Test Scenarios:**
1. **Login as Admin**
2. **Auto-Approve**:
   - Submit a new deal
   - Verify deal is automatically approved and appears in feed immediately
3. **Moderation Access**:
   - Access moderation page
   - Verify can approve/reject any deals
4. **Archive Access**:
   - Access archive page
   - View archived deals
   - Restore archived deals (if implemented)

### 2.5 Auto-Approve User (Role: `user`, auto_approve: `true`)

**User Creation:**
```sql
-- Run in Supabase SQL Editor
INSERT INTO public.users (email, username, role, auto_approve)
VALUES ('trusteduser@example.com', 'trusteduser', 'user', true);
```

**Test Scenarios:**
1. **Login as Auto-Approve User**
2. **Submit Deal**:
   - Submit a new deal
   - Verify deal is automatically approved
   - Verify deal appears in feed immediately
3. **Verify Regular User Permissions**:
   - Cannot access moderation page
   - Can only see own deals in account

---

## 3. Feature-Specific Testing

### 3.1 Deal Submission
- [ ] Image upload works (JPEG, PNG, WebP)
- [ ] Image compression works (max 5MB, compressed if larger)
- [ ] Image preview displays correctly
- [ ] Required fields validated
- [ ] URL validation works
- [ ] Date picker shows future dates only
- [ ] Category selection works
- [ ] Promo code is optional
- [ ] Success message displays
- [ ] Deal appears in user's account

### 3.2 Voting System
- [ ] Can vote hot (🔥)
- [ ] Can vote cold (❄️)
- [ ] Can change vote
- [ ] Vote count updates in real-time
- [ ] One vote per device (device_id)
- [ ] Votes persist on page reload

### 3.3 Reporting System
- [ ] Report modal opens
- [ ] Report reasons display
- [ ] Required reason selection
- [ ] Optional note field
- [ ] Submit report works
- [ ] Success message displays
- [ ] One report per device per deal (if implemented)

### 3.4 Deal Expiration
- [ ] Expired deals don't show in feed
- [ ] Expired deals show in archive
- [ ] Expiration date displays correctly
- [ ] Countdown/time remaining shows (if implemented)

### 3.5 Search & Filtering (if implemented)
- [ ] Category filter works
- [ ] Search by title works
- [ ] Filter by location works
- [ ] Combined filters work
- [ ] Clear filters works

---

## 4. Browser Testing

### 4.1 Chrome/Edge (Chromium)
- [ ] All features work
- [ ] PWA installation works
- [ ] Service worker registers
- [ ] DevTools shows no errors

### 4.2 Safari (iOS/macOS)
- [ ] All features work
- [ ] PWA installation works (iOS)
- [ ] Image upload works
- [ ] Date picker works
- [ ] No webkit-specific issues

### 4.3 Firefox
- [ ] All features work
- [ ] No console errors
- [ ] Forms work correctly

### 4.4 Samsung Internet (Android)
- [ ] All features work
- [ ] PWA installation works
- [ ] No mobile-specific issues

---

## 5. Performance Testing

### 5.1 Lighthouse Audit
Run Lighthouse in Chrome DevTools for each page:

**Target Scores:**
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 90+
- PWA: 100

**Pages to Audit:**
- [ ] `/feed`
- [ ] `/submit`
- [ ] `/post?id=[deal-id]`
- [ ] `/moderation`
- [ ] `/account`

### 5.2 Network Testing
- [ ] Test on slow 3G
- [ ] Test on 4G
- [ ] Test with offline mode
- [ ] Verify image lazy loading
- [ ] Check bundle size

---

## 6. Security Testing

### 6.1 Authentication
- [ ] OTP verification works
- [ ] Invalid OTP rejected
- [ ] Session persists after refresh
- [ ] Logout works correctly
- [ ] Protected routes redirect to login

### 6.2 Authorization
- [ ] Users can't access moderation page
- [ ] Users can't approve deals via API
- [ ] RLS policies enforce data access
- [ ] Can't edit other users' deals

### 6.3 Input Validation
- [ ] XSS prevention (script tags in title/description)
- [ ] SQL injection prevention
- [ ] File upload validation (type, size)
- [ ] URL validation
- [ ] Required field validation

---

## 7. Testing Checklist Summary

### Pre-Deployment Checklist
- [ ] All screen sizes tested (mobile, tablet, desktop)
- [ ] All user roles tested (anonymous, user, moderator, admin)
- [ ] All browsers tested
- [ ] Lighthouse scores meet targets
- [ ] No console errors on any page
- [ ] PWA installation works
- [ ] All API routes functional
- [ ] Database RLS policies verified
- [ ] Environment variables configured
- [ ] Image storage working (Supabase)
- [ ] Email OTP delivery working

### Post-Deployment Checklist
- [ ] Production URL accessible
- [ ] HTTPS certificate valid
- [ ] Custom domain configured (if applicable)
- [ ] Environment variables set in Vercel
- [ ] Database connection working
- [ ] Image uploads working in production
- [ ] Email OTP working in production
- [ ] No errors in Vercel logs
- [ ] Analytics/monitoring setup (if applicable)

---

## 8. Known Limitations & Edge Cases

### Current Limitations:
1. **Device-based tracking**: Votes and reports use device_id (can be cleared)
2. **No user blocking**: Reported users aren't automatically blocked
3. **No deal editing**: Users can't edit submitted deals
4. **No image deletion**: Old images aren't cleaned up from storage

### Edge Cases to Test:
- [ ] Submit deal with extremely long title (>500 chars)
- [ ] Submit deal with no description
- [ ] Upload very large image (>10MB)
- [ ] Upload non-image file
- [ ] Submit deal with expired date in past
- [ ] Vote on archived deal
- [ ] Report already reported deal

---

## 9. Testing Tools

### Browser DevTools
- **Chrome DevTools**: Device emulation, Lighthouse, Network tab
- **Safari Web Inspector**: iOS debugging
- **Firefox Developer Tools**: Responsive design mode

### External Tools
- **BrowserStack**: Cross-browser testing
- **Responsinator**: Quick responsive preview
- **GTmetrix**: Performance analysis
- **WebPageTest**: Advanced performance metrics

### Local Testing Commands
```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server locally
npm run start

# Run linter
npm run lint
```

---

## 10. Bug Reporting Template

When you find issues during testing:

```markdown
**Page/Feature**: [e.g., Submit Deal Page]
**User Role**: [e.g., Regular User]
**Device/Screen Size**: [e.g., iPhone 11 Pro, 375px]
**Browser**: [e.g., Safari iOS 15]
**Steps to Reproduce**:
1. Navigate to /submit
2. Click upload image
3. Select large image (8MB)

**Expected**: Image compresses and uploads
**Actual**: Upload fails with timeout
**Screenshots**: [attach if available]
**Console Errors**: [paste any errors]
```

---

## Summary

This testing guide ensures comprehensive coverage before deployment. Focus on:
1. **Responsive design** across all breakpoints
2. **User permissions** for all roles
3. **Core functionality** (submit, vote, report, moderate)
4. **Performance** (Lighthouse scores)
5. **Security** (auth, authorization, input validation)

Happy Testing! 🚀
