'use client'

import { TextareaHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-semibold text-text-primary mb-2.5"
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          className={cn(
            // 2025 Modern Textarea Styles with better spacing
            'w-full px-4 py-3.5 border-2 rounded-xl bg-surface text-text-primary placeholder:text-text-tertiary resize-y',
            'focus:outline-none focus:ring-3 focus:ring-primary/30 focus:border-primary',
            'disabled:bg-background-secondary disabled:cursor-not-allowed disabled:opacity-60',
            'transition-all duration-200 leading-relaxed',
            'hover:border-primary/40',
            error ? 'border-error focus:ring-error/30 focus:border-error' : 'border-border',
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

Textarea.displayName = 'Textarea'

export default Textarea
