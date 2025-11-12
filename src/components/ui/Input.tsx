'use client'

import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-semibold text-text-primary mb-2.5"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            // 2025 Modern Input Styles with better touch target and spacing
            'w-full px-4 py-3.5 border-2 rounded-xl bg-surface text-text-primary placeholder:text-text-tertiary',
            'focus:outline-none focus:ring-3 focus:ring-primary/30 focus:border-primary',
            'disabled:bg-background-secondary disabled:cursor-not-allowed disabled:opacity-60',
            'transition-all duration-200 min-h-[44px]',
            'hover:border-primary/40',
            error
              ? 'border-error focus:ring-error/30 focus:border-error'
              : 'border-border',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-error font-medium flex items-center gap-1.5">
            <span className="text-base">⚠</span>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-2 text-sm text-text-tertiary leading-relaxed">{helperText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
