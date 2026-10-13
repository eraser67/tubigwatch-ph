import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getListingsForComparison, getCategories } from '@/lib/dal/products'
import { CompareView } from '@/components/compare/CompareView'

export const metadata: Metadata = {
  title: 'Compare Prices & Storage Containers — TubigWatch PH',
  description:
    'Compare real-time prices, stock availability, and verified hardware stores for water storage containers, buckets, drums, and tanks.',
}

function CompareSkeleton() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      <div style={{ height: '38px', width: '320px', backgroundColor: 'var(--surface-elevated)', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }} />
      <div style={{ height: '140px', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', marginBottom: '1.5rem', border: '1px solid var(--border)' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {[1, 2].map((i) => (
          <div key={i} style={{ height: '220px', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }} />
        ))}
      </div>
    </div>
  )
}

async function CompareContent() {
  const [listings, categories] = await Promise.all([
    getListingsForComparison(),
    getCategories(),
  ])

  return <CompareView listings={listings} categories={categories} />
}

export default function ComparePage() {
  return (
    <Suspense fallback={<CompareSkeleton />}>
      <CompareContent />
    </Suspense>
  )
}
