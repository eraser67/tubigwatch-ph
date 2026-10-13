import Link from 'next/link'
import type { Metadata } from 'next'
import { APP_NAME, APP_DESCRIPTION, PILOT_MUNICIPALITY } from '@/lib/constants'

export const metadata: Metadata = {
  title: `${APP_NAME} — Water Supply & Price Finder`,
  description: APP_DESCRIPTION,
}

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section
        aria-labelledby="hero-heading"
        style={{
          padding: '4rem 1rem 3rem',
          textAlign: 'center',
          background: 'linear-gradient(180deg, var(--muted-background) 0%, var(--background) 100%)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 500 }}>
            Pilot — {PILOT_MUNICIPALITY}
          </p>
          <h1
            id="hero-heading"
            style={{
              fontWeight: 800,
              fontSize: 'clamp(1.75rem, 5vw, 3rem)',
              lineHeight: 1.15,
              margin: '0 0 1rem',
              color: 'var(--foreground)',
            }}
          >
            💧 Find water containers near you
          </h1>
          <p
            style={{
              color: 'var(--muted)',
              fontSize: '1.05rem',
              margin: '0 0 2rem',
              lineHeight: 1.7,
            }}
          >
            {APP_DESCRIPTION} Compare prices, check stock, and contribute store locations to help your community.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/map"
              id="hero-map-link"
              style={{
                padding: '0.65rem 1.5rem',
                backgroundColor: 'var(--color-brand-600)',
                color: '#fff',
                borderRadius: 'var(--radius-md)',
                fontWeight: 700,
                textDecoration: 'none',
                fontSize: '0.95rem',
              }}
            >
              Browse the map
            </Link>
            <Link
              href="/compare"
              id="hero-compare-link"
              style={{
                padding: '0.65rem 1.5rem',
                backgroundColor: 'transparent',
                color: 'var(--color-brand-600)',
                border: '2px solid var(--color-brand-600)',
                borderRadius: 'var(--radius-md)',
                fontWeight: 700,
                textDecoration: 'none',
                fontSize: '0.95rem',
              }}
            >
              Compare prices
            </Link>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section
        aria-labelledby="features-heading"
        style={{ padding: '3rem 1rem', maxWidth: '900px', margin: '0 auto' }}
      >
        <h2 id="features-heading" className="sr-only">What you can do</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {features.map((f) => (
            <div
              key={f.title}
              style={{
                padding: '1.5rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
              }}
            >
              <p style={{ fontSize: '1.75rem', margin: '0 0 0.75rem' }} aria-hidden="true">{f.icon}</p>
              <h3 style={{ margin: '0 0 0.5rem', fontWeight: 700, fontSize: '1rem' }}>{f.title}</h3>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>{f.description}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

const features = [
  {
    icon: '🗺️',
    title: 'Interactive map',
    description: 'Browse store pins on a live map. Tap a marker to see prices and stock status.',
  },
  {
    icon: '⚖️',
    title: 'Fair price comparison',
    description: 'Compare equivalent products by size and type — not just the cheapest listing.',
  },
  {
    icon: '📍',
    title: 'Add a store',
    description: 'Pin a new store on the map and submit its products for community review.',
  },
  {
    icon: '🕒',
    title: 'Freshness labels',
    description: "Every price shows when it was reported and whether it's been verified.",
  },
]
