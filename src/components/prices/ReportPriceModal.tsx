'use client'

import { useState, useTransition } from 'react'
import { submitPriceReportAction } from '@/app/actions/prices'

interface ReportPriceModalProps {
  listingId: string
  productName: string
  currentPrice: number | null
  currentStock: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function ReportPriceModal({
  listingId,
  productName,
  currentPrice,
  currentStock,
  isOpen,
  onClose,
  onSuccess,
}: ReportPriceModalProps) {
  const [isPending, startTransition] = useTransition()
  const [price, setPrice] = useState(currentPrice ? String(currentPrice) : '')
  const [stockStatus, setStockStatus] = useState(currentStock || 'available')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successInfo, setSuccessInfo] = useState<{ accepted: boolean } | null>(null)

  if (!isOpen) return null

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setPhotoFile(null)
      setPhotoPreview(null)
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Evidence photo must be 5 MB or smaller.')
      return
    }

    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = () => setPhotoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!price || Number(price) <= 0) {
      setErrorMsg('Please enter a valid price in PHP greater than 0.')
      return
    }

    const formData = new FormData()
    formData.append('listing_id', listingId)
    formData.append('reported_price_php', price)
    formData.append('stock_status', stockStatus)

    if (photoFile) {
      formData.append('photo', photoFile)
    }

    startTransition(async () => {
      const res = await submitPriceReportAction(formData)
      if (res.success) {
        setSuccessInfo({ accepted: res.data.accepted })
        onSuccess?.()
      } else {
        setErrorMsg(res.error)
      }
    })
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
          maxWidth: '460px',
          width: '100%',
          padding: '1.75rem',
          position: 'relative',
          animation: 'fadeIn 0.15s ease-out',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-brand-600)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Report Price Update
            </span>
            <h2 id="report-modal-title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0.2rem 0 0 0' }}>
              {productName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              color: 'var(--muted)',
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {successInfo ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                backgroundColor: 'rgba(22, 163, 74, 0.1)',
                color: 'var(--color-success)',
                fontSize: '1.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto',
              }}
            >
              ✓
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              {successInfo.accepted ? 'Price Updated Immediately!' : 'Price Report Submitted!'}
            </h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              {successInfo.accepted
                ? 'Your trusted contributor report was automatically accepted and the public listing has been refreshed.'
                : 'Thank you for keeping TubigWatch PH updated! Your price report is in the queue and will be verified by a moderator.'}
            </p>
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: 'var(--color-brand-600)',
                color: '#ffffff',
                border: 'none',
                padding: '0.55rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            {errorMsg && (
              <div
                role="alert"
                style={{
                  backgroundColor: 'rgba(220, 38, 38, 0.1)',
                  color: 'var(--color-danger)',
                  padding: '0.6rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.825rem',
                }}
              >
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Current Price info */}
            {currentPrice !== null && (
              <div
                style={{
                  backgroundColor: 'var(--surface-elevated)',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ color: 'var(--muted)' }}>Current Reported Price:</span>
                <span style={{ fontWeight: 700, color: 'var(--foreground)' }}>₱{currentPrice.toFixed(2)}</span>
              </div>
            )}

            {/* New Price */}
            <div>
              <label htmlFor="reported-price" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                New Price in PHP (₱) <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                id="reported-price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 95.00"
                required
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface-elevated)',
                  color: 'var(--foreground)',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                }}
              />
            </div>

            {/* Stock status */}
            <div>
              <label htmlFor="stock-status" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Current Stock Availability
              </label>
              <select
                id="stock-status"
                value={stockStatus}
                onChange={(e) => setStockStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface-elevated)',
                  color: 'var(--foreground)',
                  fontSize: '0.9rem',
                }}
              >
                <option value="available">Available (In Stock)</option>
                <option value="limited">Limited Stock (Selling Fast)</option>
                <option value="sold_out">Sold Out / Out of Stock</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>

            {/* Evidence photo (optional) */}
            <div>
              <label htmlFor="evidence-photo" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Evidence Photo (Optional — price tag, shelf sign, receipt)
              </label>
              <input
                id="evidence-photo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
                style={{ fontSize: '0.825rem' }}
              />
              {photoPreview && (
                <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoPreview}
                    alt="Evidence Preview"
                    style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoFile(null)
                      setPhotoPreview(null)
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '0.8rem' }}
                  >
                    Remove ×
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  backgroundColor: 'var(--surface-elevated)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)',
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isPending}
                style={{
                  backgroundColor: 'var(--color-brand-600)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.5rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  cursor: isPending ? 'wait' : 'pointer',
                  opacity: isPending ? 0.7 : 1,
                }}
              >
                {isPending ? 'Submitting...' : 'Submit Update ✓'}
              </button>
            </div>
          </form>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
