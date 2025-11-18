# 🔄 MIGRATION GUIDE - DohaDealsRadar Security Updates

## Overview

This guide explains how to update your client-side code to work with the new security improvements. **All changes are backwards compatible**, so you can migrate gradually.

---

## 🔑 Authentication Changes

### What Changed

The API now returns session tokens on login, which should be used for authenticated requests.

### Before (Old)

```typescript
// Login
const response = await fetch('/api/verify-code-and-get-user', {
  method: 'POST',
  body: JSON.stringify({ email, code, deviceId })
})

const { user, isNewUser } = await response.json()

// Later, when calling protected APIs
await fetch('/api/submit-deal', {
  method: 'POST',
  body: JSON.stringify({
    userId: user.id,  // ❌ OLD WAY - Insecure
    title,
    description,
    // ... other fields
  })
})
```

### After (New - Recommended)

```typescript
// Login
const response = await fetch('/api/verify-code-and-get-user', {
  method: 'POST',
  body: JSON.stringify({ email, code, deviceId })
})

const { user, isNewUser, session } = await response.json()

// Save session tokens
localStorage.setItem('access_token', session.accessToken)
localStorage.setItem('refresh_token', session.refreshToken)

// Later, when calling protected APIs
const accessToken = localStorage.getItem('access_token')

await fetch('/api/submit-deal', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,  // ✅ NEW WAY - Secure
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    // userId no longer needed - extracted from token
    title,
    description,
    // ... other fields
  })
})
```

---

## 📝 API Endpoint Changes

### Endpoints That Now Support Session Authentication

All the following endpoints now support (and prefer) token-based authentication:

#### Admin/Moderator Operations

```typescript
// Approve Deal
await fetch('/api/approve-deal', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    dealId,
    // moderatorUserId no longer needed
  })
})

// Reject Deal
await fetch('/api/reject-deal', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    dealId,
    reason,
    // moderatorUserId no longer needed
  })
})

// Delete Deal (Admin only)
await fetch('/api/delete-deal', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    dealId,
    // adminUserId no longer needed
  })
})

// Restore Deal (Admin only)
await fetch('/api/restore-deal', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    dealId,
    // adminUserId no longer needed
  })
})
```

#### User Operations

```typescript
// Submit Deal
await fetch('/api/submit-deal', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title,
    description,
    imageUrl,
    category,
    expiryDays,
    // userId no longer needed
  })
})

// Upload Image
await fetch('/api/upload-image', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    image,
    filename,
  })
})

// Manage Username
await fetch('/api/manage_username', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username,
    // userId no longer needed
  })
})
```

---

## 🔄 Backwards Compatibility

**Important**: The old method (sending `userId` in body) still works! This allows gradual migration.

```typescript
// ✅ This still works (but will be deprecated soon)
await fetch('/api/submit-deal', {
  method: 'POST',
  body: JSON.stringify({
    userId: user.id,  // Old way still works
    title,
    // ...
  })
})

// ✅ This is preferred (new way)
await fetch('/api/submit-deal', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,  // New way
  },
  body: JSON.stringify({
    title,
    // ...
  })
})
```

---

## ⚠️ Rate Limiting

Some endpoints now have rate limits to prevent abuse:

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/send-verification-code` | 5 requests | 15 minutes |
| `/api/verify-code-and-get-user` | 5 requests | 15 minutes |
| `/api/submit-deal` | 10 requests | 24 hours |
| `/api/upload-image` | 20 requests | 1 hour |

### Handling Rate Limit Errors

```typescript
const response = await fetch('/api/send-verification-code', {
  method: 'POST',
  body: JSON.stringify({ email })
})

if (response.status === 429) {
  const { message, resetAt } = await response.json()

  // Show user-friendly message
  const resetDate = new Date(resetAt)
  const minutesLeft = Math.ceil((resetDate - Date.now()) / 60000)

  alert(`${message}. Please try again in ${minutesLeft} minutes.`)
}
```

---

## 🖼️ File Upload Changes

### What Changed

- SVG files are now blocked (security measure)
- File validation is stricter (magic number verification)
- File size limit enforced: 1MB

### Supported Formats

✅ **Allowed**:
- JPEG/JPG
- PNG
- WebP

❌ **Blocked**:
- SVG (security risk - can contain JavaScript)
- GIF
- Other formats

### Example

```typescript
try {
  const response = await fetch('/api/upload-image', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      image: base64Image,
      filename: 'photo.jpg'
    })
  })

  if (!response.ok) {
    const { message } = await response.json()

    if (message.includes('Invalid file type')) {
      alert('Only JPG, PNG, and WebP images are allowed')
    }
  }
} catch (error) {
  console.error('Upload failed:', error)
}
```

---

## 🔒 Security Headers

Your app now has enhanced security headers. No client-side changes needed, but you should be aware:

### Content Security Policy (CSP)

The app has strict CSP rules. If you're adding external resources, they must be whitelisted:

```javascript
// ✅ Allowed
<img src="https://nzchbnshkrkdqpcawohu.supabase.co/..." />

