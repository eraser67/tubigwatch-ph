import type { Metadata } from 'next'
import { EmptyState } from '@/components/feedback/EmptyState'

export const metadata: Metadata = { title: 'Compare Prices' }

export default function ComparePage() {
  return (
    <section aria-labelledby="compare-heading" style={{ padding: '2rem 1rem' }}>
      <h1 id="compare-heading" style={{ fontWeight: 700, fontSize: '1.5rem', marginBottom: '1rem' }}>
        Compare Prices
      </h1>
      <EmptyState
        icon="⚖️"
        title="Price comparison coming in Phase 7"
        message="Search and compare equivalent products across stores — built in Phase 7."
      />
    </section>
  )
}
