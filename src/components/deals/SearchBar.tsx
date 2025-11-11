'use client'

import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  debounceMs?: number
}

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search deals...',
  debounceMs = 500,
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [localValue, debounceMs, onChange])

  const handleClear = () => {
    setLocalValue('')
    onChange('')
  }

  return (
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary">
        <Search className="w-5 h-5" />
      </div>
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-12 pr-12 py-3.5 border border-border rounded-xl bg-surface-variant text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:bg-surface transition-all"
      />
      {localValue && (
        <button
          onClick={handleClear}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}
