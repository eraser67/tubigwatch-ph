'use server'

export interface GeocodingSuggestion {
  label: string
  lat: number
  lng: number
  name?: string
  street?: string
  district?: string
  city?: string
  state?: string
}

/**
 * Forward geocoding action using Photon by Komoot (ADR-08).
 * Biased towards the Philippines / default pilot municipality.
 * Public endpoint, gracefully handles failures.
 */
export async function searchAddressAction(query: string): Promise<GeocodingSuggestion[]> {
  const trimmed = query.trim()
  if (trimmed.length < 3) return []

  try {
    // Photon API forward geocode, biased near Manila (14.5995, 120.9842)
    const url = new URL('https://photon.komoot.io/api/')
    url.searchParams.set('q', trimmed)
    url.searchParams.set('limit', '5')
    url.searchParams.set('lat', '14.5995')
    url.searchParams.set('lon', '120.9842')

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'TubigWatch-PH/1.0 (Community Water Finder)',
        Accept: 'application/json',
      },
      next: { revalidate: 3600 }, // Cache geocode results for 1 hour
    })

    if (!response.ok) {
      console.warn('Photon geocoding returned non-200:', response.status)
      return []
    }

    const data = await response.json()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const features: any[] = data.features ?? []

    return features
      .filter((f) => f.geometry && Array.isArray(f.geometry.coordinates))
      .map((f) => {
        const [lon, lat] = f.geometry.coordinates
        const p = f.properties ?? {}

        const parts = [
          p.name,
          p.street,
          p.district,
          p.city ?? p.county,
          p.state,
          p.country,
        ].filter(Boolean)

        const label = parts.length > 0 ? parts.join(', ') : `${lat.toFixed(5)}, ${lon.toFixed(5)}`

        return {
          label,
          lat,
          lng: lon,
          name: p.name,
          street: p.street,
          district: p.district,
          city: p.city ?? p.county,
          state: p.state,
        }
      })
  } catch (err) {
    console.error('Geocoding search failed:', err)
    return []
  }
}
