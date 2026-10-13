// Application-wide constants derived from environment and ADR decisions.
// All configurable values come from env vars — nothing is hardcoded here.
// See docs/EnvironmentVariables.md for the full reference.

export const APP_NAME = 'TubigWatch PH'
export const APP_DESCRIPTION =
  'Community-powered water supply and price finder for Philippine municipalities.'

/** Days before a listing is shown as Stale. Default: 7. (ADR-04) */
export const LISTING_FRESHNESS_DAYS =
  typeof process !== 'undefined' && process.env.LISTING_FRESHNESS_DAYS
    ? Number(process.env.LISTING_FRESHNESS_DAYS)
    : 7

/** Maximum photo upload size in bytes. Default: 5 MB. (ADR-05) */
export const PHOTO_MAX_SIZE_BYTES =
  typeof process !== 'undefined' && process.env.PHOTO_MAX_SIZE_BYTES
    ? Number(process.env.PHOTO_MAX_SIZE_BYTES)
    : 5_242_880

/** Allowed photo MIME types. (ADR-05) */
export const PHOTO_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/** Pilot municipality name — replace before Phase 10. (ADR-01) */
export const PILOT_MUNICIPALITY = 'Placeholder Municipality'

/** Default map center [latitude, longitude] and zoom level. */
export const DEFAULT_MAP_CENTER: [number, number] = [14.5995, 120.9842]
export const DEFAULT_MAP_ZOOM = 13

/** Stock status labels. */
export const STOCK_STATUS = {
  AVAILABLE: 'Available',
  LIMITED: 'Limited',
  SOLD_OUT: 'Sold Out',
  UNKNOWN: 'Unknown',
} as const

export type StockStatus = (typeof STOCK_STATUS)[keyof typeof STOCK_STATUS]

/** Verification / trust labels shown in the UI. */
export const VERIFICATION_LABELS = {
  COMMUNITY_REPORTED: 'Community Reported',
  STORE_CONFIRMED: 'Store Confirmed',
  ADMIN_VERIFIED: 'Admin Verified',
} as const

export type VerificationLabel = (typeof VERIFICATION_LABELS)[keyof typeof VERIFICATION_LABELS]

/** Listing / submission statuses used across stores and price reports. */
export const LISTING_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
} as const

export type ListingStatus = (typeof LISTING_STATUS)[keyof typeof LISTING_STATUS]
