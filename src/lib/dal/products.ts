/**
 * Data Access Layer — Products, Categories, Listings, Price Reports
 */
import { cache } from 'react'
import { createClient, createAdminClient, createPublicClient } from '@/lib/supabase/server'
import type { ProductInput, StoreListingInput, PriceReportInput } from '@/lib/validation/product'

export type CategoryDTO = {
  id: string
  name: string
  slug: string
  description: string | null
  sort_order: number
}

export type ProductDTO = {
  id: string
  category_id: string
  name: string
  brand: string | null
  capacity_liters: number | null
  material: string | null
  dimensions_cm: string | null
  description: string | null
}

export type ListingDTO = {
  id: string
  store_id: string
  product_id: string
  current_price_php: number | null
  stock_status: string
  listing_status: string
  last_reported_at: string | null
  last_confirmed_at: string | null
}

/** Returns all product categories in sort order — public. */
export const getCategories = cache(async (): Promise<CategoryDTO[]> => {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('product_categories')
    .select('id,name,slug,description,sort_order')
    .order('sort_order')

  if (error) throw new Error(`Failed to fetch categories: ${error.message}`)
  return (data ?? []) as CategoryDTO[]
})

/** Returns all products, optionally filtered by category — public. */
export const getProducts = cache(async (categoryId?: string): Promise<ProductDTO[]> => {
  const supabase = createPublicClient()
  const query = supabase
    .from('products')
    .select('id,category_id,name,brand,capacity_liters,material,dimensions_cm,description')
    .order('name')

  const { data, error } = categoryId
    ? await query.eq('category_id', categoryId)
    : await query

  if (error) throw new Error(`Failed to fetch products: ${error.message}`)
  return (data ?? []) as ProductDTO[]
})

/** Returns a single product by ID — public. */
export const getProductById = cache(async (id: string): Promise<ProductDTO | null> => {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('products')
    .select('id,category_id,name,brand,capacity_liters,material,dimensions_cm,description')
    .eq('id', id)
    .single()

  if (error?.code === 'PGRST116') return null
  if (error) throw new Error(`Failed to fetch product: ${error.message}`)
  return data as ProductDTO | null
})

export type ListingWithProductDTO = ListingDTO & {
  product: ProductDTO | null
}

/** Returns all approved listings for a store — public. */
export const getListingsForStore = cache(async (storeId: string): Promise<ListingDTO[]> => {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('store_product_listings')
    .select(
      'id,store_id,product_id,current_price_php,stock_status,listing_status,last_reported_at,last_confirmed_at',
    )
    .eq('store_id', storeId)
    .eq('listing_status', 'approved')
    .order('last_reported_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch listings: ${error.message}`)
  return (data ?? []) as ListingDTO[]
})

/** Returns all approved listings for a store with full product details — public. */
export const getListingsWithProductForStore = cache(
  async (storeId: string): Promise<ListingWithProductDTO[]> => {
    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from('store_product_listings')
      .select(`
        id,
        store_id,
        product_id,
        current_price_php,
        stock_status,
        listing_status,
        last_reported_at,
        last_confirmed_at,
        products (
          id,
          category_id,
          name,
          brand,
          capacity_liters,
          material,
          dimensions_cm,
          description
        )
      `)
      .eq('store_id', storeId)
      .eq('listing_status', 'approved')
      .order('last_reported_at', { ascending: false })

    if (error) throw new Error(`Failed to fetch store listings with products: ${error.message}`)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).map((row: any) => ({
      id: row.id,
      store_id: row.store_id,
      product_id: row.product_id,
      current_price_php: row.current_price_php != null ? Number(row.current_price_php) : null,
      stock_status: row.stock_status,
      listing_status: row.listing_status,
      last_reported_at: row.last_reported_at,
      last_confirmed_at: row.last_confirmed_at,
      product: row.products ?? null,
    })) as ListingWithProductDTO[]
  },
)

/** Admin: all listings for a store regardless of status. */
export async function getAllListingsForStoreAdmin(storeId: string): Promise<ListingDTO[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('store_product_listings')
    .select(
      'id,store_id,product_id,current_price_php,stock_status,listing_status,last_reported_at,last_confirmed_at',
    )
    .eq('store_id', storeId)
    .order('listing_status')

  if (error) throw new Error(`Failed to fetch all listings: ${error.message}`)
  return (data ?? []) as ListingDTO[]
}

/** Admin: create a product. */
export async function createProduct(input: ProductInput): Promise<{ id: string }> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('products')
    .insert({
      category_id: input.category_id,
      name: input.name,
      brand: input.brand || null,
      capacity_liters: input.capacity_liters ?? null,
      material: input.material || null,
      dimensions_cm: input.dimensions_cm || null,
      description: input.description ?? null,
    } as Parameters<ReturnType<typeof admin.from>['insert']>[0])
    .select('id')
    .single()

  if (error?.code === '23505') {
    throw new Error('A product with this name, brand, and capacity already exists in this category.')
  }
  if (error) throw new Error(`Failed to create product: ${error.message}`)
  return { id: (data as { id: string }).id }
}

