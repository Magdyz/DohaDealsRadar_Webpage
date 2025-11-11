import { VoteType } from '@/types'

const VOTES_KEY = 'doha_deals_votes'
const REPORTS_KEY = 'doha_deals_reports'

interface VotesData {
  [dealId: string]: VoteType
}

interface ReportsData {
  [date: string]: string[] // Deal IDs reported per day
  reportedDeals: string[] // All time reported deals
}

// Votes Management
export function getVote(dealId: string): VoteType | null {
  if (typeof window === 'undefined') return null

  try {
    const votesStr = localStorage.getItem(VOTES_KEY)
    if (!votesStr) return null

    const votes: VotesData = JSON.parse(votesStr)
    return votes[dealId] || null
  } catch {
    return null
  }
}

export function setVote(dealId: string, voteType: VoteType): void {
  if (typeof window === 'undefined') return

  try {
    const votesStr = localStorage.getItem(VOTES_KEY)
    const votes: VotesData = votesStr ? JSON.parse(votesStr) : {}

    votes[dealId] = voteType
    localStorage.setItem(VOTES_KEY, JSON.stringify(votes))
  } catch (error) {
    console.error('Error saving vote:', error)
  }
}

export function hasVoted(dealId: string): boolean {
  return getVote(dealId) !== null
}

// Reports Management
export function canReport(dealId: string): { canReport: boolean; reason?: string } {
  if (typeof window === 'undefined') {
    return { canReport: true }
  }

  try {
    const reportsStr = localStorage.getItem(REPORTS_KEY)
    if (!reportsStr) return { canReport: true }

    const reports: ReportsData = JSON.parse(reportsStr)

    // Check if already reported this deal
    if (reports.reportedDeals?.includes(dealId)) {
      return { canReport: false, reason: 'You have already reported this deal' }
    }

    // Check daily limit (5 per day)
    const today = new Date().toISOString().split('T')[0]
    const todayReports = reports[today] || []

    if (todayReports.length >= 5) {
      return { canReport: false, reason: 'You have reached the daily limit of 5 reports' }
    }

    return { canReport: true }
  } catch {
    return { canReport: true }
  }
}

export function addReport(dealId: string): void {
  if (typeof window === 'undefined') return

  try {
    const reportsStr = localStorage.getItem(REPORTS_KEY)
    const reports: ReportsData = reportsStr ? JSON.parse(reportsStr) : { reportedDeals: [] }

    const today = new Date().toISOString().split('T')[0]

    if (!reports[today]) {
      reports[today] = []
    }

    reports[today].push(dealId)

    if (!reports.reportedDeals) {
      reports.reportedDeals = []
    }

    if (!reports.reportedDeals.includes(dealId)) {
      reports.reportedDeals.push(dealId)
    }

    localStorage.setItem(REPORTS_KEY, JSON.stringify(reports))
  } catch (error) {
    console.error('Error saving report:', error)
  }
}

export function clearOldReports(): void {
  if (typeof window === 'undefined') return

  try {
    const reportsStr = localStorage.getItem(REPORTS_KEY)
    if (!reportsStr) return

    const reports: ReportsData = JSON.parse(reportsStr)
    const today = new Date()
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Remove daily report entries older than 7 days
    Object.keys(reports).forEach((key) => {
      if (key !== 'reportedDeals') {
        const reportDate = new Date(key)
        if (reportDate < sevenDaysAgo) {
          delete reports[key]
        }
      }
    })

    localStorage.setItem(REPORTS_KEY, JSON.stringify(reports))
  } catch (error) {
    console.error('Error clearing old reports:', error)
  }
}
