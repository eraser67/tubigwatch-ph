'use client'

import { useState, useTransition } from 'react'
import type { StoreDTO } from '@/lib/dal/stores'
import { approveStoreAction, rejectStoreAction, suspendStoreAction } from '@/app/actions/stores'
import { updateStoreVerificationAction } from '@/app/actions/moderation'

interface StoreAdminClientProps {
  pendingStores: StoreDTO[]
  allStores: StoreDTO[]
}

export function StoreAdminClient({ pendingStores, allStores }: StoreAdminClientProps) {
  const [pending, setPending] = useState(pendingStores)
  const [stores, setStores] = useState(allStores)
  const [filterQuery, setFilterQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected' | 'suspended'>('all')
  const [feedback, setFeedback] = useState<{ id: string; type: 'success' | 'error'; message: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleApprove = (storeId: string) => {
    setFeedback(null)
    startTransition(async () => {
      const res = await approveStoreAction(storeId)
      if (res.success) {
        setFeedback({ id: storeId, type: 'success', message: 'Store approved successfully.' })
        setPending((prev) => prev.filter((s) => s.id !== storeId))
        setStores((prev) =>
          prev.map((s) => (s.id === storeId ? { ...s, listing_status: 'approved' as const } : s)),
        )
      } else {
        setFeedback({ id: storeId, type: 'error', message: res.error || 'Failed to approve store.' })
      }
    })
  }

  const handleReject = (storeId: string) => {
    const reason = prompt('Please specify a rejection reason (e.g. Incomplete details, invalid location):')
    if (reason === null) return // cancelled
    setFeedback(null)
    startTransition(async () => {
      const res = await rejectStoreAction(storeId, reason)
      if (res.success) {
        setFeedback({ id: storeId, type: 'success', message: 'Store marked as rejected.' })
        setPending((prev) => prev.filter((s) => s.id !== storeId))
        setStores((prev) =>
          prev.map((s) => (s.id === storeId ? { ...s, listing_status: 'rejected' as const } : s)),
        )
      } else {
        setFeedback({ id: storeId, type: 'error', message: res.error || 'Failed to reject store.' })
      }
    })
  }

  const handleSuspend = (storeId: string) => {
    const reason = prompt('Specify suspension reason (e.g. Multiple reports of fraudulent price, closed business):')
    if (reason === null) return
    setFeedback(null)
    startTransition(async () => {
      const res = await suspendStoreAction(storeId, reason)
      if (res.success) {
        setFeedback({ id: storeId, type: 'success', message: 'Store suspended.' })
        setStores((prev) =>
          prev.map((s) => (s.id === storeId ? { ...s, listing_status: 'suspended' as const } : s)),
        )
      } else {
        setFeedback({ id: storeId, type: 'error', message: res.error || 'Failed to suspend store.' })
      }
    })
  }

  const handleVerificationChange = (
    storeId: string,
    newStatus: 'unverified' | 'store_confirmed' | 'admin_verified',
  ) => {
    setFeedback(null)
    startTransition(async () => {
      const res = await updateStoreVerificationAction(storeId, newStatus)
      if (res.success) {
        setFeedback({ id: storeId, type: 'success', message: `Verification set to ${newStatus}.` })
        setStores((prev) =>
          prev.map((s) => (s.id === storeId ? { ...s, verification_status: newStatus } : s)),
        )
      } else {
        setFeedback({ id: storeId, type: 'error', message: res.error || 'Failed to update verification.' })
      }
    })
  }

  const filteredStores = stores.filter((s) => {
    if (statusFilter !== 'all' && s.listing_status !== statusFilter) return false
    if (!filterQuery) return true
    const q = filterQuery.toLowerCase()
    return (
      s.name.toLowerCase().includes(q) ||
      (s.municipality && s.municipality.toLowerCase().includes(q)) ||
      (s.barangay && s.barangay.toLowerCase().includes(q))
    )
  })

  return (
    <div>
      {/* Pending review queue */}
      <section aria-labelledby="pending-heading" style={{ marginBottom: '2.5rem' }}>
        <h2
          id="pending-heading"
          style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--foreground)' }}
        >
          Pending Store Review Queue ({pending.length})
        </h2>

        {pending.length === 0 ? (
          <div
            style={{
              padding: '1.5rem',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--muted)',
              fontSize: '0.9rem',
              textAlign: 'center',
            }}
          >
            ✅ All caught up! No store submissions waiting for approval.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {pending.map((store) => (
              <div
                key={store.id}
                style={{
                  padding: '1.15rem 1.25rem',
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
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <p style={{ fontWeight: 700, margin: 0, fontSize: '1rem' }}>{store.name}</p>
                    <span
                      style={{
                        padding: '0.15rem 0.5rem',
                        fontSize: '0.75rem',
                        borderRadius: '999px',
                        backgroundColor: '#fef3c7',
                        color: '#b45309',
                        fontWeight: 600,
                      }}
                    >
                      Awaiting Review
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)' }}>
                    {[store.address_line, store.barangay, store.municipality, store.province]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                  <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: 'var(--muted)' }}>
                    📍 Lat: {store.latitude.toFixed(5)}, Lng: {store.longitude.toFixed(5)} · Submitted{' '}
                    {new Date(store.created_at).toLocaleDateString()}
                    {store.contact_number && ` · 📞 ${store.contact_number}`}
                  </p>

                  {feedback && feedback.id === store.id && (
                    <div
                      style={{
                        marginTop: '0.5rem',
                        fontSize: '0.825rem',
                        color: feedback.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
                        fontWeight: 600,
                      }}
                    >
                      {feedback.type === 'error' ? '⚠️ ' : '✅ '}
                      {feedback.message}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, alignItems: 'center' }}>
                  <a
                    href={`/stores/${store.id}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: '0.45rem 0.75rem',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.8rem',
                      textDecoration: 'none',
                      color: 'var(--foreground)',
                      fontWeight: 500,
                    }}
                  >
                    Preview ↗
                  </a>
                  <button
                    id={`approve-store-${store.id}`}
                    type="button"
                    disabled={isPending}
                    onClick={() => handleApprove(store.id)}
                    style={{
                      padding: '0.45rem 0.95rem',
                      backgroundColor: 'var(--color-success)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: 600,
                      fontSize: '0.825rem',
                      cursor: isPending ? 'wait' : 'pointer',
                      opacity: isPending ? 0.7 : 1,
                    }}
                  >
                    Approve
                  </button>
                  <button
                    id={`reject-store-${store.id}`}
                    type="button"
                    disabled={isPending}
                    onClick={() => handleReject(store.id)}
                    style={{
                      padding: '0.45rem 0.85rem',
                      backgroundColor: 'transparent',
                      color: 'var(--color-danger)',
                      border: '1px solid var(--color-danger)',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: 600,
                      fontSize: '0.825rem',
                      cursor: isPending ? 'wait' : 'pointer',
                    }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* All stores directory table with moderation tools */}
      <section aria-labelledby="all-stores-heading">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <h2
            id="all-stores-heading"
            style={{ fontWeight: 600, fontSize: '1.1rem', margin: 0, color: 'var(--foreground)' }}
          >
            All Stores Catalog ({filteredStores.length})
          </h2>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="search"
              placeholder="Filter by name or town..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              style={{
                padding: '0.4rem 0.75rem',
                fontSize: '0.85rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--surface)',
                color: 'var(--foreground)',
              }}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              style={{
                padding: '0.4rem 0.75rem',
                fontSize: '0.85rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--surface)',
                color: 'var(--foreground)',
              }}
            >
              <option value="all">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        <div
          style={{
            overflowX: 'auto',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--surface)',
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.85rem',
            }}
          >
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', backgroundColor: 'var(--surface-elevated)' }}>
                {['Store Name & Location', 'Listing Status', 'Verification Tier', 'Created', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '0.65rem 0.85rem', fontWeight: 600, color: 'var(--muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredStores.map((store) => (
                <tr key={store.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.65rem 0.85rem' }}>
                    <a
                      href={`/stores/${store.id}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontWeight: 600, color: 'var(--color-brand-600)', textDecoration: 'none' }}
                    >
                      {store.name} ↗
                    </a>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                      {[store.barangay, store.municipality].filter(Boolean).join(', ')}
                    </div>
                  </td>
                  <td style={{ padding: '0.65rem 0.85rem' }}>
                    <StatusBadge status={store.listing_status} />
                  </td>
                  <td style={{ padding: '0.65rem 0.85rem' }}>
                    <select
                      value={store.verification_status}
                      disabled={isPending}
                      onChange={(e) =>
                        handleVerificationChange(
                          store.id,
                          e.target.value as 'unverified' | 'store_confirmed' | 'admin_verified',
                        )
                      }
                      style={{
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.785rem',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor:
                          store.verification_status === 'admin_verified'
                            ? '#dcfce7'
                            : store.verification_status === 'store_confirmed'
                              ? '#e0e7ff'
                              : 'transparent',
                        fontWeight: 600,
                        color:
                          store.verification_status === 'admin_verified'
                            ? '#166534'
                            : store.verification_status === 'store_confirmed'
                              ? '#3730a3'
                              : 'var(--foreground)',
                      }}
                    >
                      <option value="unverified">⚪ unverified</option>
                      <option value="store_confirmed">🔵 store_confirmed</option>
                      <option value="admin_verified">🟢 admin_verified</option>
                    </select>
                  </td>
                  <td style={{ padding: '0.65rem 0.85rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                    {new Date(store.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '0.65rem 0.85rem', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      {store.listing_status !== 'approved' && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleApprove(store.id)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            backgroundColor: 'var(--color-success)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                          }}
                        >
                          Approve
                        </button>
                      )}
                      {store.listing_status === 'approved' && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleSuspend(store.id)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            backgroundColor: 'transparent',
                            color: '#eab308',
                            border: '1px solid #eab308',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                          }}
                        >
                          Suspend
                        </button>
                      )}
                      {store.listing_status !== 'rejected' && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleReject(store.id)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            backgroundColor: 'transparent',
                            color: 'var(--color-danger)',
                            border: '1px solid var(--color-danger)',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                          }}
                        >
                          Reject
                        </button>
                      )}
                    </div>
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
  const badgeMap: Record<string, { bg: string; text: string; label: string }> = {
    approved: { bg: '#dcfce7', text: '#166534', label: 'Approved' },
    pending: { bg: '#fef3c7', text: '#b45309', label: 'Pending' },
    rejected: { bg: '#fee2e2', text: '#991b1b', label: 'Rejected' },
    suspended: { bg: '#f1f5f9', text: '#475569', label: 'Suspended' },
  }
  const badge = badgeMap[status] ?? { bg: '#f1f5f9', text: '#475569', label: status }
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.15rem 0.5rem',
        borderRadius: '999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        backgroundColor: badge.bg,
        color: badge.text,
      }}
    >
      {badge.label}
    </span>
  )
}
