'use client'

import { Globe, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DealTypeSelectorProps {
  value: 'online' | 'physical'
  onChange: (value: 'online' | 'physical') => void
}

export default function DealTypeSelector({ value, onChange }: DealTypeSelectorProps) {
  return (
    <div className="w-full">
      <label className="block text-base font-semibold text-text-primary mb-3">
        Deal Type *
      </label>
      <div className="grid grid-cols-1 gap-3">
        <button
          type="button"
          onClick={() => onChange('online')}
          className={cn(
            'p-4 border-2 rounded-xl transition-all text-left',
            value === 'online'
              ? 'border-primary bg-primary/10 shadow-sm'
              : 'border-border hover:border-primary/50 hover:bg-primary/5'
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                value === 'online' ? 'bg-primary text-white' : 'bg-background-secondary text-text-secondary'
              )}
            >
              <Globe className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-text-primary mb-0.5">Online Deal</h3>
              <p className="text-xs text-text-secondary leading-snug">
                Website or online store
              </p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onChange('physical')}
          className={cn(
            'p-4 border-2 rounded-xl transition-all text-left',
            value === 'physical'
              ? 'border-primary bg-primary/10 shadow-sm'
              : 'border-border hover:border-primary/50 hover:bg-primary/5'
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                value === 'physical' ? 'bg-primary text-white' : 'bg-background-secondary text-text-secondary'
              )}
            >
              <MapPin className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-text-primary mb-0.5">Physical Deal</h3>
              <p className="text-xs text-text-secondary leading-snug">
                Physical location in Doha
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}
