'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface PinMapProps {
  latitude: number
  longitude: number
  onCoordinatesChange: (lat: number, lng: number) => void
  tileUrl?: string
  tileAttribution?: string
}

function createPinIcon() {
  const svg = `
    <div style="
      cursor: grab;
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: transform 0.1s ease;
      filter: drop-shadow(0 6px 8px rgba(0, 0, 0, 0.35));
    ">
      <svg width="38" height="48" viewBox="0 0 38 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 0C8.50659 0 0 8.50659 0 19C0 30.5 19 48 19 48C19 48 38 30.5 38 19C38 8.50659 29.4934 0 19 0Z" fill="#2563eb"/>
        <path d="M19 2C9.61116 2 2 9.61116 2 19C2 28.5 17.5 44 19 45.5C20.5 44 36 28.5 36 19C36 9.61116 28.3888 2 19 2Z" fill="#1d4ed8"/>
        <circle cx="19" cy="19" r="13" fill="#ffffff"/>
        <!-- Plus / Target pin glyph -->
        <circle cx="19" cy="19" r="6" fill="#2563eb"/>
      </svg>
      <div style="
        background: #1d4ed8;
        color: #ffffff;
        font-size: 10px;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: 9999px;
        margin-top: -6px;
        white-space: nowrap;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      ">
        DRAG ME
      </div>
    </div>
  `

  return L.divIcon({
    html: svg,
    className: 'custom-pin-drop',
    iconSize: [38, 56],
    iconAnchor: [19, 48],
  })
}

export default function PinMap({
  latitude,
  longitude,
  onCoordinatesChange,
  tileUrl = 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png',
  tileAttribution = '© Stadia Maps © OpenStreetMap contributors',
}: PinMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [geoNotice, setGeoNotice] = useState<string | null>(null)

  // Explicit geolocation with low-accuracy fallback
  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoNotice('Geolocation is not supported by your browser.')
      return
    }

    setIsLocating(true)
    setGeoNotice(null)

    const onFound = (pos: GeolocationPosition) => {
      setIsLocating(false)
      const lat = Number(pos.coords.latitude.toFixed(6))
      const lng = Number(pos.coords.longitude.toFixed(6))
      onCoordinatesChange(lat, lng)

      if (mapRef.current) {
        mapRef.current.flyTo([lat, lng], 16, { animate: true, duration: 1 })
      }
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng])
      }
    }

    const onFailed = (err: GeolocationPositionError) => {
      if (err.code === err.TIMEOUT || err.code === err.POSITION_UNAVAILABLE) {
        navigator.geolocation.getCurrentPosition(
          onFound,
          (fallbackErr) => {
            setIsLocating(false)
            if (fallbackErr.code === fallbackErr.PERMISSION_DENIED) {
              setGeoNotice('Location permission was denied. Tap or drag anywhere on the map to place the pin.')
            } else {
              setGeoNotice('Unable to fetch location. Please place the pin manually on the map.')
            }
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 120000 },
        )
        return
      }

      setIsLocating(false)
      if (err.code === err.PERMISSION_DENIED) {
        setGeoNotice('Location permission was denied. Tap or drag anywhere on the map to place the pin.')
      } else {
        setGeoNotice('Unable to fetch location. Please place the pin manually on the map.')
      }
    }

    navigator.geolocation.getCurrentPosition(
      onFound,
      onFailed,
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    )
  }, [onCoordinatesChange])

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const initialPos: [number, number] = [latitude, longitude]
    const map = L.map(mapContainerRef.current, {
      center: initialPos,
      zoom: 15,
      zoomControl: false,
    })

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    L.tileLayer(tileUrl, {
      attribution: tileAttribution,
      maxZoom: 19,
    }).addTo(map)

    // Add draggable marker
    const marker = L.marker(initialPos, {
      draggable: true,
      icon: createPinIcon(),
      title: 'Store Location (Drag to adjust)',
    }).addTo(map)

    // Handle marker drag
    marker.on('dragend', () => {
      const pos = marker.getLatLng()
      onCoordinatesChange(Number(pos.lat.toFixed(6)), Number(pos.lng.toFixed(6)))
    })

    // Handle map click to drop/move pin
    map.on('click', (e: L.LeafletMouseEvent) => {
      const lat = Number(e.latlng.lat.toFixed(6))
      const lng = Number(e.latlng.lng.toFixed(6))
      marker.setLatLng([lat, lng])
      onCoordinatesChange(lat, lng)
      map.panTo([lat, lng], { animate: true })
    })

    mapRef.current = map
    markerRef.current = marker

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync external coordinate changes (e.g. from geocoding search)
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return
    const currentMarkerPos = markerRef.current.getLatLng()

    // Only update if difference is meaningful to prevent jumpy movement
    const latDiff = Math.abs(currentMarkerPos.lat - latitude)
    const lngDiff = Math.abs(currentMarkerPos.lng - longitude)

    if (latDiff > 0.0001 || lngDiff > 0.0001) {
      markerRef.current.setLatLng([latitude, longitude])
      mapRef.current.panTo([latitude, longitude], { animate: true })
    }
  }, [latitude, longitude])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '340px' }}>
      <div
        ref={mapContainerRef}
        aria-label="Map for selecting store coordinates"
        style={{
          width: '100%',
          height: '100%',
          minHeight: '340px',
          borderRadius: 'var(--radius-lg)',
          zIndex: 1,
        }}
      />

      {/* Floating control overlay */}
      <div
        style={{
          position: 'absolute',
          top: '0.75rem',
          right: '0.75rem',
          zIndex: 400,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem',
        }}
      >
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={isLocating}
          aria-label="Set pin to current location"
          style={{
            backgroundColor: 'var(--surface)',
            color: 'var(--color-brand-600)',
            border: '1px solid var(--border)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            borderRadius: 'var(--radius-md)',
            padding: '0.45rem 0.75rem',
            fontSize: '0.825rem',
            fontWeight: 600,
            cursor: isLocating ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            transition: 'background-color 0.15s',
          }}
        >
          <span>{isLocating ? '⏳' : '📍'}</span>
          <span>{isLocating ? 'Locating...' : 'Use My Location'}</span>
        </button>
      </div>

      {/* Helper instruction tooltip bar */}
      <div
        style={{
          position: 'absolute',
          bottom: '0.75rem',
          left: '0.75rem',
          zIndex: 400,
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          color: '#ffffff',
          borderRadius: 'var(--radius-md)',
          padding: '0.35rem 0.65rem',
          fontSize: '0.75rem',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
        }}
      >
        <span>👆</span>
        <span>Tap map or drag pin to position</span>
      </div>

      {/* Geolocation notice banner */}
      {geoNotice && (
        <div
          role="status"
          style={{
            position: 'absolute',
            top: '0.75rem',
            left: '0.75rem',
            zIndex: 400,
            backgroundColor: 'var(--surface)',
            color: 'var(--color-warning)',
            border: '1px solid var(--border)',
            padding: '0.4rem 0.65rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.75rem',
            maxWidth: '260px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          }}
        >
          <span>⚠️ {geoNotice}</span>
        </div>
      )}
    </div>
  )
}
