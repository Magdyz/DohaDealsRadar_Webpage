import { z } from 'zod'

export const dealSchema = z.object({
  dealType: z.enum(['online', 'physical']),
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters'),
  description: z
    .string()
    .max(2000, 'Description must be less than 2000 characters')
    .optional(),
  link: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  location: z
    .string()
    .min(3, 'Location must be at least 3 characters')
    .max(100, 'Location must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  category: z.enum([
    'food_dining',
    'shopping_fashion',
    'electronics_tech',
    'health_beauty',
    'entertainment_activities',
  ]),
  promoCode: z
    .string()
    .max(50, 'Promo code must be less than 50 characters')
    .optional()
    .or(z.literal('')),
  expiryDays: z
    .number()
    .min(1, 'Expiry must be at least 1 day')
    .max(30, 'Expiry cannot exceed 30 days'),
  imageUrl: z.string().url('Please provide a valid image URL'),
})

export type DealFormData = z.infer<typeof dealSchema>

// Refined validation based on deal type
export const validateDealForm = (data: DealFormData) => {
  const errors: Record<string, string> = {}

  if (data.dealType === 'online') {
    if (!data.link || data.link.trim() === '') {
      errors.link = 'Link is required for online deals'
    }
  } else if (data.dealType === 'physical') {
    if (!data.location || data.location.trim() === '') {
      errors.location = 'Location is required for physical deals'
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}
