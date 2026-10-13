import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getStoreById } from '@/lib/dal/stores'
import { getListingsWithProductForStore, getPriceHistoryForListing } from '@/lib/dal/products'
import { LISTING_FRESHNESS_DAYS } from '@/lib/constants'
import { StoreListingProductCard } from '@/components/prices/StoreListingProductCard'
import { ReportListingButton } from '@/components/feedback/ReportListingButton'

interface StoreDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: StoreDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const store = await getStoreById(id)
  if (!store) return { title: 'Store Not Found' }
  return {
    title: `${store.name} — Water Supply & Prices`,
    description: `Water containers, buckets, drums, and tanks available at ${store.name} in ${store.municipality}.`,
  }
}

async function StoreDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const store = await getStoreById(id)

  if (!store) {
    notFound()
  }

  const listings = await getListingsWithProductForStore(id)
  const histories = await Promise.all(
    listings.map((l) => getPriceHistoryForListing(l.id).catch(() => [])),
  )

  const isVerified =
    store.verification_status === 'store_confirmed' || store.verification_status === 'admin_verified'

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Navigation breadcrumbs */}
      <nav aria-label="Breadcrumb" style={{ marginBottom: '1.5rem', fontSize: '0.875rem' }}>
        <ol style={{ display: 'flex', gap: '0.5rem', listStyle: 'none', padding: 0, margin: 0, color: 'var(--muted)' }}>
          <li>
            <Link href="/map" style={{ color: 'var(--color-brand-600)', textDecoration: 'none' }}>
              ← Map
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href="/stores" style={{ color: 'var(--color-brand-600)', textDecoration: 'none' }}>
              Stores
            </Link>
          </li>
          <li>/</li>
          <li aria-current="page" style={{ color: 'var(--foreground)', fontWeight: 600 }}>
            {store.name}
          </li>
        </ol>
      </nav>

      {/* Store Header Card */}
      <header
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          padding: '1.75rem',
          marginBottom: '2rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '9999px',
                  backgroundColor: isVerified ? 'rgba(22, 163, 74, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                  color: isVerified ? 'var(--color-success)' : 'var(--muted)',
                }}
              >
                {isVerified ? '✓ Verified Business' : 'Community Reported'}
              </span>

              {store.delivers && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '0.2rem 0.6rem',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    color: 'var(--color-brand-600)',
                  }}
                >
                  🚚 Delivery Available {store.delivery_fee_php ? `(₱${store.delivery_fee_php})` : '(Free)'}
                </span>
              )}
            </div>

            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--foreground)', margin: '0 0 0.5rem 0' }}>
              {store.name}
            </h1>

            {store.description && (
              <p style={{ color: 'var(--muted)', fontSize: '0.95rem', maxWidth: '640px', margin: '0 0 1rem 0' }}>
                {store.description}
              </p>
            )}

            {/* Address & Meta details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--foreground)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span aria-hidden="true">📍</span>
                <span>{[store.address_line, store.barangay, store.municipality, store.province].filter(Boolean).join(', ')}</span>
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
                  <a href={`tel:${store.contact_number}`} style={{ color: 'var(--color-brand-600)', textDecoration: 'none', fontWeight: 600 }}>
                    {store.contact_number}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Quick Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '180px' }}>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                backgroundColor: 'var(--color-brand-600)',
                color: '#ffffff',
                padding: '0.65rem 1rem',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
                fontSize: '0.9rem',
                textAlign: 'center',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
              }}
            >
              <span>Directions</span>
              <span>↗</span>
            </a>

            <Link
              href="/map"
              style={{
                backgroundColor: 'var(--surface-elevated)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
                padding: '0.65rem 1rem',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
                fontSize: '0.9rem',
                textAlign: 'center',
                textDecoration: 'none',
              }}
            >
              View on Map 🗺️
            </Link>

            <ReportListingButton storeId={store.id} storeName={store.name} />
          </div>
        </div>
      </header>

      {/* Available Products Section */}
      <section aria-labelledby="products-heading" style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h2 id="products-heading" style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>
              Available Water Storage Products ({listings.length})
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted)', margin: '0.25rem 0 0 0' }}>
              Reported prices in Philippine Pesos (PHP). Listings older than {LISTING_FRESHNESS_DAYS} days are marked stale.
            </p>
          </div>
        </div>

        {listings.length === 0 ? (
          <div
            style={{
              padding: '2.5rem',
              textAlign: 'center',
              backgroundColor: 'var(--surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
            }}
          >
            <p style={{ color: 'var(--muted)', margin: 0 }}>
              No product prices have been submitted for this store yet.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {listings.map((listing, idx) => (
              <StoreListingProductCard
                key={listing.id}
                listing={listing}
                history={histories[idx] ?? []}
                freshnessDays={LISTING_FRESHNESS_DAYS}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function StoreDetailLoading() {
  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1rem' }}>
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          padding: '2rem',
          height: '240px',
          opacity: 0.6,
          marginBottom: '2rem',
        }}
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1rem',
        }}
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              backgroundColor: 'var(--surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              padding: '1.5rem',
              height: '180px',
              opacity: 0.6,
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default function StoreDetailPage({ params }: StoreDetailPageProps) {
  return (
    <Suspense fallback={<StoreDetailLoading />}>
      <StoreDetailContent params={params} />
    </Suspense>
  )
}
