'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getCurrentUser, requireModerator } from '@/lib/dal/auth'
import {
  createContentReport,
  resolveContentReport,
  mergeDuplicateStores,
  updateStoreVerification,
  type ContentReportReason,
} from '@/lib/dal/moderation'
import { checkRateLimit } from '@/lib/rateLimit'

export type ModerationActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

const ContentReportSchema = z.object({
  target_table: z.enum(['stores', 'store_product_listings']),
  target_id: z.string().uuid('Invalid target ID'),
  reason: z.enum([
    'incorrect_price',
    'incorrect_location',
    'duplicate',
    'closed_store',
    'spam',
    'other',
  ]),
  details: z.string().max(1000, 'Details cannot exceed 1000 characters').optional(),
})

/**
 * Public action: Submit an inaccurate listing report or flag an issue (FR-07).
 * Anonymous reports permitted with IP/rate awareness.
 */
export async function submitContentReportAction(
  formData: FormData,
): Promise<ModerationActionResult<{ id: string }>> {
  // Honeypot spam check
  const honeypot = formData.get('hp_field')
  if (typeof honeypot === 'string' && honeypot.length > 0) {
    return { success: false, error: 'Spam report detected.' }
  }

  // Rate limit: max 15 reports per 15 minutes
  const rateLimit = await checkRateLimit('submit_report', 15, 15 * 60 * 1000)
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: `Too many reports submitted. Please wait ${rateLimit.retryAfterSeconds} seconds before trying again.`,
    }
  }

  const raw = Object.fromEntries(formData)
  const parsed = ContentReportSchema.safeParse(raw)

  if (!parsed.success) {
    return {
      success: false,
      error: 'Please select a valid report reason and details.',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const user = await getCurrentUser()

  try {
    const { id } = await createContentReport({
      target_table: parsed.data.target_table,
      target_id: parsed.data.target_id,
      reason: parsed.data.reason as ContentReportReason,
      details: parsed.data.details ?? null,
      reporter_id: user?.id ?? null,
    })

    revalidatePath('/admin/inaccurate-reports')
    return { success: true, data: { id } }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to submit report.',
    }
  }
}

/**
 * Moderator action: Resolve or dismiss an inaccurate listing report.
 */
export async function resolveContentReportAction(
  reportId: string,
  status: 'resolved' | 'dismissed',
  resolutionNote?: string,
): Promise<ModerationActionResult> {
  const user = await requireModerator()

  try {
    await resolveContentReport({
      reportId,
      status,
      resolutionNote,
      moderatorId: user.id,
    })

    revalidatePath('/admin/inaccurate-reports')
    revalidatePath('/admin/audit')
    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to resolve report.',
    }
  }
}

/**
 * Moderator action: Merge duplicate stores into a canonical target store.
 * Reassigns product listings and preserves all price history.
 */
export async function mergeDuplicateStoresAction(
  duplicateStoreId: string,
  targetStoreId: string,
  reason?: string,
): Promise<ModerationActionResult> {
  const user = await requireModerator()

  if (duplicateStoreId === targetStoreId) {
    return {
      success: false,
      error: 'Cannot merge a store into itself. Please select two distinct stores.',
    }
  }

  try {
    await mergeDuplicateStores({
      duplicateStoreId,
      targetStoreId,
      moderatorId: user.id,
      reason: reason ?? null,
    })

    revalidatePath('/admin/stores')
    revalidatePath('/admin/duplicates')
    revalidatePath('/admin/audit')
    revalidatePath('/stores')
    revalidatePath('/map')
    revalidatePath('/compare')

    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to merge duplicate stores.',
    }
  }
}

/**
 * Moderator action: Update store verification status.
 */
export async function updateStoreVerificationAction(
  storeId: string,
  verificationStatus: 'unverified' | 'store_confirmed' | 'admin_verified',
  reason?: string,
): Promise<ModerationActionResult> {
  const user = await requireModerator()

  try {
    await updateStoreVerification({
      storeId,
      verificationStatus,
      moderatorId: user.id,
      reason: reason ?? null,
    })

    revalidatePath('/admin/stores')
    revalidatePath('/admin/audit')
    revalidatePath('/stores')
    revalidatePath(`/stores/${storeId}`)
    revalidatePath('/map')

    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update store verification.',
    }
  }
}
