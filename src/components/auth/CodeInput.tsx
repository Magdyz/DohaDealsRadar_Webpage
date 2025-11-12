'use client'

import { useRef, useState, KeyboardEvent, ClipboardEvent } from 'react'
import { cn } from '@/lib/utils'

interface CodeInputProps {
  length?: number
  onComplete: (code: string) => void
  error?: string
  disabled?: boolean
}

export default function CodeInput({
  length = 6,
  onComplete,
  error,
  disabled = false,
}: CodeInputProps) {
  const [code, setCode] = useState<string[]>(Array(length).fill(''))
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (index: number, value: string) => {
    if (disabled) return

    // Only allow numbers
    if (value && !/^\d$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value

    setCode(newCode)

    // Auto-focus next input
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    // Call onComplete when all digits are filled
    if (newCode.every((digit) => digit !== '')) {
      onComplete(newCode.join(''))
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return

    if (e.key === 'Backspace' && !code[index] && index > 0) {
      // Focus previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    if (disabled) return

    e.preventDefault()
    const pastedData = e.clipboardData.getData('text/plain').trim()

    // Only process if pasted data is all digits
    if (!/^\d+$/.test(pastedData)) return

    const pastedCode = pastedData.slice(0, length).split('')
    const newCode = [...code]

    pastedCode.forEach((digit, index) => {
      newCode[index] = digit
    })

    setCode(newCode)

    // Focus the next empty input or the last input
    const nextEmptyIndex = newCode.findIndex((digit) => digit === '')
    if (nextEmptyIndex !== -1) {
      inputRefs.current[nextEmptyIndex]?.focus()
    } else {
      inputRefs.current[length - 1]?.focus()
    }

    // Call onComplete if all digits are filled
    if (newCode.every((digit) => digit !== '')) {
      onComplete(newCode.join(''))
    }
  }

  return (
    <div className="w-full">
      <div className="flex gap-3 md:gap-4 justify-center px-2">
        {code.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={disabled}
            className={cn(
              'w-12 h-16 md:w-14 md:h-20 text-center text-2xl md:text-3xl font-bold border-2 rounded-xl',
              'focus:outline-none focus:ring-4 focus:ring-primary/30 focus:border-primary',
              'transition-all duration-200 shadow-sm',
              'bg-surface',
              error
                ? 'border-error focus:ring-error/30 focus:border-error animate-shake'
                : 'border-border hover:border-primary/50',
              disabled && 'bg-background-secondary cursor-not-allowed opacity-60'
            )}
            autoFocus={index === 0}
          />
        ))}
      </div>
      {error && (
        <div className="mt-4 p-3 bg-error/10 border border-error/30 rounded-lg">
          <p className="text-sm font-medium text-error text-center flex items-center justify-center gap-2">
            <span className="text-base">⚠</span>
            {error}
          </p>
        </div>
      )}
    </div>
  )
}
