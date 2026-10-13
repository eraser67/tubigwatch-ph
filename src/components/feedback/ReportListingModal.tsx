'use client'

import { useState, useTransition } from 'react'
import { submitContentReportAction } from '@/app/actions/moderation'

interface ReportListingModalProps {
  targetTable: 'stores' | 'store_product_listings'
  targetId: string
  targetTitle: string
  isOpen: boolean
  onClose: () => void
}

const REPORT_REASONS = [
  { value: 'incorrect_price', label: '💰 Incorrect Price' },
  { value: 'incorrect_location', label: '📍 Incorrect Map Location' },
  { value: 'closed_store', label: '🔒 Store is Closed or Relocated' },
  { value: 'duplicate', label: '👥 Duplicate Store Listing' },
  { value: 'spam', label: '🚫 Spam or Fake Listing' },
  { value: 'other', label: '❓ Other Inaccuracy' },
]

export function ReportListingModal({
  targetTable,
  targetId,
  targetTitle,
  isOpen,
  onClose,
}: ReportListingModalProps) {
  const [reason, setReason] = useState('incorrect_price')
  const [details, setDetails] = useState('')
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    const formData = new FormData()
    formData.append('target_table', targetTable)
    formData.append('target_id', targetId)
    formData.append('reason', reason)
    if (details.trim()) {
      formData.append('details', details.trim())
    }

    startTransition(async () => {
      const result = await submitContentReportAction(formData)
      if (result.success) {
        setIsSubmitted(true)
      } else {
        setErrorMessage(result.error)
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
        zIndex: 1000,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        backdropFilter: 'blur(3px)',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          width: '100%',
          maxWidth: '480px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2 id="report-modal-title" style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>
              Report Inaccurate Information
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: '0.2rem 0 0' }}>
              {targetTitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.25rem',
              cursor: 'pointer',
              color: 'var(--muted)',
              padding: '0.25rem',
            }}
          >
            ✕
          </button>
        </div>

        {isSubmitted ? (
          <div style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem' }}>
              ✅
            </span>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Thank you for your report!
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '1.5rem' }}>
              Our community moderators will review the details and verify the listing coordinates, prices, and status.
            </p>
            <button
              type="button"
              onClick={() => {
                setIsSubmitted(false)
                onClose()
              }}
              style={{
                backgroundColor: 'var(--color-brand-600)',
                color: '#ffffff',
                border: 'none',
                padding: '0.6rem 1.5rem',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {errorMessage && (
              <div
                role="alert"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: 'var(--color-danger)',
                  padding: '0.6rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.825rem',
                }}
              >
                ⚠️ {errorMessage}
              </div>
            )}

            {/* Reason selector */}
            <div>
              <label htmlFor="report-reason" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                What is the issue?
              </label>
              <select
                id="report-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface-elevated)',
                  color: 'var(--foreground)',
                  fontSize: '0.875rem',
                }}
              >
                {REPORT_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Additional details */}
            <div>
              <label htmlFor="report-details" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Additional Details (Optional):
              </label>
              <textarea
                id="report-details"
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="e.g. The store moved to a different barangay, or drums are currently out of stock..."
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface-elevated)',
                  color: 'var(--foreground)',
                  fontSize: '0.875rem',
                  resize: 'vertical',
                }}
              />
            </div>

            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', margin: 0 }}>
              Reports help maintain accurate water container availability across our community. Thank you for your contribution.
            </p>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border)',
                  padding: '0.55rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  color: 'var(--foreground)',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                style={{
                  backgroundColor: 'var(--color-danger)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.55rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: isPending ? 'wait' : 'pointer',
                  opacity: isPending ? 0.7 : 1,
                }}
              >
                {isPending ? 'Submitting...' : 'Submit Report 🚩'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