/** Add a product listing to a store. */
export async function createStoreListing(input: StoreListingInput): Promise<{ id: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('store_product_listings')
    .insert({
      store_id: input.store_id,
      product_id: input.product_id,
      current_price_php: input.current_price_php ?? null,
      stock_status: input.stock_status,
      listing_status: 'pending',
      last_reported_at: new Date().toISOString(),
    } as Parameters<ReturnType<typeof supabase.from>['insert']>[0])
    .select('id')
    .single()

  if (error?.code === '23505') throw new Error('This product is already listed for this store.')
  if (error) throw new Error(`Failed to create listing: ${error.message}`)
  return { id: (data as { id: string }).id }
}
export type PriceHistoryDTO = {
  id: string
  listing_id: string
  accepted_price_php: number
  stock_status: string
  source: string
  source_report_id: string | null
  verified_by_id: string | null
  effective_at: string
  created_at: string
}

export type PendingPriceReportDTO = {
  id: string
  listing_id: string
  reported_price_php: number
  stock_status: string
  source: string
  evidence_photo_path: string | null
  created_at: string
  listing: {
    id: string
    current_price_php: number | null
    store: {
      id: string
      name: string
      municipality: string
    } | null
    product: {
      id: string
      name: string
      capacity_liters: number | null
    } | null
  } | null
}

/**
 * Submit a community price report.
 * Auto-accepted for trusted contributors (ADR-03).
 */
export async function submitPriceReport(
  input: PriceReportInput,
  reporterId: string | null,
  isTrusted: boolean,
  evidencePhotoPath?: string | null,
): Promise<{ reportId: string; accepted: boolean }> {
  const supabase = await createClient()
  const reviewStatus = isTrusted ? 'approved' : 'pending'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: report, error: reportError } = await (supabase.from('price_reports') as any)
    .insert({
      listing_id: input.listing_id,
      reported_price_php: input.reported_price_php,
      stock_status: input.stock_status,
      source: 'community_reported',
      reporter_id: reporterId,
      evidence_photo_path: evidencePhotoPath ?? null,
      review_status: reviewStatus,
      ...(isTrusted ? { reviewed_at: new Date().toISOString() } : {}),
    })
    .select('id')
    .single()

  if (reportError) throw new Error(`Failed to submit report: ${reportError.message}`)

  if (isTrusted) {
    const admin = createAdminClient()
    const now = new Date().toISOString()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin.from('store_product_listings') as any)
      .update({
        current_price_php: input.reported_price_php,
        stock_status: input.stock_status,
        last_reported_at: now,
        last_confirmed_at: now,
        updated_at: now,
      })
      .eq('id', input.listing_id)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin.from('price_history') as any).insert({
      listing_id: input.listing_id,
      accepted_price_php: input.reported_price_php,
      stock_status: input.stock_status,
      source: 'community_reported',
      source_report_id: (report as { id: string }).id,
      verified_by_id: reporterId,
    })
  }

  return { reportId: (report as { id: string }).id, accepted: isTrusted }
}

/** Moderator: accept a queued price report and update the listing. */
export async function acceptPriceReport(reportId: string, moderatorId: string): Promise<void> {
  const admin = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: report, error: fetchError } = await (admin.from('price_reports') as any)
    .select('id,listing_id,reported_price_php,stock_status')
    .eq('id', reportId)
    .single()

  if (fetchError || !report) throw new Error('Price report not found')

  const r = report as {
    id: string
    listing_id: string
    reported_price_php: number
    stock_status: string
  }
  const now = new Date().toISOString()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin.from('price_reports') as any)
    .update({ review_status: 'approved', reviewer_id: moderatorId, reviewed_at: now })
    .eq('id', reportId)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin.from('store_product_listings') as any)
    .update({
      current_price_php: r.reported_price_php,
      stock_status: r.stock_status,
      last_reported_at: now,
      last_confirmed_at: now,
      updated_at: now,
    })
    .eq('id', r.listing_id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin.from('price_history') as any).insert({
    listing_id: r.listing_id,
    accepted_price_php: r.reported_price_php,
    stock_status: r.stock_status,
    source: 'community_reported',
    source_report_id: reportId,
    verified_by_id: moderatorId,
  })
}

/** Moderator: reject a queued price report. */
export async function rejectPriceReport(reportId: string, moderatorId: string): Promise<void> {
  const admin = createAdminClient()
  const now = new Date().toISOString()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin.from('price_reports') as any)
    .update({ review_status: 'rejected', reviewer_id: moderatorId, reviewed_at: now })
    .eq('id', reportId)

  if (error) throw new Error(`Failed to reject price report: ${error.message}`)
}

