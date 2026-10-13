/**
 * Zod schemas for product submissions and listings.
 */
import { z } from 'zod'

export const ProductSchema = z.object({
  category_id: z.string().uuid('Invalid category'),
  name: z
    .string()
    .min(2, 'Product name must be at least 2 characters')
    .max(120)
    .trim(),
  brand: z.string().max(100).trim().optional().or(z.literal('')),
  capacity_liters: z.coerce
    .number()
    .positive('Capacity must be a positive number')
    .max(100_000, 'Capacity too large')
    .optional()
    .nullable(),
  material: z.string().max(80).trim().optional().or(z.literal('')),
  dimensions_cm: z
    .string()
    .regex(/^[\d.]+\s*x\s*[\d.]+(\s*x\s*[\d.]+)?$/, 'Format: W x H or W x H x D')
    .optional()
    .or(z.literal('')),
  description: z.string().max(500).trim().optional(),
})

export type ProductInput = z.infer<typeof ProductSchema>

/** Schema for adding a product listing to a specific store */
export const StoreListingSchema = z.object({
  store_id: z.string().uuid('Invalid store'),
  product_id: z.string().uuid('Invalid product'),
  current_price_php: z.coerce
    .number()
    .min(0, 'Price cannot be negative')
    .max(999_999.99, 'Price is unrealistically high')
    .optional()
    .nullable(),
  stock_status: z.enum(['available', 'limited', 'sold_out', 'unknown']).default('unknown'),
})

export type StoreListingInput = z.infer<typeof StoreListingSchema>

/** Schema for a community price report */
export const PriceReportSchema = z.object({
  listing_id: z.string().uuid('Invalid listing'),
  reported_price_php: z.coerce
    .number()
    .min(0, 'Price cannot be negative')
    .max(999_999.99, 'Price is unrealistically high'),
  stock_status: z.enum(['available', 'limited', 'sold_out', 'unknown']).default('available'),
})

export type PriceReportInput = z.infer<typeof PriceReportSchema>
