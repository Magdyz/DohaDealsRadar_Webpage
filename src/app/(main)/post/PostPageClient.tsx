'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { ArrowLeft, Check } from 'lucide-react'
import { Button, Input, Textarea, Badge, Spinner } from '@/components/ui'
import { DealTypeSelector, PriceInput } from '@/components/post'
import { ProtectedRoute } from '@/components/auth'
import PriceDisplay from '@/components/deals/PriceDisplay'
import { useAuthStore } from '@/lib/store/authStore'
import { submitDeal } from '@/lib/api/deals'
import { dealSubmissionSchema, formatZodError, type DealSubmissionData } from '@/lib/validation/dealSchema'
import { CATEGORIES } from '@/types'
import type { DealCategory } from '@/types'

// PERFORMANCE: Code split ImageUpload to reduce initial bundle size (includes browser-image-compression)
const ImageUpload = dynamic(() => import('@/components/post/ImageUpload'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-48 border-2 border-dashed rounded-xl flex items-center justify-center">
      <Spinner size="md" />
    </div>
  ),
})

function PostDealContent() {
  const router = useRouter()
  const { user } = useAuthStore()

  const [formData, setFormData] = useState<Partial<DealSubmissionData>>({
    category: 'food_dining',
    expiryDays: 10,
  })

  // Price fields are managed as strings for input, converted to numbers for validation
  const [originalPriceStr, setOriginalPriceStr] = useState('')
  const [discountedPriceStr, setDiscountedPriceStr] = useState('')

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isAutoApproved, setIsAutoApproved] = useState(false)

  const handleChange = (field: keyof DealSubmissionData, value: any) => {
    setFormData({ ...formData, [field]: value })
    // Clear error for this field
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  const validateForm = (): boolean => {
    // Pass price strings directly for validation
    const dataToValidate = {
      ...formData,
      originalPrice: originalPriceStr,
      discountedPrice: discountedPriceStr,
    }

    const result = dealSubmissionSchema.safeParse(dataToValidate)

    if (!result.success) {
      const validationErrors: Record<string, string> = {}
      result.error.issues.forEach((err) => {
        const field = err.path.join('.')
        if (field) {
          validationErrors[field] = err.message
        }
      })
      setErrors(validationErrors)
      return false
    }

    setErrors({})
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !user) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await submitDeal({
        title: formData.title!,
        description: formData.description,
        imageUrl: formData.imageUrl!,
        link: formData.link,
        location: formData.location,
        category: formData.category!,
        promoCode: formData.promoCode,
        originalPrice: originalPriceStr || undefined,
        discountedPrice: discountedPriceStr || undefined,
        expiryDays: formData.expiryDays!,
        userId: user.id,
      })

      if (response.success) {
        setIsAutoApproved(response.autoApproved || false)
        setShowSuccess(true)
      }
    } catch (error: any) {
      setErrors({ submit: error.message || 'Failed to submit deal' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-secondary px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            Deal Submitted Successfully!
          </h2>
          <p className="text-text-secondary mb-6">
            {isAutoApproved
              ? 'Your deal has been automatically approved and is now live!'
              : 'Your deal is pending review. It will appear in the feed once approved by a moderator.'}
          </p>
          <div className="flex flex-col gap-3">
            <Button variant="primary" size="lg" onClick={() => router.push('/feed')}>
              Go to Feed
            </Button>
            <Button variant="outline" size="lg" onClick={() => router.push('/account')}>
              View My Deals
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-secondary">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="md" onClick={() => router.push('/feed')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl md:text-2xl font-bold text-text-primary">Post a Deal</h1>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 py-4 md:py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-modern-lg p-4 md:p-8 space-y-4 md:space-y-8">
          {/* Image Upload - Moved to top */}
          <ImageUpload
            value={formData.imageUrl || ''}
            onChange={(url) => handleChange('imageUrl', url)}
            error={errors.imageUrl}
          />

          {/* Title */}
          <Input
            label="Deal Title *"
            placeholder="e.g., 50% Off All Pizzas at Pizza Hut"
            value={formData.title || ''}
            onChange={(e) => handleChange('title', e.target.value)}
            error={errors.title}
            helperText="3-200 characters"
          />

          {/* Price Fields - Matches Android app positioning */}
          <div>
            <label className="block text-sm md:text-base font-semibold text-text-primary mb-3">
              Price (Optional)
            </label>
            <div className="flex gap-4">
              <PriceInput
                label="Original"
                value={originalPriceStr}
                onChange={(value) => {
                  setOriginalPriceStr(value)
                  if (errors.originalPrice) {
                    setErrors({ ...errors, originalPrice: '' })
                  }
                }}
                placeholder="100"
                error={errors.originalPrice}
              />
              <PriceInput
                label="Discounted"
                value={discountedPriceStr}
                onChange={(value) => {
                  setDiscountedPriceStr(value)
                  if (errors.discountedPrice) {
                    setErrors({ ...errors, discountedPrice: '' })
                  }
                }}
                placeholder="80"
                error={errors.discountedPrice}
              />
            </div>

            {/* Price Preview */}
            {(originalPriceStr || discountedPriceStr) && (
              <div className="mt-4 p-4 bg-background-secondary rounded-xl border-2 border-border/30">
                <div className="text-xs md:text-sm font-semibold text-text-secondary mb-2">
                  Price Preview:
                </div>
                <PriceDisplay
                  originalPrice={originalPriceStr || null}
                  discountedPrice={discountedPriceStr || null}
                  variant="details"
                />
              </div>
            )}
          </div>

          {/* Description */}
          <Textarea
            label="Description (Optional)"
            placeholder="Add more details about the deal..."
            value={formData.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            error={errors.description}
            helperText="Max 2000 characters"
            rows={4}
          />

          {/* Deal Type & Category - Side by side on larger screens */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Deal Type */}
            <div>
              <DealTypeSelector
                value={formData.dealType || 'online'}
                onChange={(value) => handleChange('dealType', value)}
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm md:text-base font-semibold text-text-primary mb-2">
                Category *
              </label>
              <div className="grid grid-cols-1 gap-1.5 md:gap-2">
                {CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleChange('category', category.id)}
                    className={`px-2.5 py-2 md:p-3 border-2 rounded-lg md:rounded-xl transition-all text-left min-h-[40px] md:min-h-[44px] ${
                      formData.category === category.id
                        ? 'border-primary bg-primary/10 shadow-sm'
                        : 'border-border hover:border-primary/50 hover:bg-primary/5'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <span className="text-base md:text-xl flex-shrink-0">{category.emoji}</span>
                      <span className="text-xs md:text-sm font-medium text-text-primary leading-snug">{category.label}</span>
                    </div>
                  </button>
                ))}
              </div>
              {errors.category && (
                <p className="mt-1.5 text-xs md:text-sm font-medium text-error">{errors.category}</p>
              )}
            </div>
          </div>

          {/* Link or Location */}
          {formData.dealType === 'online' ? (
            <Input
              label="Deal Link *"
              type="url"
              placeholder="https://example.com/deal"
              value={formData.link || ''}
              onChange={(e) => handleChange('link', e.target.value)}
              error={errors.link}
              helperText="Full URL to the deal"
            />
          ) : (
            <Input
              label="Location *"
              placeholder="e.g., Villagio Mall, Doha"
              value={formData.location || ''}
              onChange={(e) => handleChange('location', e.target.value)}
              error={errors.location}
              helperText="Where can people find this deal?"
            />
          )}

          {/* Promo Code */}
          <Input
            label="Promo Code (Optional)"
            placeholder="e.g., SAVE50"
            value={formData.promoCode || ''}
            onChange={(e) => handleChange('promoCode', e.target.value.toUpperCase())}
            error={errors.promoCode}
            helperText="If applicable"
          />

          {/* Expiry */}
          <div>
            <label className="block text-sm md:text-base font-semibold text-text-primary mb-2">
              Deal Expires In (Days) *
            </label>
            <input
              type="range"
              min="1"
              max="30"
              value={formData.expiryDays || 10}
              onChange={(e) => handleChange('expiryDays', parseInt(e.target.value))}
              className="w-full h-2 bg-background-secondary rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-lg"
            />
            <div className="flex justify-between items-center text-xs md:text-sm text-text-secondary mt-2">
              <span className="font-medium">1 day</span>
              <Badge variant="purple" className="px-3 py-1 md:px-4 md:py-1.5 text-sm md:text-base font-bold">
                {formData.expiryDays || 10} days
              </Badge>
              <span className="font-medium">30 days</span>
            </div>
            {errors.expiryDays && (
              <p className="mt-1.5 text-xs md:text-sm font-medium text-error">{errors.expiryDays}</p>
            )}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-3 md:p-4 bg-error/10 border-2 border-error/30 rounded-lg md:rounded-xl">
              <p className="text-xs md:text-sm font-medium text-error">{errors.submit}</p>
            </div>
          )}

          {/* Submit Button - 2025 Mobile-Friendly */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={isSubmitting}
          >
            Submit Deal
          </Button>
        </form>
      </div>
    </div>
  )
}

export default function PostDealPage() {
  return (
    <ProtectedRoute requireAuth={true}>
      <PostDealContent />
    </ProtectedRoute>
  )
}
