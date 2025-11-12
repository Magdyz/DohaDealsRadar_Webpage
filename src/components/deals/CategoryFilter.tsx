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
    <div className="flex gap-2 overflow-x-auto pb-2 px-3 md:px-4 scrollbar-hide">
      <button
        onClick={() => onChange('')}
        className={cn(
          'px-4 py-2 rounded-full text-[15px] font-semibold whitespace-nowrap transition-all duration-200 h-10',
          selected === ''
            ? 'bg-action-primary text-white border-2 border-action-primary'
            : 'bg-transparent text-text-primary border border-border/40 hover:border-action-primary/50'
        )}
      >
        All
      </button>

      {CATEGORIES.map((category) => (
        <button
          key={category.id}
          onClick={() => onChange(category.id)}
          className={cn(
            'px-4 py-2 rounded-full text-[15px] font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 h-10',
            selected === category.id
              ? 'bg-action-primary text-white border-2 border-action-primary'
              : 'bg-transparent text-text-primary border border-border/40 hover:border-action-primary/50'
          )}
        >
          <span className="text-base">{category.emoji}</span>
          <span>{category.label}</span>
        </button>
      ))}
    </div>
  )
}
