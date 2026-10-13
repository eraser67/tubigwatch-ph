/**
 * Data Access Layer — Moderation, Content Reports, Audit Log, and Store Merges
 */
import { cache } from 'react'
import { createAdminClient, createClient } from '@/lib/supabase/server'

export type ModerationActionType =
  | 'approve'
  | 'reject'
  | 'edit'
  | 'suspend'
  | 'merge'
  | 'verify_ownership'
  | 'revoke_trust'
  | 'grant_trust'

export type ContentReportReason =
  | 'incorrect_price'
  | 'incorrect_location'
  | 'duplicate'
  | 'closed_store'
  | 'spam'
  | 'other'

export type ModerationActionDTO = {
  id: string
  actor_id: string
  action: ModerationActionType
  target_table: string
  target_id: string
  previous_status: string | null
  new_status: string | null
  reason: string | null
  created_at: string
  actor: {
    id: string
    role: string
    display_name: string | null
  } | null
}

export type ContentReportDTO = {
  id: string
  target_table: string
  target_id: string
  reason: ContentReportReason
  details: string | null
  reporter_id: string | null
  status: 'open' | 'resolved' | 'dismissed'
  resolution_note: string | null
  resolved_by_id: string | null
  resolved_at: string | null
  created_at: string
  store?: {
    id: string
    name: string
    municipality: string
  } | null
}

/**
 * Appends an immutable audit log entry into moderation_actions.
 * (FR-10 / ADR-03 / Audit Trail)
 */
export async function recordModerationAction(params: {
  actor_id: string
  action: ModerationActionType
  target_table: string
  target_id: string
  previous_status?: string | null
  new_status?: string | null
  reason?: string | null
}): Promise<void> {
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin.from('moderation_actions') as any).insert({
    actor_id: params.actor_id,
    action: params.action,
    target_table: params.target_table,
    target_id: params.target_id,
    previous_status: params.previous_status ?? null,
    new_status: params.new_status ?? null,
    reason: params.reason ?? null,
  })

  if (error) {
    console.error('Failed to append to moderation_actions audit log:', error)
  }
}

/**
 * Fetches the immutable moderation audit trail (admin/moderator only).
 */
export const getModerationAuditLog = cache(async (): Promise<ModerationActionDTO[]> => {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('moderation_actions')
    .select(`
      id,
      actor_id,
      action,
      target_table,
      target_id,
      previous_status,
      new_status,
      reason,
      created_at,
      profiles (
        id,
        role,
        display_name
      )
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw new Error(`Failed to fetch moderation audit log: ${error.message}`)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => ({
    id: row.id,
    actor_id: row.actor_id,
    action: row.action as ModerationActionType,
    target_table: row.target_table,
    target_id: row.target_id,
    previous_status: row.previous_status,
    new_status: row.new_status,
    reason: row.reason,
    created_at: row.created_at,
    actor: row.profiles
      ? {
          id: row.profiles.id,
          role: row.profiles.role,
          display_name: row.profiles.display_name,
        }
      : null,
  }))
})

/**
 * Creates a community content/inaccuracy report (FR-07).
 * Anonymous reports allowed (reporter_id can be null).
 */
export async function createContentReport(params: {
  target_table: string
  target_id: string
  reason: ContentReportReason
  details?: string | null
  reporter_id?: string | null
}): Promise<{ id: string }> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('content_reports') as any)
    .insert({
      target_table: params.target_table,
      target_id: params.target_id,
      reason: params.reason,
      details: params.details?.trim() || null,
      reporter_id: params.reporter_id ?? null,
      status: 'open',
    })
    .select('id')
    .single()

  if (error) throw new Error(`Failed to submit report: ${error.message}`)
  return { id: (data as { id: string }).id }
}

/**
 * Fetches all open and resolved content reports for moderators.
 */
export const getContentReports = cache(async (): Promise<ContentReportDTO[]> => {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('content_reports')
    .select(`
      id,
      target_table,
      target_id,
      reason,
      details,
      reporter_id,
      status,
      resolution_note,
      resolved_by_id,
      resolved_at,
      created_at
    `)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch content reports: ${error.message}`)

  // For reports where target_table is 'stores', fetch store names for context
  const reports = (data ?? []) as ContentReportDTO[]
  const storeIds = reports.filter((r) => r.target_table === 'stores').map((r) => r.target_id)

  if (storeIds.length > 0) {
    const { data: stores } = await admin
      .from('stores')
      .select('id, name, municipality')
      .in('id', storeIds)

    const storeMap = new Map((stores ?? []).map((s) => [s.id, s]))
    reports.forEach((r) => {
      if (r.target_table === 'stores') {
        r.store = storeMap.get(r.target_id) ?? null
      }
    })
  }

  return reports
})

