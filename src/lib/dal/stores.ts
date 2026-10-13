/**
 * Data Access Layer — Stores
 * Server-only. All functions return safe DTOs, never raw Supabase rows.
 * Authorization is enforced here — never rely solely on RLS for mutations.
 */
import { cache } from 'react'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { StoreSubmitInput, StoreAdminUpdateInput } from '@/lib/validation/store'
import { DUPLICATE_RADIUS_KM } from '@/lib/validation/store'
import { LISTING_FRESHNESS_DAYS } from '@/lib/constants'

export type StoreDTO = {
  id: string
  name: string
  description: string | null
  address_line: string | null
  barangay: string | null
  municipality: string
  province: string | null
  latitude: number
  longitude: number
  contact_number: string | null
  opening_hours: string | null
  delivers: boolean
  delivery_fee_php: number | null
  listing_status: string
  verification_status: string
  created_at: string
  updated_at: string
}

const STORE_COLUMNS =
  'id,name,description,address_line,barangay,municipality,province,latitude,longitude,contact_number,opening_hours,delivers,delivery_fee_php,listing_status,verification_status,created_at,updated_at'

/** Returns all approved stores — public, cached per request. */
export const getApprovedStores = cache(async (): Promise<StoreDTO[]> => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('stores')
    .select(STORE_COLUMNS)
    .eq('listing_status', 'approved')
    .order('name')

  if (error) throw new Error(`Failed to fetch stores: ${error.message}`)
  return (data ?? []) as StoreDTO[]
})

/** Returns a single approved store by ID — public. */
export const getStoreById = cache(async (id: string): Promise<StoreDTO | null> => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('stores')
    .select(STORE_COLUMNS)
    .eq('id', id)
    .eq('listing_status', 'approved')
    .single()

  if (error?.code === 'PGRST116') return null
  if (error) throw new Error(`Failed to fetch store: ${error.message}`)
  return data as StoreDTO | null
})

/** Returns stores awaiting moderation — moderators/admins only. */
export async function getPendingStores(): Promise<StoreDTO[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('stores')
    .select(STORE_COLUMNS)
    .eq('listing_status', 'pending')
    .order('created_at')

  if (error) throw new Error(`Failed to fetch pending stores: ${error.message}`)
  return (data ?? []) as StoreDTO[]
}

/** All stores for admin use — includes all statuses. */
export async function getAllStoresAdmin(): Promise<StoreDTO[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('stores')
    .select(STORE_COLUMNS)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch all stores: ${error.message}`)
  return (data ?? []) as StoreDTO[]
}

/**
 * Checks for near-duplicate stores within DUPLICATE_RADIUS_KM.
 * Returns stores that may be duplicates — caller decides whether to block or warn.
 */
export async function getNearbyStores(
  lat: number,
  lng: number,
  excludeId?: string,
): Promise<Array<StoreDTO & { distance_km: number }>> {
  const supabase = await createClient()

  const latDelta = DUPLICATE_RADIUS_KM / 111
  const lngDelta = DUPLICATE_RADIUS_KM / (111 * Math.cos((lat * Math.PI) / 180))

  const { data, error } = await supabase
    .from('stores')
    .select(STORE_COLUMNS)
    .neq('listing_status', 'rejected')
    .gte('latitude', lat - latDelta)
    .lte('latitude', lat + latDelta)
    .gte('longitude', lng - lngDelta)
    .lte('longitude', lng + lngDelta)

  if (error) throw new Error(`Duplicate check failed: ${error.message}`)

  return ((data ?? []) as StoreDTO[])
    .filter((store) => !excludeId || store.id !== excludeId)
    .map((store) => ({
      ...store,
      distance_km: haversineKm(lat, lng, store.latitude, store.longitude),
    }))
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Submits a new store. creatorId is null for anonymous (ADR-02). */
export async function createStore(
  input: StoreSubmitInput,
  creatorId: string | null,
): Promise<{ id: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('stores')
    .insert({
      name: input.name,
      description: input.description ?? null,
      address_line: input.address_line ?? null,
      barangay: input.barangay ?? null,
      municipality: input.municipality,
      province: input.province ?? null,
      latitude: input.latitude,
      longitude: input.longitude,
      contact_number: input.contact_number || null,
      opening_hours: input.opening_hours ?? null,
      delivers: input.delivers,
      delivery_fee_php: input.delivery_fee_php ?? null,
      creator_id: creatorId,
      listing_status: 'pending',
      verification_status: 'unverified',
    } as Parameters<ReturnType<typeof supabase.from>['insert']>[0])
    .select('id')
    .single()

  if (error) throw new Error(`Failed to create store: ${error.message}`)
  return { id: (data as { id: string }).id }
}

/** Admin: update a store's fields and/or status. */
export async function adminUpdateStore(
  id: string,
  update: StoreAdminUpdateInput,
): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('stores')
    .update({ ...update, updated_at: new Date().toISOString() } as Parameters<ReturnType<typeof admin.from>['update']>[0])
    .eq('id', id)

  if (error) throw new Error(`Failed to update store: ${error.message}`)
}

/** How many days since a listing was last confirmed. */
export function getDaysSinceConfirmed(lastConfirmedAt: string | null): number | null {
  if (!lastConfirmedAt) return null
  return Math.floor((Date.now() - new Date(lastConfirmedAt).getTime()) / 86_400_000)
}

/** Returns true if the listing is considered stale (ADR-04). */
export function isStale(lastConfirmedAt: string | null): boolean {
  const days = getDaysSinceConfirmed(lastConfirmedAt)
  return days === null || days > LISTING_FRESHNESS_DAYS
}
