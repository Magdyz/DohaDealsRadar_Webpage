'use client'

import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined'
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    // 2025 Modern Card Styles with generous spacing
    const variants = {
      default: 'bg-surface shadow-modern-sm border border-border/50',
      elevated: 'bg-surface shadow-modern-lg hover:shadow-modern-xl transition-all duration-400 transform hover:-translate-y-1',
      outlined: 'bg-surface border-2 border-border hover:border-primary/60 hover:shadow-modern-sm transition-all duration-300',
    }

    return (
      <div
        ref={ref}
        className={cn('rounded-xl overflow-hidden', variants[variant], className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

// 2025 Modern Card Sections with better spacing
export const CardHeader = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('px-6 py-5 border-b border-border/30', className)} {...props} />
))

CardHeader.displayName = 'CardHeader'

export const CardBody = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('px-6 py-6', className)} {...props} />
))

CardBody.displayName = 'CardBody'

export const CardFooter = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('px-6 py-5 border-t border-border/30 bg-background/30', className)} {...props} />
))

CardFooter.displayName = 'CardFooter'

export default Card
