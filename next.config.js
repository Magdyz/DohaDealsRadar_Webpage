/** @type {import('next').NextConfig} */

// ========================================
// PWA CONFIGURATION
// ========================================
// Import next-pwa for Progressive Web App support
const withPWA = require('next-pwa')({
  dest: 'public', // Service worker files will be generated in /public
  disable: process.env.NODE_ENV === 'development', // Disable PWA in development for easier debugging
  register: true, // Auto-register service worker
  skipWaiting: true, // Skip waiting for old service worker to finish
  // Runtime caching configuration to prevent breaking real-time features
  runtimeCaching: [
    {
      // Cache images with CacheFirst strategy (performance optimization)
      urlPattern: /^https:\/\/nzchbnshkrkdqpcawohu\.supabase\.co\/storage\/v1\/object\/public\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'supabase-images',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        },
      },
    },
    {
      // Use NetworkFirst for API routes to ensure fresh data (CRITICAL: prevents stale deal data)
      urlPattern: /^https?:\/\/.*\/api\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 5 * 60, // 5 minutes only
        },
      },
    },
  ],
})

// ========================================
// EXISTING NEXT.JS CONFIGURATION
// ========================================
// IMPORTANT: All existing configurations are preserved below
const nextConfig = {
  // Existing image configuration - DO NOT MODIFY
  images: {
    unoptimized: true, // Keep unoptimized for compatibility with current setup
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nzchbnshkrkdqpcawohu.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // PWA: Empty turbopack config to silence Next.js 16 warning
  // next-pwa requires webpack, so we keep using webpack for builds
  turbopack: {},
}

// ========================================
// EXPORT WITH PWA WRAPPER
// ========================================
// withPWA wraps the existing config without modifying it
module.exports = withPWA(nextConfig)
