/**
 * Error state component.
 * Use inside error.tsx boundary files or inline for partial errors.
 */

interface ErrorStateProps {
  title?: string
  message?: string
  /** Show a retry button if reset is provided (Next.js error boundary pattern). */
  reset?: () => void
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  reset,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        padding: '3rem 1.5rem',
        textAlign: 'center',
        color: 'var(--foreground)',
        maxWidth: '480px',
        margin: '0 auto',
      }}
    >
      <span style={{ fontSize: '2.5rem' }} aria-hidden="true">⚠️</span>
      <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1.25rem' }}>{title}</h2>
      <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.6 }}>{message}</p>
      {reset && (
        <button
          id="error-retry-btn"
          onClick={reset}
          style={{
            marginTop: '0.5rem',
            padding: '0.5rem 1.25rem',
            backgroundColor: 'var(--color-brand-600)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      )}
    </div>
  )
}

/** Full-page error — use in app/error.tsx */
export function PageError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <ErrorState
        title="Something went wrong"
        message={
          process.env.NODE_ENV === 'development'
            ? error.message
            : 'An unexpected error occurred. Please reload or try again.'
        }
        reset={reset}
      />
    </div>
  )
}
