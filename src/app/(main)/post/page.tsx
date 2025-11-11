'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check } from 'lucide-react'
import { Button, Input, Textarea, Badge } from '@/components/ui'
import { DealTypeSelector, ImageUpload } from '@/components/post'
import { ProtectedRoute } from '@/components/auth'
import { useAuthStore } from '@/lib/store/authStore'
import { submitDeal } from '@/lib/api/deals'
import { dealSchema, validateDealForm, type DealFormData } from '@/lib/validation/dealSchema'
import { CATEGORIES } from '@/types'
import type { DealCategory } from '@/types'

function PostDealContent() {
  const router = useRouter()
  const { user } = useAuthStore()

  const [formData, setFormData] = useState<Partial<DealFormData>>({
    dealType: 'online',
    category: 'food_dining',
    expiryDays: 10,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isAutoApproved, setIsAutoApproved] = useState(false)

  const handleChange = (field: keyof DealFormData, value: any) => {
    setFormData({ ...formData, [field]: value })
    // Clear error for this field
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  const validateForm = (): boolean => {
    try {
      dealSchema.parse(formData)
      const { isValid, errors: validationErrors } = validateDealForm(formData as DealFormData)
      setErrors(validationErrors)
      return isValid
    } catch (error: any) {
      const validationErrors: Record<string, string> = {}
      if (error.errors) {
        error.errors.forEach((err: any) => {
          validationErrors[err.path[0]] = err.message
        })
      }
      setErrors(validationErrors)
      return false
    }
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
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="md" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-text-primary">Post a Deal</h1>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Deal Type */}
          <DealTypeSelector
            value={formData.dealType || 'online'}
            onChange={(value) => handleChange('dealType', value)}
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

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Category *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleChange('category', category.id)}
                  className={`p-3 border-2 rounded-lg transition-all text-left ${
                    formData.category === category.id
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{category.emoji}</span>
                    <span className="text-sm font-medium">{category.label}</span>
                  </div>
                </button>
              ))}
            </div>
            {errors.category && (
              <p className="mt-1 text-sm text-red-600">{errors.category}</p>
            )}
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
            <label className="block text-sm font-medium text-text-primary mb-2">
              Deal Expires In (Days) *
            </label>
            <input
              type="range"
              min="1"
              max="30"
              value={formData.expiryDays || 10}
              onChange={(e) => handleChange('expiryDays', parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-text-tertiary mt-1">
              <span>1 day</span>
              <Badge variant="purple">{formData.expiryDays || 10} days</Badge>
              <span>30 days</span>
            </div>
            {errors.expiryDays && (
              <p className="mt-1 text-sm text-red-600">{errors.expiryDays}</p>
            )}
          </div>

          {/* Image Upload */}
          <ImageUpload
            value={formData.imageUrl || ''}
            onChange={(url) => handleChange('imageUrl', url)}
            error={errors.imageUrl}
          />

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Submit Button */}
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
