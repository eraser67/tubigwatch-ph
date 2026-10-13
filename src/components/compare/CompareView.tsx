'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import type { ComparisonListingDTO, CategoryDTO } from '@/lib/dal/products'
import { LISTING_FRESHNESS_DAYS } from '@/lib/constants'
import { ReportPriceModal } from '@/components/prices/ReportPriceModal'

interface CompareViewProps {
  listings: ComparisonListingDTO[]
  categories: CategoryDTO[]
}

type SortOption = 'price-asc' | 'price-desc' | 'distance-asc' | 'confirmed-desc' | 'name-asc'
type MatchMode = 'exact' | 'equivalent'

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

export function CompareView({ listings, categories }: CompareViewProps) {
  const searchParams = useSearchParams()
  const initialProductId = searchParams.get('product') || ''
  const initialCategory = searchParams.get('category') || 'all'

  // Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory)
  const [selectedCapacity, setSelectedCapacity] = useState<string>('all')
  const [selectedBrand, setSelectedBrand] = useState<string>('all')
  const [selectedStock, setSelectedStock] = useState<string>('all')
  const [minPrice, setMinPrice] = useState<string>('')
  const [maxPrice, setMaxPrice] = useState<string>('')
  const [sortBy, setSortBy] = useState<SortOption>('price-asc')
  const [matchMode, setMatchMode] = useState<MatchMode>('exact')

  // User Geolocation State
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [locationNotice, setLocationNotice] = useState<string | null>(null)

  // Report Price Modal State
  const [reportingListing, setReportingListing] = useState<ComparisonListingDTO | null>(null)

  // Unique brands & capacities from dataset
  const uniqueBrands = useMemo(() => {
    const brands = new Set<string>()
    listings.forEach((l) => {
      if (l.product.brand) brands.add(l.product.brand)
    })
    return Array.from(brands).sort()
  }, [listings])

  const uniqueCapacities = useMemo(() => {
    const caps = new Set<number>()
    listings.forEach((l) => {
      if (l.product.capacity_liters != null) caps.add(l.product.capacity_liters)
    })
    return Array.from(caps).sort((a, b) => a - b)
  }, [listings])

  // Geolocation trigger
  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationNotice('Geolocation is not supported by your browser.')
      return
    }

    setIsLocating(true)
    setLocationNotice(null)

    const onFound = (pos: GeolocationPosition) => {
      setIsLocating(false)
      setUserCoords([pos.coords.latitude, pos.coords.longitude])
      setSortBy('distance-asc')
    }

    const onFailed = (err: GeolocationPositionError) => {
      if (err.code === err.TIMEOUT || err.code === err.POSITION_UNAVAILABLE) {
        navigator.geolocation.getCurrentPosition(
          onFound,
          () => {
            setIsLocating(false)
            setLocationNotice('Unable to determine location. Check browser location permissions.')
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 120000 },
        )
        return
      }
      setIsLocating(false)
      setLocationNotice('Location permission was denied. You can still sort by lowest price.')
    }

    navigator.geolocation.getCurrentPosition(onFound, onFailed, {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 60000,
    })
  }, [])

  // Filter listings
  const filteredListings = useMemo(() => {
    return listings.filter((l) => {
      // Direct product ID match if passed in query and no query overrides
      if (initialProductId && !searchQuery && l.product_id !== initialProductId) {
        // Only if user hasn't cleared it
        // We let filters refine it
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchesProduct = l.product.name.toLowerCase().includes(q)
        const matchesBrand = l.product.brand?.toLowerCase().includes(q) ?? false
        const matchesMaterial = l.product.material?.toLowerCase().includes(q) ?? false
        const matchesStore = l.store.name.toLowerCase().includes(q)
        const matchesBarangay = l.store.barangay?.toLowerCase().includes(q) ?? false
        const matchesMunicipality = l.store.municipality.toLowerCase().includes(q)
        if (!matchesProduct && !matchesBrand && !matchesMaterial && !matchesStore && !matchesBarangay && !matchesMunicipality) {
          return false
        }
      }

      // Category
      if (selectedCategory !== 'all') {
        const catSlug = l.product.category?.slug
        if (catSlug !== selectedCategory) return false
      }

      // Capacity
      if (selectedCapacity !== 'all') {
        const targetCap = Number(selectedCapacity)
        if (l.product.capacity_liters !== targetCap) return false
      }

      // Brand
      if (selectedBrand !== 'all') {
        if (l.product.brand !== selectedBrand) return false
      }

      // Stock
      if (selectedStock === 'available' && l.stock_status !== 'available') return false
      if (selectedStock === 'limited' && l.stock_status !== 'limited') return false

      // Price Range
      if (minPrice && l.current_price_php < Number(minPrice)) return false
      if (maxPrice && l.current_price_php > Number(maxPrice)) return false

      return true
    })
  }, [listings, searchQuery, selectedCategory, selectedCapacity, selectedBrand, selectedStock, minPrice, maxPrice, initialProductId])

  // Group listings by comparison key
  // Exact mode groups by `product_id`. Equivalent mode groups by `category_id + capacity_liters`.
  const comparisonGroups = useMemo(() => {
    const groupsMap = new Map<
      string,
      {
        key: string
        title: string
        categoryName: string
        capacityLiters: number | null
        brand: string | null
        material: string | null
        listings: ComparisonListingDTO[]
      }
    >()

    filteredListings.forEach((listing) => {
      const groupKey =
        matchMode === 'exact'
          ? listing.product_id
          : `${listing.product.category_id}-${listing.product.capacity_liters ?? 'nocap'}`

      const title =
        matchMode === 'exact'
          ? listing.product.name
          : `${listing.product.category?.name ?? 'Product'} (${listing.product.capacity_liters ?? '?'}L Equivalent)`

      if (!groupsMap.has(groupKey)) {
        groupsMap.set(groupKey, {
          key: groupKey,
          title,
          categoryName: listing.product.category?.name ?? 'General',
          capacityLiters: listing.product.capacity_liters,
          brand: listing.product.brand,
          material: listing.product.material,
          listings: [],
        })
      }

      groupsMap.get(groupKey)!.listings.push(listing)
    })

    // Sort listings within each group according to selected sort option
    const sortedGroups = Array.from(groupsMap.values()).map((group) => {
      const sortedListings = [...group.listings].sort((a, b) => {
        if (sortBy === 'price-asc') return a.current_price_php - b.current_price_php
        if (sortBy === 'price-desc') return b.current_price_php - a.current_price_php
        if (sortBy === 'confirmed-desc') {
          const timeA = new Date(a.last_confirmed_at ?? a.last_reported_at ?? 0).getTime()
          const timeB = new Date(b.last_confirmed_at ?? b.last_reported_at ?? 0).getTime()
          return timeB - timeA
        }
        if (sortBy === 'distance-asc' && userCoords) {
          const distA = getDistanceKm(userCoords[0], userCoords[1], a.store.latitude, a.store.longitude)
          const distB = getDistanceKm(userCoords[0], userCoords[1], b.store.latitude, b.store.longitude)
          return distA - distB
        }
        if (sortBy === 'name-asc') return a.store.name.localeCompare(b.store.name)
        return a.current_price_php - b.current_price_php
      })

      return {
        ...group,
        listings: sortedListings,
      }
    })

    // Sort groups themselves: groups with lowest starting price first
    sortedGroups.sort((a, b) => {
      const lowestA = a.listings[0]?.current_price_php ?? Infinity
      const lowestB = b.listings[0]?.current_price_php ?? Infinity
      return lowestA - lowestB
    })

    return sortedGroups
  }, [filteredListings, matchMode, sortBy, userCoords])

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedCategory('all')
    setSelectedCapacity('all')
    setSelectedBrand('all')
    setSelectedStock('all')
    setMinPrice('')
    setMaxPrice('')
    setSortBy('price-asc')
    setMatchMode('exact')
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: 'var(--foreground)' }}>
              Compare Water Supply Prices ⚖️
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: 0 }}>
              Find the lowest verified prices and potential savings for containers, drums, and tanks across local hardware stores.
            </p>
          </div>

          {/* Matching Mode Selector (Exact vs Equivalent Specification) */}
          <div
            style={{
              backgroundColor: 'var(--surface-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '0.25rem',
              display: 'inline-flex',
              gap: '0.25rem',
            }}
          >
            <button
              type="button"
              onClick={() => setMatchMode('exact')}
              title="Compare the identical product brand & model across stores"
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                fontSize: '0.825rem',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: matchMode === 'exact' ? 'var(--color-brand-600)' : 'transparent',
                color: matchMode === 'exact' ? '#ffffff' : 'var(--foreground)',
                transition: 'all 0.15s ease',
              }}
            >
              Exact Products
            </button>
            <button
              type="button"
              onClick={() => setMatchMode('equivalent')}
              title="Compare equivalent capacity & category items across brands (e.g. 200L drums)"
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                fontSize: '0.825rem',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: matchMode === 'equivalent' ? 'var(--color-brand-600)' : 'transparent',
                color: matchMode === 'equivalent' ? '#ffffff' : 'var(--foreground)',
                transition: 'all 0.15s ease',
              }}
            >
              Capacity Equivalents
            </button>
          </div>
        </div>
      </div>

      {/* Geolocation Notice Banner */}
      {locationNotice && (
        <div
          role="alert"
          style={{
            backgroundColor: '#fffbeb',
            color: '#b45309',
            border: '1px solid #fde68a',
            borderRadius: 'var(--radius-md)',
            padding: '0.65rem 1rem',
            fontSize: '0.85rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>⚠️ {locationNotice}</span>
          <button
            type="button"
            onClick={() => setLocationNotice(null)}
            style={{ background: 'none', border: 'none', color: '#b45309', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ×
          </button>
        </div>
      )}

      {/* Filter and Search Control Bar */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        {/* Search Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          {/* Keyword Search */}
          <div style={{ position: 'relative' }}>
            <label htmlFor="compare-search" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.35rem' }}>
              Search Products or Stores
            </label>
            <input
              id="compare-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. 200L drum, bucket, hardware name..."
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface-elevated)',
                color: 'var(--foreground)',
                fontSize: '0.875rem',
              }}
            />
          </div>

          {/* Category Filter */}
          <div>
            <label htmlFor="category-select" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.35rem' }}>
              Category
            </label>
            <select
              id="category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface-elevated)',
                color: 'var(--foreground)',
                fontSize: '0.875rem',
              }}
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Capacity Filter */}
          <div>
            <label htmlFor="capacity-select" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.35rem' }}>
              Capacity
            </label>
            <select
              id="capacity-select"
              value={selectedCapacity}
              onChange={(e) => setSelectedCapacity(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface-elevated)',
                color: 'var(--foreground)',
                fontSize: '0.875rem',
              }}
            >
              <option value="all">All Capacities</option>
              {uniqueCapacities.map((cap) => (
                <option key={cap} value={cap.toString()}>
                  {cap} Liters
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label htmlFor="sort-select" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.35rem' }}>
              Sort Listings
            </label>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                style={{
                  flex: 1,
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface-elevated)',
                  color: 'var(--foreground)',
                  fontSize: '0.875rem',
                }}
              >
                <option value="price-asc">Lowest Price First (₱ → ₱₱₱)</option>
                <option value="price-desc">Highest Price First (₱₱₱ → ₱)</option>
                <option value="distance-asc">Nearest Store</option>
                <option value="confirmed-desc">Latest Confirmed Date</option>
                <option value="name-asc">Store Name (A-Z)</option>
              </select>

              <button
                type="button"
                onClick={handleLocateMe}
                disabled={isLocating}
                title="Use current location for distance sorting"
                style={{
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  backgroundColor: userCoords ? 'rgba(37, 99, 235, 0.1)' : 'var(--surface-elevated)',
                  color: userCoords ? 'var(--color-brand-600)' : 'var(--foreground)',
                  cursor: isLocating ? 'wait' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                {isLocating ? '⏳' : userCoords ? '📍 Nearby' : '📍 My Location'}
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Filter Row: Brand, Stock, Price Range & Reset */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Brand Filter */}
            {uniqueBrands.length > 0 && (
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                aria-label="Filter by brand"
                style={{
                  padding: '0.35rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface-elevated)',
                  fontSize: '0.8rem',
                  color: 'var(--foreground)',
                }}
              >
                <option value="all">All Brands</option>
                {uniqueBrands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            )}

            {/* Stock status filter */}
            <select
              value={selectedStock}
              onChange={(e) => setSelectedStock(e.target.value)}
              aria-label="Filter by stock status"
              style={{
                padding: '0.35rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface-elevated)',
                fontSize: '0.8rem',
                color: 'var(--foreground)',
              }}
            >
              <option value="all">All Stock Statuses</option>
              <option value="available">In Stock Only</option>
              <option value="limited">Limited Stock</option>
            </select>

            {/* Min Price */}
            <input
              type="number"
              placeholder="Min ₱"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              aria-label="Minimum price in PHP"
              style={{
                width: '90px',
                padding: '0.35rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface-elevated)',
                fontSize: '0.8rem',
                color: 'var(--foreground)',
              }}
            />

            {/* Max Price */}
            <input
              type="number"
              placeholder="Max ₱"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              aria-label="Maximum price in PHP"
              style={{
                width: '90px',
                padding: '0.35rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface-elevated)',
                fontSize: '0.8rem',
                color: 'var(--foreground)',
              }}
            />
          </div>

          {/* Reset Filters button */}
          <button
            type="button"
            onClick={handleResetFilters}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-brand-600)',
              fontSize: '0.825rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '0.3rem 0.5rem',
            }}
          >
            Clear Filters ↺
          </button>
        </div>
      </div>

      {/* Transport & Delivery Disclosure Notice (FR-06) */}
      <div
        style={{
          backgroundColor: 'var(--surface-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem 1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.8rem',
          color: 'var(--muted)',
        }}
      >
        <span>💡</span>
        <span>
          <strong>Pricing Disclaimer:</strong> Comparisons show current reported in-store retail prices in Philippine Pesos (PHP). Transport and delivery costs are not included unless explicitly noted by stores offering delivery services.
        </span>
      </div>

      {/* Results Header Count */}
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
          Showing <strong>{comparisonGroups.length}</strong> {comparisonGroups.length === 1 ? 'product group' : 'product groups'} ({filteredListings.length} total store listings)
        </span>
      </div>

      {/* Empty State: No results */}
      {comparisonGroups.length === 0 && (
        <div
          role="status"
          style={{
            textAlign: 'center',
            padding: '3.5rem 1.5rem',
            backgroundColor: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
          }}
        >
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '0.75rem' }} aria-hidden="true">
            🔍
          </span>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>
            No matching products found
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
            We could not find any store listings matching your current filters. Try relaxing your price range or clearing category filters.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            style={{
              backgroundColor: 'var(--color-brand-600)',
              color: '#ffffff',
              padding: '0.6rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* Comparison Product Group Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {comparisonGroups.map((group) => {
          const prices = group.listings.map((l) => l.current_price_php)
          const lowestPrice = Math.min(...prices)
          const highestPrice = Math.max(...prices)
          const potentialSavingsPhp = highestPrice - lowestPrice
          const potentialSavingsPercent = highestPrice > 0 ? Math.round((potentialSavingsPhp / highestPrice) * 100) : 0
          const hasMultipleStores = group.listings.length > 1

          return (
            <section
              key={group.key}
              aria-labelledby={`group-title-${group.key}`}
              style={{
                backgroundColor: 'var(--surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
                overflow: 'hidden',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
              }}
            >
              {/* Product Group Header & Savings Banner */}
              <div
                style={{
                  padding: '1.25rem 1.5rem',
                  borderBottom: '1px solid var(--border)',
                  backgroundColor: 'var(--surface-elevated)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '0.15rem 0.55rem',
                        borderRadius: '9999px',
                        backgroundColor: 'rgba(37, 99, 235, 0.12)',
                        color: 'var(--color-brand-600)',
                      }}
                    >
                      {group.categoryName}
                    </span>

                    {group.capacityLiters != null && (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '0.15rem 0.55rem',
                          borderRadius: '9999px',
                          backgroundColor: 'rgba(100, 116, 139, 0.1)',
                          color: 'var(--muted)',
                        }}
                      >
                        {group.capacityLiters} Liters
                      </span>
                    )}

                    {group.brand && (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '0.15rem 0.55rem',
                          borderRadius: '9999px',
                          backgroundColor: 'rgba(100, 116, 139, 0.1)',
                          color: 'var(--muted)',
                        }}
                      >
                        Brand: {group.brand}
                      </span>
                    )}
                  </div>

                  <h2 id={`group-title-${group.key}`} style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 0.25rem 0', color: 'var(--foreground)' }}>
                    {group.title}
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: 0 }}>
                    Available in <strong>{group.listings.length}</strong> {group.listings.length === 1 ? 'store' : 'stores'} across your area
                  </p>
                </div>

                {/* Savings Calculator Widget */}
                {hasMultipleStores && potentialSavingsPhp > 0 ? (
                  <div
                    style={{
                      backgroundColor: 'rgba(22, 163, 74, 0.1)',
                      border: '1px solid rgba(22, 163, 74, 0.3)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.75rem 1rem',
                      textAlign: 'right',
                      minWidth: '200px',
                    }}
                  >
                    <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-success)', textTransform: 'uppercase' }}>
                      Potential Savings
                    </span>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-success)' }}>
                      Save up to ₱{potentialSavingsPhp.toFixed(2)}
                    </span>
                    <span style={{ display: 'block', fontSize: '0.775rem', color: 'var(--muted)', marginTop: '0.1rem' }}>
                      ({potentialSavingsPercent}% price spread between stores)
                    </span>
                  </div>
                ) : (
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase' }}>
                      Reported Price
                    </span>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--foreground)' }}>
                      ₱{lowestPrice.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* Single store notice if no comparable store exists */}
              {!hasMultipleStores && (
                <div
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: 'rgba(245, 158, 11, 0.08)',
                    borderBottom: '1px solid rgba(245, 158, 11, 0.2)',
                    fontSize: '0.825rem',
                    color: '#b45309',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <span>
                    ℹ️ Only 1 store is currently listed with this product. Know another hardware store selling this item?
                  </span>
                  <Link
                    href="/contribute"
                    style={{
                      fontWeight: 600,
                      color: 'var(--color-brand-600)',
                      textDecoration: 'none',
                    }}
                  >
                    + Add a Store Listing
                  </Link>
                </div>
              )}

              {/* Listings Store Table / Cards */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {group.listings.map((listing, index) => {
                  const isLowest = listing.current_price_php === lowestPrice && hasMultipleStores
                  const daysSinceConfirm = listing.last_confirmed_at
                    ? (Date.now() - new Date(listing.last_confirmed_at).getTime()) / (1000 * 60 * 60 * 24)
                    : null
                  const isFresh = daysSinceConfirm != null && daysSinceConfirm <= LISTING_FRESHNESS_DAYS

                  const distance =
                    userCoords != null
                      ? getDistanceKm(userCoords[0], userCoords[1], listing.store.latitude, listing.store.longitude)
                      : null

                  return (
                    <div
                      key={listing.id}
                      style={{
                        padding: '1.25rem 1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '1.25rem',
                        borderBottom: index < group.listings.length - 1 ? '1px solid var(--border)' : 'none',
                        backgroundColor: isLowest ? 'rgba(37, 99, 235, 0.02)' : 'transparent',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      {/* Left: Store Information */}
                      <div style={{ flex: 1, minWidth: '260px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                          <Link
                            href={`/stores/${listing.store.id}`}
                            style={{
                              fontSize: '1.1rem',
                              fontWeight: 700,
                              color: 'var(--foreground)',
                              textDecoration: 'none',
                            }}
                          >
                            {listing.store.name}
                          </Link>

                          {isLowest && (
                            <span
                              style={{
                                fontSize: '0.725rem',
                                fontWeight: 700,
                                backgroundColor: 'var(--color-brand-600)',
                                color: '#ffffff',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '9999px',
                              }}
                            >
                              🏆 Lowest Price
                            </span>
                          )}

                          {listing.store.verification_status === 'admin_verified' && (
                            <span
                              style={{
                                fontSize: '0.725rem',
                                fontWeight: 600,
                                backgroundColor: 'rgba(22, 163, 74, 0.1)',
                                color: 'var(--color-success)',
                                padding: '0.15rem 0.45rem',
                                borderRadius: '9999px',
                              }}
                            >
                              ✓ Verified
                            </span>
                          )}
                        </div>

                        {/* Location and Distance */}
                        <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: '0 0 0.5rem 0' }}>
                          📍 {[listing.store.barangay, listing.store.municipality].filter(Boolean).join(', ')}
                          {distance != null && (
                            <strong style={{ color: 'var(--foreground)', marginLeft: '0.5rem' }}>
                              · {distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`} away
                            </strong>
                          )}
                        </p>

                        {/* Badges: Freshness, Stock, Delivery */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {/* Freshness Badge */}
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              padding: '0.15rem 0.5rem',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: isFresh ? 'rgba(22, 163, 74, 0.1)' : 'rgba(245, 158, 11, 0.12)',
                              color: isFresh ? 'var(--color-success)' : 'var(--color-warning)',
                            }}
                          >
                            {isFresh ? 'Fresh Price' : 'Stale Price (Confirm in Store)'}
                          </span>

                          {/* Stock status */}
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              padding: '0.15rem 0.5rem',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor:
                                listing.stock_status === 'available'
                                  ? 'rgba(22, 163, 74, 0.1)'
                                  : listing.stock_status === 'limited'
                                  ? 'rgba(245, 158, 11, 0.12)'
                                  : 'rgba(239, 68, 68, 0.1)',
                              color:
                                listing.stock_status === 'available'
                                  ? 'var(--color-success)'
                                  : listing.stock_status === 'limited'
                                  ? 'var(--color-warning)'
                                  : 'var(--color-danger)',
                            }}
                          >
                            {listing.stock_status === 'available'
                              ? 'In Stock'
                              : listing.stock_status === 'limited'
                              ? 'Limited Stock'
                              : 'Out of Stock'}
                          </span>

                          {/* Delivery Info */}
                          {listing.store.delivers ? (
                            <span
                              style={{
                                fontSize: '0.75rem',
                                color: 'var(--color-brand-600)',
                                backgroundColor: 'rgba(37, 99, 235, 0.08)',
                                padding: '0.15rem 0.5rem',
                                borderRadius: 'var(--radius-sm)',
                              }}
                            >
                              🚚 Delivers {listing.store.delivery_fee_php != null ? `(₱${listing.store.delivery_fee_php.toFixed(2)})` : ''}
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: '0.75rem',
                                color: 'var(--muted)',
                                backgroundColor: 'var(--surface-elevated)',
                                padding: '0.15rem 0.5rem',
                                borderRadius: 'var(--radius-sm)',
                              }}
                            >
                              Pickup Only
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Price & Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', textAlign: 'right' }}>
                        <div>
                          <span
                            style={{
                              fontSize: '1.6rem',
                              fontWeight: 800,
                              color: isLowest ? 'var(--color-brand-600)' : 'var(--foreground)',
                              display: 'block',
                            }}
                          >
                            ₱{listing.current_price_php.toFixed(2)}
                          </span>

                          <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block' }}>
                            {listing.last_confirmed_at
                              ? `Confirmed ${new Date(listing.last_confirmed_at).toLocaleDateString()}`
                              : listing.last_reported_at
                              ? `Reported ${new Date(listing.last_reported_at).toLocaleDateString()}`
                              : 'Unconfirmed'}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: '130px' }}>
                          <Link
                            href={`/stores/${listing.store.id}`}
                            style={{
                              backgroundColor: 'var(--surface-elevated)',
                              color: 'var(--foreground)',
                              border: '1px solid var(--border)',
                              padding: '0.45rem 0.85rem',
                              borderRadius: 'var(--radius-md)',
                              fontSize: '0.825rem',
                              fontWeight: 600,
                              textAlign: 'center',
                              textDecoration: 'none',
                              transition: 'background-color 0.15s ease',
                            }}
                          >
                            View Store 🏪
                          </Link>

                          <button
                            type="button"
                            onClick={() => setReportingListing(listing)}
                            style={{
                              backgroundColor: 'transparent',
                              color: 'var(--color-brand-600)',
                              border: '1px dashed var(--color-brand-600)',
                              padding: '0.45rem 0.85rem',
                              borderRadius: 'var(--radius-md)',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Update Price 📝
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      {/* Report Price Modal when updating from compare view */}
      {reportingListing && (
        <ReportPriceModal
          listingId={reportingListing.id}
          productName={reportingListing.product.name}
          currentPrice={reportingListing.current_price_php}
          currentStock={reportingListing.stock_status}
          isOpen={true}
          onClose={() => setReportingListing(null)}
        />
      )}
    </div>
  )
}
