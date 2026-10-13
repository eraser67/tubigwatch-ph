import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getApprovedStoresForMap } from '@/lib/dal/stores'
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '@/lib/constants'
import { MapContainer } from '@/components/map/MapContainer'
import { MapSkeleton } from '@/components/map/MapSkeleton'

export const metadata: Metadata = {
  title: 'Water Supply Map — TubigWatch PH',
  description:
    'Browse approved water storage containers, buckets, drums, and tanks from verified hardware stores across the municipality.',
}

async function MapContent() {
  const stores = await getApprovedStoresForMap()

  const tileUrl =
    process.env.NEXT_PUBLIC_MAP_TILE_PROVIDER ||
    'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png'
  const tileAttribution =
    process.env.NEXT_PUBLIC_MAP_TILE_ATTRIBUTION ||
    '© Stadia Maps © OpenStreetMap contributors'

  return (
    <MapContainer
      initialStores={stores}
      initialCenter={DEFAULT_MAP_CENTER}
      initialZoom={DEFAULT_MAP_ZOOM}
      tileUrl={tileUrl}
      tileAttribution={tileAttribution}
    />
  )
}

export default function MapPage() {
  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <h1 className="sr-only">Interactive Water Supply Store Map</h1>
      <Suspense fallback={<MapSkeleton />}>
        <MapContent />
      </Suspense>
    </div>
  )
}
