'use client'

import { Suspense, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, Eye } from 'lucide-react'
import { Button, Card, CardBody, Input, Badge, Spinner } from '@/components/ui'
import { submitDeal, uploadImage } from '@/lib/api/deals'
import { useAuthStore } from '@/lib/store/authStore'
import { useDeviceId } from '@/lib/hooks/useDeviceId'
import { useToast } from '@/lib/hooks/useToast'
import { dealSubmissionSchema, formatZodError } from '@/lib/validation/dealSchema'
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
  const [expiryDays, setExpiryDays] = useState('7')

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB')
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file')
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
      // Upload image first
      let imageUrl = imagePreview
      if (imageFile) {
        const uploadResult = await uploadImage(imageFile)
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
    <div className="min-h-screen bg-background-secondary pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-text-primary">Post a Deal</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit}>
          <Card variant="elevated">
            <CardBody className="p-6 space-y-6">
              {/* Error message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
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

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Deal Image *
                </label>
                {!imagePreview ? (
                  <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-12 h-12 text-gray-400 mb-3" />
                      <p className="mb-2 text-sm text-gray-600">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
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
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    {!isSubmitting && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Category *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      disabled={isSubmitting}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        category === cat.id
                          ? 'border-primary bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{cat.emoji}</span>
                        <span className="text-sm font-medium">{cat.label}</span>
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

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={isSubmitting}
                  className="flex-1"
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

              {/* Auto-approval notice */}
              {user?.auto_approve && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                  ✨ Your deals are auto-approved! This deal will be visible immediately.
                </div>
              )}
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
