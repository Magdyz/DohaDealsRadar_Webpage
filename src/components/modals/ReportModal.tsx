'use client'

import { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { useUser } from '@/lib/store/authStore'
import { useToast } from '@/lib/hooks/useToast'

export type ReportReason = 'spam' | 'inappropriate' | 'expired' | 'misleading'

interface ReportModalProps {
  dealId: string
  dealTitle: string
  isOpen: boolean
  onClose: () => void
}

const reportReasons: Array<{ value: ReportReason; label: string; description: string }> = [
  {
    value: 'spam',
    label: 'Spam or Duplicate',
    description: 'This deal is spam or has been posted multiple times',
  },
  {
    value: 'inappropriate',
    label: 'Inappropriate Content',
    description: 'Contains offensive, harmful, or inappropriate content',
  },
  {
    value: 'expired',
    label: 'Expired Deal',
    description: 'This deal is no longer available or has expired',
  },
  {
    value: 'misleading',
    label: 'Misleading Information',
    description: 'Contains false or misleading information about the deal',
  },
]

export default function ReportModal({ dealId, dealTitle, isOpen, onClose }: ReportModalProps) {
  const user = useUser()
  const { toast } = useToast()
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null)
  const [details, setDetails] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  // High-severity reports require at least 30 characters of details
  const highSeverityReasons: ReportReason[] = ['spam', 'misleading']
  const requiresDetails = selectedReason && highSeverityReasons.includes(selectedReason)
  const detailsValid = !requiresDetails || details.trim().length >= 30

  const handleSubmit = async () => {
    if (!selectedReason || !user || !detailsValid) return

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/report-deal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId,
          userId: user.id,
          reason: selectedReason,
          details: details.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit report')
      }

      toast.success('Report submitted successfully. Thank you for keeping the community safe!')
      onClose()
    } catch (err: any) {
      if (err.message.includes('already reported')) {
        toast.error('You have already reported this deal')
      } else if (err.message.includes('5 deals per day')) {
        toast.error('You have reached your daily report limit (5 reports)')
      } else {
        toast.error(err.message || 'Failed to submit report')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4">
        <div className="bg-surface rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/20">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h2 className="text-lg font-bold text-text-primary">Report Deal</h2>
            </div>
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-1">Deal Title</h3>
              <p className="text-sm text-text-secondary line-clamp-2">{dealTitle}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-3">
                Why are you reporting this deal?
              </h3>
              <div className="space-y-2">
                {reportReasons.map((reason) => (
                  <button
                    key={reason.value}
                    onClick={() => setSelectedReason(reason.value)}
                    className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                      selectedReason === reason.value
                        ? 'border-action-primary bg-primary-light'
                        : 'border-border/20 bg-surface-variant hover:border-action-primary/50'
                    }`}
                  >
                    <div className="font-semibold text-sm text-text-primary mb-0.5">
                      {reason.label}
                    </div>
                    <div className="text-xs text-text-secondary">{reason.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Additional Details - 2025 Mobile-First Design */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-text-primary">
                  Additional Details {requiresDetails && <span className="text-error">*</span>}
                </label>
                <span className={`text-xs font-medium ${
                  requiresDetails && details.trim().length < 30
                    ? 'text-error'
                    : 'text-text-tertiary'
                }`}>
                  {details.length}/30
                </span>
              </div>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={requiresDetails
                  ? "Please provide specific details about this report (minimum 30 characters)..."
                  : "Optional: Provide additional context for your report..."
                }
                className={`w-full min-h-[120px] px-4 py-3 border-2 rounded-xl bg-surface text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm resize-none ${
                  requiresDetails && !detailsValid
                    ? 'border-error focus:border-error'
                    : 'border-border focus:border-primary'
                }`}
                maxLength={500}
              />
              {requiresDetails && !detailsValid && (
                <p className="mt-1.5 text-xs text-error font-medium">
                  High-severity reports require at least 30 characters of details
                </p>
              )}
              <p className="mt-1.5 text-xs text-text-tertiary">
                Help moderators understand your concern by providing specific details
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
              <p className="text-xs text-yellow-900">
                <strong>Note:</strong> Reports are reviewed by moderators. False reports may result
                in action against your account. You can report up to 5 deals per day.
              </p>
            </div>
          </div>

          {/* Footer - 2025 Touch-Friendly Buttons */}
          <div className="flex gap-3 p-4 border-t border-border/20">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-border/40 text-text-primary font-semibold hover:bg-surface-variant transition-colors min-h-[44px]"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedReason || !detailsValid || isSubmitting}
              className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold transition-colors min-h-[44px]"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
