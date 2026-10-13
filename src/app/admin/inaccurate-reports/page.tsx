import type { Metadata } from 'next'
import Link from 'next/link'
import { requireModerator } from '@/lib/dal/auth'
import { getContentReports } from '@/lib/dal/moderation'
import { resolveContentReportAction } from '@/app/actions/moderation'

export const metadata: Metadata = { title: 'Inaccurate Listing Reports — Admin' }

export default async function InaccurateReportsPage() {
  await requireModerator()
  const reports = await getContentReports()

  const openReports = reports.filter((r) => r.status === 'open')
  const resolvedReports = reports.filter((r) => r.status !== 'open')

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>
          Inaccurate Listing Reports 🚩
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', margin: 0 }}>
          Community reports of incorrect prices, bad locations, closed stores, or spam.
        </p>
      </div>

      {/* Open Reports */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--foreground)' }}>
          Open Reports ({openReports.length})
        </h2>

        {openReports.length === 0 ? (
          <div
            style={{
              padding: '2.5rem 1rem',
              textAlign: 'center',
              backgroundColor: 'var(--surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              color: 'var(--muted)',
              fontSize: '0.9rem',
            }}
          >
            ✅ No open inaccuracy reports. All listings are clear!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {openReports.map((report) => (
              <div
                key={report.id}
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '9999px',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: 'var(--color-danger)',
                        marginRight: '0.5rem',
                      }}
                    >
                      {report.reason.replace('_', ' ')}
                    </span>

                    <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                      Reported on {new Date(report.created_at).toLocaleString()}
                    </span>

                    {report.store ? (
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0.4rem 0 0.1rem' }}>
                        Store: <Link href={`/stores/${report.store.id}`} style={{ color: 'var(--color-brand-600)' }}>
                          {report.store.name}
                        </Link>{' '}
                        <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--muted)' }}>
                          ({report.store.municipality})
                        </span>
                      </h3>
                    ) : (
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0.4rem 0 0.1rem' }}>
                        Target ID: <code>{report.target_id}</code> ({report.target_table})
                      </h3>
                    )}
                  </div>
                </div>

                {report.details && (
                  <div
                    style={{
                      backgroundColor: 'var(--surface-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.75rem',
                      fontSize: '0.875rem',
                    }}
                  >
                    <strong>Reporter Notes:</strong> &ldquo;{report.details}&rdquo;
                  </div>
                )}

                {/* Resolution Action Forms */}
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                  <form
                    action={async () => {
                      'use server'
                      await resolveContentReportAction(report.id, 'resolved', 'Issue reviewed and fixed by moderator')
                    }}
                  >
                    <button
                      type="submit"
                      style={{
                        backgroundColor: 'var(--color-success)',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.4rem 0.85rem',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      ✓ Mark Resolved
                    </button>
                  </form>

                  <form
                    action={async () => {
                      'use server'
                      await resolveContentReportAction(report.id, 'dismissed', 'Dismissed by moderator as not an issue')
                    }}
                  >
                    <button
                      type="submit"
                      style={{
                        backgroundColor: 'transparent',
                        color: 'var(--muted)',
                        border: '1px solid var(--border)',
                        padding: '0.4rem 0.85rem',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      Dismiss (Invalid)
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Resolved Reports History */}
      <section>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--muted)' }}>
          Resolved History ({resolvedReports.length})
        </h2>

        {resolvedReports.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No historical reports.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {resolvedReports.slice(0, 15).map((r) => (
              <div
                key={r.id}
                style={{
                  backgroundColor: 'var(--surface-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.85rem',
                }}
              >
                <div>
                  <span style={{ fontWeight: 600 }}>{r.store?.name ?? r.target_id}</span> ·{' '}
                  <span style={{ color: 'var(--muted)' }}>{r.reason}</span>
                  {r.resolution_note && (
                    <span style={{ color: 'var(--muted)', marginLeft: '0.5rem' }}>
                      — Note: {r.resolution_note}
                    </span>
                  )}
                </div>

                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '9999px',
                    backgroundColor: r.status === 'resolved' ? 'rgba(22, 163, 74, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                    color: r.status === 'resolved' ? 'var(--color-success)' : 'var(--muted)',
                  }}
                >
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
