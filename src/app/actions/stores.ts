'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/dal/auth'
import { requireModerator } from '@/lib/dal/auth'
import { createStore, adminUpdateStore, getNearbyStores } from '@/lib/dal/stores'
import { StoreSubmitSchema } from '@/lib/validation/store'

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

/**
 * Public Server Action — submit a new store.
 * Anonymous submissions are allowed (ADR-02).
 * All submissions go to pending for moderation.
 */
export async function submitStoreAction(
  formData: FormData,
): Promise<ActionResult<{ id: string; duplicateWarnings: number }>> {
  const raw = Object.fromEntries(formData)
  const parsed = StoreSubmitSchema.safeParse(raw)

  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed. Please check the highlighted fields.',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const user = await getCurrentUser()

  // Duplicate check — non-blocking (warn, don't reject)
  const nearby = await getNearbyStores(parsed.data.latitude, parsed.data.longitude)
  const duplicateWarnings = nearby.length

  try {
    const { id } = await createStore(parsed.data, user?.id ?? null)
    revalidatePath('/admin/stores')
    return { success: true, data: { id, duplicateWarnings } }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to submit store.',
    }
  }
}

/**
 * Moderator Server Action — approve a store submission.
 */
export async function approveStoreAction(storeId: string): Promise<ActionResult> {
  await requireModerator()

  try {
    await adminUpdateStore(storeId, { listing_status: 'approved' })
    revalidatePath('/admin/stores')
    revalidatePath('/stores')
    revalidatePath('/map')
    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to approve store.',
    }
  }
}

/**
 * Moderator Server Action — reject a store submission.
 */
export async function rejectStoreAction(storeId: string): Promise<ActionResult> {
  await requireModerator()

  try {
    await adminUpdateStore(storeId, { listing_status: 'rejected' })
    revalidatePath('/admin/stores')
    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to reject store.',
    }
  }
}

/**
 * Moderator Server Action — suspend a store.
 */
export async function suspendStoreAction(storeId: string): Promise<ActionResult> {
  await requireModerator()

  try {
    await adminUpdateStore(storeId, { listing_status: 'suspended' })
    revalidatePath('/admin/stores')
    revalidatePath('/stores')
    revalidatePath('/map')
    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to suspend store.',
    }
  }
}
