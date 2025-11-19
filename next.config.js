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
  // Image optimization enabled for better performance (2025 best practices)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nzchbnshkrkdqpcawohu.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/avif', 'image/webp'], // Modern formats: AVIF (60-80% smaller), WebP (30-50% smaller)
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840], // Added 4K & 8K for 2025 devices
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384], // For smaller images like thumbnails
    minimumCacheTTL: 60 * 60 * 24 * 30, // Cache optimized images for 30 days (2025 best practice)
    dangerouslyAllowSVG: false, // Security: Prevent SVG injection attacks
    contentDispositionType: 'attachment', // Security: Force download for unknown types
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;", // Security: CSP for images
  },

  // Performance optimizations
  reactStrictMode: true,

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production', // Remove console.logs in production
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
