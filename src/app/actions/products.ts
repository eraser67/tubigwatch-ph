'use server'

import { revalidatePath } from 'next/cache'
import { requireModerator } from '@/lib/dal/auth'
import { getCurrentUser } from '@/lib/dal/auth'
import { createProduct, createStoreListing, submitPriceReport, acceptPriceReport } from '@/lib/dal/products'
import { ProductSchema, StoreListingSchema, PriceReportSchema } from '@/lib/validation/product'
import type { ActionResult } from './stores'

/**
 * Admin Server Action — create a product in the catalog.
 */
export async function createProductAction(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  await requireModerator()

  const raw = Object.fromEntries(formData)
  const parsed = ProductSchema.safeParse(raw)

  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed.',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  try {
    const product = await createProduct(parsed.data)
    revalidatePath('/admin/products')
    return { success: true, data: product }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to create product.',
    }
  }
}

/**
 * Authenticated Server Action — add a product listing to a store.
 * Only authenticated users can link products to stores (anonymous not allowed here).
 */
export async function createStoreListingAction(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'You must be signed in to add a listing.' }

  const raw = Object.fromEntries(formData)
  const parsed = StoreListingSchema.safeParse(raw)

  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed.',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  try {
    const listing = await createStoreListing(parsed.data)
    revalidatePath(`/stores/${parsed.data.store_id}`)
    return { success: true, data: listing }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to add listing.',
    }
  }
}

/**
 * Public Server Action — submit a community price report.
 * Anonymous allowed (ADR-02). Auto-accepted for trusted contributors (ADR-03).
 */
export async function submitPriceReportAction(
  formData: FormData,
): Promise<ActionResult<{ accepted: boolean }>> {
  const raw = Object.fromEntries(formData)
  const parsed = PriceReportSchema.safeParse(raw)

  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed.',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const user = await getCurrentUser()

  try {
    const result = await submitPriceReport(parsed.data, user?.id ?? null, user?.trusted ?? false)
    revalidatePath('/stores')
    revalidatePath('/compare')
    return { success: true, data: { accepted: result.accepted } }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to submit price report.',
    }
  }
}

/**
 * Moderator Server Action — accept a queued price report.
 */
export async function acceptPriceReportAction(reportId: string): Promise<ActionResult> {
  const mod = await requireModerator()

  try {
    await acceptPriceReport(reportId, mod.id)
    revalidatePath('/admin/stores')
    revalidatePath('/stores')
    revalidatePath('/compare')
    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to accept report.',
    }
  }
}
