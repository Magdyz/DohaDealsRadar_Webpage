'use client'

import Link from 'next/link'
import { Home, Search, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-6">
      <div className="max-w-md w-full text-center">
        <div className="bg-surface rounded-2xl shadow-lg border-2 border-border/30 p-6 md:p-8">
          {/* 404 Illustration */}
          <div className="mb-8">
            <div className="text-7xl font-bold text-primary mb-4">404</div>
            <div className="text-6xl mb-2">🔍</div>
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
            Page Not Found
          </h1>

          {/* Message */}
          <p className="text-text-secondary mb-6 leading-relaxed">
            We couldn't find the page you're looking for. It may have been removed, renamed, or doesn't exist.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/feed"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-action-primary hover:bg-primary-dark text-white rounded-xl font-semibold transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Go to Feed</span>
            </Link>

            <button
              onClick={() => window.history.back()}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-border hover:bg-surface-variant text-text-primary rounded-xl font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go Back</span>
            </button>
          </div>

          {/* Search Suggestion */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-sm text-text-tertiary mb-3">
              Looking for deals?
            </p>
            <Link
              href="/feed"
              className="inline-flex items-center gap-2 text-action-primary hover:text-primary-dark font-medium text-sm transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>Browse All Deals</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