// ❌ Blocked by CSP
<img src="https://random-external-site.com/image.jpg" />
```

To add new external domains, update `vercel.json` CSP header.

---

## 📦 Helper Functions

### Creating an API Client

We recommend creating a centralized API client:

```typescript
// src/lib/api/client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api'

function getAccessToken() {
  return localStorage.getItem('access_token')
}

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = getAccessToken()

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  // Handle rate limiting
  if (response.status === 429) {
    const { message, resetAt } = await response.json()
    throw new Error(message)
  }

  // Handle auth errors
  if (response.status === 401) {
    // Clear invalid token
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')

    // Redirect to login
    window.location.href = '/login'

    throw new Error('Authentication required')
  }

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Request failed')
  }

  return response.json()
}

// Usage
export const dealApi = {
  submit: (data) => apiRequest('/submit-deal', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  approve: (dealId) => apiRequest('/approve-deal', {
    method: 'POST',
    body: JSON.stringify({ dealId })
  }),

  // ... other methods
}
```

---

## 🧪 Testing Your Changes

### 1. Test Authentication Flow

```typescript
// 1. Request OTP
await fetch('/api/send-verification-code', {
  method: 'POST',
  body: JSON.stringify({ email: 'test@example.com' })
})

// 2. Verify OTP
const response = await fetch('/api/verify-code-and-get-user', {
  method: 'POST',
  body: JSON.stringify({
    email: 'test@example.com',
    code: '123456',
    deviceId: 'test-device'
  })
})

const { user, session } = await response.json()

// 3. Verify session tokens exist
console.assert(session.accessToken, 'Access token missing!')
console.assert(session.refreshToken, 'Refresh token missing!')

// 4. Test protected endpoint
const result = await fetch('/api/submit-deal', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.accessToken}`
  },
  body: JSON.stringify({
    title: 'Test Deal',
    // ... other fields
  })
})

console.assert(result.ok, 'Protected request failed!')
```

### 2. Test Rate Limiting

```typescript
// Should succeed for first 5 attempts
for (let i = 0; i < 5; i++) {
  const response = await fetch('/api/send-verification-code', {
    method: 'POST',
    body: JSON.stringify({ email: 'test@example.com' })
  })
  console.log(`Attempt ${i + 1}:`, response.status)
}

// 6th attempt should fail with 429
const response = await fetch('/api/send-verification-code', {
  method: 'POST',
  body: JSON.stringify({ email: 'test@example.com' })
})
console.assert(response.status === 429, 'Rate limit not working!')
```

---

## 🚨 Troubleshooting

### "Authentication required" errors

**Problem**: Getting 401 errors on protected endpoints

**Solution**:
1. Check that you're sending the Authorization header
2. Verify the token hasn't expired
3. Ensure you're using the format: `Bearer ${token}`

```typescript
// ✅ Correct
headers: {
  'Authorization': `Bearer ${accessToken}`
}

// ❌ Wrong
headers: {
  'Authorization': accessToken  // Missing "Bearer "
}
```

### "Too many requests" errors

**Problem**: Getting 429 errors

**Solution**:
1. Check the `resetAt` timestamp in the error response
2. Show user when they can try again
3. Implement exponential backoff for retries

```typescript
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (error.status === 429 && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000 // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      throw error
    }
  }
}
```

### "Invalid file type" errors

**Problem**: Can't upload images

**Solution**:
1. Ensure file is JPG, PNG, or WebP
2. Check file size is under 1MB
3. Don't try to upload SVG files

```typescript
function validateFile(file: File) {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Only JPG, PNG, and WebP images allowed')
  }

  if (file.size > 1024 * 1024) {
    throw new Error('File must be under 1MB')
  }

  return true
}
```

---

## 📝 Checklist

Before deploying your client-side changes:

- [ ] Update login flow to save session tokens
- [ ] Add Authorization header to protected API calls
- [ ] Remove `userId` from request bodies (optional, backwards compatible)
- [ ] Handle 401 errors (expired/invalid tokens)
- [ ] Handle 429 errors (rate limiting)
- [ ] Update file upload to handle new validation errors
- [ ] Test all authentication flows
- [ ] Test rate limiting behavior
- [ ] Update error handling for new error formats
- [ ] Document changes for your team

---

## 🎯 Recommended Migration Timeline

### Week 1: Update Authentication
- Deploy new login flow with session tokens
- Keep sending `userId` in body (backwards compatible)
- Monitor for errors

### Week 2: Update Protected Endpoints
- Start using Authorization headers
- Remove `userId` from body
- Monitor authentication flow

### Week 3: Final Cleanup
- Remove all `userId` from request bodies
- Update error handling
- Document new API patterns

---

## 📞 Support

If you encounter issues during migration:
1. Check this guide first
2. Review the SECURITY_FIXES.md document
3. Check server logs for detailed error messages
4. Verify your implementation against the examples above

---

*Last Updated: 2025-11-18*
*Version: 1.0.0*
