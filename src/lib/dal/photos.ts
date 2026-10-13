/**
 * Data Access Layer — Photo uploads and retention.
 * ADR-05: max 5 MB, JPEG/PNG/WebP, UUID-named storage paths, 30-day rejection retention.
 */
import { createAdminClient } from '@/lib/supabase/server'
import { validatePhotoFile, mimeToExtension, PHOTO_REJECTION_RETENTION_DAYS } from '@/lib/validation/photo'
import type { PhotoType } from '@/lib/validation/photo'

export const PHOTOS_BUCKET = 'photos'

function generateStoragePath(type: PhotoType, entityId: string, mimeType: string): string {
  const uuid = crypto.randomUUID()
  const ext = mimeToExtension(mimeType)
  return `${type}/${entityId}/${uuid}.${ext}`
}

export async function uploadPhoto(
  file: File,
  photoType: PhotoType,
  entityId: string,
  uploaderId: string | null,
): Promise<{ storagePath: string; photoId: string }> {
  const validation = validatePhotoFile(file)
  if (!validation.ok) throw new Error(validation.error)

  const storagePath = generateStoragePath(photoType, entityId, file.type)
  const admin = createAdminClient()

  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadError } = await admin.storage
    .from(PHOTOS_BUCKET)
    .upload(storagePath, arrayBuffer, { contentType: file.type, upsert: false })

  if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`)

  if (photoType === 'storefront') {
    const { data, error } = await admin
      .from('store_photos')
      .insert({
        store_id: entityId,
        storage_path: storagePath,
        photo_type: photoType,
        review_status: 'pending',
        uploaded_by_id: uploaderId,
      } as Parameters<ReturnType<typeof admin.from>['insert']>[0])
      .select('id')
      .single()

    if (error) {
      await admin.storage.from(PHOTOS_BUCKET).remove([storagePath])
      throw new Error(`Failed to record photo metadata: ${error.message}`)
    }
    return { storagePath, photoId: (data as { id: string }).id }
  } else {
    const { data, error } = await admin
      .from('product_photos')
      .insert({
        listing_id: entityId,
        storage_path: storagePath,
        review_status: 'pending',
        uploaded_by_id: uploaderId,
      } as Parameters<ReturnType<typeof admin.from>['insert']>[0])
      .select('id')
      .single()

    if (error) {
      await admin.storage.from(PHOTOS_BUCKET).remove([storagePath])
      throw new Error(`Failed to record photo metadata: ${error.message}`)
    }
    return { storagePath, photoId: (data as { id: string }).id }
  }
}

export async function rejectStorePhoto(photoId: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('store_photos')
    .update({ review_status: 'rejected' } as Parameters<ReturnType<typeof admin.from>['update']>[0])
    .eq('id', photoId)
  if (error) throw new Error(`Failed to reject photo: ${error.message}`)
}

export async function rejectProductPhoto(photoId: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('product_photos')
    .update({ review_status: 'rejected' } as Parameters<ReturnType<typeof admin.from>['update']>[0])
    .eq('id', photoId)
  if (error) throw new Error(`Failed to reject photo: ${error.message}`)
}

export async function approveStorePhoto(photoId: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('store_photos')
    .update({ review_status: 'approved' } as Parameters<ReturnType<typeof admin.from>['update']>[0])
    .eq('id', photoId)
  if (error) throw new Error(`Failed to approve photo: ${error.message}`)
}

export async function purgeExpiredRejectedPhotos(): Promise<number> {
  const admin = createAdminClient()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - PHOTO_REJECTION_RETENTION_DAYS)

  const { data: storePhotos } = await admin
    .from('store_photos')
    .select('id,storage_path')
    .eq('review_status', 'rejected')
    .lt('created_at', cutoff.toISOString())

  const { data: productPhotos } = await admin
    .from('product_photos')
    .select('id,storage_path')
    .eq('review_status', 'rejected')
    .lt('created_at', cutoff.toISOString())

  type PhotoRow = { id: string; storage_path: string }
  const sp = (storePhotos ?? []) as PhotoRow[]
  const pp = (productPhotos ?? []) as PhotoRow[]

  const allPaths = [...sp.map((p) => p.storage_path), ...pp.map((p) => p.storage_path)]
  if (allPaths.length === 0) return 0

  await admin.storage.from(PHOTOS_BUCKET).remove(allPaths)

  if (sp.length) {
    await admin.from('store_photos').delete().in('id', sp.map((p) => p.id))
  }
  if (pp.length) {
    await admin.from('product_photos').delete().in('id', pp.map((p) => p.id))
  }

  return allPaths.length
}

export function getPhotoPublicUrl(storagePath: string): string {
  const admin = createAdminClient()
  const { data } = admin.storage.from(PHOTOS_BUCKET).getPublicUrl(storagePath)
  return data.publicUrl
}
