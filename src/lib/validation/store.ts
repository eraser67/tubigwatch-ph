/**
 * Zod schemas for store submissions and admin updates.
 * Used in Server Actions — never trust client input.
 */
import { z } from 'zod'

export const StoreSubmitSchema = z.object({
  name: z
    .string()
    .min(2, 'Store name must be at least 2 characters')
    .max(120, 'Store name must be 120 characters or fewer')
    .trim(),
  description: z.string().max(500, 'Description must be 500 characters or fewer').trim().optional(),
  address_line: z.string().max(200).trim().optional(),
  barangay: z.string().max(100).trim().optional(),
  municipality: z
    .string()
    .min(2, 'Municipality is required')
    .max(100)
    .trim(),
  province: z.string().max(100).trim().optional(),
  latitude: z.coerce
    .number()
    .min(-90, 'Invalid latitude')
    .max(90, 'Invalid latitude'),
  longitude: z.coerce
    .number()
    .min(-180, 'Invalid longitude')
    .max(180, 'Invalid longitude'),
  contact_number: z
    .string()
    .regex(/^[0-9+\-\s()]{7,20}$/, 'Invalid phone number format')
    .optional()
    .or(z.literal('')),
  opening_hours: z.string().max(200).trim().optional(),
  delivers: z.coerce.boolean().default(false),
  delivery_fee_php: z.coerce
    .number()
    .min(0, 'Delivery fee cannot be negative')
    .max(9999.99)
    .optional()
    .nullable(),
})

export type StoreSubmitInput = z.infer<typeof StoreSubmitSchema>

/** Admin-only update — allows changing listing and verification status */
export const StoreAdminUpdateSchema = StoreSubmitSchema.partial().extend({
  listing_status: z.enum(['pending', 'approved', 'rejected', 'suspended']).optional(),
  verification_status: z
    .enum(['unverified', 'store_confirmed', 'admin_verified'])
    .optional(),
  owner_id: z.string().uuid().optional().nullable(),
})

export type StoreAdminUpdateInput = z.infer<typeof StoreAdminUpdateSchema>

/** Near-duplicate detection: stores within this radius (km) trigger a warning */
export const DUPLICATE_RADIUS_KM = 0.15
