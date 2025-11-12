'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button, Input, Spinner } from '@/components/ui'
import { registerUsername } from '@/lib/api/auth'
import { useAuthStore } from '@/lib/store/authStore'

function UsernameForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('returnUrl') || '/feed'

  const { user, updateUsername } = useAuthStore()

  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  if (!user) {
    router.push('/login')
    return null
  }

  const validateUsername = (username: string): string | null => {
    if (!username.trim()) {
      return 'Username is required'
    }

    if (username.length < 3) {
      return 'Username must be at least 3 characters'
    }

    if (username.length > 20) {
      return 'Username must be less than 20 characters'
    }

    // Only allow alphanumeric, underscore, and hyphen
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return 'Username can only contain letters, numbers, underscore, and hyphen'
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const validationError = validateUsername(username)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsLoading(true)

    try {
      const response = await registerUsername(user.id, username)

      if (response.success) {
        updateUsername(username)
        router.push(returnUrl)
      }
    } catch (err: any) {
      setError(
        err.message || 'Failed to set username. It may already be taken.'
      )
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
          <p className="text-base text-text-secondary">Choose your username</p>
        </div>

        <div className="bg-surface rounded-2xl shadow-lg border border-border/30 p-6 md:p-8">
          <h2 className="text-xl md:text-2xl font-semibold text-text-primary mb-2">
            Welcome!
          </h2>
          <p className="text-text-secondary mb-6">
            Create a unique username to identify your deals
          </p>

          <form onSubmit={handleSubmit}>
            <Input
              type="text"
              label="Username"
              placeholder="cool_deals_hunter"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              error={error}
              helperText="3-20 characters, letters, numbers, - and _ only"
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
        </div>
      </div>
    </div>
  )
}

export default function UsernamePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    }>
      <UsernameForm />
    </Suspense>
  )
}
