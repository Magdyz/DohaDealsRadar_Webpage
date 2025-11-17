/**
 * Image Optimization Utilities
 *
 * Provides utilities for optimized image loading with blur placeholders
 */

/**
 * Generate a tiny blur placeholder for images
 * This creates a 10x10 pixel blurred gray square as a data URL
 *
 * @returns Base64 encoded blur placeholder
 */
export function getBlurDataURL(): string {
  // Create a 10x10 gray square SVG
  const svg = `
    <svg width="10" height="10" xmlns="http://www.w3.org/2000/svg">
      <rect width="10" height="10" fill="#E5E7EB"/>
    </svg>
  `

  // Convert to base64
  const base64 = Buffer.from(svg).toString('base64')
  return `data:image/svg+xml;base64,${base64}`
}

/**
 * Generate a shimmer effect placeholder
 * Creates an animated shimmer for loading states
 *
 * @param w Width
 * @param h Height
 * @returns Base64 encoded shimmer SVG
 */
export function getShimmerDataURL(w: number, h: number): string {
  const shimmer = `
    <svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g">
          <stop stop-color="#E5E7EB" offset="20%" />
          <stop stop-color="#F3F4F6" offset="50%" />
          <stop stop-color="#E5E7EB" offset="70%" />
        </linearGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="#E5E7EB" />
      <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
      <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
    </svg>
  `

  const base64 = Buffer.from(shimmer).toString('base64')
  return `data:image/svg+xml;base64,${base64}`
}

/**
 * Preload critical images
 * Call this for above-the-fold images
 *
 * @param src Image URL
 * @param as Image type (default: 'image')
 */
export function preloadImage(src: string, as: 'image' | 'fetch' = 'image'): void {
  if (typeof window === 'undefined') return

  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = as
  link.href = src
  link.crossOrigin = 'anonymous'
  document.head.appendChild(link)
}
