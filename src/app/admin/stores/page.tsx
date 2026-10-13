import type { Metadata } from 'next'
import { getPendingStores, getAllStoresAdmin } from '@/lib/dal/stores'
import { requireModerator } from '@/lib/dal/auth'
import { approveStoreAction, rejectStoreAction } from '@/app/actions/stores'

export const metadata: Metadata = { title: 'Store Management' }

export default async function AdminStoresPage() {
  await requireModerator()

  const [pending, all] = await Promise.all([getPendingStores(), getAllStoresAdmin()])

  return (
    <div>
      <h1 id="admin-stores-heading" style={{ fontWeight: 700, fontSize: '1.375rem', marginBottom: '1.5rem' }}>
        Store Management
      </h1>

      {/* Pending review queue */}
      <section aria-labelledby="pending-heading" style={{ marginBottom: '2.5rem' }}>
        <h2
          id="pending-heading"
          style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '1rem', color: 'var(--muted)' }}
        >
          Pending Review ({pending.length})
        </h2>

        {pending.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>No stores awaiting review.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {pending.map((store) => (
              <div
                key={store.id}
                style={{
                  padding: '1rem 1.25rem',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--surface)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <p style={{ fontWeight: 600, margin: '0 0 0.25rem' }}>{store.name}</p>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)' }}>
                    {[store.address_line, store.barangay, store.municipality]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--muted)' }}>
                    {store.latitude.toFixed(5)}, {store.longitude.toFixed(5)} ·{' '}
                    {new Date(store.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                <form action={async () => { await approveStoreAction(store.id) }}>
                    <button
                      id={`approve-store-${store.id}`}
                      type="submit"
                      style={{
                        padding: '0.35rem 0.875rem',
                        backgroundColor: 'var(--color-success)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                      }}
                    >
                      Approve
                    </button>
                  </form>
                  <form action={async () => { await rejectStoreAction(store.id) }}>
                    <button
                      id={`reject-store-${store.id}`}
                      type="submit"
                      style={{
                        padding: '0.35rem 0.875rem',
                        backgroundColor: 'transparent',
                        color: 'var(--color-danger)',
                        border: '1px solid var(--color-danger)',
                        borderRadius: 'var(--radius-md)',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                      }}
                    >
                      Reject
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* All stores table */}
      <section aria-labelledby="all-stores-heading">
        <h2
          id="all-stores-heading"
          style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '1rem', color: 'var(--muted)' }}
        >
          All Stores ({all.length})
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.85rem',
            }}
          >
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                {['Name', 'Municipality', 'Status', 'Verification', 'Submitted'].map((h) => (
                  <th key={h} style={{ padding: '0.5rem 0.75rem', fontWeight: 600, color: 'var(--muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {all.map((store) => (
                <tr key={store.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.5rem 0.75rem', fontWeight: 500 }}>{store.name}</td>
                  <td style={{ padding: '0.5rem 0.75rem', color: 'var(--muted)' }}>{store.municipality}</td>
                  <td style={{ padding: '0.5rem 0.75rem' }}>
                    <StatusBadge status={store.listing_status} />
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', color: 'var(--muted)' }}>
                    {store.verification_status}
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', color: 'var(--muted)' }}>
                    {new Date(store.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    approved: 'var(--color-success)',
    pending: 'var(--color-warning)',
    rejected: 'var(--color-danger)',
    suspended: 'var(--muted)',
  }
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.15rem 0.5rem',
        borderRadius: '999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        color: colors[status] ?? 'var(--muted)',
        border: `1px solid ${colors[status] ?? 'var(--border)'}`,
      }}
    >
      {status}
    </span>
  )
}
