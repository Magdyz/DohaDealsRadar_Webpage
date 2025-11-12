'use client'

import { User as UserIcon, Mail, Shield, Award } from 'lucide-react'
import { Card, CardBody, Badge } from '@/components/ui'
import type { User } from '@/types'

interface UserProfileProps {
  user: User
}

export default function UserProfile({ user }: UserProfileProps) {
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'danger'
      case 'moderator':
        return 'purple'
      default:
        return 'default'
    }
  }

  const getRoleIcon = (role: string) => {
    if (role === 'admin' || role === 'moderator') {
      return <Shield className="w-4 h-4" />
    }
    return <UserIcon className="w-4 h-4" />
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <Card variant="elevated">
      <CardBody>
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <UserIcon className="w-8 h-8 text-primary" />
          </div>

          {/* User Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-semibold text-text-primary">
                {user.username || 'User'}
              </h2>
              <Badge variant={getRoleBadgeVariant(user.role)} size="sm">
                <span className="flex items-center gap-1">
                  {getRoleIcon(user.role)}
                  <span className="capitalize">{user.role}</span>
                </span>
              </Badge>
              {user.auto_approve && (
                <Badge variant="success" size="sm">
                  <span className="flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    Trusted
                  </span>
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 text-text-secondary mb-2">
              <Mail className="w-4 h-4" />
              <span className="text-sm">{user.email}</span>
            </div>

            <p className="text-sm text-text-tertiary">
              Member since {formatDate(user.created_at)}
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
