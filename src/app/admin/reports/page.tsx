import type { Metadata } from 'next'
import { requireModerator } from '@/lib/dal/auth'
import { EmptyState } from '@/components/feedback/EmptyState'

export const metadata: Metadata = { title: 'Price Reports' }

export default async function AdminReportsPage() {
  await requireModerator()

  return (
    <div>
      <h1 id="admin-reports-heading" style={{ fontWeight: 700, fontSize: '1.375rem', marginBottom: '1.5rem' }}>
        Price Report Queue
      </h1>
      <EmptyState
        icon="📋"
        title="Price report review coming in Phase 6"
        message="The price report review UI will be built in Phase 6 (Price reporting and moderation)."
      />
    </div>
  )
}
