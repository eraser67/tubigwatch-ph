'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import type { StoreMapDTO } from '@/lib/dal/stores'

interface StoreDirectoryClientProps {
  stores: StoreMapDTO[]
}

/** Calculates distance in km between two coordinate pairs using Haversine */
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function StoreDirectoryClient({ stores }: StoreDirectoryClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDelivery, setFilterDelivery] = useState(false)
  const [filterVerified, setFilterVerified] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'distance' | 'products' | 'price'>('name')
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null)
  const [isLocating, setIsLocating] = useState(false)

  // Geolocation trigger
  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) return

    setIsLocating(true)
    const onFound = (pos: GeolocationPosition) => {
      setIsLocating(false)
      setUserCoords([pos.coords.latitude, pos.coords.longitude])
      setSortBy('distance')
    }
    const onFailed = () => {
      navigator.geolocation.getCurrentPosition(
        onFound,
        () => setIsLocating(false),
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 120000 }
      )
    }

    navigator.geolocation.getCurrentPosition(onFound, onFailed, {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 60000,
    })
  }, [])

  // Filter stores
  const filteredStores = useMemo(() => {
    return stores.filter((store) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchesName = store.name.toLowerCase().includes(q)
        const matchesBarangay = store.barangay?.toLowerCase().includes(q) ?? false
        const matchesMunicipality = store.municipality.toLowerCase().includes(q)
        const matchesAddress = store.address_line?.toLowerCase().includes(q) ?? false
        const matchesProduct = store.listings.some((l) =>
          l.product?.name.toLowerCase().includes(q)
        )
        if (!matchesName && !matchesBarangay && !matchesMunicipality && !matchesAddress && !matchesProduct) {
          return false
        }
      }

      if (filterDelivery && !store.delivers) return false
      if (
        filterVerified &&
        store.verification_status !== 'store_confirmed' &&
        store.verification_status !== 'admin_verified'
      ) {
        return false
      }

      return true
    })
  }, [stores, searchQuery, filterDelivery, filterVerified])

  // Sort stores
  const sortedStores = useMemo(() => {
    return [...filteredStores].sort((a, b) => {
      if (sortBy === 'distance' && userCoords) {
        const distA = getDistanceKm(userCoords[0], userCoords[1], a.latitude, a.longitude)
        const distB = getDistanceKm(userCoords[0], userCoords[1], b.latitude, b.longitude)
        return distA - distB
      }

      if (sortBy === 'products') {
        return b.listings.length - a.listings.length
      }

      if (sortBy === 'price') {
        const pricesA = a.listings.map((l) => l.current_price_php).filter((p): p is number => p != null && p > 0)
        const pricesB = b.listings.map((l) => l.current_price_php).filter((p): p is number => p != null && p > 0)
        const minA = pricesA.length > 0 ? Math.min(...pricesA) : Infinity
        const minB = pricesB.length > 0 ? Math.min(...pricesB) : Infinity
        return minA - minB
      }

      return a.name.localeCompare(b.name)
    })
  }, [filteredStores, sortBy, userCoords])

  return (
    <div>
      {/* Search & Filter Bar */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Search box */}
          <div style={{ flex: 1, minWidth: '240px' }}>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stores by name, barangay, or product..."
              aria-label="Search stores"
              style={{
                width: '100%',
                padding: '0.55rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface-elevated)',
                color: 'var(--foreground)',
                fontSize: '0.875rem',
              }}
            />
          </div>

          {/* Sort Selector */}
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'distance' | 'products' | 'price')}
              aria-label="Sort stores"
              style={{
                padding: '0.55rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface-elevated)',
                color: 'var(--foreground)',
                fontSize: '0.85rem',
              }}
            >
              <option value="name">Name (A-Z)</option>
              <option value="price">Lowest Starting Price</option>
              <option value="products">Most Products</option>
              <option value="distance">Nearest Distance</option>
            </select>

            <button
              type="button"
              onClick={handleLocateMe}
              disabled={isLocating}
              title="Use current location to calculate distance"
              style={{
                padding: '0.55rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                backgroundColor: userCoords ? 'rgba(37, 99, 235, 0.1)' : 'var(--surface-elevated)',
                color: userCoords ? 'var(--color-brand-600)' : 'var(--foreground)',
                cursor: isLocating ? 'wait' : 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              {isLocating ? '⏳' : userCoords ? '📍 Nearby' : '📍 Distance'}
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setFilterDelivery(!filterDelivery)}
            style={{
              padding: '0.3rem 0.75rem',
              borderRadius: '9999px',
              border: filterDelivery ? '1px solid var(--color-brand-600)' : '1px solid var(--border)',
              backgroundColor: filterDelivery ? 'var(--color-brand-600)' : 'var(--surface-elevated)',
              color: filterDelivery ? '#ffffff' : 'var(--foreground)',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            🚚 Offers Delivery
          </button>

          <button
            type="button"
            onClick={() => setFilterVerified(!filterVerified)}
            style={{
              padding: '0.3rem 0.75rem',
              borderRadius: '9999px',
              border: filterVerified ? '1px solid var(--color-success)' : '1px solid var(--border)',
              backgroundColor: filterVerified ? 'var(--color-success)' : 'var(--surface-elevated)',
              color: filterVerified ? '#ffffff' : 'var(--foreground)',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            ✓ Verified Only
          </button>

          {(searchQuery || filterDelivery || filterVerified) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setFilterDelivery(false)
                setFilterVerified(false)
              }}
              style={{
                padding: '0.3rem 0.6rem',
                background: 'none',
                border: 'none',
                color: 'var(--muted)',
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              Clear filters ↺
            </button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div style={{ marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--muted)' }}>
        Showing <strong>{sortedStores.length}</strong> {sortedStores.length === 1 ? 'store' : 'stores'}
      </div>

      {/* Empty State */}
      {sortedStores.length === 0 && (
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
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            No stores match your filters
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem', maxWidth: '380px', margin: '0 auto 1rem auto' }}>
            Try clearing your search query or removing delivery/verification filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('')
              setFilterDelivery(false)
              setFilterVerified(false)
            }}
            style={{
              backgroundColor: 'var(--color-brand-600)',
              color: '#ffffff',
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Stores Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1.25rem' }}>
        {sortedStores.map((store) => {
          const isVerified =
            store.verification_status === 'store_confirmed' || store.verification_status === 'admin_verified'
          const prices = store.listings
            .map((l) => l.current_price_php)
            .filter((p): p is number => p != null && p > 0)
          const lowestPrice = prices.length > 0 ? Math.min(...prices) : null

          const distance =
            userCoords != null
              ? getDistanceKm(userCoords[0], userCoords[1], store.latitude, store.longitude)
              : null

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
                      🚚 Delivers {store.delivery_fee_php != null ? `(₱${store.delivery_fee_php.toFixed(2)})` : ''}
                    </span>
                  )}
                </div>

                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.35rem 0' }}>
                  <Link href={`/stores/${store.id}`} style={{ color: 'var(--foreground)', textDecoration: 'none' }}>
                    {store.name}
                  </Link>
                </h2>

                <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: '0 0 0.75rem 0' }}>
                  📍 {[store.barangay, store.municipality].filter(Boolean).join(', ')}
                  {distance != null && (
                    <strong style={{ color: 'var(--foreground)', marginLeft: '0.4rem' }}>
                      · {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}
                    </strong>
                  )}
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
    </div>
  )
}
