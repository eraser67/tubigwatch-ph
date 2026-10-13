/**
 * Database type definitions — manually maintained until Phase 9 when
 * `supabase gen types typescript` is added to the workflow.
 *
 * These types mirror the migration schema exactly.
 * Update this file whenever a migration changes the schema.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type ListingStatus = 'pending' | 'approved' | 'rejected' | 'suspended'
export type VerificationStatus = 'unverified' | 'store_confirmed' | 'admin_verified'
export type StockStatus = 'available' | 'limited' | 'sold_out' | 'unknown'
export type PriceSource = 'community_reported' | 'store_confirmed' | 'admin_verified'
export type ModerationAction =
  | 'approve'
  | 'reject'
  | 'edit'
  | 'suspend'
  | 'merge'
  | 'verify_ownership'
  | 'revoke_trust'
  | 'grant_trust'
export type AppRole = 'public' | 'contributor' | 'moderator' | 'admin'
export type PhotoType = 'storefront' | 'product' | 'price_evidence'
export type ContentReportReason =
  | 'incorrect_price'
  | 'incorrect_location'
  | 'duplicate'
  | 'closed_store'
  | 'spam'
  | 'other'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: AppRole
          trusted: boolean
          display_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role?: AppRole
          trusted?: boolean
          display_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          role?: AppRole
          trusted?: boolean
          display_name?: string | null
          updated_at?: string
        }
      }
      product_categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          sort_order?: number
          created_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          sort_order?: number
        }
      }
      stores: {
        Row: {
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
          listing_status: ListingStatus
          verification_status: VerificationStatus
          creator_id: string | null
          owner_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          address_line?: string | null
          barangay?: string | null
          municipality: string
          province?: string | null
          latitude: number
          longitude: number
          contact_number?: string | null
          opening_hours?: string | null
          delivers?: boolean
          delivery_fee_php?: number | null
          listing_status?: ListingStatus
          verification_status?: VerificationStatus
          creator_id?: string | null
          owner_id?: string | null
        }
        Update: {
          name?: string
          description?: string | null
          address_line?: string | null
          barangay?: string | null
          municipality?: string
          province?: string | null
          latitude?: number
          longitude?: number
          contact_number?: string | null
          opening_hours?: string | null
          delivers?: boolean
          delivery_fee_php?: number | null
          listing_status?: ListingStatus
          verification_status?: VerificationStatus
          owner_id?: string | null
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          category_id: string
          name: string
          brand: string | null
          capacity_liters: number | null
          material: string | null
          dimensions_cm: string | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id: string
          name: string
          brand?: string | null
          capacity_liters?: number | null
          material?: string | null
          dimensions_cm?: string | null
          description?: string | null
        }
        Update: {
          name?: string
          brand?: string | null
          capacity_liters?: number | null
          material?: string | null
          dimensions_cm?: string | null
          description?: string | null
          updated_at?: string
        }
      }
      store_product_listings: {
        Row: {
          id: string
          store_id: string
          product_id: string
          current_price_php: number | null
          stock_status: StockStatus
          listing_status: ListingStatus
          last_reported_at: string | null
          last_confirmed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          product_id: string
          current_price_php?: number | null
          stock_status?: StockStatus
          listing_status?: ListingStatus
          last_reported_at?: string | null
          last_confirmed_at?: string | null
        }
        Update: {
          current_price_php?: number | null
          stock_status?: StockStatus
          listing_status?: ListingStatus
          last_reported_at?: string | null
          last_confirmed_at?: string | null
          updated_at?: string
        }
      }
      price_reports: {
        Row: {
          id: string
          listing_id: string
          reported_price_php: number
          stock_status: StockStatus
          source: PriceSource
          reporter_id: string | null
          evidence_photo_path: string | null
          review_status: ListingStatus
          reviewer_id: string | null
          reviewed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          reported_price_php: number
          stock_status?: StockStatus
          source?: PriceSource
          reporter_id?: string | null
          evidence_photo_path?: string | null
          review_status?: ListingStatus
        }
        Update: {
          review_status?: ListingStatus
          reviewer_id?: string | null
          reviewed_at?: string | null
        }
      }
      price_history: {
        Row: {
          id: string
          listing_id: string
          accepted_price_php: number
          stock_status: StockStatus
          source: PriceSource
          source_report_id: string | null
          verified_by_id: string | null
          effective_at: string
          created_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          accepted_price_php: number
          stock_status?: StockStatus
          source?: PriceSource
          source_report_id?: string | null
          verified_by_id?: string | null
          effective_at?: string
        }
        Update: never
      }
      store_photos: {
        Row: {
          id: string
          store_id: string
          storage_path: string
          photo_type: PhotoType
          review_status: ListingStatus
          uploaded_by_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          store_id: string
          storage_path: string
          photo_type?: PhotoType
          review_status?: ListingStatus
          uploaded_by_id?: string | null
        }
        Update: {
          review_status?: ListingStatus
        }
      }
      product_photos: {
        Row: {
          id: string
          listing_id: string
          storage_path: string
          review_status: ListingStatus
          uploaded_by_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          storage_path: string
          review_status?: ListingStatus
          uploaded_by_id?: string | null
        }
        Update: {
          review_status?: ListingStatus
        }
      }
      content_reports: {
        Row: {
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
        }
        Insert: {
          id?: string
          target_table: string
          target_id: string
          reason: ContentReportReason
          details?: string | null
          reporter_id?: string | null
        }
        Update: {
          status?: 'open' | 'resolved' | 'dismissed'
          resolution_note?: string | null
          resolved_by_id?: string | null
          resolved_at?: string | null
        }
      }
      moderation_actions: {
        Row: {
          id: string
          actor_id: string
          action: ModerationAction
          target_table: string
          target_id: string
          previous_status: string | null
          new_status: string | null
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          actor_id: string
          action: ModerationAction
          target_table: string
          target_id: string
          previous_status?: string | null
          new_status?: string | null
          reason?: string | null
        }
        Update: never
      }
      store_ownership_claims: {
        Row: {
          id: string
          store_id: string
          claimant_id: string
          evidence: string | null
          status: 'pending' | 'approved' | 'rejected'
          reviewer_id: string | null
          reviewed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          store_id: string
          claimant_id: string
          evidence?: string | null
        }
        Update: {
          status?: 'pending' | 'approved' | 'rejected'
          reviewer_id?: string | null
          reviewed_at?: string | null
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      listing_status: ListingStatus
      verification_status: VerificationStatus
      stock_status: StockStatus
      price_source: PriceSource
      app_role: AppRole
      photo_type: PhotoType
      content_report_reason: ContentReportReason
      moderation_action: ModerationAction
    }
  }
}
