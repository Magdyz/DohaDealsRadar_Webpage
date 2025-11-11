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
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
        <Search className="w-5 h-5" />
      </div>
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2.5 border-2 border-gray-300 rounded-lg bg-white text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
      />
      {localValue && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}
