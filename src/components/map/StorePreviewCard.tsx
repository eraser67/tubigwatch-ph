'use client'

import Link from 'next/link'
import type { StoreMapDTO } from '@/lib/dal/stores'

interface StorePreviewCardProps {
  store: StoreMapDTO
  onClose: () => void
  onRecenterStore?: (lat: number, lng: number) => void
}

export function StorePreviewCard({ store, onClose }: StorePreviewCardProps) {
  const isVerified = store.verification_status === 'store_confirmed' || store.verification_status === 'admin_verified'
  const hasProducts = store.listings && store.listings.length > 0

  return (
    <article
      aria-labelledby="store-preview-title"
      style={{
        backgroundColor: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        border: '1px solid var(--border)',
        padding: '1.25rem',
        maxWidth: '380px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.875rem',
        position: 'relative',
        animation: 'slideUp 0.2s ease-out',
      }}
    >
      {/* Header with Title and Close Button */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.125rem 0.5rem',
                borderRadius: '9999px',
                backgroundColor: isVerified ? 'rgba(22, 163, 74, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                color: isVerified ? 'var(--color-success)' : 'var(--muted)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              {isVerified ? '✓ Verified Store' : 'Community Reported'}
            </span>

            {store.delivers && (
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '0.125rem 0.5rem',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(37, 99, 235, 0.1)',
                  color: 'var(--color-brand-600)',
                }}
              >
                🚚 Delivers
              </span>
            )}
          </div>

          <h2
            id="store-preview-title"
            style={{
              fontSize: '1.125rem',
              fontWeight: 700,
              color: 'var(--foreground)',
              lineHeight: 1.3,
              margin: 0,
            }}
          >
            {store.name}
          </h2>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close store preview"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--muted)',
            cursor: 'pointer',
            padding: '0.25rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '1.25rem',
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ×
        </button>
      </div>

      {/* Address & Contact info */}
      <div style={{ fontSize: '0.85rem', color: 'var(--muted)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
          <span aria-hidden="true">📍</span>
          <span>
            {[store.address_line, store.barangay, store.municipality, store.province].filter(Boolean).join(', ')}
          </span>
        </div>

        {store.opening_hours && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span aria-hidden="true">🕒</span>
            <span>{store.opening_hours}</span>
          </div>
        )}

        {store.contact_number && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span aria-hidden="true">📞</span>
            <a
              href={`tel:${store.contact_number}`}
              style={{ color: 'var(--color-brand-600)', textDecoration: 'none', fontWeight: 500 }}
            >
              {store.contact_number}
            </a>
          </div>
        )}
      </div>

      {/* Product Highlights */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
          Available Products ({store.listings.length})
        </div>

        {hasProducts ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '140px', overflowY: 'auto' }}>
            {store.listings.slice(0, 3).map((listing) => (
              <div
                key={listing.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.85rem',
                  padding: '0.35rem 0.5rem',
                  backgroundColor: 'var(--surface-elevated)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '0.5rem' }}>
                  <span style={{ fontWeight: 500, color: 'var(--foreground)' }}>
                    {listing.product?.name ?? 'Water Product'}
                  </span>
                  {listing.product?.capacity_liters && (
                    <span style={{ color: 'var(--muted)', fontSize: '0.75rem', marginLeft: '0.25rem' }}>
                      ({listing.product.capacity_liters}L)
                    </span>
                  )}
                </div>
                <div style={{ fontWeight: 700, color: 'var(--color-brand-600)', whiteSpace: 'nowrap' }}>
                  {listing.current_price_php != null ? `₱${listing.current_price_php.toFixed(2)}` : 'Inquire'}
                </div>
              </div>
            ))}
            {store.listings.length > 3 && (
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)', margin: '0.2rem 0 0 0', textAlign: 'center' }}>
                +{store.listings.length - 3} more products
              </p>
            )}
          </div>
        ) : (
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: 0, fontStyle: 'italic' }}>
            No listed products yet. Be the first to report prices!
          </p>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
        <Link
          href={`/stores/${store.id}`}
          style={{
            flex: 1,
            backgroundColor: 'var(--color-brand-600)',
            color: '#ffffff',
            textAlign: 'center',
            padding: '0.5rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            fontSize: '0.875rem',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.15s ease',
          }}
        >
          View Store & Prices
        </Link>

        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Open directions in Google Maps"
          style={{
            backgroundColor: 'var(--surface-elevated)',
            color: 'var(--foreground)',
            border: '1px solid var(--border)',
            padding: '0.5rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            fontSize: '0.875rem',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.25rem',
          }}
        >
          Directions ↗
        </a>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </article>
  )
}
