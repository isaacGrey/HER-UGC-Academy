
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "analytics_events": {
                  Row: {
                    "created_at": string,"entity_id": string,"event": string,"id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"entity_id": string,"event": string,"id"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"entity_id"?: string,"event"?: string,"id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "analytics_events_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"audit_logs": {
                  Row: {
                    "action": string,"actor_id": string | null,"created_at": string,"entity_id": string,"entity_type": string,"id": string,"metadata": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"created_at"?: string,"entity_id": string,"entity_type": string,"id"?: string,"metadata"?: NonNullable<Json>
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"created_at"?: string,"entity_id"?: string,"entity_type"?: string,"id"?: string,"metadata"?: NonNullable<Json>
                  }
                  Relationships: [
                    {
      foreignKeyName: "audit_logs_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"brand_contacts": {
                  Row: {
                    "contact_email": string | null,"contact_name": string | null,"contact_title": string | null,"id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "contact_email"?: string | null,"contact_name"?: string | null,"contact_title"?: string | null,"id": string
                  }
                  Update: {
                    "contact_email"?: string | null,"contact_name"?: string | null,"contact_title"?: string | null,"id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "brand_contacts_id_fkey"
      columns: ["id"]
isOneToOne: true
      referencedRelation: "brands"
      referencedColumns: ["id"]
    }
                  ]
                },"brand_members": {
                  Row: {
                    "brand_id": string,"id": string,"member_role": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "brand_id": string,"id"?: string,"member_role"?: string,"user_id": string
                  }
                  Update: {
                    "brand_id"?: string,"id"?: string,"member_role"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "brand_members_brand_id_fkey"
      columns: ["brand_id"]
isOneToOne: false
      referencedRelation: "brands"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "brand_members_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"brands": {
                  Row: {
                    "company_size": string | null,"created_at": string,"description": string,"id": string,"industry": string,"location": string,"logo_path": string | null,"name": string,"remote": boolean,"slug": string,"updated_at": string,"verified": boolean,"website": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "company_size"?: string | null,"created_at"?: string,"description"?: string,"id"?: string,"industry"?: string,"location"?: string,"logo_path"?: string | null,"name": string,"remote"?: boolean,"slug": string,"updated_at"?: string,"verified"?: boolean,"website"?: string | null
                  }
                  Update: {
                    "company_size"?: string | null,"created_at"?: string,"description"?: string,"id"?: string,"industry"?: string,"location"?: string,"logo_path"?: string | null,"name"?: string,"remote"?: boolean,"slug"?: string,"updated_at"?: string,"verified"?: boolean,"website"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"creator_campaigns": {
                  Row: {
                    "brand_name": string,"compensation": number | null,"created_at": string,"creator_id": string,"end_date": string | null,"external_platform": string | null,"external_url": string | null,"id": string,"name": string,"notes": string | null,"start_date": string | null,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "brand_name": string,"compensation"?: number | null,"created_at"?: string,"creator_id": string,"end_date"?: string | null,"external_platform"?: string | null,"external_url"?: string | null,"id"?: string,"name": string,"notes"?: string | null,"start_date"?: string | null,"status"?: string
                  }
                  Update: {
                    "brand_name"?: string,"compensation"?: number | null,"created_at"?: string,"creator_id"?: string,"end_date"?: string | null,"external_platform"?: string | null,"external_url"?: string | null,"id"?: string,"name"?: string,"notes"?: string | null,"start_date"?: string | null,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "creator_campaigns_creator_id_fkey"
      columns: ["creator_id"]
isOneToOne: false
      referencedRelation: "creator_discovery"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "creator_campaigns_creator_id_fkey"
      columns: ["creator_id"]
isOneToOne: false
      referencedRelation: "creator_profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"creator_contacts": {
                  Row: {
                    "business_email": string | null,"contact_email": string | null,"id": string,"preferred_contact_method": string
                  }
                  ComputedFields: never
                  Insert: {
                    "business_email"?: string | null,"contact_email"?: string | null,"id": string,"preferred_contact_method"?: string
                  }
                  Update: {
                    "business_email"?: string | null,"contact_email"?: string | null,"id"?: string,"preferred_contact_method"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "creator_contacts_id_fkey"
      columns: ["id"]
isOneToOne: true
      referencedRelation: "creator_discovery"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "creator_contacts_id_fkey"
      columns: ["id"]
isOneToOne: true
      referencedRelation: "creator_profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"creator_earnings": {
                  Row: {
                    "amount": number,"campaign_name": string | null,"created_at": string,"creator_id": string,"currency": string,"data_source": string,"external_reference": string | null,"id": string,"period": string,"source": string,"verified": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "amount": number,"campaign_name"?: string | null,"created_at"?: string,"creator_id": string,"currency"?: string,"data_source"?: string,"external_reference"?: string | null,"id"?: string,"period": string,"source": string,"verified"?: boolean
                  }
                  Update: {
                    "amount"?: number,"campaign_name"?: string | null,"created_at"?: string,"creator_id"?: string,"currency"?: string,"data_source"?: string,"external_reference"?: string | null,"id"?: string,"period"?: string,"source"?: string,"verified"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "creator_earnings_creator_id_fkey"
      columns: ["creator_id"]
isOneToOne: false
      referencedRelation: "creator_discovery"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "creator_earnings_creator_id_fkey"
      columns: ["creator_id"]
isOneToOne: false
      referencedRelation: "creator_profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"creator_profiles": {
                  Row: {
                    "academy_status": string | null,"academy_tier": string | null,"availability": string,"avatar_path": string | null,"badges": (string)[],"bio": string,"cohort": string | null,"content_styles": (string)[],"created_at": string,"display_name": string,"graduation_date": string | null,"headline": string,"id": string,"languages": (string)[],"location": string,"niches": (string)[],"platforms": (string)[],"preferred_campaign_types": (string)[],"rate_min": number | null,"specialties": (string)[],"timezone": string,"updated_at": string,"verified": boolean,"verified_at": string | null,"website": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "academy_status"?: string | null,"academy_tier"?: string | null,"availability"?: string,"avatar_path"?: string | null,"badges"?: (string)[],"bio"?: string,"cohort"?: string | null,"content_styles"?: (string)[],"created_at"?: string,"display_name": string,"graduation_date"?: string | null,"headline"?: string,"id": string,"languages"?: (string)[],"location"?: string,"niches"?: (string)[],"platforms"?: (string)[],"preferred_campaign_types"?: (string)[],"rate_min"?: number | null,"specialties"?: (string)[],"timezone"?: string,"updated_at"?: string,"verified"?: boolean,"verified_at"?: string | null,"website"?: string | null
                  }
                  Update: {
                    "academy_status"?: string | null,"academy_tier"?: string | null,"availability"?: string,"avatar_path"?: string | null,"badges"?: (string)[],"bio"?: string,"cohort"?: string | null,"content_styles"?: (string)[],"created_at"?: string,"display_name"?: string,"graduation_date"?: string | null,"headline"?: string,"id"?: string,"languages"?: (string)[],"location"?: string,"niches"?: (string)[],"platforms"?: (string)[],"preferred_campaign_types"?: (string)[],"rate_min"?: number | null,"specialties"?: (string)[],"timezone"?: string,"updated_at"?: string,"verified"?: boolean,"verified_at"?: string | null,"website"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "creator_profiles_id_fkey"
      columns: ["id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"feature_flags": {
                  Row: {
                    "description": string,"enabled": boolean,"id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "description": string,"enabled"?: boolean,"id": string
                  }
                  Update: {
                    "description"?: string,"enabled"?: boolean,"id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"invitations": {
                  Row: {
                    "accepted_at": string | null,"created_at": string,"email": string,"expires_at": string,"id": string,"invited_by": string | null,"revoked_at": string | null,"role": Database["public"]['Enums']["app_role"],"token_hash": string
                  }
                  ComputedFields: never
                  Insert: {
                    "accepted_at"?: string | null,"created_at"?: string,"email": string,"expires_at"?: string,"id"?: string,"invited_by"?: string | null,"revoked_at"?: string | null,"role": Database["public"]['Enums']["app_role"],"token_hash": string
                  }
                  Update: {
                    "accepted_at"?: string | null,"created_at"?: string,"email"?: string,"expires_at"?: string,"id"?: string,"invited_by"?: string | null,"revoked_at"?: string | null,"role"?: Database["public"]['Enums']["app_role"],"token_hash"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "invitations_invited_by_fkey"
      columns: ["invited_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"opportunities": {
                  Row: {
                    "approved_at": string | null,"brand_id": string,"campaign_type": string,"closed_at": string | null,"compensation_max": number,"compensation_min": number,"compensation_type": string,"content_requirements": string,"cover_path": string | null,"created_at": string,"creator_requirements": string,"currency": string,"deadline": string | null,"deliverables": string,"description": string,"end_date": string | null,"external_platform": string,"external_url": string,"featured": boolean,"id": string,"location": string,"niches": (string)[],"photo_1": string | null,"photo_2": string | null,"photo_3": string | null,"platforms": (string)[],"rejection_reason": string | null,"remote": boolean,"start_date": string | null,"status": Database["public"]['Enums']["opportunity_status"],"summary": string,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "approved_at"?: string | null,"brand_id": string,"campaign_type"?: string,"closed_at"?: string | null,"compensation_max"?: number,"compensation_min"?: number,"compensation_type"?: string,"content_requirements"?: string,"cover_path"?: string | null,"created_at"?: string,"creator_requirements"?: string,"currency"?: string,"deadline"?: string | null,"deliverables"?: string,"description": string,"end_date"?: string | null,"external_platform"?: string,"external_url": string,"featured"?: boolean,"id"?: string,"location"?: string,"niches"?: (string)[],"photo_1"?: string | null,"photo_2"?: string | null,"photo_3"?: string | null,"platforms"?: (string)[],"rejection_reason"?: string | null,"remote"?: boolean,"start_date"?: string | null,"status"?: Database["public"]['Enums']["opportunity_status"],"summary": string,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "approved_at"?: string | null,"brand_id"?: string,"campaign_type"?: string,"closed_at"?: string | null,"compensation_max"?: number,"compensation_min"?: number,"compensation_type"?: string,"content_requirements"?: string,"cover_path"?: string | null,"created_at"?: string,"creator_requirements"?: string,"currency"?: string,"deadline"?: string | null,"deliverables"?: string,"description"?: string,"end_date"?: string | null,"external_platform"?: string,"external_url"?: string,"featured"?: boolean,"id"?: string,"location"?: string,"niches"?: (string)[],"photo_1"?: string | null,"photo_2"?: string | null,"photo_3"?: string | null,"platforms"?: (string)[],"rejection_reason"?: string | null,"remote"?: boolean,"start_date"?: string | null,"status"?: Database["public"]['Enums']["opportunity_status"],"summary"?: string,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "opportunities_brand_id_fkey"
      columns: ["brand_id"]
isOneToOne: false
      referencedRelation: "brands"
      referencedColumns: ["id"]
    }
                  ]
                },"plans": {
                  Row: {
                    "active": boolean,"created_at": string,"currency": string,"description": string,"features": (string)[],"id": string,"is_default": boolean,"name": string,"price_monthly": number,"price_yearly": number,"stripe_price_monthly_id": string | null,"stripe_price_yearly_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"created_at"?: string,"currency"?: string,"description"?: string,"features"?: (string)[],"id"?: string,"is_default"?: boolean,"name": string,"price_monthly"?: number,"price_yearly"?: number,"stripe_price_monthly_id"?: string | null,"stripe_price_yearly_id"?: string | null
                  }
                  Update: {
                    "active"?: boolean,"created_at"?: string,"currency"?: string,"description"?: string,"features"?: (string)[],"id"?: string,"is_default"?: boolean,"name"?: string,"price_monthly"?: number,"price_yearly"?: number,"stripe_price_monthly_id"?: string | null,"stripe_price_yearly_id"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"portfolio_items": {
                  Row: {
                    "brand_name": string | null,"created_at": string,"creator_id": string,"description": string,"display_order": number,"featured": boolean,"id": string,"image_path": string | null,"likes": number | null,"media_type": string,"platform": string,"title": string,"url": string | null,"views": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "brand_name"?: string | null,"created_at"?: string,"creator_id": string,"description"?: string,"display_order"?: number,"featured"?: boolean,"id"?: string,"image_path"?: string | null,"likes"?: number | null,"media_type"?: string,"platform"?: string,"title": string,"url"?: string | null,"views"?: number | null
                  }
                  Update: {
                    "brand_name"?: string | null,"created_at"?: string,"creator_id"?: string,"description"?: string,"display_order"?: number,"featured"?: boolean,"id"?: string,"image_path"?: string | null,"likes"?: number | null,"media_type"?: string,"platform"?: string,"title"?: string,"url"?: string | null,"views"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "portfolio_items_creator_id_fkey"
      columns: ["creator_id"]
isOneToOne: false
      referencedRelation: "creator_discovery"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "portfolio_items_creator_id_fkey"
      columns: ["creator_id"]
isOneToOne: false
      referencedRelation: "creator_profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "can_invite_admin": boolean,"created_at": string,"display_name": string,"email": string,"id": string,"role": Database["public"]['Enums']["app_role"],"status": Database["public"]['Enums']["account_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "can_invite_admin"?: boolean,"created_at"?: string,"display_name": string,"email": string,"id": string,"role": Database["public"]['Enums']["app_role"],"status"?: Database["public"]['Enums']["account_status"],"updated_at"?: string
                  }
                  Update: {
                    "can_invite_admin"?: boolean,"created_at"?: string,"display_name"?: string,"email"?: string,"id"?: string,"role"?: Database["public"]['Enums']["app_role"],"status"?: Database["public"]['Enums']["account_status"],"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"rate_limits": {
                  Row: {
                    "hits": number,"id": string,"reset_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "hits": number,"id": string,"reset_at": string
                  }
                  Update: {
                    "hits"?: number,"id"?: string,"reset_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"saved_brands": {
                  Row: {
                    "brand_id": string,"created_at": string,"id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "brand_id": string,"created_at"?: string,"id"?: string,"user_id": string
                  }
                  Update: {
                    "brand_id"?: string,"created_at"?: string,"id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "saved_brands_brand_id_fkey"
      columns: ["brand_id"]
isOneToOne: false
      referencedRelation: "brands"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "saved_brands_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"saved_creators": {
                  Row: {
                    "created_at": string,"creator_id": string,"id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"creator_id": string,"id"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"creator_id"?: string,"id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "saved_creators_creator_id_fkey"
      columns: ["creator_id"]
isOneToOne: false
      referencedRelation: "creator_discovery"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "saved_creators_creator_id_fkey"
      columns: ["creator_id"]
isOneToOne: false
      referencedRelation: "creator_profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "saved_creators_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"saved_opportunities": {
                  Row: {
                    "created_at": string,"id": string,"opportunity_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"opportunity_id": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"opportunity_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "saved_opportunities_opportunity_id_fkey"
      columns: ["opportunity_id"]
isOneToOne: false
      referencedRelation: "opportunities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "saved_opportunities_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"social_accounts": {
                  Row: {
                    "connected_at": string,"connection_method": string,"creator_id": string,"id": string,"last_synced_at": string | null,"oauth_status": string,"platform": string,"platform_user_id": string | null,"profile_url": string,"username": string
                  }
                  ComputedFields: never
                  Insert: {
                    "connected_at"?: string,"connection_method"?: string,"creator_id": string,"id"?: string,"last_synced_at"?: string | null,"oauth_status"?: string,"platform": string,"platform_user_id"?: string | null,"profile_url": string,"username": string
                  }
                  Update: {
                    "connected_at"?: string,"connection_method"?: string,"creator_id"?: string,"id"?: string,"last_synced_at"?: string | null,"oauth_status"?: string,"platform"?: string,"platform_user_id"?: string | null,"profile_url"?: string,"username"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "social_accounts_creator_id_fkey"
      columns: ["creator_id"]
isOneToOne: false
      referencedRelation: "creator_discovery"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "social_accounts_creator_id_fkey"
      columns: ["creator_id"]
isOneToOne: false
      referencedRelation: "creator_profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"social_metric_snapshots": {
                  Row: {
                    "average_comments": number,"average_likes": number,"average_shares": number,"average_views": number,"created_at": string,"engagement_rate": number,"followers": number,"following": number,"id": string,"social_account_id": string,"source": string,"total_views": number,"video_count": number
                  }
                  ComputedFields: never
                  Insert: {
                    "average_comments"?: number,"average_likes"?: number,"average_shares"?: number,"average_views"?: number,"created_at"?: string,"engagement_rate"?: number,"followers"?: number,"following"?: number,"id"?: string,"social_account_id": string,"source"?: string,"total_views"?: number,"video_count"?: number
                  }
                  Update: {
                    "average_comments"?: number,"average_likes"?: number,"average_shares"?: number,"average_views"?: number,"created_at"?: string,"engagement_rate"?: number,"followers"?: number,"following"?: number,"id"?: string,"social_account_id"?: string,"source"?: string,"total_views"?: number,"video_count"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "social_metric_snapshots_social_account_id_fkey"
      columns: ["social_account_id"]
isOneToOne: false
      referencedRelation: "social_accounts"
      referencedColumns: ["id"]
    }
                  ]
                },"subscriptions": {
                  Row: {
                    "brand_id": string,"current_period_end": string | null,"id": string,"plan_id": string | null,"status": string,"stripe_customer_id": string | null,"stripe_subscription_id": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "brand_id": string,"current_period_end"?: string | null,"id"?: string,"plan_id"?: string | null,"status"?: string,"stripe_customer_id"?: string | null,"stripe_subscription_id"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "brand_id"?: string,"current_period_end"?: string | null,"id"?: string,"plan_id"?: string | null,"status"?: string,"stripe_customer_id"?: string | null,"stripe_subscription_id"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "subscriptions_brand_id_fkey"
      columns: ["brand_id"]
isOneToOne: true
      referencedRelation: "brands"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "subscriptions_plan_id_fkey"
      columns: ["plan_id"]
isOneToOne: false
      referencedRelation: "plans"
      referencedColumns: ["id"]
    }
                  ]
                },"webhook_events": {
                  Row: {
                    "created_at": string,"id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            "creator_discovery": {
                  Row: {
                    "academy_status": string | null,"academy_tier": string | null,"availability": string,"avatar_path": string | null,"average_views": number | null,"badges": (string)[],"bio": string,"cohort": string | null,"content_styles": (string)[],"created_at": string,"display_name": string,"engagement_rate": number | null,"followers": number | null,"graduation_date": string | null,"headline": string,"id": string,"languages": (string)[],"last_snapshot_at": string | null,"location": string,"metric_account_count": number | null,"niches": (string)[],"platforms": (string)[],"preferred_campaign_types": (string)[],"rate_min": number | null,"specialties": (string)[],"timezone": string,"total_views": number | null,"updated_at": string,"verified": boolean,"verified_at": string | null,"website": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "creator_profiles_id_fkey"
      columns: ["id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "active_role":
{ Args: Record<PropertyKey, never>; Returns: Database["public"]['Enums']["app_role"]
                           },
"brand_visible":
{ Args: { "b": string }; Returns: boolean
                           },
"consume_rate_limit":
{ Args: { "key": string,"maximum": number,"seconds": number }; Returns: boolean
                           },
"creator_visible":
{ Args: { "c": string }; Returns: boolean
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_brand_member":
{ Args: { "b": string }; Returns: boolean
                           }
          }
          Enums: {
            "account_status": "INVITED"|"ACTIVE"|"SUSPENDED"|"REVOKED"|"DELETED","app_role": "CREATOR"|"BRAND"|"ADMIN","opportunity_status": "DRAFT"|"PENDING"|"APPROVED"|"LIVE"|"CLOSED"|"REJECTED"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "account_status": ["INVITED", "ACTIVE", "SUSPENDED", "REVOKED", "DELETED"],"app_role": ["CREATOR", "BRAND", "ADMIN"],"opportunity_status": ["DRAFT", "PENDING", "APPROVED", "LIVE", "CLOSED", "REJECTED"]
          }
        }
} as const
