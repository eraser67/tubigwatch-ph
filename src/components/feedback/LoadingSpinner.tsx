/**
 * Reusable loading skeleton.
 * Use as a Suspense fallback or within loading.tsx files.
 */

interface LoadingSpinnerProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

export function LoadingSpinner({ message = 'Loading…', size = 'md' }: LoadingSpinnerProps) {
  const dim = size === 'sm' ? 20 : size === 'lg' ? 48 : 32

  return (
    <div
      role="status"
      aria-label={message}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        padding: '2rem',
        color: 'var(--muted)',
      }}
    >
      <svg
        width={dim}
        height={dim}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        style={{ animation: 'spin 1s linear infinite' }}
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="var(--border)"
          strokeWidth="3"
        />
        <path
          d="M12 2a10 10 0 0 1 10 10"
          stroke="var(--color-brand-500)"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <p style={{ fontSize: '0.9rem', margin: 0 }}>{message}</p>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

/** Full-page loading state — used in loading.tsx route files. */
export function PageLoading({ message }: { message?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
      }}
    >
      <LoadingSpinner size="lg" message={message} />
    </div>
  )
}
