'use client'

import { useState } from 'react'
import { ReportListingModal } from './ReportListingModal'

interface ReportListingButtonProps {
  storeId: string
  storeName: string
}

export function ReportListingButton({ storeId, storeName }: ReportListingButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.4rem',
          padding: '0.5rem 0.85rem',
          backgroundColor: 'transparent',
          color: 'var(--muted)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.85rem',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#ef4444'
          e.currentTarget.style.borderColor = '#fca5a5'
          e.currentTarget.style.backgroundColor = '#fef2f2'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--muted)'
          e.currentTarget.style.borderColor = 'var(--border)'
          e.currentTarget.style.backgroundColor = 'transparent'
        }}
        title="Report inaccurate information, closed store, or incorrect location"
      >
        <span>🚩</span>
        <span>Report Issue</span>
      </button>

      <ReportListingModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        targetTable="stores"
        targetId={storeId}
        targetTitle={storeName}
      />
    </>
  )
}
