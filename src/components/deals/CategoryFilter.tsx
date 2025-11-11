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
          'px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200',
          selected === ''
            ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105'
            : 'bg-surface-variant text-text-secondary border border-border hover:border-primary/50 hover:bg-surface'
        )}
      >
        <span className="text-base mr-1.5">🔥</span>
        All
      </button>

      {CATEGORIES.map((category) => (
        <button
          key={category.id}
          onClick={() => onChange(category.id)}
          className={cn(
            'px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-2',
            selected === category.id
              ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105'
              : 'bg-surface-variant text-text-secondary border border-border hover:border-primary/50 hover:bg-surface'
          )}
        >
          <span className="text-base">{category.emoji}</span>
          <span>{category.label}</span>
        </button>
      ))}
    </div>
  )
}
