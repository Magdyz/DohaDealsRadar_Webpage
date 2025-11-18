'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
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
      router.replace('/login')
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
    <div className="min-h-screen bg-background px-4 py-6 md:py-8">
      {/* Back Button */}
      <div className="max-w-2xl mx-auto mb-4">
        <button
          onClick={() => router.replace('/login')}
          className="flex items-center gap-2 px-3 py-2 min-h-[44px] text-text-primary hover:bg-surface-variant rounded-xl transition-all hover:scale-105"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </button>
      </div>

      <div className="flex items-center justify-center">
        <div className="w-full max-w-2xl">
          {/* Header - Brand */}
          <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-action-primary to-primary-dark shadow-purple mb-6">
            <span className="text-3xl md:text-4xl">📧</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-3 tracking-tight">
            Check Your Email
          </h1>
          <p className="text-base md:text-lg text-text-secondary leading-relaxed px-4">
            We've sent a 6-digit verification code to
          </p>
          <p className="text-base md:text-lg font-semibold text-text-primary mt-2">
            {email}
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-surface rounded-2xl shadow-modern-lg border border-border/30 p-6 sm:p-8 md:p-12 space-y-8">
          {/* Code Input Section */}
          <div className="space-y-4">
            <label className="block text-center text-sm font-semibold text-text-secondary uppercase tracking-wide">
              Enter Verification Code
            </label>
            <CodeInput
              length={6}
              onComplete={handleCodeComplete}
              error={error}
              disabled={isLoading}
            />
          </div>

          {/* Resend Section */}
          <div className="pt-4 border-t border-border/30">
            <div className="text-center space-y-3">
              <p className="text-sm text-text-secondary">
                Didn't receive the code?
              </p>
              {resendCooldown > 0 ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-background-secondary rounded-lg">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-medium text-text-secondary">
                    Resend in {resendCooldown}s
                  </span>
                </div>
              ) : (
                <button
                  onClick={handleResend}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-primary hover:text-primary-dark hover:bg-primary/5 rounded-lg transition-all"
                >
                  <span>↻</span>
                  <span>Resend Code</span>
                </button>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/30"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-surface px-4 text-text-tertiary font-medium">or</span>
            </div>
          </div>

          {/* Change Email Button */}
          <Button
            variant="outline"
            size="lg"
            className="w-full min-h-[48px] text-base font-semibold"
            onClick={() => router.replace('/login')}
          >
            Use a Different Email
          </Button>
        </div>

        {/* Footer Help Text */}
        <div className="mt-8 text-center">
          <p className="text-sm text-text-tertiary leading-relaxed px-4">
            Make sure to check your spam folder if you don't see the email
          </p>
        </div>
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
