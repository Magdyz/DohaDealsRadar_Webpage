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
      <label className="block text-sm font-medium text-text-primary mb-3">
        Deal Type *
      </label>
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => onChange('online')}
          className={cn(
            'p-6 border-2 rounded-lg transition-all text-left',
            value === 'online'
              ? 'border-primary bg-primary/5'
              : 'border-gray-200 hover:border-gray-300'
          )}
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center',
                value === 'online' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
              )}
            >
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">Online Deal</h3>
            </div>
          </div>
          <p className="text-sm text-text-secondary">
            Deal available through a website or online store
          </p>
        </button>

        <button
          type="button"
          onClick={() => onChange('physical')}
          className={cn(
            'p-6 border-2 rounded-lg transition-all text-left',
            value === 'physical'
              ? 'border-primary bg-primary/5'
              : 'border-gray-200 hover:border-gray-300'
          )}
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center',
                value === 'physical' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
              )}
            >
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">Physical Deal</h3>
            </div>
          </div>
          <p className="text-sm text-text-secondary">
            Deal available at a physical location in Doha
          </p>
        </button>
      </div>
    </div>
  )
}
