/**
 * Photo upload validation — enforced server-side in Server Actions.
 * ADR-05: max 5 MB, JPEG/PNG/WebP only.
 */
import { z } from 'zod'

export const PHOTO_MAX_SIZE_BYTES = parseInt(process.env.PHOTO_MAX_SIZE_BYTES ?? '5242880', 10)
export const PHOTO_ALLOWED_MIME_TYPES = (
  process.env.PHOTO_ALLOWED_TYPES ?? 'image/jpeg,image/png,image/webp'
).split(',')
export const PHOTO_REJECTION_RETENTION_DAYS = parseInt(
  process.env.PHOTO_REJECTION_RETENTION_DAYS ?? '30',
  10,
)

export const PhotoTypeSchema = z.enum(['storefront', 'product', 'price_evidence'])
export type PhotoType = z.infer<typeof PhotoTypeSchema>

/**
 * Validates a File object server-side.
 * Call this before uploading to Supabase Storage.
 */
export function validatePhotoFile(file: File): { ok: true } | { ok: false; error: string } {
  if (!PHOTO_ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      ok: false,
      error: `File type not allowed. Accepted: ${PHOTO_ALLOWED_MIME_TYPES.join(', ')}`,
    }
  }
  if (file.size > PHOTO_MAX_SIZE_BYTES) {
    const mb = (PHOTO_MAX_SIZE_BYTES / 1_048_576).toFixed(0)
    return { ok: false, error: `File is too large. Maximum size is ${mb} MB.` }
  }
  return { ok: true }
}

/** Maps MIME type to the correct file extension for storage. */
export function mimeToExtension(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  }
  return map[mimeType] ?? 'bin'
}
