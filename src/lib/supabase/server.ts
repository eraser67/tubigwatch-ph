/**
 * Supabase server client — for use in Server Components, Route Handlers,
 * and Server Actions. Reads/writes cookies for session management.
 *
 * IMPORTANT: Never use this in client-side code.
 */
import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// SSR client is intentionally untyped — see comment on createAdminClient below.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createClient(): Promise<ReturnType<typeof createServerClient<any>>> {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Called from a Server Component — safe to ignore.
          }
        },
      },
    },
  )
}

/**
 * Public client for static or unauthenticated queries.
 * Does NOT read cookies, so it doesn't force dynamic rendering on static routes.
 * Uses anon key with RLS enforced (only approved public rows are accessible).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createPublicClient(): ReturnType<typeof createSupabaseClient<any>> {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}

/**
 * Supabase admin client — uses the service-role key.
 * Bypasses ALL RLS policies. Only use in trusted server-side code.
 * NEVER expose this client or its key to the browser.
 */
// Admin client is intentionally untyped — our manually-authored Database type
// does not satisfy the internal SupabaseSchema generic constraint of supabase-js v2.
// All DAL functions use explicit 'as' assertions for safety.
// Replace with supabase gen types output in Phase 9.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createAdminClient(): ReturnType<typeof createSupabaseClient<any>> {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}
