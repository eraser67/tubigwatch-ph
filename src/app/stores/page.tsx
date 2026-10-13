import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { getApprovedStoresForMap } from '@/lib/dal/stores'
import { StoreDirectoryClient } from '@/components/stores/StoreDirectoryClient'

export const metadata: Metadata = {
  title: 'Hardware & Water Supply Stores — TubigWatch PH',
  description:
    'Directory of verified and community-reported hardware stores selling water storage containers, buckets, drums, and tanks.',
}

async function StoresList() {
  const stores = await getApprovedStoresForMap()

  if (stores.length === 0) {
    return (
      <div
        style={{
          padding: '3rem',
          textAlign: 'center',
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
        }}
      >
        <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem' }} aria-hidden="true">
          🏪
        </span>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          No approved stores found yet
        </h2>
        <p style={{ color: 'var(--muted)', maxWidth: '400px', margin: '0 auto 1.5rem auto' }}>
          Know a hardware store selling drums or containers in your area? Help the community by contributing!
        </p>
        <Link
          href="/contribute"
          style={{
            display: 'inline-block',
            backgroundColor: 'var(--color-brand-600)',
            color: '#ffffff',
            padding: '0.6rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Add a Store
        </Link>
      </div>
    )
  }

  return <StoreDirectoryClient stores={stores} />
}

function StoresLoading() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1.25rem' }}>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            backgroundColor: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            padding: '1.25rem',
            height: '200px',
            opacity: 0.6,
          }}
        />
      ))}
    </div>
  )
}

export default function StoresPage() {
  return (
    <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--foreground)', margin: '0 0 0.5rem 0' }}>
            Water Supply Stores
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.95rem', margin: 0 }}>
            Find approved hardware and supply shops offering water drums, containers, buckets, and tanks.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link
            href="/compare"
            style={{
              backgroundColor: 'var(--surface-elevated)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
              padding: '0.65rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              fontSize: '0.9rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span>Compare Prices</span>
            <span>⚖️</span>
          </Link>

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
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span>Open Map</span>
            <span>🗺️</span>
          </Link>
        </div>
      </div>

      <Suspense fallback={<StoresLoading />}>
        <StoresList />
      </Suspense>
    </div>
  )
}
