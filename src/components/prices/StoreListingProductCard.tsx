'use client'

import { useState } from 'react'
import type { ListingWithProductDTO, PriceHistoryDTO } from '@/lib/dal/products'
import { ReportPriceModal } from './ReportPriceModal'
import { PriceHistoryModal } from './PriceHistoryModal'

interface StoreListingProductCardProps {
  listing: ListingWithProductDTO
  history: PriceHistoryDTO[]
  freshnessDays: number
}

export function StoreListingProductCard({
  listing,
  history,
  freshnessDays,
}: StoreListingProductCardProps) {
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  const now = new Date()
  const reportedDate = listing.last_reported_at ? new Date(listing.last_reported_at) : null
  const confirmedDate = listing.last_confirmed_at ? new Date(listing.last_confirmed_at) : null

  const ageDays = reportedDate
    ? Math.max(0, Math.floor((now.getTime() - reportedDate.getTime()) / (1000 * 60 * 60 * 24)))
    : 999
  const isStale = ageDays > freshnessDays

  return (
    <>
      <div
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '1rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
        }}
      >
        <div>
          {/* Header Badges */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.15rem 0.5rem',
                borderRadius: '9999px',
                backgroundColor:
                  listing.stock_status === 'available'
                    ? 'rgba(22, 163, 74, 0.1)'
                    : listing.stock_status === 'limited'
                      ? 'rgba(217, 119, 6, 0.1)'
                      : 'rgba(220, 38, 38, 0.1)',
                color:
                  listing.stock_status === 'available'
                    ? 'var(--color-success)'
                    : listing.stock_status === 'limited'
                      ? 'var(--color-warning)'
                      : 'var(--color-danger)',
              }}
            >
              {listing.stock_status.toUpperCase()}
            </span>

            {/* Freshness Badge */}
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.15rem 0.5rem',
                borderRadius: '9999px',
                backgroundColor: isStale ? 'rgba(217, 119, 6, 0.12)' : 'rgba(37, 99, 235, 0.1)',
                color: isStale ? 'var(--color-warning)' : 'var(--color-brand-600)',
              }}
            >
              {isStale ? `⚠️ Stale (${ageDays}d ago)` : `✓ Fresh (${ageDays}d ago)`}
            </span>
          </div>

          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.25rem 0', color: 'var(--foreground)' }}>
            {listing.product?.name ?? 'Water Storage Item'}
          </h3>

          {listing.product?.brand && (
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: '0 0 0.5rem 0' }}>
              Brand: {listing.product.brand}
            </p>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>
            {listing.product?.capacity_liters && (
              <span>Capacity: <strong>{listing.product.capacity_liters} Liters</strong></span>
            )}
            {listing.product?.material && <span>• Material: {listing.product.material}</span>}
          </div>

          {/* Timestamps & Audit details */}
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', borderTop: '1px solid var(--border)', paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {reportedDate && (
              <div>
                Reported: <strong>{reportedDate.toLocaleDateString('en-PH')}</strong>
              </div>
            )}
            {confirmedDate && (
              <div>
                Confirmed: <strong>{confirmedDate.toLocaleDateString('en-PH')}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Pricing & Actions */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Current Price
            </span>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-brand-600)' }}>
              {listing.current_price_php != null ? `₱${listing.current_price_php.toFixed(2)}` : 'Inquire'}
            </span>
          </div>

          {isStale && (
            <p style={{ fontSize: '0.75rem', color: 'var(--color-warning)', margin: '0 0 0.75rem 0', lineHeight: 1.4 }}>
              ⚠️ Reported over {freshnessDays} days ago. Please confirm price and availability with the store before visiting.
            </p>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setIsReportOpen(true)}
              style={{
                flex: 1,
                backgroundColor: 'var(--color-brand-600)',
                color: '#ffffff',
                border: 'none',
                padding: '0.45rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.825rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.15s',
              }}
            >
              Update Price 💬
            </button>

            <button
              type="button"
              onClick={() => setIsHistoryOpen(true)}
              title="View immutable price change history"
              style={{
                backgroundColor: 'var(--surface-elevated)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
                padding: '0.45rem 0.65rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.825rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              History ({history.length})
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ReportPriceModal
        listingId={listing.id}
        productName={listing.product?.name ?? 'Product'}
        currentPrice={listing.current_price_php}
        currentStock={listing.stock_status}
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />

      <PriceHistoryModal
        productName={listing.product?.name ?? 'Product'}
        history={history}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    </>
  )
}
