export function MapSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading interactive map"
      style={{
        width: '100%',
        height: '100%',
        minHeight: '600px',
        backgroundColor: 'var(--muted-background)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        borderRadius: 'var(--radius-lg)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          border: '3px solid var(--border)',
          borderTopColor: 'var(--color-brand-600)',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontWeight: 600, color: 'var(--foreground)' }}>Loading interactive map...</p>
        <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Fetching water supply stores in your area</p>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
