'use client'

import { useState, useTransition, useRef } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import type { ProductDTO, CategoryDTO } from '@/lib/dal/products'
import { submitStoreAction } from '@/app/actions/stores'
import { searchAddressAction, type GeocodingSuggestion } from '@/app/actions/geocoding'
import { DEFAULT_MAP_CENTER, PILOT_MUNICIPALITY } from '@/lib/constants'
import { MapSkeleton } from '@/components/map/MapSkeleton'

const DynamicPinMap = dynamic(() => import('./PinMap'), {
  ssr: false,
  loading: () => <MapSkeleton />,
})

interface ProductRow {
  id: string
  productId: string
  pricePhp: string
  stockStatus: string
  customName?: string
  customCapacityLiters?: string
  customCategoryId?: string
  customBrand?: string
}

interface ContributeFormProps {
  products: ProductDTO[]
  categories: CategoryDTO[]
}

export function ContributeForm({ products, categories }: ContributeFormProps) {
  const [isPending, startTransition] = useTransition()

  // Step 1: Location & Pin State
  const [latitude, setLatitude] = useState(DEFAULT_MAP_CENTER[0])
  const [longitude, setLongitude] = useState(DEFAULT_MAP_CENTER[1])
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<GeocodingSuggestion[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Step 2: Store Details State
  const [name, setName] = useState('')
  const [municipality, setMunicipality] = useState(PILOT_MUNICIPALITY)
  const [barangay, setBarangay] = useState('')
  const [addressLine, setAddressLine] = useState('')
  const [province, setProvince] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [openingHours, setOpeningHours] = useState('')
  const [delivers, setDelivers] = useState(false)
  const [deliveryFeePhp, setDeliveryFeePhp] = useState('')
  const [description, setDescription] = useState('')

  // Step 3: Photo State
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)

  // Step 4: Products State
  const [productRows, setProductRows] = useState<ProductRow[]>([
    { id: '1', productId: products[0]?.id ?? '', pricePhp: '', stockStatus: 'available' },
  ])

  // Form feedback state
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [submissionSuccess, setSubmissionSuccess] = useState<{
    storeId: string
    duplicateWarnings: number
  } | null>(null)

  // Debounced Photon geocoding search handler
  const handleSearchChange = (val: string) => {
    setSearchQuery(val)
    if (val.trim().length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
      return
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true)
      const results = await searchAddressAction(val)
      setSuggestions(results)
      setIsSearching(false)
      setShowSuggestions(results.length > 0)
    }, 350)
  }

  const handleSelectSuggestion = (suggestion: GeocodingSuggestion) => {
    setLatitude(Number(suggestion.lat.toFixed(6)))
    setLongitude(Number(suggestion.lng.toFixed(6)))

    if (suggestion.city || suggestion.district) {
      setMunicipality(suggestion.city ?? PILOT_MUNICIPALITY)
    }
    if (suggestion.district) {
      setBarangay(suggestion.district)
    }
    if (suggestion.street || suggestion.name) {
      setAddressLine(suggestion.street ?? suggestion.name ?? '')
    }
    if (suggestion.state) {
      setProvince(suggestion.state)
    }

    setSearchQuery(suggestion.label)
    setShowSuggestions(false)
  }

  // Photo change handler
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setPhotoError(null)

    if (!file) {
      setPhotoFile(null)
      setPhotoPreview(null)
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Photo must be 5 MB or smaller.')
      return
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setPhotoError('Only JPEG, PNG, or WebP images are allowed.')
      return
    }

    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = () => setPhotoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  // Product rows helpers
  const handleAddProduct = () => {
    setProductRows((prev) => [
      ...prev,
      {
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        productId: products[0]?.id ?? '',
        pricePhp: '',
        stockStatus: 'available',
      },
    ])
  }

  const handleRemoveProduct = (id: string) => {
    setProductRows((prev) => prev.filter((p) => p.id !== id))
  }

  const handleUpdateProduct = (id: string, field: keyof ProductRow, value: string) => {
    setProductRows((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)))
  }

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setFieldErrors({})

    if (!name.trim()) {
      setFieldErrors({ name: ['Store name is required'] })
      return
    }

    const formData = new FormData()
    formData.append('name', name.trim())
    formData.append('municipality', municipality.trim())
    if (barangay.trim()) formData.append('barangay', barangay.trim())
    if (addressLine.trim()) formData.append('address_line', addressLine.trim())
    if (province.trim()) formData.append('province', province.trim())
    formData.append('latitude', String(latitude))
    formData.append('longitude', String(longitude))
    if (contactNumber.trim()) formData.append('contact_number', contactNumber.trim())
    if (openingHours.trim()) formData.append('opening_hours', openingHours.trim())
    formData.append('delivers', String(delivers))
    if (delivers && deliveryFeePhp) formData.append('delivery_fee_php', deliveryFeePhp)
    if (description.trim()) formData.append('description', description.trim())

    if (photoFile) {
      formData.append('photo', photoFile)
    }

    // Filter valid products
    const validProducts = productRows
      .filter((p) => p.productId)
      .map((p) => {
        if (p.productId === 'other') {
          return {
            productId: 'other',
            isCustom: true,
            customName: p.customName?.trim() || 'Custom Container',
            customCapacityLiters: p.customCapacityLiters ? Number(p.customCapacityLiters) : null,
            customCategoryId: p.customCategoryId || categories[0]?.id,
            customBrand: p.customBrand?.trim() || null,
            currentPricePhp: p.pricePhp ? Number(p.pricePhp) : null,
            stockStatus: p.stockStatus,
          }
        }
        return {
          productId: p.productId,
          isCustom: false,
          currentPricePhp: p.pricePhp ? Number(p.pricePhp) : null,
          stockStatus: p.stockStatus,
        }
      })

    if (validProducts.length > 0) {
      formData.append('products', JSON.stringify(validProducts))
    }

    startTransition(async () => {
      const result = await submitStoreAction(formData)
      if (result.success) {
        setSubmissionSuccess({
          storeId: result.data.id,
          duplicateWarnings: result.data.duplicateWarnings,
        })
      } else {
        setFormError(result.error)
        if (result.fieldErrors) setFieldErrors(result.fieldErrors)
      }
    })
  }

  // Success Screen
  if (submissionSuccess) {
    return (
      <div
        role="status"
        aria-labelledby="success-heading"
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          padding: '2.5rem 1.5rem',
          maxWidth: '560px',
          margin: '2rem auto',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(22, 163, 74, 0.1)',
            color: 'var(--color-success)',
            fontSize: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem auto',
          }}
        >
          ✓
        </div>

        <h2 id="success-heading" style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem' }}>
          Store Submitted for Review!
        </h2>

        <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
          Thank you for helping the community! Your submission for <strong>{name}</strong> has been received and marked as{' '}
          <strong style={{ color: 'var(--color-warning)' }}>Pending Review</strong>. It will be verified by a moderator
          before appearing publicly on the interactive map.
        </p>

        {submissionSuccess.duplicateWarnings > 0 && (
          <div
            style={{
              backgroundColor: 'rgba(217, 119, 6, 0.08)',
              border: '1px solid rgba(217, 119, 6, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem',
              color: 'var(--color-warning)',
              fontSize: '0.85rem',
              marginBottom: '1.5rem',
              textAlign: 'left',
            }}
          >
            ⚠️ <strong>Duplicate Note:</strong> {submissionSuccess.duplicateWarnings} store(s) already exist near these
            coordinates. A moderator will review whether to merge or approve this location.
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
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
            }}
          >
            Explore Map 🗺️
          </Link>

          <button
            type="button"
            onClick={() => {
              setSubmissionSuccess(null)
              setName('')
              setAddressLine('')
              setBarangay('')
              setPhotoFile(null)
              setPhotoPreview(null)
              setProductRows([
                { id: '1', productId: products[0]?.id ?? '', pricePhp: '', stockStatus: 'available' },
              ])
            }}
            style={{
              backgroundColor: 'var(--surface-elevated)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
              padding: '0.65rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            Submit Another Store +
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Banner Alert on Form Error */}
      {formError && (
        <div
          role="alert"
          style={{
            backgroundColor: 'rgba(220, 38, 38, 0.1)',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '0.875rem 1rem',
            color: 'var(--color-danger)',
            fontSize: '0.9rem',
          }}
        >
          ❌ {formError}
        </div>
      )}

      {/* STEP 1: Pin Location & Address Search */}
      <section
        aria-labelledby="step-1-heading"
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          padding: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '1.25rem' }}>📍</span>
          <h2 id="step-1-heading" style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
            1. Pin Store Location
          </h2>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--muted)', margin: '0 0 1.25rem 0' }}>
          Search an address or tap anywhere on the map to set the exact coordinates of the water supply shop.
        </p>

        {/* Address Search Bar */}
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <label htmlFor="address-search" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
            Search Address / Landmark (Photon by Komoot):
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="address-search"
              type="search"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="e.g. Barangay San Antonio, hardware store, public market..."
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface-elevated)',
                color: 'var(--foreground)',
                fontSize: '0.9rem',
              }}
            />
            {isSearching && (
              <span style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', color: 'var(--muted)' }}>
                Searching...
              </span>
            )}
          </div>

          {/* Autocomplete Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <ul
              role="listbox"
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                margin: '0.25rem 0 0 0',
                padding: '0.25rem 0',
                listStyle: 'none',
                zIndex: 500,
                maxHeight: '220px',
                overflowY: 'auto',
              }}
            >
              {suggestions.map((s, idx) => (
                <li key={idx}>
                  <button
                    type="button"
                    onClick={() => handleSelectSuggestion(s)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 1rem',
                      textAlign: 'left',
                      background: 'none',
                      border: 'none',
                      fontSize: '0.85rem',
                      color: 'var(--foreground)',
                      cursor: 'pointer',
                      borderBottom: idx < suggestions.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    📍 {s.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Leaflet PinMap */}
        <div style={{ height: '360px', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)', marginBottom: '1rem' }}>
          <DynamicPinMap
            latitude={latitude}
            longitude={longitude}
            onCoordinatesChange={(lat, lng) => {
              setLatitude(lat)
              setLongitude(lng)
            }}
          />
        </div>

        {/* Selected Coordinates Readout / Editable fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label htmlFor="latitude" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.25rem' }}>
              Latitude:
            </label>
            <input
              id="latitude"
              type="number"
              step="any"
              value={latitude}
              onChange={(e) => setLatitude(Number(e.target.value))}
              required
              style={{
                width: '100%',
                padding: '0.45rem 0.65rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface-elevated)',
                color: 'var(--foreground)',
                fontSize: '0.85rem',
              }}
            />
          </div>

          <div>
            <label htmlFor="longitude" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.25rem' }}>
              Longitude:
            </label>
            <input
              id="longitude"
              type="number"
              step="any"
              value={longitude}
              onChange={(e) => setLongitude(Number(e.target.value))}
              required
              style={{
                width: '100%',
                padding: '0.45rem 0.65rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface-elevated)',
                color: 'var(--foreground)',
                fontSize: '0.85rem',
              }}
            />
          </div>
        </div>
      </section>

      {/* STEP 2: Store Information */}
      <section
        aria-labelledby="step-2-heading"
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          padding: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '1.25rem' }}>🏪</span>
          <h2 id="step-2-heading" style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
            2. Store Details
          </h2>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--muted)', margin: '0 0 1.25rem 0' }}>
          Provide business information so residents can locate and contact the store.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Store Name */}
          <div>
            <label htmlFor="store-name" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Store Name <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              id="store-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. San Pedro Hardware & Water Supply"
              required
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: fieldErrors.name ? '1px solid var(--color-danger)' : '1px solid var(--border)',
                backgroundColor: 'var(--surface-elevated)',
                color: 'var(--foreground)',
                fontSize: '0.9rem',
              }}
            />
            {fieldErrors.name && (
              <p style={{ color: 'var(--color-danger)', fontSize: '0.75rem', margin: '0.25rem 0 0 0' }}>
                {fieldErrors.name[0]}
              </p>
            )}
          </div>

          {/* Municipality & Barangay */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label htmlFor="municipality" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Municipality / City <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                id="municipality"
                type="text"
                value={municipality}
                onChange={(e) => setMunicipality(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface-elevated)',
                  color: 'var(--foreground)',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            <div>
              <label htmlFor="barangay" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Barangay
              </label>
              <input
                id="barangay"
                type="text"
                value={barangay}
                onChange={(e) => setBarangay(e.target.value)}
                placeholder="e.g. Barangay San Antonio"
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface-elevated)',
                  color: 'var(--foreground)',
                  fontSize: '0.9rem',
                }}
              />
            </div>
          </div>

          {/* Street Address Line */}
          <div>
            <label htmlFor="address-line" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Street Address / Landmark Details
            </label>
            <input
              id="address-line"
              type="text"
              value={addressLine}
              onChange={(e) => setAddressLine(e.target.value)}
              placeholder="e.g. 142 Rizal Avenue, beside Public Market"
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface-elevated)',
                color: 'var(--foreground)',
                fontSize: '0.9rem',
              }}
            />
          </div>

          {/* Contact & Hours */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label htmlFor="contact-number" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Contact Phone / Mobile
              </label>
              <input
                id="contact-number"
                type="tel"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="e.g. 0917-123-4567"
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface-elevated)',
                  color: 'var(--foreground)',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            <div>
              <label htmlFor="opening-hours" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Opening Hours
              </label>
              <input
                id="opening-hours"
                type="text"
                value={openingHours}
                onChange={(e) => setOpeningHours(e.target.value)}
                placeholder="e.g. Mon-Sat 8:00 AM - 6:00 PM"
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface-elevated)',
                  color: 'var(--foreground)',
                  fontSize: '0.9rem',
                }}
              />
            </div>
          </div>

          {/* Delivery Option */}
          <div style={{ backgroundColor: 'var(--surface-elevated)', padding: '0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
              <input
                type="checkbox"
                checked={delivers}
                onChange={(e) => setDelivers(e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              <span>🚚 Store offers delivery for water containers/drums</span>
            </label>

            {delivers && (
              <div style={{ marginTop: '0.75rem', paddingLeft: '1.5rem' }}>
                <label htmlFor="delivery-fee" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Delivery Fee in PHP (Leave blank if free or depends on distance):
                </label>
                <input
                  id="delivery-fee"
                  type="number"
                  step="0.01"
                  min="0"
                  value={deliveryFeePhp}
                  onChange={(e) => setDeliveryFeePhp(e.target.value)}
                  placeholder="e.g. 50.00"
                  style={{
                    maxWidth: '180px',
                    padding: '0.45rem 0.65rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--foreground)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>
            )}
          </div>

          {/* Description / Notes */}
          <div>
            <label htmlFor="description" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Additional Notes / Description (Optional)
            </label>
            <textarea
              id="description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Near corner of Rizal St, stocks 200L drums regularly"
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface-elevated)',
                color: 'var(--foreground)',
                fontSize: '0.9rem',
              }}
            />
          </div>

          {/* Optional Storefront Photo */}
          <div>
            <label htmlFor="photo-upload" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Storefront Photo (Optional — max 5 MB, JPEG/PNG/WebP):
            </label>
            <input
              id="photo-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
              style={{ fontSize: '0.85rem' }}
            />
            {photoError && (
              <p style={{ color: 'var(--color-danger)', fontSize: '0.75rem', margin: '0.25rem 0 0 0' }}>
                {photoError}
              </p>
            )}

            {photoPreview && (
              <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoPreview}
                  alt="Storefront Preview"
                  style={{ width: '120px', height: '90px', objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setPhotoFile(null)
                    setPhotoPreview(null)
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-danger)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}
                >
                  Remove Photo ×
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* STEP 3: Products Available at this Store */}
      <section
        aria-labelledby="step-3-heading"
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          padding: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>💧</span>
            <h2 id="step-3-heading" style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
              3. Products & Prices (Optional)
            </h2>
          </div>

          <button
            type="button"
            onClick={handleAddProduct}
            style={{
              backgroundColor: 'var(--surface-elevated)',
              color: 'var(--color-brand-600)',
              border: '1px solid var(--border)',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.825rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            + Add Another Product
          </button>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--muted)', margin: '0 0 1.25rem 0' }}>
          List water containers, drums, buckets, or tanks available at this store with their current prices.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {productRows.map((row) => (
            <div
              key={row.id}
              style={{
                backgroundColor: 'var(--surface-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr)) auto',
                gap: '0.75rem',
                alignItems: 'end',
              }}
            >
              {/* Product selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Product Item:
                </label>
                <select
                  value={row.productId}
                  onChange={(e) => {
                    const val = e.target.value
                    handleUpdateProduct(row.id, 'productId', val)
                    if (val === 'other' && !row.customCategoryId) {
                      handleUpdateProduct(row.id, 'customCategoryId', categories[0]?.id || '')
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.65rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--foreground)',
                    fontSize: '0.85rem',
                  }}
                >
                  <optgroup label="Standard Catalog Products">
                    {products.map((prod) => (
                      <option key={prod.id} value={prod.id}>
                        {prod.name} {prod.capacity_liters ? `(${prod.capacity_liters}L)` : ''}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Other / Custom">
                    <option value="other">✨ Other (Specify Name & Liters)...</option>
                  </optgroup>
                </select>
              </div>

              {/* Price in PHP */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Price in PHP (₱):
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={row.pricePhp}
                  onChange={(e) => handleUpdateProduct(row.id, 'pricePhp', e.target.value)}
                  placeholder="e.g. 85.00"
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.65rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--foreground)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              {/* Stock status */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Stock Status:
                </label>
                <select
                  value={row.stockStatus}
                  onChange={(e) => handleUpdateProduct(row.id, 'stockStatus', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.65rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--foreground)',
                    fontSize: '0.85rem',
                  }}
                >
                  <option value="available">Available (In Stock)</option>
                  <option value="limited">Limited Stock</option>
                  <option value="sold_out">Sold Out</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>

              {/* Remove button */}
              {productRows.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveProduct(row.id)}
                  title="Remove this product item"
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: 'var(--color-danger)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.45rem 0.65rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    alignSelf: 'end',
                  }}
                >
                  ×
                </button>
              )}

              {/* Custom Product Specification (Name, Liters, Category, Brand) */}
              {row.productId === 'other' && (
                <div
                  style={{
                    gridColumn: '1 / -1',
                    backgroundColor: 'rgba(37, 99, 235, 0.04)',
                    border: '1px dashed var(--color-brand-600)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem 1rem',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                    gap: '0.75rem',
                    marginTop: '0.25rem',
                  }}
                >
                  {/* Custom Product Name */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--color-brand-600)' }}>
                      Product Name <span style={{ color: 'var(--color-danger)' }}>*</span>:
                    </label>
                    <input
                      type="text"
                      value={row.customName ?? ''}
                      onChange={(e) => handleUpdateProduct(row.id, 'customName', e.target.value)}
                      placeholder="e.g. Slim Space-Saver Drum"
                      required
                      style={{
                        width: '100%',
                        padding: '0.45rem 0.65rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--surface)',
                        color: 'var(--foreground)',
                        fontSize: '0.85rem',
                      }}
                    />
                  </div>

                  {/* How Many Liters */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--color-brand-600)' }}>
                      How Many Liters <span style={{ color: 'var(--color-danger)' }}>*</span>:
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={row.customCapacityLiters ?? ''}
                      onChange={(e) => handleUpdateProduct(row.id, 'customCapacityLiters', e.target.value)}
                      placeholder="e.g. 50, 75, 120, 1000"
                      required
                      style={{
                        width: '100%',
                        padding: '0.45rem 0.65rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--surface)',
                        color: 'var(--foreground)',
                        fontSize: '0.85rem',
                      }}
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                      Category:
                    </label>
                    <select
                      value={row.customCategoryId ?? (categories[0]?.id || '')}
                      onChange={(e) => handleUpdateProduct(row.id, 'customCategoryId', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.45rem 0.65rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--surface)',
                        color: 'var(--foreground)',
                        fontSize: '0.85rem',
                      }}
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Brand */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                      Brand (Optional):
                    </label>
                    <input
                      type="text"
                      value={row.customBrand ?? ''}
                      onChange={(e) => handleUpdateProduct(row.id, 'customBrand', e.target.value)}
                      placeholder="e.g. Megabox, Orocan"
                      style={{
                        width: '100%',
                        padding: '0.45rem 0.65rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--surface)',
                        color: 'var(--foreground)',
                        fontSize: '0.85rem',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Submit Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', alignItems: 'center' }}>
        <Link
          href="/map"
          style={{
            color: 'var(--muted)',
            textDecoration: 'none',
            fontSize: '0.9rem',
            fontWeight: 500,
          }}
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={isPending}
          style={{
            backgroundColor: 'var(--color-brand-600)',
            color: '#ffffff',
            border: 'none',
            padding: '0.75rem 1.75rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: isPending ? 'wait' : 'pointer',
            opacity: isPending ? 0.7 : 1,
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          {isPending ? 'Submitting Store...' : 'Submit Store for Review ✓'}
        </button>
      </div>
    </form>
  )
}
