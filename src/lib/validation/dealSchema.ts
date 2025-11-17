import { z } from 'zod'
import type { DealCategory } from '@/types'

const CATEGORIES: DealCategory[] = [
  'food_dining',
  'shopping_fashion',
  'entertainment',
  'home_services',
  'other',
]

// Schema for deal submission form validation
export const dealSubmissionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(10, 'Title must be at least 10 characters')
    .max(200, 'Title must not exceed 200 characters'),
  description: z
    .string()
    .trim()
    .max(2000, 'Description must not exceed 2000 characters')
    .optional()
    .or(z.literal('')),
  dealType: z.enum(['online', 'physical']).optional(),
  imageUrl: z.string().url('Invalid image URL').optional(),
  link: z
    .string()
    .trim()
    .refine(
      (val) => {
        if (!val || val === '') return true
        try {
          new URL(val)
          return true
        } catch {
          return false
        }
      },
      { message: 'Please enter a valid URL (e.g., https://example.com)' }
    )
    .optional()
    .or(z.literal('')),
  location: z
    .string()
    .trim()
    .max(100, 'Location must not exceed 100 characters')
    .optional()
    .or(z.literal('')),
  category: z.enum(CATEGORIES as [DealCategory, ...DealCategory[]], 'Please select a valid category'),
  promoCode: z
    .string()
    .trim()
    .max(50, 'Promo code must not exceed 50 characters')
    .optional()
    .or(z.literal('')),
  expiryDays: z
    .number()
    .int('Expiry days must be a whole number')
    .min(1, 'Deal must be valid for at least 1 day')
    .max(30, 'Deal cannot be valid for more than 30 days'),
  originalPrice: z
    .number()
    .positive('Original price must be a positive number')
    .optional()
    .or(z.literal(0))
    .transform((val) => val === 0 ? undefined : val),
  discountedPrice: z
    .number()
    .positive('Discounted price must be a positive number')
    .optional()
    .or(z.literal(0))
    .transform((val) => val === 0 ? undefined : val),
}).refine(
  (data) => {
    // If both prices exist, discounted must be less than original
    if (data.originalPrice && data.discountedPrice) {
      return data.discountedPrice < data.originalPrice
    }
    return true
  },
  {
    message: 'Discounted price must be less than original price',
    path: ['discountedPrice'],
  }
)

export type DealSubmissionData = z.infer<typeof dealSubmissionSchema>

// Helper function to format Zod errors for display
export function formatZodError(error: z.ZodError): string {
  const firstError = error.issues[0]
  if (!firstError) return 'Validation failed'

  const field = firstError.path.join('.')
  const message = firstError.message

  return field ? `${field}: ${message}` : message
}

// Helper function to get all validation errors as a map
export function getValidationErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {}

  for (const err of error.issues) {
    const field = err.path.join('.')
    if (field) {
      errors[field] = err.message
    }
  }

  return errors
}
