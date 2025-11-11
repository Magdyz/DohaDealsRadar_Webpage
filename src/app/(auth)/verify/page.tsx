'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button, Spinner } from '@/components/ui'
import CodeInput from '@/components/auth/CodeInput'
import { verifyCode, sendVerificationCode } from '@/lib/api/auth'
import { useAuthStore } from '@/lib/store/authStore'
import { getDeviceId } from '@/lib/utils/deviceId'

function VerifyForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const returnUrl = searchParams.get('returnUrl') || '/feed'

  const { login } = useAuthStore()

  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (!email) {
      router.push('/login')
    }
  }, [email, router])

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleCodeComplete = async (code: string) => {
    if (!email) return

    setError('')
    setIsLoading(true)

    try {
      const deviceId = getDeviceId()
      const response = await verifyCode(email, code, deviceId)

      if (response.success && response.user) {
        login(response.user)

        // If new user without username, redirect to username setup
        if (response.isNewUser && !response.user.username) {
          router.push(`/username?returnUrl=${encodeURIComponent(returnUrl)}`)
        } else {
          router.push(returnUrl)
        }
      }
    } catch (err: any) {
      setError(err.message || 'Invalid verification code. Please try again.')
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email || resendCooldown > 0) return

    setError('')

    try {
      await sendVerificationCode(email)
      setResendCooldown(60) // 60 second cooldown
    } catch (err: any) {
      setError(err.message || 'Failed to resend code. Please try again.')
    }
  }

  if (!email) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">
            Doha Deals Radar
          </h1>
          <p className="text-text-secondary">Enter verification code</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-text-primary mb-2">
            Check Your Email
          </h2>
          <p className="text-text-secondary mb-6">
            We sent a 6-digit code to <strong>{email}</strong>
          </p>

          <CodeInput
            length={6}
            onComplete={handleCodeComplete}
            error={error}
            disabled={isLoading}
          />

          <div className="mt-6 text-center">
            {resendCooldown > 0 ? (
              <p className="text-sm text-text-tertiary">
                Resend code in {resendCooldown}s
              </p>
            ) : (
              <button
                onClick={handleResend}
                className="text-sm text-primary hover:underline"
              >
                Didn't receive the code? Resend
              </button>
            )}
          </div>

          <Button
            variant="ghost"
            size="md"
            className="w-full mt-4"
            onClick={() => router.push('/login')}
          >
            Use a different email
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    }>
      <VerifyForm />
    </Suspense>
  )
}
