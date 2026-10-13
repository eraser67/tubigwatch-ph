import type { Metadata } from 'next'
import { requireModerator } from '@/lib/dal/auth'
import { getAllStoresAdmin } from '@/lib/dal/stores'
import { DuplicateMergeClient } from './DuplicateMergeClient'

export const metadata: Metadata = { title: 'Merge Duplicate Stores — Admin' }

export default async function DuplicateStoresPage() {
  await requireModerator()
  const stores = await getAllStoresAdmin()

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>
          Merge Duplicate Stores 🔀
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', margin: 0 }}>
          Combine duplicate store submissions into a single canonical store. All existing product listings and price histories are automatically transferred and preserved.
        </p>
      </div>

      <DuplicateMergeClient stores={stores} />
    </div>
  )
}
