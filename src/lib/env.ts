/**
 * Environment variable validation using Zod.
 * All env vars are validated at build-time and runtime.
 * Server-side vars are never exposed to the client.
 *
 * Usage:
 *   import { env } from '@/lib/env'
 *   const url = env.NEXT_PUBLIC_SUPABASE_URL
 */

import { z } from 'zod'

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  NEXT_PUBLIC_MAP_TILE_PROVIDER: z.string().url('NEXT_PUBLIC_MAP_TILE_PROVIDER must be a valid URL'),
  NEXT_PUBLIC_MAP_TILE_ATTRIBUTION: z.string().min(1, 'NEXT_PUBLIC_MAP_TILE_ATTRIBUTION is required'),
  NEXT_PUBLIC_GEOCODING_PROVIDER_URL: z.string().url('NEXT_PUBLIC_GEOCODING_PROVIDER_URL must be a valid URL'),
  NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL must be a valid URL'),
})

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  LISTING_FRESHNESS_DAYS: z.coerce.number().int().positive().default(7),
  PHOTO_MAX_SIZE_BYTES: z.coerce.number().int().positive().default(5242880),
  PHOTO_ALLOWED_TYPES: z.string().default('image/jpeg,image/png,image/webp'),
  PHOTO_REJECTION_RETENTION_DAYS: z.coerce.number().int().positive().default(30),
  ANONYMOUS_SUBMISSIONS_ENABLED: z
    .string()
    .transform((v) => v === 'true')
    .default('true'),
  TRUSTED_CONTRIBUTOR_AUTO_ACCEPT: z
    .string()
    .transform((v) => v === 'true')
    .default('true'),
  RATE_LIMIT_SUBMISSIONS_PER_HOUR: z.coerce.number().int().positive().default(10),
  RATE_LIMIT_PRICE_REPORTS_PER_HOUR: z.coerce.number().int().positive().default(20),
})

function validateEnv() {
  const isServer = typeof window === 'undefined'

  const clientResult = clientSchema.safeParse(process.env)
  if (!clientResult.success) {
    console.error('❌ Invalid client environment variables:')
    console.error(clientResult.error.flatten().fieldErrors)
    throw new Error('Invalid client environment variables — check .env.local')
  }

  if (isServer) {
    const serverResult = serverSchema.safeParse(process.env)
    if (!serverResult.success) {
      console.error('❌ Invalid server environment variables:')
      console.error(serverResult.error.flatten().fieldErrors)
      throw new Error('Invalid server environment variables — check .env.local')
    }
    return { ...clientResult.data, ...serverResult.data }
  }

  return clientResult.data as z.infer<typeof clientSchema> & Partial<z.infer<typeof serverSchema>>
}

export const env = validateEnv()
