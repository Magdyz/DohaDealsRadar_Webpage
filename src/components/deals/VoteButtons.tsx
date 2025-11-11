'use client'

import { useState, useEffect } from 'react'
import { Flame, Snowflake } from 'lucide-react'
import { cn } from '@/lib/utils'
import { castVote } from '@/lib/api/deals'
import { getDeviceId } from '@/lib/utils/deviceId'
import { getVote, setVote, hasVoted } from '@/lib/utils/localStorage'
import type { VoteType } from '@/types'

interface VoteButtonsProps {
  dealId: string
  initialHotVotes: number
  initialColdVotes: number
  onVoteSuccess?: (hotVotes: number, coldVotes: number) => void
}

export default function VoteButtons({
  dealId,
  initialHotVotes,
  initialColdVotes,
  onVoteSuccess,
}: VoteButtonsProps) {
  const [hotVotes, setHotVotes] = useState(initialHotVotes)
  const [coldVotes, setColdVotes] = useState(initialColdVotes)
  const [userVote, setUserVote] = useState<VoteType | null>(null)
  const [isVoting, setIsVoting] = useState(false)

  useEffect(() => {
    // Check if user has already voted on this deal
    const existingVote = getVote(dealId)
    setUserVote(existingVote)
  }, [dealId])

  const handleVote = async (voteType: VoteType) => {
    if (hasVoted(dealId) || isVoting) return

    setIsVoting(true)

    // Optimistic update
    if (voteType === 'hot') {
      setHotVotes(hotVotes + 1)
    } else {
      setColdVotes(coldVotes + 1)
    }
    setUserVote(voteType)

    try {
      const deviceId = getDeviceId()
      const response = await castVote(dealId, deviceId, voteType)

      if (response.success) {
        // Update with actual counts from server
        setHotVotes(response.hotVotes)
        setColdVotes(response.coldVotes)

        // Store vote in localStorage
        setVote(dealId, voteType)

        // Callback for parent component
        if (onVoteSuccess) {
          onVoteSuccess(response.hotVotes, response.coldVotes)
        }
      }
    } catch (error) {
      // Revert optimistic update on error
      if (voteType === 'hot') {
        setHotVotes(hotVotes)
      } else {
        setColdVotes(coldVotes)
      }
      setUserVote(null)
      console.error('Vote failed:', error)
    } finally {
      setIsVoting(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Hot Vote Button */}
      <button
        onClick={() => handleVote('hot')}
        disabled={hasVoted(dealId) || isVoting}
        className={cn(
          'flex items-center gap-1 px-3 py-1.5 rounded-full transition-all',
          'border-2 text-sm font-medium',
          userVote === 'hot'
            ? 'border-accent-hot bg-accent-hot text-white'
            : 'border-accent-hot text-accent-hot hover:bg-accent-hot/10',
          (hasVoted(dealId) || isVoting) && 'opacity-50 cursor-not-allowed'
        )}
      >
        <Flame className="w-4 h-4" />
        <span>{hotVotes}</span>
      </button>

      {/* Cold Vote Button */}
      <button
        onClick={() => handleVote('cold')}
        disabled={hasVoted(dealId) || isVoting}
        className={cn(
          'flex items-center gap-1 px-3 py-1.5 rounded-full transition-all',
          'border-2 text-sm font-medium',
          userVote === 'cold'
            ? 'border-accent-cold bg-accent-cold text-white'
            : 'border-accent-cold text-accent-cold hover:bg-accent-cold/10',
          (hasVoted(dealId) || isVoting) && 'opacity-50 cursor-not-allowed'
        )}
      >
        <Snowflake className="w-4 h-4" />
        <span>{coldVotes}</span>
      </button>
    </div>
  )
}
