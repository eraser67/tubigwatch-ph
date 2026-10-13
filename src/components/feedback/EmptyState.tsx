/**
 * Empty state component — shown when a query returns no results.
 */

interface EmptyStateProps {
  icon?: string
  title: string
  message?: string
  action?: React.ReactNode
}

export function EmptyState({ icon = '🔍', title, message, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        padding: '3rem 1.5rem',
        textAlign: 'center',
        color: 'var(--foreground)',
        maxWidth: '480px',
        margin: '0 auto',
      }}
    >
      <span style={{ fontSize: '2.5rem' }} aria-hidden="true">{icon}</span>
      <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1.125rem' }}>{title}</h2>
      {message && (
        <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.6 }}>{message}</p>
      )}
      {action && <div style={{ marginTop: '0.5rem' }}>{action}</div>}
    </div>
  )
}
