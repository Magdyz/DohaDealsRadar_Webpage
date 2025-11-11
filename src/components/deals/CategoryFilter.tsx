'use client'

import { Badge } from '@/components/ui'
import { cn } from '@/lib/utils'
import { CATEGORIES } from '@/types'
import type { DealCategory } from '@/types'

interface CategoryFilterProps {
  selected: DealCategory | ''
  onChange: (category: DealCategory | '') => void
}

export default function CategoryFilter({
  selected,
  onChange,
}: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => onChange('')}
        className={cn(
          'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
          selected === ''
            ? 'bg-primary text-white'
            : 'bg-white text-text-secondary border-2 border-gray-200 hover:border-primary'
        )}
      >
        All Categories
      </button>

      {CATEGORIES.map((category) => (
        <button
          key={category.id}
          onClick={() => onChange(category.id)}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2',
            selected === category.id
              ? 'bg-primary text-white'
              : 'bg-white text-text-secondary border-2 border-gray-200 hover:border-primary'
          )}
        >
          <span>{category.emoji}</span>
          <span>{category.label}</span>
        </button>
      ))}
    </div>
  )
}
