'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/dal/auth'
import { requireModerator } from '@/lib/dal/auth'
import { createStore, adminUpdateStore, getNearbyStores } from '@/lib/dal/stores'
import { createAdminClient } from '@/lib/supabase/server'
import { uploadPhoto } from '@/lib/dal/photos'
import { validatePhotoFile } from '@/lib/validation/photo'
import { StoreSubmitSchema } from '@/lib/validation/store'
import { checkRateLimit } from '@/lib/rateLimit'

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

interface SubmittedProductItem {
  productId: string
  currentPricePhp?: number | null
  stockStatus: string
  isCustom?: boolean
  customName?: string
  customCapacityLiters?: number | null
  customCategoryId?: string
  customBrand?: string | null
}

/**
 * Public Server Action — submit a new store.
 * Anonymous submissions are allowed (ADR-02).
 * All submissions go to pending for moderation.
 * Supports optional storefront photo and product listings.
 */
export async function submitStoreAction(
  formData: FormData,
): Promise<ActionResult<{ id: string; duplicateWarnings: number }>> {
  // Honeypot bot protection
  const honeypot = formData.get('hp_field')
  if (typeof honeypot === 'string' && honeypot.length > 0) {
    return { success: false, error: 'Spam submission detected.' }
  }

  // Rate limiting (max 10 submissions per 15 minutes)
  const rateLimit = await checkRateLimit('submit_store', 10, 15 * 60 * 1000)
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: `Too many submissions. Please wait ${rateLimit.retryAfterSeconds} seconds before trying again.`,
    }
  }

  const raw = Object.fromEntries(formData)
  const parsed = StoreSubmitSchema.safeParse(raw)

  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed. Please check the highlighted fields.',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  // Validate photo file if provided
  const photoEntry = formData.get('photo')
  const photoFile = photoEntry instanceof File && photoEntry.size > 0 ? photoEntry : null
  if (photoFile) {
    const photoValidation = validatePhotoFile(photoFile)
    if (!photoValidation.ok) {
      return {
        success: false,
        error: photoValidation.error,
        fieldErrors: { photo: [photoValidation.error] },
      }
    }
  }

  const user = await getCurrentUser()

  // Duplicate check — non-blocking (warn, don't reject)
  const nearby = await getNearbyStores(parsed.data.latitude, parsed.data.longitude)
  const duplicateWarnings = nearby.length

  try {
    const { id } = await createStore(parsed.data, user?.id ?? null)

    // Upload storefront photo if attached
    if (photoFile) {
      try {
        await uploadPhoto(photoFile, 'storefront', id, user?.id ?? null)
      } catch (photoErr) {
        console.error('Failed to upload storefront photo:', photoErr)
        // Store creation succeeded, log photo error without failing entire submission
      }
    }

    // Attach any products submitted with the store
    const productsJson = formData.get('products')
    if (typeof productsJson === 'string' && productsJson.trim()) {
      try {
        const productsList: SubmittedProductItem[] = JSON.parse(productsJson)
        if (Array.isArray(productsList) && productsList.length > 0) {
          const admin = createAdminClient()
          for (const item of productsList) {
            let targetProductId = item.productId

            // If user specified 'other' / custom product, find or create it in products catalog
            if (item.productId === 'other' || item.isCustom) {
              const customName = (item.customName || 'Custom Container').trim()
              const customCategory = item.customCategoryId

              // Check if matching product already exists
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const { data: existingProd } = await (admin.from('products') as any)
                .select('id')
                .eq('name', customName)
                .eq('category_id', customCategory)
                .maybeSingle()

              if (existingProd) {
                targetProductId = existingProd.id
              } else {
                // Insert new custom product into catalog
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { data: newProd, error: insertProdErr } = await (admin.from('products') as any)
                  .insert({
                    name: customName,
                    category_id: customCategory,
                    capacity_liters: item.customCapacityLiters ? Number(item.customCapacityLiters) : null,
                    brand: item.customBrand ? item.customBrand.trim() : null,
                  })
                  .select('id')
                  .single()

                if (!insertProdErr && newProd) {
                  targetProductId = newProd.id
                } else if (insertProdErr) {
                  console.error('Failed to create custom product:', insertProdErr)
                }
              }
            }

            if (!targetProductId || targetProductId === 'other') continue

            // Insert pending listing
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (admin.from('store_product_listings') as any).insert({
              store_id: id,
              product_id: targetProductId,
              current_price_php: item.currentPricePhp ?? null,
              stock_status: item.stockStatus || 'unknown',
              listing_status: 'pending',
              last_reported_at: new Date().toISOString(),
            })

            // Record initial price report
            if (item.currentPricePhp != null && item.currentPricePhp > 0) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              await (admin.from('price_reports') as any).insert({
                store_id: id,
                product_id: targetProductId,
                reported_price_php: item.currentPricePhp,
                stock_status: item.stockStatus || 'unknown',
                report_source: user ? 'user' : 'anonymous',
                reporter_id: user?.id ?? null,
                report_status: 'pending',
              })
            }
          }
        }
      } catch (parseErr) {
        console.error('Failed to parse submitted products:', parseErr)
      }
    }

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
 * Enforces separation of duties: contributors cannot approve their own submissions.
 * Appends to immutable moderation audit trail.
 */
