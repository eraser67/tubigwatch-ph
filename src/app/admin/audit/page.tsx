import type { Metadata } from 'next'
import { requireModerator } from '@/lib/dal/auth'
import { getModerationAuditLog } from '@/lib/dal/moderation'

export const metadata: Metadata = { title: 'Moderation Audit Log — Admin' }

const ACTION_COLORS: Record<string, { bg: string; text: string }> = {
  approve: { bg: 'rgba(22, 163, 74, 0.1)', text: 'var(--color-success)' },
  reject: { bg: 'rgba(239, 68, 68, 0.1)', text: 'var(--color-danger)' },
  suspend: { bg: 'rgba(245, 158, 11, 0.12)', text: 'var(--color-warning)' },
  merge: { bg: 'rgba(37, 99, 235, 0.1)', text: 'var(--color-brand-600)' },
  verify_ownership: { bg: 'rgba(147, 51, 234, 0.1)', text: '#9333ea' },
  edit: { bg: 'rgba(100, 116, 139, 0.1)', text: 'var(--muted)' },
}

export default async function AuditLogPage() {
  await requireModerator()
  const logs = await getModerationAuditLog()

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>
          Moderation Audit Log 📜
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', margin: 0 }}>
          Immutable record of all moderation decisions, status changes, store merges, and verification events.
        </p>
      </div>

      {logs.length === 0 ? (
        <div
          style={{
            padding: '3rem 1.5rem',
            textAlign: 'center',
            backgroundColor: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            color: 'var(--muted)',
          }}
        >
          No moderation events logged yet.
        </div>
      ) : (
        <div
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--surface-elevated)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--muted)' }}>Timestamp</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--muted)' }}>Action</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--muted)' }}>Target</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--muted)' }}>Transition</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--muted)' }}>Reason / Notes</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--muted)' }}>Actor</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const style = ACTION_COLORS[log.action] ?? { bg: 'rgba(100, 116, 139, 0.1)', text: 'var(--muted)' }

                  return (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                        {new Date(log.created_at).toLocaleString('en-PH')}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '9999px',
                            backgroundColor: style.bg,
                            color: style.text,
                            textTransform: 'uppercase',
                          }}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: 600 }}>{log.target_table}</span>
                        <br />
                        <code style={{ fontSize: '0.725rem', color: 'var(--muted)' }}>
                          {log.target_id.slice(0, 8)}...
                        </code>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                        {log.previous_status ? (
                          <span>
                            <code>{log.previous_status}</code> → <code>{log.new_status}</code>
                          </span>
                        ) : (
                          <code>{log.new_status ?? '—'}</code>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', maxWidth: '280px' }}>
                        {log.reason ?? '—'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-brand-600)' }}>
                          {log.actor?.role ?? 'admin'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
