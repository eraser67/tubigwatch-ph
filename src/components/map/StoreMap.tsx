'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { StoreMapDTO } from '@/lib/dal/stores'

interface StoreMapProps {
  stores: StoreMapDTO[]
  selectedStore: StoreMapDTO | null
  onSelectStore: (store: StoreMapDTO | null) => void
  initialCenter: [number, number]
  initialZoom: number
  tileUrl: string
  tileAttribution: string
  userLocation: [number, number] | null
  onUserLocationChange: (loc: [number, number] | null) => void
  onLocationError: (msg: string) => void
}

/** Creates a modern SVG marker icon for a store */
function createStoreMarkerIcon(isSelected: boolean) {
  const pinColor = isSelected ? '#1d4ed8' : '#2563eb'
  const size = isSelected ? 42 : 36
  const height = isSelected ? 50 : 44

  const svg = `
    <div style="
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: transform 0.15s ease-in-out;
      filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3));
    ">
      <svg width="${size}" height="${height}" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 0C8.05887 0 0 8.05887 0 18C0 28.5 18 44 18 44C18 44 36 28.5 36 18C36 8.05887 27.9411 0 18 0Z" fill="${pinColor}"/>
        <path d="M18 2C9.16344 2 2 9.16344 2 18C2 26.5 16.5 40 18 41.5C19.5 40 34 26.5 34 18C34 9.16344 26.8366 2 18 2Z" fill="${pinColor}"/>
        <circle cx="18" cy="18" r="12" fill="#ffffff"/>
        <!-- Water droplet icon -->
        <path d="M18 10C18 10 13 16 13 19C13 21.7614 15.2386 24 18 24C20.7614 24 23 21.7614 23 19C23 16 18 10 18 10Z" fill="${pinColor}"/>
      </svg>
    </div>
  `

  return L.divIcon({
    html: svg,
    className: 'custom-store-pin',
    iconSize: [size, height],
    iconAnchor: [size / 2, height],
    popupAnchor: [0, -height],
  })
}

