'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button, Input, Spinner } from '@/components/ui'
import { sendVerificationCode } from '@/lib/api/auth'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('returnUrl') || '/feed'

  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Email is required')
      return
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    setIsLoading(true)

    try {
      await sendVerificationCode(email)
      // Redirect to verification page with email and returnUrl
      router.push(
        `/verify?email=${encodeURIComponent(email)}&returnUrl=${encodeURIComponent(returnUrl)}`
      )
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-2xl md:text-3xl font-bold text-primary mb-3">
            Doha Deals Radar
          </h1>
          <p className="text-base text-text-secondary">
            Sign in to post deals and vote
          </p>
        </div>

        <div className="bg-surface rounded-2xl shadow-lg border border-border/30 p-6 md:p-8">
          <h2 className="text-xl md:text-2xl font-semibold text-text-primary mb-6">
            Sign In
          </h2>

          <form onSubmit={handleSubmit}>
            <Input
              type="email"
              label="Email Address"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error}
              disabled={isLoading}
              autoFocus
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-6"
              isLoading={isLoading}
            >
              Continue
            </Button>
          </form>

          <p className="text-sm text-text-tertiary text-center mt-6">
            We'll send you a verification code to your email
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