export async function approveStoreAction(storeId: string, reason?: string): Promise<ActionResult> {
  const user = await requireModerator()
  const admin = createAdminClient()

  try {
    // Check creator for self-approval protection
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: store } = await (admin.from('stores') as any)
      .select('creator_id, listing_status')
      .eq('id', storeId)
      .single()

    if (store && store.creator_id === user.id && user.role !== 'admin') {
      return {
        success: false,
        error: 'Separation of duties: you cannot approve your own store submission.',
      }
    }

    await adminUpdateStore(storeId, { listing_status: 'approved' })

    // Also approve associated pending listings for this store
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin.from('store_product_listings') as any)
      .update({ listing_status: 'approved' })
      .eq('store_id', storeId)
      .eq('listing_status', 'pending')

    // Append to immutable audit log
    const { recordModerationAction } = await import('@/lib/dal/moderation')
    await recordModerationAction({
      actor_id: user.id,
      action: 'approve',
      target_table: 'stores',
      target_id: storeId,
      previous_status: store?.listing_status ?? 'pending',
      new_status: 'approved',
      reason: reason || 'Store submission approved',
    })

    revalidatePath('/admin/stores')
    revalidatePath('/admin/audit')
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
export async function rejectStoreAction(storeId: string, reason?: string): Promise<ActionResult> {
  const user = await requireModerator()
  const admin = createAdminClient()

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: store } = await (admin.from('stores') as any)
      .select('listing_status')
      .eq('id', storeId)
      .single()

    await adminUpdateStore(storeId, { listing_status: 'rejected' })

    // Append to immutable audit log
    const { recordModerationAction } = await import('@/lib/dal/moderation')
    await recordModerationAction({
      actor_id: user.id,
      action: 'reject',
      target_table: 'stores',
      target_id: storeId,
      previous_status: store?.listing_status ?? 'pending',
      new_status: 'rejected',
      reason: reason || 'Store submission rejected',
    })

    revalidatePath('/admin/stores')
    revalidatePath('/admin/audit')
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
export async function suspendStoreAction(storeId: string, reason?: string): Promise<ActionResult> {
  const user = await requireModerator()
  const admin = createAdminClient()

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: store } = await (admin.from('stores') as any)
      .select('listing_status')
      .eq('id', storeId)
      .single()

    await adminUpdateStore(storeId, { listing_status: 'suspended' })

    const { recordModerationAction } = await import('@/lib/dal/moderation')
    await recordModerationAction({
      actor_id: user.id,
      action: 'suspend',
      target_table: 'stores',
      target_id: storeId,
      previous_status: store?.listing_status ?? 'approved',
      new_status: 'suspended',
      reason: reason || 'Store suspended by moderator',
    })

    revalidatePath('/admin/stores')
    revalidatePath('/admin/audit')
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
