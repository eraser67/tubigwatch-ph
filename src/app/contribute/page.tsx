import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getProducts, getCategories } from '@/lib/dal/products'
import { ContributeForm } from '@/components/contribute/ContributeForm'

export const metadata: Metadata = {
  title: 'Add a Water Supply Store — TubigWatch PH',
  description:
    'Contribute a hardware shop or water supply store with map coordinates, product prices, and availability to help your community.',
}

async function ContributeContent() {
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ])

  return <ContributeForm products={products} categories={categories} />
}

function ContributeLoading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', opacity: 0.6 }}>
      <div
        style={{
          height: '360px',
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
        }}
      />
      <div
        style={{
          height: '240px',
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
        }}
      />
    </div>
  )
}

export default function ContributePage() {
  return (
    <div style={{ maxWidth: '840px', margin: '0 auto', padding: '2rem 1rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--foreground)', margin: '0 0 0.5rem 0' }}>
          Add a Water Supply Store
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '1rem', margin: 0, lineHeight: 1.5 }}>
          Help your neighbors find water containers, drums, buckets, and tanks. Place a pin on the map, provide store
          details, and submit for moderator verification.
        </p>
      </header>

      <Suspense fallback={<ContributeLoading />}>
        <ContributeContent />
      </Suspense>
    </div>
  )
}