/**
 * Resolves or dismisses a content report.
 */
export async function resolveContentReport(params: {
  reportId: string
  status: 'resolved' | 'dismissed'
  resolutionNote?: string | null
  moderatorId: string
}): Promise<void> {
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin.from('content_reports') as any)
    .update({
      status: params.status,
      resolution_note: params.resolutionNote?.trim() || null,
      resolved_by_id: params.moderatorId,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', params.reportId)

  if (error) throw new Error(`Failed to resolve content report: ${error.message}`)

  await recordModerationAction({
    actor_id: params.moderatorId,
    action: 'edit',
    target_table: 'content_reports',
    target_id: params.reportId,
    previous_status: 'open',
    new_status: params.status,
    reason: params.resolutionNote ?? `Marked as ${params.status}`,
  })
}

/**
 * Merges a duplicate store into a canonical target store.
 * Reassigns product listings from duplicate to target, sets duplicate status to rejected,
 * and preserves all price history.
 */
export async function mergeDuplicateStores(params: {
  duplicateStoreId: string
  targetStoreId: string
  moderatorId: string
  reason?: string | null
}): Promise<void> {
  const admin = createAdminClient()

  // 1. Fetch listings of duplicate store
  const { data: dupListings } = await admin
    .from('store_product_listings')
    .select('id, product_id, current_price_php, stock_status')
    .eq('store_id', params.duplicateStoreId)

  // 2. Fetch existing listings of target store to prevent duplicate unique(store_id, product_id)
  const { data: targetListings } = await admin
    .from('store_product_listings')
    .select('id, product_id')
    .eq('store_id', params.targetStoreId)

  const targetProductMap = new Map((targetListings ?? []).map((l) => [l.product_id, l.id]))

  // 3. Move or merge listings
  for (const dup of dupListings ?? []) {
    const existingTargetListingId = targetProductMap.get(dup.product_id)

    if (existingTargetListingId) {
      // Reassign price history from duplicate listing to target listing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin.from('price_history') as any)
        .update({ listing_id: existingTargetListingId })
        .eq('listing_id', dup.id)

      // Delete the redundant duplicate listing record
      await admin.from('store_product_listings').delete().eq('id', dup.id)
    } else {
      // Transfer listing directly to target store
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin.from('store_product_listings') as any)
        .update({ store_id: params.targetStoreId })
        .eq('id', dup.id)
    }
  }

  // 4. Mark duplicate store as rejected with note
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin.from('stores') as any)
    .update({
      listing_status: 'rejected',
      description: `[MERGED into ${params.targetStoreId}] ${params.reason || 'Duplicate store merged by moderator'}`,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.duplicateStoreId)

  // 5. Append immutable audit trail
  await recordModerationAction({
    actor_id: params.moderatorId,
    action: 'merge',
    target_table: 'stores',
    target_id: params.duplicateStoreId,
    previous_status: 'pending',
    new_status: 'rejected',
    reason: `Merged into target store ${params.targetStoreId}. ${params.reason || ''}`,
  })
}

/**
 * Updates store verification status (unverified, store_confirmed, admin_verified)
 * with an audit trail entry.
 */
export async function updateStoreVerification(params: {
  storeId: string
  verificationStatus: 'unverified' | 'store_confirmed' | 'admin_verified'
  moderatorId: string
  reason?: string | null
}): Promise<void> {
  const admin = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin.from('stores') as any)
    .update({
      verification_status: params.verificationStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.storeId)

  if (error) throw new Error(`Failed to update store verification: ${error.message}`)

  await recordModerationAction({
    actor_id: params.moderatorId,
    action: 'verify_ownership',
    target_table: 'stores',
    target_id: params.storeId,
    new_status: params.verificationStatus,
    reason: params.reason || `Verification status set to ${params.verificationStatus}`,
  })
}
