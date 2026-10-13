'use client'

import Link from 'next/link'
import type { StoreMapDTO } from '@/lib/dal/stores'

interface StoreListViewProps {
  stores: StoreMapDTO[]
  selectedStore: StoreMapDTO | null
  userLocation: [number, number] | null
  onSelectStore: (store: StoreMapDTO) => void
  onSwitchToMap?: () => void
}

/** Calculates approximate distance in km using the Haversine formula */
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function StoreListView({
  stores,
  selectedStore,
  userLocation,
  onSelectStore,
  onSwitchToMap,
}: StoreListViewProps) {
  if (stores.length === 0) {
    return (
      <div
        role="status"
        style={{
          padding: '3rem 1.5rem',
          textAlign: 'center',
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
        }}
      >
        <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem' }} aria-hidden="true">
          🔍
        </span>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--foreground)', marginBottom: '0.5rem' }}>
          No stores match your search
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--muted)', maxWidth: '340px', margin: '0 auto' }}>
          Try clearing search filters or zooming out to see water supply stores in nearby barangays.
        </p>
      </div>
    )
  }

  // Sort by distance if user location is known, otherwise alphabetically
  const sortedStores = [...stores].sort((a, b) => {
    if (userLocation) {
      const distA = getDistanceKm(userLocation[0], userLocation[1], a.latitude, a.longitude)
      const distB = getDistanceKm(userLocation[0], userLocation[1], b.latitude, b.longitude)
      return distA - distB
    }
    return a.name.localeCompare(b.name)
  })

  return (
    <div
      role="list"
      aria-label="Stores list"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.875rem',
        overflowY: 'auto',
      }}
    >
      {sortedStores.map((store) => {
        const isSelected = selectedStore?.id === store.id
        const isVerified =
          store.verification_status === 'store_confirmed' || store.verification_status === 'admin_verified'
        const distance = userLocation
          ? getDistanceKm(userLocation[0], userLocation[1], store.latitude, store.longitude)
          : null

        // Find lowest price among listings
        const prices = store.listings
          .map((l) => l.current_price_php)
          .filter((p): p is number => p != null && p > 0)
        const lowestPrice = prices.length > 0 ? Math.min(...prices) : null

        return (
          <article
            key={store.id}
            role="listitem"
            style={{
              backgroundColor: isSelected ? 'var(--color-brand-50)' : 'var(--surface)',
              borderRadius: 'var(--radius-lg)',
              border: isSelected ? '2px solid var(--color-brand-600)' : '1px solid var(--border)',
              padding: '1.125rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              transition: 'border-color 0.15s, box-shadow 0.15s',
              boxShadow: isSelected ? '0 4px 12px rgba(37, 99, 235, 0.12)' : 'none',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
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
                    }}
                  >
                    {isVerified ? '✓ Verified' : 'Community'}
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

                  {distance !== null && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-brand-700)', fontWeight: 600 }}>
                      📍 {distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`}
                    </span>
                  )}
                </div>

                <h3
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    color: 'var(--foreground)',
                    margin: 0,
                  }}
                >
                  {store.name}
                </h3>
              </div>

              {lowestPrice !== null && (
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--muted)', display: 'block' }}>From</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-brand-600)' }}>
                    ₱{lowestPrice.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Address */}
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span aria-hidden="true">📍</span>
              <span>
                {[store.barangay, store.municipality].filter(Boolean).join(', ')}
              </span>
            </div>

            {/* Product categories preview */}
            {store.listings.length > 0 && (
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {store.listings.slice(0, 3).map((l) => (
                  <span
                    key={l.id}
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--surface-elevated)',
                      border: '1px solid var(--border)',
                      color: 'var(--foreground)',
                    }}
                  >
                    {l.product?.name ?? 'Item'}
                    {l.current_price_php ? ` — ₱${l.current_price_php}` : ''}
                  </span>
                ))}
                {store.listings.length > 3 && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)', alignSelf: 'center' }}>
                    +{store.listings.length - 3} more
                  </span>
                )}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
              <button
                type="button"
                onClick={() => {
                  onSelectStore(store)
                  onSwitchToMap?.()
                }}
                style={{
                  flex: 1,
                  backgroundColor: 'var(--surface-elevated)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)',
                  padding: '0.45rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                  transition: 'background-color 0.15s',
                }}
              >
                <span>🗺️</span>
                <span>View on Map</span>
              </button>

              <Link
                href={`/stores/${store.id}`}
                style={{
                  flex: 1,
                  backgroundColor: 'var(--color-brand-600)',
                  color: '#ffffff',
                  padding: '0.45rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.15s',
                }}
              >
                Details & Prices →
              </Link>
            </div>
          </article>
        )
      })}
    </div>
  )
}
