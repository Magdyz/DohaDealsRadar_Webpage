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
    <div className="flex gap-2.5 overflow-x-auto pb-3 px-4 md:px-6 scrollbar-hide">
      <button
        onClick={() => onChange('')}
        className={cn(
          'px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 min-h-[40px]',
          selected === ''
            ? 'bg-gradient-to-r from-action-primary to-primary-dark text-white shadow-purple scale-105'
            : 'bg-surface text-text-primary border-2 border-border hover:border-primary/50 hover:scale-105'
        )}
      >
        All
      </button>

      {CATEGORIES.map((category) => (
        <button
          key={category.id}
          onClick={() => onChange(category.id)}
          className={cn(
            'px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 flex items-center gap-2 min-h-[40px]',
            selected === category.id
              ? 'bg-gradient-to-r from-action-primary to-primary-dark text-white shadow-purple scale-105'
              : 'bg-surface text-text-primary border-2 border-border hover:border-primary/50 hover:scale-105'
          )}
        >
          <span className="text-base">{category.emoji}</span>
          <span>{category.label}</span>
        </button>
      ))}
    </div>
  )
}
