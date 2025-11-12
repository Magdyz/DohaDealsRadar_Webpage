'use client'

/**
 * PWA Install Prompt Component
 *
 * This component shows a prompt to users on supported browsers (Chrome, Edge, Samsung Internet)
 * encouraging them to install the app to their home screen for a better experience.
 *
 * Features:
 * - Auto-detects beforeinstallprompt event
 * - Shows custom install banner
 * - Dismissible and respects user preference (saved to localStorage)
 * - iOS Safari instructions (manual install)
 * - Styled to match app theme
 *
 * SAFETY: This component is purely additive and doesn't affect any existing functionality.
 * It can be safely added or removed without breaking the app.
 */

import { useEffect, useState } from 'react'
import { X, Download, Share } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if running on iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

    // Check if already installed (standalone mode)
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    setIsStandalone(standalone)

    // Don't show if already installed
    if (standalone) {
      return
    }

    // Check if user previously dismissed the prompt
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed === 'true') {
      return
    }

    // Handle beforeinstallprompt event (Chrome, Edge, Samsung Internet)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Show prompt after 5 seconds to not be intrusive
      setTimeout(() => {
        setShowPrompt(true)
      }, 5000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // For iOS, show manual instructions after delay
    if (iOS && !standalone) {
      setTimeout(() => {
        setShowPrompt(true)
      }, 10000) // Show after 10 seconds on iOS
    }

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      )
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return
    }

    // Show the install prompt
    await deferredPrompt.prompt()

    // Wait for user response
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('PWA installed')
    }

    // Clear the prompt
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // Remember dismissal for 7 days
    const dismissUntil = Date.now() + 7 * 24 * 60 * 60 * 1000
    localStorage.setItem('pwa-install-dismissed', 'true')
    localStorage.setItem('pwa-install-dismissed-until', dismissUntil.toString())
  }

  // Don't render if conditions not met
  if (!showPrompt || isStandalone) {
    return null
  }

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up md:left-auto md:right-4 md:max-w-md"
      role="dialog"
      aria-labelledby="pwa-install-title"
      aria-describedby="pwa-install-description"
    >
      <div className="relative overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Gradient border effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-action-primary opacity-10" />

        <div className="relative p-5">
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute right-3 top-3 rounded-lg p-1 text-text-secondary transition-colors hover:bg-border hover:text-text-primary"
            aria-label="Dismiss install prompt"
          >
            <X size={20} />
          </button>

          {/* Content */}
          <div className="pr-8">
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-lg bg-primary-light p-2">
                {isIOS ? (
                  <Share size={24} className="text-primary" />
                ) : (
                  <Download size={24} className="text-primary" />
                )}
              </div>
              <div>
                <h3
                  id="pwa-install-title"
                  className="text-lg font-semibold text-text-primary"
                >
                  Install Deals Radar
                </h3>
                <p
                  id="pwa-install-description"
                  className="text-sm text-text-secondary"
                >
                  Get quick access from your home screen
                </p>
              </div>
            </div>

            {/* iOS instructions */}
            {isIOS && (
              <div className="mb-4 rounded-lg bg-background p-3 text-sm text-text-secondary">
                <p className="mb-2 font-medium text-text-primary">
                  To install:
                </p>
                <ol className="space-y-1 pl-4">
                  <li>
                    1. Tap the <Share size={14} className="inline" /> share
                    button
                  </li>
                  <li>2. Scroll and tap "Add to Home Screen"</li>
                  <li>3. Tap "Add" to confirm</li>
                </ol>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
              {!isIOS && deferredPrompt && (
                <button
                  onClick={handleInstallClick}
                  className="flex-1 rounded-lg bg-action-primary px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary-dark active:scale-95"
                >
                  Install App
                </button>
              )}
              <button
                onClick={handleDismiss}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-border"
              >
                {isIOS ? 'Got it' : 'Maybe later'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
