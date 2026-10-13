'use client'

import type { PriceHistoryDTO } from '@/lib/dal/products'

interface PriceHistoryModalProps {
  productName: string
  history: PriceHistoryDTO[]
  isOpen: boolean
  onClose: () => void
}

export function PriceHistoryModal({
  productName,
  history,
  isOpen,
  onClose,
}: PriceHistoryModalProps) {
  if (!isOpen) return null

  const formatSource = (source: string) => {
    switch (source) {
      case 'store_confirmed':
        return { label: 'Store Confirmed', bg: 'rgba(22, 163, 74, 0.1)', color: 'var(--color-success)' }
      case 'admin_verified':
        return { label: 'Admin Verified', bg: 'rgba(37, 99, 235, 0.1)', color: 'var(--color-brand-600)' }
      default:
        return { label: 'Community Reported', bg: 'rgba(100, 116, 139, 0.1)', color: 'var(--muted)' }
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
          maxWidth: '520px',
          width: '100%',
          padding: '1.75rem',
          position: 'relative',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeIn 0.15s ease-out',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-brand-600)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Historical Record (Immutable)
            </span>
            <h2 id="history-modal-title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0.2rem 0 0 0' }}>
              Price History — {productName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              color: 'var(--muted)',
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.25rem' }}>
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>📜</span>
              No accepted price changes recorded yet. Current price was set at initial listing creation.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {history.map((item, idx) => {
                const date = new Date(item.effective_at)
                const formattedDate = date.toLocaleDateString('en-PH', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
                const badge = formatSource(item.source)

                return (
                  <div
                    key={item.id}
                    style={{
                      backgroundColor: 'var(--surface-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.875rem 1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.75rem',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-brand-600)' }}>
                          ₱{item.accepted_price_php.toFixed(2)}
                        </span>
                        {idx === 0 && (
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-success)', textTransform: 'uppercase' }}>
                            (Current)
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                        Effective: {formattedDate}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          padding: '0.125rem 0.45rem',
                          borderRadius: '9999px',
                          backgroundColor: badge.bg,
                          color: badge.color,
                        }}
                      >
                        {badge.label}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'capitalize' }}>
                        Stock: {item.stock_status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: 'var(--surface-elevated)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
              padding: '0.5rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
