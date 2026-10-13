import type { Metadata } from 'next'
import { requireModerator } from '@/lib/dal/auth'
import { getPendingPriceReports } from '@/lib/dal/products'
import { PriceReportQueueClient } from './PriceReportQueueClient'

export const metadata: Metadata = { title: 'Price Report Queue — Admin | TubigWatch' }

export default async function AdminReportsPage() {
  await requireModerator()
  const pendingReports = await getPendingPriceReports().catch(() => [])

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 id="admin-reports-heading" style={{ fontWeight: 800, fontSize: '1.5rem', margin: '0 0 0.35rem 0' }}>
          Price Report Moderation Queue
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: 0 }}>
          Review community-reported price updates. Approving a report updates the active listing price and records an immutable entry in price history. Contributors cannot approve their own submissions.
        </p>
      </div>

      <PriceReportQueueClient initialReports={pendingReports} />
    </div>
  )
}
