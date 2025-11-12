'use client'

import { Package, CheckCircle, Clock, XCircle } from 'lucide-react'
import { Card, CardBody } from '@/components/ui'
import type { UserStats } from '@/types'

interface UserStatsProps {
  stats: UserStats
  isLoading?: boolean
}

export default function UserStatsComponent({ stats, isLoading }: UserStatsProps) {
  const statItems = [
    {
      label: 'Total Deals',
      value: stats.total_deals,
      icon: Package,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Approved',
      value: stats.approved_deals,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      label: 'Pending',
      value: stats.pending_deals,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      label: 'Rejected',
      value: stats.rejected_deals,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} variant="outlined">
            <CardBody className="animate-pulse">
              <div className="h-10 w-10 rounded-full bg-gray-200 mb-3"></div>
              <div className="h-6 w-16 bg-gray-200 rounded mb-1"></div>
              <div className="h-4 w-20 bg-gray-200 rounded"></div>
            </CardBody>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statItems.map((item) => {
        const Icon = item.icon
        return (
          <Card key={item.label} variant="outlined">
            <CardBody>
              <div className={`w-10 h-10 rounded-full ${item.bgColor} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div className="text-3xl font-bold text-text-primary mb-1">
                {item.value}
              </div>
              <div className="text-sm text-text-secondary">{item.label}</div>
            </CardBody>
          </Card>
        )
      })}
    </div>
  )
}
