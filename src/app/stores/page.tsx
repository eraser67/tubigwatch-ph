import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { getApprovedStoresForMap } from '@/lib/dal/stores'

export const metadata: Metadata = {
  title: 'Hardware & Water Supply Stores — TubigWatch PH',
  description:
    'Directory of verified and community-reported hardware stores selling water storage containers, buckets, drums, and tanks.',
}

async function StoresList() {
  const stores = await getApprovedStoresForMap()

  if (stores.length === 0) {
    return (
      <div
        style={{
          padding: '3rem',
          textAlign: 'center',
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
        }}
      >
        <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem' }} aria-hidden="true">
          🏪
        </span>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          No approved stores found yet
        </h2>
        <p style={{ color: 'var(--muted)', maxWidth: '400px', margin: '0 auto 1.5rem auto' }}>
          Know a hardware store selling drums or containers in your area? Help the community by contributing!
        </p>
        <Link
          href="/contribute"
          style={{
            display: 'inline-block',
            backgroundColor: 'var(--color-brand-600)',
            color: '#ffffff',
            padding: '0.6rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Add a Store
        </Link>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1.25rem' }}>
      {stores.map((store) => {
        const isVerified =
          store.verification_status === 'store_confirmed' || store.verification_status === 'admin_verified'
        const prices = store.listings
          .map((l) => l.current_price_php)
          .filter((p): p is number => p != null && p > 0)
        const lowestPrice = prices.length > 0 ? Math.min(...prices) : null

        return (
          <article
            key={store.id}
            style={{
              backgroundColor: 'var(--surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '1rem',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '0.15rem 0.5rem',
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
                      padding: '0.15rem 0.5rem',
                      borderRadius: '9999px',
                      backgroundColor: 'rgba(37, 99, 235, 0.1)',
                      color: 'var(--color-brand-600)',
                    }}
                  >
                    🚚 Delivers
                  </span>
                )}
              </div>

              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.35rem 0' }}>
                {store.name}
              </h2>

              <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: '0 0 0.75rem 0' }}>
                📍 {[store.barangay, store.municipality].filter(Boolean).join(', ')}
              </p>

              {store.listings.length > 0 && (
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  {store.listings.slice(0, 3).map((l) => (
                    <span
                      key={l.id}
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.2rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--surface-elevated)',
                        color: 'var(--foreground)',
                      }}
                    >
                      {l.product?.name}
                    </span>
                  ))}
                  {store.listings.length > 3 && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)', alignSelf: 'center' }}>
                      +{store.listings.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
              {lowestPrice !== null && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Starting from</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-brand-600)' }}>
                    ₱{lowestPrice.toFixed(2)}
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Link
                  href={`/stores/${store.id}`}
                  style={{
                    flex: 1,
                    backgroundColor: 'var(--color-brand-600)',
                    color: '#ffffff',
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    textAlign: 'center',
                    textDecoration: 'none',
                  }}
                >
                  View Details & Prices
                </Link>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}

function StoresLoading() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1.25rem' }}>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            backgroundColor: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            padding: '1.25rem',
            height: '200px',
            opacity: 0.6,
          }}
        />
      ))}
    </div>
  )
}

export default function StoresPage() {
  return (
    <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--foreground)', margin: '0 0 0.5rem 0' }}>
            Water Supply Stores
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.95rem', margin: 0 }}>
            Find approved hardware and supply shops offering water drums, containers, buckets, and tanks.
          </p>
        </div>

        <Link
          href="/map"
          style={{
            backgroundColor: 'var(--color-brand-600)',
            color: '#ffffff',
            padding: '0.65rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            fontSize: '0.9rem',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <span>Open Interactive Map</span>
          <span>🗺️</span>
        </Link>
      </div>

      <Suspense fallback={<StoresLoading />}>
        <StoresList />
      </Suspense>
    </div>
  )
}
