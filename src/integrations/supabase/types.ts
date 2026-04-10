export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string | null
          event_name: string
          id: string
          metadata: Json | null
          order_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_name: string
          id?: string
          metadata?: Json | null
          order_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_name?: string
          id?: string
          metadata?: Json | null
          order_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      banners: {
        Row: {
          active: boolean | null
          banner_order: number | null
          button_text: string | null
          created_at: string | null
          id: string
          image_url: string
          link_url: string | null
          subtitle: string | null
          title: string | null
        }
        Insert: {
          active?: boolean | null
          banner_order?: number | null
          button_text?: string | null
          created_at?: string | null
          id?: string
          image_url: string
          link_url?: string | null
          subtitle?: string | null
          title?: string | null
        }
        Update: {
          active?: boolean | null
          banner_order?: number | null
          button_text?: string | null
          created_at?: string | null
          id?: string
          image_url?: string
          link_url?: string | null
          subtitle?: string | null
          title?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          active: boolean | null
          cat_order: number | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          image_url: string | null
          name: string
          slug: string
        }
        Insert: {
          active?: boolean | null
          cat_order?: number | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          name: string
          slug: string
        }
        Update: {
          active?: boolean | null
          cat_order?: number | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      cleanup_reports: {
        Row: {
          bucket: string
          bytes_freed: number | null
          created_at: string | null
          details: Json | null
          errors: number | null
          finished_at: string | null
          id: string
          mode: string
          started_at: string | null
          total_orphans: number | null
        }
        Insert: {
          bucket: string
          bytes_freed?: number | null
          created_at?: string | null
          details?: Json | null
          errors?: number | null
          finished_at?: string | null
          id?: string
          mode: string
          started_at?: string | null
          total_orphans?: number | null
        }
        Update: {
          bucket?: string
          bytes_freed?: number | null
          created_at?: string | null
          details?: Json | null
          errors?: number | null
          finished_at?: string | null
          id?: string
          mode?: string
          started_at?: string | null
          total_orphans?: number | null
        }
        Relationships: []
      }
      cms_media: {
        Row: {
          alt: string | null
          created_at: string
          height: number | null
          id: string
          mime_type: string | null
          path: string
          size_bytes: number | null
          url: string
          width: number | null
        }
        Insert: {
          alt?: string | null
          created_at?: string
          height?: number | null
          id?: string
          mime_type?: string | null
          path: string
          size_bytes?: number | null
          url: string
          width?: number | null
        }
        Update: {
          alt?: string | null
          created_at?: string
          height?: number | null
          id?: string
          mime_type?: string | null
          path?: string
          size_bytes?: number | null
          url?: string
          width?: number | null
        }
        Relationships: []
      }
      cms_page_revisions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          page_id: string
          snapshot: Json
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          page_id: string
          snapshot: Json
          version: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          page_id?: string
          snapshot?: Json
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "cms_page_revisions_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "cms_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_pages: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_home: boolean
          og_image_url: string | null
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_home?: boolean
          og_image_url?: string | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_home?: boolean
          og_image_url?: string | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      cms_sections: {
        Row: {
          created_at: string
          data: Json
          enabled: boolean
          id: string
          name: string | null
          page_id: string
          sort_order: number
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data?: Json
          enabled?: boolean
          id?: string
          name?: string | null
          page_id: string
          sort_order?: number
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json
          enabled?: boolean
          id?: string
          name?: string | null
          page_id?: string
          sort_order?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cms_sections_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "cms_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_requests: {
        Row: {
          created_at: string | null
          email: string
          file_url: string | null
          id: string
          message: string | null
          name: string
          phone: string | null
          product: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          file_url?: string | null
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          product?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          file_url?: string | null
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          product?: string | null
        }
        Relationships: []
      }
      customer_files: {
        Row: {
          admin_comment: string | null
          category: string | null
          customer_id: string
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          order_item_id: string | null
          status: string | null
          uploaded_at: string | null
        }
        Insert: {
          admin_comment?: string | null
          category?: string | null
          customer_id: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          order_item_id?: string | null
          status?: string | null
          uploaded_at?: string | null
        }
        Update: {
          admin_comment?: string | null
          category?: string | null
          customer_id?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          order_item_id?: string | null
          status?: string | null
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_files_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_files_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      health_checks: {
        Row: {
          created_at: string | null
          details: Json | null
          id: string
          status: string
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          id?: string
          status: string
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          id?: string
          status?: string
        }
        Relationships: []
      }
      notifications_queue: {
        Row: {
          attempts: number | null
          channel: string
          created_at: string | null
          event_type: string
          id: string
          last_error: string | null
          max_attempts: number | null
          next_retry_at: string | null
          order_id: string
          payload: Json | null
          processed_at: string | null
          recipient_email: string | null
          recipient_type: string
          status: string
        }
        Insert: {
          attempts?: number | null
          channel?: string
          created_at?: string | null
          event_type: string
          id?: string
          last_error?: string | null
          max_attempts?: number | null
          next_retry_at?: string | null
          order_id: string
          payload?: Json | null
          processed_at?: string | null
          recipient_email?: string | null
          recipient_type: string
          status?: string
        }
        Update: {
          attempts?: number | null
          channel?: string
          created_at?: string | null
          event_type?: string
          id?: string
          last_error?: string | null
          max_attempts?: number | null
          next_retry_at?: string | null
          order_id?: string
          payload?: Json | null
          processed_at?: string | null
          recipient_email?: string | null
          recipient_type?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_queue_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          artwork_status: string | null
          artwork_url: string | null
          created_at: string | null
          custom_height: number | null
          custom_width: number | null
          id: string
          notes: string | null
          order_id: string
          product_id: string | null
          product_name: string
          product_snapshot: Json | null
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          artwork_status?: string | null
          artwork_url?: string | null
          created_at?: string | null
          custom_height?: number | null
          custom_width?: number | null
          id?: string
          notes?: string | null
          order_id: string
          product_id?: string | null
          product_name: string
          product_snapshot?: Json | null
          quantity?: number
          total_price: number
          unit_price: number
        }
        Update: {
          artwork_status?: string | null
          artwork_url?: string | null
          created_at?: string | null
          custom_height?: number | null
          custom_width?: number | null
          id?: string
          notes?: string | null
          order_id?: string
          product_id?: string | null
          product_name?: string
          product_snapshot?: Json | null
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_timeline: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          message: string | null
          order_id: string
          status: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          message?: string | null
          order_id: string
          status: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          message?: string | null
          order_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_timeline_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          customer_id: string
          discount: number | null
          estimated_delivery: string | null
          id: string
          notes: string | null
          order_number: string
          payment_id: string | null
          payment_method: string | null
          payment_status: string | null
          shipping: number | null
          shipping_address: Json | null
          status: string
          subtotal: number | null
          total: number | null
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          customer_id: string
          discount?: number | null
          estimated_delivery?: string | null
          id?: string
          notes?: string | null
          order_number: string
          payment_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          shipping?: number | null
          shipping_address?: Json | null
          status?: string
          subtotal?: number | null
          total?: number | null
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          customer_id?: string
          discount?: number | null
          estimated_delivery?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          payment_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          shipping?: number | null
          shipping_address?: Json | null
          status?: string
          subtotal?: number | null
          total?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_webhook_events: {
        Row: {
          error_message: string | null
          id: string
          order_number: string | null
          payload: Json | null
          pg_status: number | null
          processed_at: string | null
          provider: string
          provider_event_id: string
          received_at: string | null
          status: string
          transaction_code: string | null
        }
        Insert: {
          error_message?: string | null
          id?: string
          order_number?: string | null
          payload?: Json | null
          pg_status?: number | null
          processed_at?: string | null
          provider?: string
          provider_event_id: string
          received_at?: string | null
          status?: string
          transaction_code?: string | null
        }
        Update: {
          error_message?: string | null
          id?: string
          order_number?: string | null
          payload?: Json | null
          pg_status?: number | null
          processed_at?: string | null
          provider?: string
          provider_event_id?: string
          received_at?: string | null
          status?: string
          transaction_code?: string | null
        }
        Relationships: []
      }
      portfolio_items: {
        Row: {
          active: boolean | null
          category: string
          created_at: string | null
          description: string | null
          id: string
          image_url: string
          item_order: number | null
          title: string
        }
        Insert: {
          active?: boolean | null
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string
          item_order?: number | null
          title: string
        }
        Update: {
          active?: boolean | null
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string
          item_order?: number | null
          title?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean | null
          base_price: number | null
          category_id: string | null
          created_at: string | null
          description: string | null
          featured: boolean | null
          has_custom_size: boolean | null
          id: string
          images: string[] | null
          meta_description: string | null
          meta_title: string | null
          min_quantity: number | null
          name: string
          needs_artwork: boolean | null
          price_unit: string | null
          prod_order: number | null
          production_days: number | null
          short_description: string | null
          slug: string
          tags: string[] | null
          thumbnail: string | null
          updated_at: string | null
          weight_g: number | null
        }
        Insert: {
          active?: boolean | null
          base_price?: number | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          featured?: boolean | null
          has_custom_size?: boolean | null
          id?: string
          images?: string[] | null
          meta_description?: string | null
          meta_title?: string | null
          min_quantity?: number | null
          name: string
          needs_artwork?: boolean | null
          price_unit?: string | null
          prod_order?: number | null
          production_days?: number | null
          short_description?: string | null
          slug: string
          tags?: string[] | null
          thumbnail?: string | null
          updated_at?: string | null
          weight_g?: number | null
        }
        Update: {
          active?: boolean | null
          base_price?: number | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          featured?: boolean | null
          has_custom_size?: boolean | null
          id?: string
          images?: string[] | null
          meta_description?: string | null
          meta_title?: string | null
          min_quantity?: number | null
          name?: string
          needs_artwork?: boolean | null
          price_unit?: string | null
          prod_order?: number | null
          production_days?: number | null
          short_description?: string | null
          slug?: string
          tags?: string[] | null
          thumbnail?: string | null
          updated_at?: string | null
          weight_g?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_name: string | null
          cpf_cnpj: string | null
          created_at: string | null
          default_address: Json | null
          email: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          default_address?: Json | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          default_address?: Json | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_order_transactional: { Args: { payload: Json }; Returns: Json }
      generate_order_number: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "super_admin" | "customer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "super_admin", "customer"],
    },
  },
} as const
