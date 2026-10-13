'use client'

import { useState, useTransition } from 'react'
import type { StoreDTO } from '@/lib/dal/stores'
import { mergeDuplicateStoresAction } from '@/app/actions/moderation'

interface DuplicateMergeClientProps {
  stores: StoreDTO[]
}

export function DuplicateMergeClient({ stores }: DuplicateMergeClientProps) {
  const [duplicateStoreId, setDuplicateStoreId] = useState('')
  const [targetStoreId, setTargetStoreId] = useState('')
  const [reason, setReason] = useState('')
  const [isPending, startTransition] = useTransition()
  const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const duplicateStore = stores.find((s) => s.id === duplicateStoreId)
  const targetStore = stores.find((s) => s.id === targetStoreId)

  const handleMerge = (e: React.FormEvent) => {
    e.preventDefault()
    setResultMessage(null)

    if (!duplicateStoreId || !targetStoreId) {
      setResultMessage({ type: 'error', text: 'Please select both a duplicate store and a target store.' })
      return
    }

    if (duplicateStoreId === targetStoreId) {
      setResultMessage({ type: 'error', text: 'Cannot merge a store into itself. Choose two different stores.' })
      return
    }

    startTransition(async () => {
      const res = await mergeDuplicateStoresAction(duplicateStoreId, targetStoreId, reason)
      if (res.success) {
        setResultMessage({
          type: 'success',
          text: `Successfully merged "${duplicateStore?.name}" into "${targetStore?.name}". Product listings and price history preserved!`,
        })
        setDuplicateStoreId('')
        setReason('')
      } else {
        setResultMessage({ type: 'error', text: res.error })
      }
    })
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
      }}
    >
      {resultMessage && (
        <div
          role="alert"
          style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
            backgroundColor: resultMessage.type === 'success' ? 'rgba(22, 163, 74, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: resultMessage.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          {resultMessage.type === 'success' ? '✅' : '⚠️'} {resultMessage.text}
        </div>
      )}

      <form onSubmit={handleMerge} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {/* Duplicate Store Selection */}
          <div
            style={{
              padding: '1rem',
              border: '1px dashed var(--color-danger)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(239, 68, 68, 0.02)',
            }}
          >
            <label htmlFor="dup-select" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-danger)', marginBottom: '0.5rem' }}>
              1. Duplicate Store (To be merged & retired):
            </label>
            <select
              id="dup-select"
              value={duplicateStoreId}
              onChange={(e) => setDuplicateStoreId(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                color: 'var(--foreground)',
                fontSize: '0.875rem',
              }}
            >
              <option value="">-- Select duplicate store --</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id} disabled={s.id === targetStoreId}>
                  {s.name} ({s.municipality} · {s.listing_status})
                </option>
              ))}
            </select>

            {duplicateStore && (
              <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.5 }}>
                <p style={{ margin: '0 0 0.2rem 0' }}>📍 {duplicateStore.address_line ?? 'No street address'}, {duplicateStore.barangay}</p>
                <p style={{ margin: '0 0 0.2rem 0' }}>Status: <strong>{duplicateStore.listing_status}</strong></p>
                <p style={{ margin: 0 }}>Coords: {duplicateStore.latitude.toFixed(4)}, {duplicateStore.longitude.toFixed(4)}</p>
              </div>
            )}
          </div>

          {/* Canonical Target Store Selection */}
          <div
            style={{
              padding: '1rem',
              border: '1px dashed var(--color-success)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(22, 163, 74, 0.02)',
            }}
          >
            <label htmlFor="target-select" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-success)', marginBottom: '0.5rem' }}>
              2. Target Canonical Store (To keep active):
            </label>
            <select
              id="target-select"
              value={targetStoreId}
              onChange={(e) => setTargetStoreId(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                color: 'var(--foreground)',
                fontSize: '0.875rem',
              }}
            >
              <option value="">-- Select canonical store --</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id} disabled={s.id === duplicateStoreId}>
                  {s.name} ({s.municipality} · {s.listing_status})
                </option>
              ))}
            </select>

            {targetStore && (
              <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.5 }}>
                <p style={{ margin: '0 0 0.2rem 0' }}>📍 {targetStore.address_line ?? 'No street address'}, {targetStore.barangay}</p>
                <p style={{ margin: '0 0 0.2rem 0' }}>Status: <strong>{targetStore.listing_status}</strong></p>
                <p style={{ margin: 0 }}>Coords: {targetStore.latitude.toFixed(4)}, {targetStore.longitude.toFixed(4)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Reason */}
        <div>
          <label htmlFor="merge-reason" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
            Merge Justification / Audit Note:
          </label>
          <input
            id="merge-reason"
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Same hardware store submitted twice with slightly different name spelling"
            style={{
              width: '100%',
              padding: '0.55rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface-elevated)',
              color: 'var(--foreground)',
              fontSize: '0.875rem',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button
            type="submit"
            disabled={isPending || !duplicateStoreId || !targetStoreId}
            style={{
              backgroundColor: 'var(--color-brand-600)',
              color: '#ffffff',
              border: 'none',
              padding: '0.6rem 1.5rem',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: isPending || !duplicateStoreId || !targetStoreId ? 'not-allowed' : 'pointer',
              opacity: isPending || !duplicateStoreId || !targetStoreId ? 0.6 : 1,
            }}
          >
            {isPending ? 'Merging Stores...' : 'Merge & Reassign Listings 🔀'}
          </button>
        </div>
      </form>
    </div>
  )
}
