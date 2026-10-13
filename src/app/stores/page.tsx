import type { Metadata } from 'next'
import { EmptyState } from '@/components/feedback/EmptyState'

export const metadata: Metadata = { title: 'Stores' }

export default function StoresPage() {
  return (
    <section aria-labelledby="stores-heading" style={{ padding: '2rem 1rem' }}>
      <h1 id="stores-heading" style={{ fontWeight: 700, fontSize: '1.5rem', marginBottom: '1rem' }}>
        Stores
      </h1>
      <EmptyState
        icon="🏪"
        title="Store list coming in Phase 3"
        message="Store listings and management will be built in Phase 3."
      />
    </section>
  )
}
