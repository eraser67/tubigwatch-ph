import type { Metadata } from 'next'
import { EmptyState } from '@/components/feedback/EmptyState'

export const metadata: Metadata = { title: 'Add a Store' }

export default function ContributePage() {
  return (
    <section aria-labelledby="contribute-heading" style={{ padding: '2rem 1rem' }}>
      <h1 id="contribute-heading" style={{ fontWeight: 700, fontSize: '1.5rem', marginBottom: '1rem' }}>
        Add a Store
      </h1>
      <EmptyState
        icon="📍"
        title="Store submission coming in Phase 5"
        message="The guided Add Store workflow with map pin placement will be built in Phase 5."
      />
    </section>
  )
}
