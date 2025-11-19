'use client'

import { Suspense, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, Eye } from 'lucide-react'
import { Button, Card, CardBody, Input, Badge, Spinner } from '@/components/ui'
import { PriceInput } from '@/components/post'
import PriceDisplay from '@/components/deals/PriceDisplay'
import { submitDeal, uploadImage } from '@/lib/api/deals'
import { useAuthStore } from '@/lib/store/authStore'
import { useDeviceId } from '@/lib/hooks/useDeviceId'
import { useToast } from '@/lib/hooks/useToast'
import { dealSubmissionSchema, formatZodError } from '@/lib/validation/dealSchema'
import { compressImageForUpload, validateImageFile } from '@/lib/utils'
import { CATEGORIES } from '@/types'
import type { DealCategory } from '@/types'

function SubmitDealContent() {
  const router = useRouter()
  const { user } = useAuthStore()
  const deviceId = useDeviceId()
  const { toast } = useToast()

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [link, setLink] = useState('')
  const [location, setLocation] = useState('')
  const [category, setCategory] = useState<DealCategory>('food_dining')
  const [promoCode, setPromoCode] = useState('')
  const [originalPrice, setOriginalPrice] = useState('')
  const [discountedPrice, setDiscountedPrice] = useState('')
  const [expiryDays, setExpiryDays] = useState('7')

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate image file (max 10MB before compression)
    const validation = validateImageFile(file, 10)
    if (!validation.valid) {
      setError(validation.error || 'Invalid image file')
      return
    }

    setImageFile(file)
    setError('')

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Remove selected image
  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview('')
  }

  // Validate form using Zod
  const validateForm = (): boolean => {
    // Validate image first
    if (!imageFile && !imagePreview) {
      setError('Please upload an image')
      return false
    }

    const days = parseInt(expiryDays)
    if (isNaN(days)) {
      setError('Please enter a valid number for expiry days')
      return false
    }

    // Validate using Zod schema
    const result = dealSubmissionSchema.safeParse({
      title,
      description,
      link,
      location,
      category,
      promoCode,
      originalPrice,
      discountedPrice,
      expiryDays: days,
    })

    if (!result.success) {
      const errorMessage = formatZodError(result.error)
      setError(errorMessage)
      return false
    }

    return true
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Upload image first (with compression)
      let imageUrl = imagePreview
      if (imageFile) {
        // Compress image before upload (inspired by Android app approach)
        console.log('📦 Compressing image before upload...')
        const compressedFile = await compressImageForUpload(imageFile)
        const uploadResult = await uploadImage(compressedFile)
        imageUrl = uploadResult.url
      }

      // Submit deal
      const dealData = {
        title: title.trim(),
        description: description.trim() || undefined,
        imageUrl,
        link: link.trim() || undefined,
        location: location.trim() || undefined,
        category,
        promoCode: promoCode.trim() || undefined,
        originalPrice: originalPrice.trim() || undefined,
        discountedPrice: discountedPrice.trim() || undefined,
        expiryDays: parseInt(expiryDays),
        userId: user?.id || deviceId,
      }

      const result = await submitDeal(dealData)

      if (result.success && result.deal) {
        // Show success toast
        toast.success('Deal submitted successfully! Redirecting...')

        // Store deal ID for setTimeout closure
        const dealId = result.deal.id

        // Redirect to the new deal after a short delay
        setTimeout(() => {
          router.push(`/deals/${dealId}`)
        }, 1000)
      } else {
        const errorMsg = result.message || 'Failed to submit deal'
        setError(errorMsg)
        toast.error(errorMsg)
      }
    } catch (err: any) {
      console.error('Submit error:', err)
      const errorMsg = err.message || 'Failed to submit deal. Please try again.'
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header - 2025 Modern Design */}
      <div className="bg-surface shadow-md sticky top-0 z-20 border-b border-border/50 backdrop-blur-sm bg-surface/95">
        <div className="max-w-4xl mx-auto px-4 py-4 md:px-6 md:py-5">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight">Post a Deal</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/feed')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>

      {/* Form - 2025 Modern Layout with better spacing */}
      <div className="max-w-4xl mx-auto px-4 py-6 md:px-6 md:py-8">
        <form onSubmit={handleSubmit} className="animate-fade-in">
          <Card variant="elevated">
            <CardBody className="p-6 md:p-8 space-y-6">
              {/* Error message - 2025 Modern Style */}
              {error && (
                <div className="bg-error/10 border-2 border-error/30 text-error px-6 py-4 rounded-xl flex items-start gap-3 animate-scale-in">
                  <span className="text-2xl">⚠️</span>
                  <p className="font-medium flex-1">{error}</p>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Deal Title *
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., 50% off on all electronics at City Mall"
                  maxLength={200}
                  required
                  disabled={isSubmitting}
                />
                <p className="mt-1 text-xs text-text-tertiary">
                  {title.length}/200 characters
                </p>
              </div>

              {/* Price Fields - Matches Android app positioning */}
              <div>
                <label className="block text-sm md:text-base font-semibold text-text-primary mb-3">
                  Price (Optional)
                </label>
                <div className="flex gap-4">
                  <PriceInput
                    label="Original"
                    value={originalPrice}
                    onChange={setOriginalPrice}
                    placeholder="100"
                  />
                  <PriceInput
                    label="Discounted"
                    value={discountedPrice}
                    onChange={setDiscountedPrice}
                    placeholder="80"
                  />
                </div>

                {/* Price Preview */}
                {(originalPrice || discountedPrice) && (
                  <div className="mt-4 p-4 bg-background-secondary rounded-xl border-2 border-border/30">
                    <div className="text-xs md:text-sm font-semibold text-text-secondary mb-2">
                      Price Preview:
                    </div>
                    <PriceDisplay
                      originalPrice={originalPrice || null}
                      discountedPrice={discountedPrice || null}
                      variant="details"
                    />
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add more details about this deal..."
                  rows={4}
                  maxLength={2000}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
                <p className="mt-1 text-xs text-text-tertiary">
                  {description.length}/2000 characters
                </p>
              </div>

              {/* Image Upload - 2025 Modern Design */}
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-3">
                  Deal Image *
                </label>
                {!imagePreview ? (
                  <label className="flex flex-col items-center justify-center w-full h-72 border-3 border-dashed border-border rounded-2xl cursor-pointer hover:border-primary hover:bg-primary-light/30 transition-all duration-300 group">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Upload className="w-8 h-8 text-primary-dark" />
                      </div>
                      <p className="mb-2 text-base text-text-primary">
                        <span className="font-bold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-sm text-text-secondary">PNG, JPG, GIF up to 10MB (auto-compressed)</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                      disabled={isSubmitting}
                    />
                  </label>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden shadow-md">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-72 object-cover"
                    />
                    {!isSubmitting && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-3 right-3 p-2.5 bg-error text-white rounded-full hover:bg-red-700 shadow-lg hover:scale-110 transition-all"
                        aria-label="Remove image"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Category - 2025 Mobile-First Modern Selection */}
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2.5">
                  Category *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      disabled={isSubmitting}
                      className={`
                        relative overflow-hidden
                        px-3 py-3 md:px-4 md:py-4
                        rounded-xl border-2
                        transition-all duration-300
                        min-h-[48px] md:min-h-[56px]
                        ${
                          category === cat.id
                            ? 'border-primary bg-gradient-to-br from-primary-light to-primary-light/70 shadow-md scale-[1.02] md:scale-105'
                            : 'border-border/60 bg-surface hover:border-primary/40 hover:bg-surface-variant active:scale-[0.98] md:hover:scale-[1.02]'
                        }
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                    >
                      {/* Selected indicator - modern subtle glow */}
                      {category === cat.id && (
                        <div className="absolute inset-0 bg-gradient-to-br from-action-primary/5 to-primary-dark/5 animate-pulse-slow" />
                      )}

                      <div className="relative flex items-center justify-start md:justify-center gap-2 md:gap-2.5">
                        <span className="text-xl md:text-2xl flex-shrink-0">{cat.emoji}</span>
                        <span className={`
                          text-xs md:text-sm font-semibold text-left md:text-center
                          ${category === cat.id ? 'text-primary-dark' : 'text-text-primary'}
                        `}>
                          {cat.label}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Link */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Deal Link (Optional)
                </label>
                <Input
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://example.com/deal"
                  disabled={isSubmitting}
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Location (Optional)
                </label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., City Mall, Doha"
                  disabled={isSubmitting}
                />
              </div>

              {/* Promo Code */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Promo Code (Optional)
                </label>
                <Input
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="e.g., SAVE50"
                  maxLength={50}
                  disabled={isSubmitting}
                />
              </div>

              {/* Expiry Days */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Deal Valid For *
                </label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(e.target.value)}
                    min="1"
                    max="30"
                    required
                    disabled={isSubmitting}
                    className="w-24"
                  />
                  <span className="text-sm text-text-secondary">days from now</span>
                </div>
                <p className="mt-1 text-xs text-text-tertiary">
                  How many days is this deal valid for? (1-30 days)
                </p>
              </div>

              {/* Auto-approval notice - 2025 Modern Design */}
              {user?.auto_approve && (
                <div className="bg-success/10 border-2 border-success/30 text-success px-6 py-4 rounded-xl flex items-start gap-3 animate-scale-in">
                  <span className="text-2xl">✨</span>
                  <div>
                    <p className="font-semibold mb-1">Auto-Approval Enabled</p>
                    <p className="text-sm opacity-90">Your deals are auto-approved! This deal will be visible immediately.</p>
                  </div>
                </div>
              )}

              {/* Submit Button - 2025 Modern Design */}
              <div className="pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-action-primary to-primary-dark hover:from-primary-dark hover:to-action-primary shadow-purple hover:shadow-xl"
                >
                  {isSubmitting ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Deal'
                  )}
                </Button>
              </div>
            </CardBody>
          </Card>
        </form>
      </div>
    </div>
  )
}

export default function SubmitDealPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Spinner size="lg" /></div>}>
      <SubmitDealContent />
    </Suspense>
  )
}
