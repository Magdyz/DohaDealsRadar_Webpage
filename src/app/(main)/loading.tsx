import { Spinner } from '@/components/ui'

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="text-text-secondary mt-4 text-sm">Loading...</p>
      </div>
    </div>
  )
}