/** Public: get price history for a specific listing ordered by latest first. */
export const getPriceHistoryForListing = cache(
  async (listingId: string): Promise<PriceHistoryDTO[]> => {
    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from('price_history')
      .select('id,listing_id,accepted_price_php,stock_status,source,source_report_id,verified_by_id,effective_at,created_at')
      .eq('listing_id', listingId)
      .order('effective_at', { ascending: false })

    if (error) throw new Error(`Failed to fetch price history: ${error.message}`)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).map((row: any) => ({
      ...row,
      accepted_price_php: Number(row.accepted_price_php),
    })) as PriceHistoryDTO[]
  },
)

/** Moderator: get all pending price reports awaiting review. */
export async function getPendingPriceReports(): Promise<PendingPriceReportDTO[]> {
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin.from('price_reports') as any)
    .select(`
      id,
      listing_id,
      reported_price_php,
      stock_status,
      source,
      evidence_photo_path,
      created_at,
      store_product_listings (
        id,
        current_price_php,
        stores (
          id,
          name,
          municipality
        ),
        products (
          id,
          name,
          capacity_liters
        )
      )
    `)
    .eq('review_status', 'pending')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch pending price reports: ${error.message}`)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => ({
    id: row.id,
    listing_id: row.listing_id,
    reported_price_php: Number(row.reported_price_php),
    stock_status: row.stock_status,
    source: row.source,
    evidence_photo_path: row.evidence_photo_path,
    created_at: row.created_at,
    listing: row.store_product_listings
      ? {
          id: row.store_product_listings.id,
          current_price_php:
            row.store_product_listings.current_price_php != null
              ? Number(row.store_product_listings.current_price_php)
              : null,
          store: row.store_product_listings.stores ?? null,
          product: row.store_product_listings.products ?? null,
        }
      : null,
  })) as PendingPriceReportDTO[]
}

export type StoreInfoForComparison = {
  id: string
  name: string
  barangay: string | null
  municipality: string
  latitude: number
  longitude: number
  delivers: boolean
  delivery_fee_php: number | null
  verification_status: string
}

export type ComparisonListingDTO = {
  id: string
  store_id: string
  product_id: string
  current_price_php: number
  stock_status: string
  listing_status: string
  last_reported_at: string | null
  last_confirmed_at: string | null
  product: ProductDTO & {
    category: CategoryDTO | null
  }
  store: StoreInfoForComparison
}

/**
 * Returns all approved listings across all approved stores for price comparison and search.
 * Public cached query.
 */
export const getListingsForComparison = cache(
  async (): Promise<ComparisonListingDTO[]> => {
    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from('store_product_listings')
      .select(`
        id,
        store_id,
        product_id,
        current_price_php,
        stock_status,
        listing_status,
        last_reported_at,
        last_confirmed_at,
        stores!inner (
          id,
          name,
          barangay,
          municipality,
          latitude,
          longitude,
          delivers,
          delivery_fee_php,
          verification_status,
          listing_status
        ),
        products!inner (
          id,
          category_id,
          name,
          brand,
          capacity_liters,
          material,
          dimensions_cm,
          description,
          product_categories (
            id,
            name,
            slug,
            description,
            sort_order
          )
        )
      `)
      .eq('listing_status', 'approved')
      .eq('stores.listing_status', 'approved')
      .not('current_price_php', 'is', null)
      .order('current_price_php', { ascending: true })

    if (error) throw new Error(`Failed to fetch comparison listings: ${error.message}`)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).map((row: any) => ({
      id: row.id,
      store_id: row.store_id,
      product_id: row.product_id,
      current_price_php: Number(row.current_price_php),
      stock_status: row.stock_status,
      listing_status: row.listing_status,
      last_reported_at: row.last_reported_at,
      last_confirmed_at: row.last_confirmed_at,
      product: {
        id: row.products.id,
        category_id: row.products.category_id,
        name: row.products.name,
        brand: row.products.brand,
        capacity_liters:
          row.products.capacity_liters != null ? Number(row.products.capacity_liters) : null,
        material: row.products.material,
        dimensions_cm: row.products.dimensions_cm,
        description: row.products.description,
        category: row.products.product_categories
          ? {
              id: row.products.product_categories.id,
              name: row.products.product_categories.name,
              slug: row.products.product_categories.slug,
              description: row.products.product_categories.description,
              sort_order: row.products.product_categories.sort_order,
            }
          : null,
      },
      store: {
        id: row.stores.id,
        name: row.stores.name,
        barangay: row.stores.barangay,
        municipality: row.stores.municipality,
        latitude: row.stores.latitude,
        longitude: row.stores.longitude,
        delivers: row.stores.delivers,
        delivery_fee_php:
          row.stores.delivery_fee_php != null ? Number(row.stores.delivery_fee_php) : null,
        verification_status: row.stores.verification_status,
      },
    }))
  },
)
