import type { Metadata } from 'next'
import { requireModerator } from '@/lib/dal/auth'
import { getPendingPriceReports } from '@/lib/dal/products'
import { approvePriceReportAction, rejectPriceReportAction } from '@/app/actions/prices'
import { EmptyState } from '@/components/feedback/EmptyState'

export const metadata: Metadata = { title: 'Price Report Queue — Admin' }

export default async function AdminReportsPage() {
  await requireModerator()
  const pendingReports = await getPendingPriceReports().catch(() => [])

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 id="admin-reports-heading" style={{ fontWeight: 800, fontSize: '1.5rem', margin: '0 0 0.35rem 0' }}>
          Price Report Moderation Queue
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: 0 }}>
          Review community-reported price updates. Approving a report updates the active listing price and records an immutable entry in price history.
        </p>
      </div>

      {pendingReports.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No pending price reports"
          message="All community price submissions have been reviewed and accepted."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {pendingReports.map((report) => {
            const currentPrice = report.listing?.current_price_php
            const diff = currentPrice != null ? report.reported_price_php - currentPrice : null

            return (
              <div
                key={report.id}
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1.25rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0.125rem 0.5rem',
                        borderRadius: '9999px',
                        backgroundColor: 'rgba(217, 119, 6, 0.1)',
                        color: 'var(--color-warning)',
                        textTransform: 'uppercase',
                      }}
                    >
                      Pending Review
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                      Submitted: {new Date(report.created_at).toLocaleDateString('en-PH')}
                    </span>
                  </div>

                  <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>
                    {report.listing?.product?.name ?? 'Unknown Product'}
                  </h2>

                  <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: '0 0 0.5rem 0' }}>
                    🏪 {report.listing?.store?.name} ({report.listing?.store?.municipality})
                  </p>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginTop: '0.5rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block' }}>Current Price</span>
                      <span style={{ fontSize: '1rem', color: 'var(--muted)' }}>
                        {currentPrice != null ? `₱${currentPrice.toFixed(2)}` : 'None'}
                      </span>
                    </div>

                    <span style={{ fontSize: '1.25rem', color: 'var(--muted)' }}>→</span>

                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block' }}>Reported Price</span>
                      <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-brand-600)' }}>
                        ₱{report.reported_price_php.toFixed(2)}
                      </span>
                    </div>

                    {diff !== null && (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.125rem 0.4rem',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: diff > 0 ? 'rgba(220, 38, 38, 0.1)' : 'rgba(22, 163, 74, 0.1)',
                          color: diff > 0 ? 'var(--color-danger)' : 'var(--color-success)',
                        }}
                      >
                        {diff > 0 ? `+₱${diff.toFixed(2)}` : `-₱${Math.abs(diff).toFixed(2)}`}
                      </span>
                    )}

                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block' }}>Reported Stock</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'capitalize' }}>
                        {report.stock_status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <form
                    action={async () => {
                      'use server'
                      await approvePriceReportAction(report.id)
                    }}
                  >
                    <button
                      type="submit"
                      style={{
                        backgroundColor: 'var(--color-success)',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Approve Price ✓
                    </button>
                  </form>

                  <form
                    action={async () => {
                      'use server'
                      await rejectPriceReportAction(report.id)
                    }}
                  >
                    <button
                      type="submit"
                      style={{
                        backgroundColor: 'var(--surface-elevated)',
                        color: 'var(--color-danger)',
                        border: '1px solid var(--border)',
                        padding: '0.5rem 0.85rem',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Reject ×
                    </button>
                  </form>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
