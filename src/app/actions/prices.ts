'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser, requireModerator } from '@/lib/dal/auth'
import { createAdminClient } from '@/lib/supabase/server'
import {
  submitPriceReport,
  acceptPriceReport,
  rejectPriceReport,
} from '@/lib/dal/products'
import { uploadPhoto } from '@/lib/dal/photos'
import { validatePhotoFile } from '@/lib/validation/photo'
import { PriceReportSchema } from '@/lib/validation/product'
import { checkRateLimit } from '@/lib/rateLimit'

export type PriceActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

/**
 * Community price report submission.
 * Anonymous reporting allowed (ADR-02).
 * Auto-accepts for trusted contributors / admins (ADR-03).
 */
export async function submitPriceReportAction(
  formData: FormData,
): Promise<PriceActionResult<{ reportId: string; accepted: boolean }>> {
  // Honeypot spam check
  const honeypot = formData.get('hp_field')
  if (typeof honeypot === 'string' && honeypot.length > 0) {
    return { success: false, error: 'Spam submission detected.' }
  }

  // Rate limiting (max 25 price reports per 15 minutes)
  const rateLimit = await checkRateLimit('submit_price', 25, 15 * 60 * 1000)
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: `Too many price reports submitted. Please wait ${rateLimit.retryAfterSeconds} seconds before trying again.`,
    }
  }

  const raw = Object.fromEntries(formData)
  const parsed = PriceReportSchema.safeParse(raw)

  if (!parsed.success) {
    return {
      success: false,
      error: 'Please enter a valid price and stock status.',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const user = await getCurrentUser()

  // Check trusted contributor auto-accept rule (ADR-03)
  const autoAcceptConfig = process.env.TRUSTED_CONTRIBUTOR_AUTO_ACCEPT === 'true'
  const isTrustedRole = user?.role === 'moderator' || user?.role === 'admin' || user?.trusted === true
  const isTrusted = isTrustedRole || (autoAcceptConfig && user != null)

  // Optional evidence photo (e.g. price tag, shelf sign, receipt)
  const photoEntry = formData.get('photo')
  const photoFile = photoEntry instanceof File && photoEntry.size > 0 ? photoEntry : null
  let evidencePath: string | null = null

  if (photoFile) {
    const photoValidation = validatePhotoFile(photoFile)
    if (!photoValidation.ok) {
      return {
        success: false,
        error: photoValidation.error,
        fieldErrors: { photo: [photoValidation.error] },
      }
    }

    try {
      const uploadRes = await uploadPhoto(photoFile, 'price_evidence', parsed.data.listing_id, user?.id ?? null)
      evidencePath = uploadRes.storagePath
    } catch (uploadErr) {
      console.error('Failed to upload price evidence photo:', uploadErr)
      // Continue submission even if evidence upload failed
    }
  }

  try {
    const { reportId, accepted } = await submitPriceReport(
      parsed.data,
      user?.id ?? null,
      isTrusted,
      evidencePath,
    )

    revalidatePath('/stores')
    revalidatePath('/map')
    revalidatePath('/admin/reports')

    return { success: true, data: { reportId, accepted } }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to submit price report.',
    }
  }
}

/** Moderator action: accept a price report */
export async function approvePriceReportAction(reportId: string, reason?: string): Promise<PriceActionResult> {
  const user = await requireModerator()
  const admin = createAdminClient()

  try {
    // Check reporter for separation of duties
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: report } = await (admin.from('price_reports') as any)
      .select('reported_by_id')
      .eq('id', reportId)
      .single()

    if (report && report.reported_by_id === user.id && user.role !== 'admin') {
      return {
        success: false,
        error: 'Separation of duties: you cannot approve your own price report.',
      }
    }

    await acceptPriceReport(reportId, user.id)

    const { recordModerationAction } = await import('@/lib/dal/moderation')
    await recordModerationAction({
      actor_id: user.id,
      action: 'approve',
      target_table: 'price_reports',
      target_id: reportId,
      previous_status: 'pending',
      new_status: 'approved',
      reason: reason || 'Price report accepted',
    })

    revalidatePath('/admin/reports')
    revalidatePath('/admin/audit')
    revalidatePath('/stores')
    revalidatePath('/map')
    revalidatePath('/compare')
    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to approve price report.',
    }
  }
}

/** Moderator action: reject a price report */
export async function rejectPriceReportAction(reportId: string, reason?: string): Promise<PriceActionResult> {
  const user = await requireModerator()

  try {
    await rejectPriceReport(reportId, user.id)

    const { recordModerationAction } = await import('@/lib/dal/moderation')
    await recordModerationAction({
      actor_id: user.id,
      action: 'reject',
      target_table: 'price_reports',
      target_id: reportId,
      previous_status: 'pending',
      new_status: 'rejected',
      reason: reason || 'Price report rejected',
    })

    revalidatePath('/admin/reports')
    revalidatePath('/admin/audit')
    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to reject price report.',
    }
  }
}
