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

/**
 * Submit a community price report.
 * Auto-accepted for trusted contributors (ADR-03).
 */
export async function submitPriceReport(
  input: PriceReportInput,
  reporterId: string | null,
  isTrusted: boolean,
): Promise<{ reportId: string; accepted: boolean }> {
  const supabase = await createClient()
  const reviewStatus = isTrusted ? 'approved' : 'pending'

  const { data: report, error: reportError } = await supabase
    .from('price_reports')
    .insert({
      listing_id: input.listing_id,
      reported_price_php: input.reported_price_php,
      stock_status: input.stock_status,
      source: 'community_reported',
      reporter_id: reporterId,
      review_status: reviewStatus,
      ...(isTrusted ? { reviewed_at: new Date().toISOString() } : {}),
    } as Parameters<ReturnType<typeof supabase.from>['insert']>[0])
    .select('id')
    .single()

  if (reportError) throw new Error(`Failed to submit report: ${reportError.message}`)

  if (isTrusted) {
    const admin = createAdminClient()
    const now = new Date().toISOString()

    await admin
      .from('store_product_listings')
      .update({
        current_price_php: input.reported_price_php,
        stock_status: input.stock_status,
        last_reported_at: now,
        last_confirmed_at: now,
        updated_at: now,
      } as Parameters<ReturnType<typeof admin.from>['update']>[0])
      .eq('id', input.listing_id)

    await admin
      .from('price_history')
      .insert({
        listing_id: input.listing_id,
        accepted_price_php: input.reported_price_php,
        stock_status: input.stock_status,
        source: 'community_reported',
        source_report_id: (report as { id: string }).id,
        verified_by_id: reporterId,
      } as Parameters<ReturnType<typeof admin.from>['insert']>[0])
  }

  return { reportId: (report as { id: string }).id, accepted: isTrusted }
}

/** Moderator: accept a queued price report and update the listing. */
export async function acceptPriceReport(reportId: string, moderatorId: string): Promise<void> {
  const admin = createAdminClient()

  const { data: report, error: fetchError } = await admin
    .from('price_reports')
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

  await admin
    .from('price_reports')
    .update({ review_status: 'approved', reviewer_id: moderatorId, reviewed_at: now } as Parameters<ReturnType<typeof admin.from>['update']>[0])
    .eq('id', reportId)

  await admin
    .from('store_product_listings')
    .update({
      current_price_php: r.reported_price_php,
      stock_status: r.stock_status,
      last_reported_at: now,
      last_confirmed_at: now,
      updated_at: now,
    } as Parameters<ReturnType<typeof admin.from>['update']>[0])
    .eq('id', r.listing_id)

  await admin
    .from('price_history')
    .insert({
      listing_id: r.listing_id,
      accepted_price_php: r.reported_price_php,
      stock_status: r.stock_status,
      source: 'community_reported',
      source_report_id: reportId,
      verified_by_id: moderatorId,
    } as Parameters<ReturnType<typeof admin.from>['insert']>[0])
}
