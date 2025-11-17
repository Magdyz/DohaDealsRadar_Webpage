'use client'

import { ChangeEvent } from 'react'

interface PriceInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  error?: string
}

export default function PriceInput({ label, value, onChange, placeholder, error }: PriceInputProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value

    // Allow empty string, numbers, and decimals
    if (inputValue === '' || /^\d*\.?\d*$/.test(inputValue)) {
      onChange(inputValue)
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 pointer-events-none select-none">
          QR{' '}
        </div>
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={`
            w-full pl-12 pr-4 py-3
            bg-white dark:bg-zinc-800
            border rounded-lg
            text-zinc-900 dark:text-zinc-100
            placeholder:text-zinc-400 dark:placeholder:text-zinc-500
            focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-400
            transition-all
            ${error
              ? 'border-red-500 dark:border-red-400'
              : 'border-zinc-200 dark:border-zinc-700'
            }
          `}
        />
      </div>
      {error && (
        <p className="text-xs text-red-500 dark:text-red-400 mt-1">{error}</p>
      )}
    </div>
  )
}
