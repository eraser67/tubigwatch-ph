/**
 * Data Access Layer — Auth helpers
 * Server-only. Returns minimal safe DTOs, never raw DB rows.
 * Uses React cache() to deduplicate auth lookups within a single request.
 */
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { AppRole } from '@/types/database'

export type SessionUser = {
  id: string
  email: string | undefined
  role: AppRole
  trusted: boolean
}

/**
 * Returns the authenticated user with their application role.
 * Returns null if not signed in.
 * Cached per-request — safe to call multiple times.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, trusted')
    .eq('id', user.id)
    .single<{ role: AppRole; trusted: boolean }>()

  return {
    id: user.id,
    email: user.email,
    role: profile?.role ?? 'public',
    trusted: profile?.trusted ?? false,
  }
})

/**
 * Asserts the current request has an authenticated user.
 * Throws if not authenticated — use in protected Server Actions.
 */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  return user
}

/**
 * Asserts the current user has moderator or admin role.
 * Throws if not authorized.
 */
export async function requireModerator(): Promise<SessionUser> {
  const user = await requireAuth()
  if (user.role !== 'moderator' && user.role !== 'admin') {
    throw new Error('Forbidden — moderator role required')
  }
  return user
}

/**
 * Asserts the current user has admin role.
 * Throws if not authorized.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth()
  if (user.role !== 'admin') {
    throw new Error('Forbidden — admin role required')
  }
  return user
}
