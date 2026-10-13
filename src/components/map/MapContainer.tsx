'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import type { StoreMapDTO } from '@/lib/dal/stores'
import { MapSkeleton } from './MapSkeleton'
import { StorePreviewCard } from './StorePreviewCard'
import { StoreListView } from './StoreListView'

// Dynamically import StoreMap to ensure Leaflet only runs client-side (no SSR window errors)
const DynamicStoreMap = dynamic(() => import('./StoreMap'), {
  ssr: false,
  loading: () => <MapSkeleton />,
})

interface MapContainerProps {
  initialStores: StoreMapDTO[]
  initialCenter: [number, number]
  initialZoom: number
  tileUrl: string
  tileAttribution: string
}

const CATEGORIES = [
  { id: 'all', label: 'All Products' },
  { id: 'buckets', label: 'Buckets' },
  { id: 'containers', label: 'Containers' },
  { id: 'drums', label: 'Drums' },
  { id: 'tanks', label: 'Tanks' },
]

export function MapContainer({
  initialStores,
  initialCenter,
  initialZoom,
  tileUrl,
  tileAttribution,
}: MapContainerProps) {
  const [selectedStore, setSelectedStore] = useState<StoreMapDTO | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [locationNotice, setLocationNotice] = useState<string | null>(null)
  const [mobileTab, setMobileTab] = useState<'map' | 'list'>('map')

  // Filter stores by query and product category
  const filteredStores = useMemo(() => {
    return initialStores.filter((store) => {
      // Query filter: store name, barangay, municipality
      const q = searchQuery.toLowerCase().trim()
      const matchesQuery =
        !q ||
        store.name.toLowerCase().includes(q) ||
        (store.barangay && store.barangay.toLowerCase().includes(q)) ||
        store.municipality.toLowerCase().includes(q)

      if (!matchesQuery) return false

      // Category filter
      if (selectedCategory === 'all') return true

      return store.listings.some((listing) => {
        const prodName = listing.product?.name.toLowerCase() ?? ''
        if (selectedCategory === 'buckets' && prodName.includes('bucket')) return true
        if (selectedCategory === 'drums' && prodName.includes('drum')) return true
        if (selectedCategory === 'tanks' && prodName.includes('tank')) return true
        if (selectedCategory === 'containers' && (prodName.includes('container') || prodName.includes('jug'))) return true
        return false
      })
    })
  }, [initialStores, searchQuery, selectedCategory])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 110px)', minHeight: '650px', position: 'relative' }}>
      {/* Top Search & Filter Bar */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          padding: '0.75rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: 1, minWidth: '220px', maxWidth: '450px' }}>
            <span
              style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: '0.9rem' }}
              aria-hidden="true"
            >
              🔍
            </span>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stores, barangays, or products..."
              aria-label="Search stores"
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface-elevated)',
                color: 'var(--foreground)',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                ×
              </button>
            )}
          </div>

          {/* Results count & Mobile View Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
              <strong>{filteredStores.length}</strong> {filteredStores.length === 1 ? 'store' : 'stores'} found
            </span>

            {/* Mobile Map / List switcher */}
            <div
              className="mobile-tab-switcher"
              style={{
                display: 'inline-flex',
                backgroundColor: 'var(--surface-elevated)',
                borderRadius: 'var(--radius-md)',
                padding: '0.2rem',
                border: '1px solid var(--border)',
              }}
            >
              <button
                type="button"
                onClick={() => setMobileTab('map')}
                style={{
                  padding: '0.3rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: mobileTab === 'map' ? 'var(--color-brand-600)' : 'transparent',
                  color: mobileTab === 'map' ? '#ffffff' : 'var(--foreground)',
                  transition: 'background-color 0.15s',
                }}
              >
                🗺️ Map
              </button>
              <button
                type="button"
                onClick={() => setMobileTab('list')}
                style={{
                  padding: '0.3rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: mobileTab === 'list' ? 'var(--color-brand-600)' : 'transparent',
                  color: mobileTab === 'list' ? '#ffffff' : 'var(--foreground)',
                  transition: 'background-color 0.15s',
                }}
              >
                📋 List
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '0.3rem 0.75rem',
                  borderRadius: '9999px',
                  border: isSelected ? '1px solid var(--color-brand-600)' : '1px solid var(--border)',
                  backgroundColor: isSelected ? 'var(--color-brand-600)' : 'var(--surface-elevated)',
                  color: isSelected ? '#ffffff' : 'var(--foreground)',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Geolocation Notice Banner */}
      {/* Geolocation Notice Banner */}
      {locationNotice && (
        <div
          role="alert"
          style={{
            backgroundColor: '#fffbeb',
            color: '#b45309',
            borderBottom: '1px solid #fde68a',
            padding: '0.65rem 1rem',
            fontSize: '0.85rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            zIndex: 20,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.1rem' }}>⚠️</span>
            <span>{locationNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setLocationNotice(null)}
            aria-label="Dismiss notice"
            style={{
              background: 'none',
              border: 'none',
              color: '#b45309',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              padding: '0.2rem 0.4rem',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Main Content Area: Split on Desktop, Tabbed on Mobile */}
      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        {/* Desktop Side List Panel */}
        <aside
          className="desktop-side-list"
          aria-label="Store directory sidebar"
          style={{
            width: '380px',
            borderRight: '1px solid var(--border)',
            backgroundColor: 'var(--surface)',
            padding: '1rem',
            overflowY: 'auto',
            flexShrink: 0,
          }}
        >
          <StoreListView
            stores={filteredStores}
            selectedStore={selectedStore}
            userLocation={userLocation}
            onSelectStore={(store) => {
              setSelectedStore(store)
              setMobileTab('map')
            }}
          />
        </aside>

        {/* Map View Area */}
        <div
          className={`map-viewport ${mobileTab === 'list' ? 'mobile-hidden' : ''}`}
          style={{
            flex: 1,
            height: '100%',
            position: 'relative',
          }}
        >
          <DynamicStoreMap
            stores={filteredStores}
            selectedStore={selectedStore}
            onSelectStore={setSelectedStore}
            initialCenter={initialCenter}
            initialZoom={initialZoom}
            tileUrl={tileUrl}
            tileAttribution={tileAttribution}
            userLocation={userLocation}
            onUserLocationChange={setUserLocation}
            onLocationError={setLocationNotice}
          />

          {/* Floating Store Preview Card on Map */}
          {selectedStore && (
            <div
              style={{
                position: 'absolute',
                bottom: '1.5rem',
                left: '1.5rem',
                zIndex: 500,
                maxWidth: 'calc(100% - 3rem)',
              }}
            >
              <StorePreviewCard
                store={selectedStore}
                onClose={() => setSelectedStore(null)}
              />
            </div>
          )}
        </div>

        {/* Mobile-only Full List View */}
        <div
          className={`mobile-list-viewport ${mobileTab === 'map' ? 'mobile-hidden' : ''}`}
          style={{
            flex: 1,
            padding: '1rem',
            overflowY: 'auto',
            backgroundColor: 'var(--background)',
          }}
        >
          <StoreListView
            stores={filteredStores}
            selectedStore={selectedStore}
            userLocation={userLocation}
            onSelectStore={(store) => {
              setSelectedStore(store)
              setMobileTab('map')
            }}
            onSwitchToMap={() => setMobileTab('map')}
          />
        </div>
      </div>

      {/* Responsive Styles */}
      <style>{`
        @media (min-width: 768px) {
          .mobile-tab-switcher {
            display: none !important;
          }
          .mobile-list-viewport {
            display: none !important;
          }
          .desktop-side-list {
            display: block !important;
          }
          .map-viewport {
            display: block !important;
          }
        }
        @media (max-width: 767px) {
          .desktop-side-list {
            display: none !important;
          }
          .mobile-hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
