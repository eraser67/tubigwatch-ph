import type { Metadata } from 'next'
import { EmptyState } from '@/components/feedback/EmptyState'

export const metadata: Metadata = { title: 'Map' }

export default function MapPage() {
  return (
    <section aria-labelledby="map-heading" style={{ padding: '2rem 1rem' }}>
      <h1 id="map-heading" style={{ fontWeight: 700, fontSize: '1.5rem', marginBottom: '1rem' }}>
        Store Map
      </h1>
      <EmptyState
        icon="🗺️"
        title="Map coming in Phase 4"
        message="The interactive Leaflet map with store markers will be built in Phase 4."
      />
    </section>
  )
}