/** Creates a pulsing radar marker icon for user location */
function createUserLocationIcon() {
  const svg = `
    <div style="position: relative; width: 24px; height: 24px;">
      <div style="
        position: absolute;
        top: 0; left: 0; width: 24px; height: 24px;
        border-radius: 50%;
        background-color: rgba(37, 99, 235, 0.3);
        animation: pulseRadar 1.8s infinite cubic-bezier(0.45, 0, 0.2, 1);
      "></div>
      <div style="
        position: absolute;
        top: 4px; left: 4px; width: 16px; height: 16px;
        border-radius: 50%;
        background-color: #2563eb;
        border: 2px solid #ffffff;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>
    </div>
  `

  return L.divIcon({
    html: svg,
    className: 'custom-user-pin',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

export default function StoreMap({
  stores,
  selectedStore,
  onSelectStore,
  initialCenter,
  initialZoom,
  tileUrl,
  tileAttribution,
  userLocation,
  onUserLocationChange,
  onLocationError,
}: StoreMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const storeMarkersRef = useRef<Map<string, L.Marker>>(new Map())
  const userMarkerRef = useRef<L.Marker | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [tileWarning, setTileWarning] = useState<string | null>(null)

  // Recenter map back to initial or bounds of stores
  const handleRecenter = useCallback(() => {
    if (!mapRef.current) return

    if (stores.length > 0) {
      const bounds = L.latLngBounds(stores.map((s) => [s.latitude, s.longitude]))
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15, animate: true })
    } else {
      mapRef.current.setView(initialCenter, initialZoom, { animate: true })
    }
  }, [stores, initialCenter, initialZoom])

  const onSelectStoreRef = useRef(onSelectStore)
  useEffect(() => {
    onSelectStoreRef.current = onSelectStore
  }, [onSelectStore])

  // Explicit user geolocation trigger with low-accuracy fallback for desktop PCs
  const handleLocateMe = useCallback(() => {
    // Deselect any active store so map view and cards do not focus on the store
    onSelectStoreRef.current(null)

    if (!navigator.geolocation) {
      onLocationError('Geolocation is not supported by your browser.')
      return
    }

    // If userLocation is already set, quickly fly to it
    if (userLocation && mapRef.current) {
      mapRef.current.flyTo(userLocation, 16, { animate: true, duration: 0.8 })
    }

    setIsLocating(true)

    const onCoordsFound = (pos: GeolocationPosition) => {
      setIsLocating(false)
      const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude]
      onUserLocationChange(coords)

      if (mapRef.current) {
        mapRef.current.flyTo(coords, 16, { animate: true, duration: 1.2 })
      }
    }

    const onCoordsFailed = (err: GeolocationPositionError) => {
      // If high-accuracy GPS failed or timed out (common on desktop/laptops), fallback to network/IP geolocation
      if (err.code === err.TIMEOUT || err.code === err.POSITION_UNAVAILABLE) {
        navigator.geolocation.getCurrentPosition(
          onCoordsFound,
          (fallbackErr) => {
            setIsLocating(false)
            let msg = 'Unable to retrieve your location.'
            if (fallbackErr.code === fallbackErr.PERMISSION_DENIED) {
              msg = 'Location permission was denied. Please allow location access in your browser address bar.'
            } else if (fallbackErr.code === fallbackErr.POSITION_UNAVAILABLE) {
              msg = 'Location information is unavailable. Check that Windows Location Service is enabled.'
            } else if (fallbackErr.code === fallbackErr.TIMEOUT) {
              msg = 'Location request timed out. Please try again or search manually.'
            }
            onLocationError(msg)
          },
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 120000,
          },
        )
        return
      }

      setIsLocating(false)
      let msg = 'Unable to retrieve your location.'
      if (err.code === err.PERMISSION_DENIED) {
        msg = 'Location permission was denied. Please allow location access in your browser address bar.'
      } else if (err.code === err.POSITION_UNAVAILABLE) {
        msg = 'Location information is unavailable. Check that location services are enabled.'
      } else if (err.code === err.TIMEOUT) {
        msg = 'Location request timed out. Please try again.'
      }
      onLocationError(msg)
    }

    navigator.geolocation.getCurrentPosition(
      onCoordsFound,
      onCoordsFailed,
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000,
      },
    )
  }, [userLocation, onUserLocationChange, onLocationError])

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: false, // will add custom positioned or default
    })

    // Custom positioned zoom control at bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map)

    // Add Stadia Maps tile layer
    const tileLayer = L.tileLayer(tileUrl, {
      attribution: tileAttribution,
      maxZoom: 19,
    })

    // Gracefully handle tile loading issues
    tileLayer.on('tileerror', () => {
      setTileWarning('Map tiles may be loading slowly or degraded. Markers remain functional.')
    })

    tileLayer.addTo(map)
    mapRef.current = map

    // Deselect store when clicking empty map area
    map.on('click', (e) => {
      // Check if target is not a marker
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const originalTarget = (e as any).originalEvent?.target
      if (originalTarget && originalTarget.closest('.custom-store-pin')) return
      onSelectStoreRef.current(null)
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tileUrl, tileAttribution])

  // Update store markers
  useEffect(() => {
    if (!mapRef.current) return

    const map = mapRef.current
    const currentMarkers = storeMarkersRef.current

    // Remove existing markers
    currentMarkers.forEach((marker) => marker.remove())
    currentMarkers.clear()

    // Add markers for current stores
    stores.forEach((store) => {
      const isSelected = selectedStore?.id === store.id
      const marker = L.marker([store.latitude, store.longitude], {
        icon: createStoreMarkerIcon(isSelected),
        title: store.name,
      })

      marker.on('click', () => {
        onSelectStoreRef.current(store)
        map.panTo([store.latitude, store.longitude], { animate: true })
      })

      marker.addTo(map)
      currentMarkers.set(store.id, marker)
    })
  }, [stores, selectedStore])

  // Update user marker
  useEffect(() => {
    if (!mapRef.current) return
    const map = mapRef.current

    if (userLocation) {
      if (!userMarkerRef.current) {
        userMarkerRef.current = L.marker(userLocation, {
          icon: createUserLocationIcon(),
          zIndexOffset: 1000,
        }).addTo(map)
      } else {
        userMarkerRef.current.setLatLng(userLocation)
      }
    } else if (userMarkerRef.current) {
      userMarkerRef.current.remove()
      userMarkerRef.current = null
    }
  }, [userLocation])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '600px' }}>
      {/* Map container */}
      <div
        ref={mapContainerRef}
        id="leaflet-map"
        aria-label="Water Supply Stores Map"
        style={{
          width: '100%',
          height: '100%',
          minHeight: '600px',
          borderRadius: 'var(--radius-lg)',
          zIndex: 1,
        }}
      />

      {/* Floating Map Actions Overlay (Top-Right) */}
      <div
        style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          zIndex: 400,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        {/* Recenter Button */}
        <button
          type="button"
          onClick={handleRecenter}
          aria-label="Fit all stores in view"
          title="Fit view to show all stores"
          style={{
            backgroundColor: 'var(--surface)',
            color: 'var(--foreground)',
            border: '1px solid var(--border)',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
            borderRadius: 'var(--radius-md)',
            padding: '0.5rem 0.75rem',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            transition: 'background-color 0.15s',
          }}
        >
          <span>🎯</span>
          <span>Fit Stores</span>
        </button>

        {/* Locate Me Button */}
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={isLocating}
          aria-label="Use my location"
          title="Find stores near my location"
          style={{
            backgroundColor: 'var(--surface)',
            color: 'var(--color-brand-600)',
            border: '1px solid var(--border)',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
            borderRadius: 'var(--radius-md)',
            padding: '0.5rem 0.75rem',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: isLocating ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            transition: 'background-color 0.15s',
            opacity: isLocating ? 0.7 : 1,
          }}
        >
          <span>{isLocating ? '⏳' : '📍'}</span>
          <span>{isLocating ? 'Locating...' : 'My Location'}</span>
        </button>
      </div>

      {/* Tile Warning Banner if map tile provider degrades */}
      {tileWarning && (
        <div
          role="status"
          style={{
            position: 'absolute',
            bottom: '2.5rem',
            left: '1rem',
            zIndex: 400,
            backgroundColor: 'rgba(217, 119, 6, 0.9)',
            color: '#ffffff',
            padding: '0.4rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            maxWidth: '300px',
          }}
        >
          <span>⚠️ {tileWarning}</span>
          <button
            type="button"
            onClick={() => setTileWarning(null)}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0 }}
          >
            ×
          </button>
        </div>
      )}

      {/* Embedded CSS for custom Leaflet marker animations */}
      <style>{`
        @keyframes pulseRadar {
          0% { transform: scale(0.6); opacity: 1; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        .leaflet-container {
          font-family: inherit;
        }
        .custom-store-pin:hover svg {
          transform: scale(1.1);
        }
      `}</style>
    </div>
  )
}
