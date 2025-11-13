'use client'

import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    // 2025 Modern Button Styles
    const baseStyles =
      'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 focus:outline-none focus:ring-3 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] touch-target whitespace-normal break-words text-center'

    const variants = {
      primary: 'bg-action-primary text-white hover:bg-primary-dark shadow-purple hover:shadow-xl focus:ring-primary transform hover:-translate-y-0.5',
      secondary:
        'bg-surface-variant text-text-primary hover:bg-surface border-2 border-border hover:shadow-modern-md focus:ring-primary hover:border-primary/30',
      outline:
        'border-2 border-border text-text-primary hover:bg-surface hover:border-primary hover:text-primary focus:ring-primary hover:shadow-modern-sm',
      ghost: 'text-text-primary hover:bg-surface-variant hover:text-primary focus:ring-primary/50',
      danger: 'bg-error text-white hover:bg-red-700 shadow-md hover:shadow-xl focus:ring-error transform hover:-translate-y-0.5',
    }

    // 2025 Modern Sizing - Better touch targets (44px minimum)
    const sizes = {
      sm: 'text-sm px-4 py-2.5 min-h-[40px]',
      md: 'text-base px-6 py-3 min-h-[44px]',
      lg: 'text-lg px-8 py-4 min-h-[52px]',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Loading...
          </>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
