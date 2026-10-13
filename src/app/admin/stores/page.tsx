import type { Metadata } from 'next'
import { getPendingStores, getAllStoresAdmin } from '@/lib/dal/stores'
import { requireModerator } from '@/lib/dal/auth'
import { StoreAdminClient } from './StoreAdminClient'

export const metadata: Metadata = { title: 'Store Moderation & Verification | TubigWatch' }

export default async function AdminStoresPage() {
  await requireModerator()

  const [pending, all] = await Promise.all([getPendingStores(), getAllStoresAdmin()])

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 id="admin-stores-heading" style={{ fontWeight: 800, fontSize: '1.5rem', margin: '0 0 0.25rem 0' }}>
          Store Moderation & Verification
        </h1>
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>
          Approve, reject, suspend stores, and manage store verification tiers. Contributors cannot approve their own submissions.
        </p>
      </div>

      <StoreAdminClient pendingStores={pending} allStores={all} />
    </div>
  )
}
