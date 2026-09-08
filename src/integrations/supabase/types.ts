export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      platform_admins: {
        Row: {
          user_id: string
          created_at: string
          created_by: string | null
          notes: string | null
        }
        Insert: {
          user_id: string
          created_at?: string
          created_by?: string | null
          notes?: string | null
        }
        Update: {
          user_id?: string
          created_at?: string
          created_by?: string | null
          notes?: string | null
        }
        Relationships: []
      }
      other_income: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          id: string
          notes: string | null
          payment_method: string
          shop_id: string
          title: string
          updated_at: string
        }
        Insert: {
          amount: number
          category?: string
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          payment_method?: string
          shop_id: string
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          payment_method?: string
          shop_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "other_income_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          appointment_at: string
          created_at: string
          customer_id: string | null
          customer_name: string
          duration_minutes: number
          id: string
          notes: string | null
          service_id: string | null
          service_name: string
          shop_id: string
          staff_name: string | null
          status: string
          updated_at: string
        }
        Insert: {
          appointment_at: string
          created_at?: string
          customer_id?: string | null
          customer_name: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          service_id?: string | null
          service_name: string
          shop_id: string
          staff_name?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          appointment_at?: string
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          service_id?: string | null
          service_name?: string
          shop_id?: string
          staff_name?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      assets: {
        Row: {
          category: string | null
          condition: string | null
          created_at: string | null
          current_value: number | null
          depreciation_rate: number | null
          id: string
          location: string | null
          name: string
          notes: string | null
          purchase_date: string | null
          purchase_price: number | null
          shop_id: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          condition?: string | null
          created_at?: string | null
          current_value?: number | null
          depreciation_rate?: number | null
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          shop_id: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          condition?: string | null
          created_at?: string | null
          current_value?: number | null
          depreciation_rate?: number | null
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          shop_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          check_in: string | null
          check_out: string | null
          created_at: string | null
          date: string | null
          id: string
          notes: string | null
          shop_id: string
          staff_id: string
          status: string | null
        }
        Insert: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string | null
          date?: string | null
          id?: string
          notes?: string | null
          shop_id: string
          staff_id: string
          status?: string | null
        }
        Update: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string | null
          date?: string | null
          id?: string
          notes?: string | null
          shop_id?: string
          staff_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
          shop_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          shop_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          shop_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          shop_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          shop_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_repayments: {
        Row: {
          amount: number
          created_at: string | null
          customer_id: string
          id: string
          notes: string | null
          payment_method: string | null
          shop_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          customer_id: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          shop_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          customer_id?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_repayments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_repayments_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_debts: {
        Row: {
          amount: number
          created_at: string | null
          customer_id: string
          due_date: string | null
          id: string
          notes: string | null
          paid_amount: number | null
          sale_id: string | null
          shop_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          customer_id: string
          due_date?: string | null
          id?: string
          notes?: string | null
          paid_amount?: number | null
          sale_id?: string | null
          shop_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          customer_id?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          paid_amount?: number | null
          sale_id?: string | null
          shop_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_debts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_debts_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_debts_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          created_at: string | null
          credit_balance: number | null
          credit_limit: number | null
          email: string | null
          id: string
          loyalty_points: number | null
          name: string
          notes: string | null
          phone: string | null
          shop_id: string
          total_spent: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          credit_balance?: number | null
          credit_limit?: number | null
          email?: string | null
          id?: string
          loyalty_points?: number | null
          name: string
          notes?: string | null
          phone?: string | null
          shop_id: string
          total_spent?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          credit_balance?: number | null
          credit_limit?: number | null
          email?: string | null
          id?: string
          loyalty_points?: number | null
          name?: string
          notes?: string | null
          phone?: string | null
          shop_id?: string
          total_spent?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      draft_sale_items: {
        Row: {
          created_at: string | null
          draft_sale_id: string
          id: string
          product_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          draft_sale_id: string
          id?: string
          product_id: string
          quantity: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          draft_sale_id?: string
          id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "draft_sale_items_draft_sale_id_fkey"
            columns: ["draft_sale_id"]
            isOneToOne: false
            referencedRelation: "draft_sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draft_sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      draft_sales: {
        Row: {
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          discount: number | null
          id: string
          notes: string | null
          payment_method: string | null
          shop_id: string
          status: string | null
          tax: number | null
          total: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          discount?: number | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          shop_id: string
          status?: string | null
          tax?: number | null
          total: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          discount?: number | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          shop_id?: string
          status?: string | null
          tax?: number | null
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "draft_sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draft_sales_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          shop_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          shop_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          category_id: string | null
          created_at: string | null
          date: string | null
          description: string
          id: string
          is_recurring: boolean | null
          notes: string | null
          payment_method: string | null
          receipt_url: string | null
          recurring_frequency: string | null
          shop_id: string
          title: string | null
        }
        Insert: {
          amount: number
          category: string
          category_id?: string | null
          created_at?: string | null
          date?: string | null
          description?: string
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          recurring_frequency?: string | null
          shop_id: string
          title?: string | null
        }
        Update: {
          amount?: number
          category?: string
          category_id?: string | null
          created_at?: string | null
          date?: string | null
          description?: string
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          recurring_frequency?: string | null
          shop_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_transactions: {
        Row: {
          created_at: string | null
          customer_id: string
          id: string
          note: string | null
          points: number
          reference_id: string | null
          shop_id: string
          type: string
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          id?: string
          note?: string | null
          points: number
          reference_id?: string | null
          shop_id: string
          type: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          id?: string
          note?: string | null
          points?: number
          reference_id?: string | null
          shop_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          read_at: string | null
          shop_id: string
          title: string
          type: string | null
                  link: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          read_at?: string | null
          shop_id: string
          title: string
          type?: string | null
                  link?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          read_at?: string | null
          shop_id?: string
          title?: string
          type?: string | null
                  link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
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
      order_notes: {
        Row: {
          created_at: string | null
          id: string
          note: string
          order_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          note: string
          order_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          note?: string
          order_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_notes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          customer_id: string | null
          delivery_date: string | null
          id: string
          notes: string | null
          order_number: string | null
          paid_amount: number | null
          sale_id: string | null
          shop_id: string
          status: string | null
          total: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          delivery_date?: string | null
          id?: string
          notes?: string | null
          order_number?: string | null
          paid_amount?: number | null
          sale_id?: string | null
          shop_id: string
          status?: string | null
          total: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          delivery_date?: string | null
          id?: string
          notes?: string | null
          order_number?: string | null
          paid_amount?: number | null
          sale_id?: string | null
          shop_id?: string
          status?: string | null
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll: {
        Row: {
          allowances: number | null
          basic_salary: number
          created_at: string | null
          deductions: number | null
          id: string
          month: string
          net_salary: number
          payment_date: string | null
          payment_method: string | null
          shop_id: string
          staff_id: string
          status: string | null
        }
        Insert: {
          allowances?: number | null
          basic_salary: number
          created_at?: string | null
          deductions?: number | null
          id?: string
          month: string
          net_salary: number
          payment_date?: string | null
          payment_method?: string | null
          shop_id: string
          staff_id: string
          status?: string | null
        }
        Update: {
          allowances?: number | null
          basic_salary?: number
          created_at?: string | null
          deductions?: number | null
          id?: string
          month?: string
          net_salary?: number
          payment_date?: string | null
          payment_method?: string | null
          shop_id?: string
          staff_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      product_price_history: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          id: string
          new_buying_price: number | null
          new_selling_price: number
          old_buying_price: number | null
          old_selling_price: number
          product_id: string
          shop_id: string
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_buying_price?: number | null
          new_selling_price: number
          old_buying_price?: number | null
          old_selling_price: number
          product_id: string
          shop_id: string
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_buying_price?: number | null
          new_selling_price?: number
          old_buying_price?: number | null
          old_selling_price?: number
          product_id?: string
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_price_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_price_history_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      production_batches: {
        Row: {
          batch_number: string
          completed_at: string | null
          created_at: string
          id: string
          input_materials: Json
          notes: string | null
          output_product_id: string
          quantity_produced: number
          quantity_to_produce: number
          shop_id: string
          started_at: string | null
          status: string
          total_cost: number
          updated_at: string
        }
        Insert: {
          batch_number: string
          completed_at?: string | null
          created_at?: string
          id?: string
          input_materials?: Json
          notes?: string | null
          output_product_id: string
          quantity_produced?: number
          quantity_to_produce?: number
          shop_id: string
          started_at?: string | null
          status?: string
          total_cost?: number
          updated_at?: string
        }
        Update: {
          batch_number?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          input_materials?: Json
          notes?: string | null
          output_product_id?: string
          quantity_produced?: number
          quantity_to_produce?: number
          shop_id?: string
          started_at?: string | null
          status?: string
          total_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_batches_output_product_id_fkey"
            columns: ["output_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_batches_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          allow_discount: boolean
          barcode: string | null
          buying_price: number | null
          category_id: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          image_url: string | null
          item_type: string
          low_stock_alert: number | null
          name: string
          selling_price: number
          shop_id: string
          sku: string | null
          stock: number
          tax_profile: string | null
          track_inventory: boolean
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          allow_discount?: boolean
          barcode?: string | null
          buying_price?: number | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          image_url?: string | null
          item_type?: string
          low_stock_alert?: number | null
          name: string
          selling_price: number
          shop_id: string
          sku?: string | null
          stock?: number
          tax_profile?: string | null
          track_inventory?: boolean
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          allow_discount?: boolean
          barcode?: string | null
          buying_price?: number | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          image_url?: string | null
          item_type?: string
          low_stock_alert?: number | null
          name?: string
          selling_price?: number
          shop_id?: string
          sku?: string | null
          stock?: number
          tax_profile?: string | null
          track_inventory?: boolean
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          phone: string | null
          shop_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          shop_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          shop_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          device_label: string | null
          endpoint: string
          id: string
          last_used_at: string
          p256dh: string
          shop_id: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          device_label?: string | null
          endpoint: string
          id?: string
          last_used_at?: string
          p256dh: string
          shop_id: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          device_label?: string | null
          endpoint?: string
          id?: string
          last_used_at?: string
          p256dh?: string
          shop_id?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      salary_payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          month: string
          notes: string | null
          payment_date: string | null
          shop_id: string
          staff_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          month: string
          notes?: string | null
          payment_date?: string | null
          shop_id: string
          staff_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          month?: string
          notes?: string | null
          payment_date?: string | null
          shop_id?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "salary_payments_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_payments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          buying_price_at_sale: number
          created_at: string | null
          discount_amount: number | null
          id: string
          product_id: string
          quantity: number
          sale_id: string
          unit_price: number
        }
        Insert: {
          buying_price_at_sale?: number
          created_at?: string | null
          discount_amount?: number | null
          id?: string
          product_id: string
          quantity: number
          sale_id: string
          unit_price: number
        }
        Update: {
          buying_price_at_sale?: number
          created_at?: string | null
          discount_amount?: number | null
          id?: string
          product_id?: string
          quantity?: number
          sale_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          cash_amount: number | null
          cashier_id: string | null
          created_at: string | null
          customer_id: string | null
          customer_name: string | null
          discount: number | null
          discount_amount: number | null
          discount_percent: number | null
          id: string
          invoice_number: string | null
          loyalty_points_earned: number | null
          loyalty_points_redeemed: number | null
          mpesa_amount: number | null
          mpesa_code: string | null
          payment_method: string
          refund_reason: string | null
          shop_id: string
          status: string | null
          subtotal: number | null
          tax_amount: number | null
          total: number
        }
        Insert: {
          cash_amount?: number | null
          cashier_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          discount?: number | null
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          invoice_number?: string | null
          loyalty_points_earned?: number | null
          loyalty_points_redeemed?: number | null
          mpesa_amount?: number | null
          mpesa_code?: string | null
          payment_method?: string
          refund_reason?: string | null
          shop_id: string
          status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          total: number
        }
        Update: {
          cash_amount?: number | null
          cashier_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          discount?: number | null
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          invoice_number?: string | null
          loyalty_points_earned?: number | null
          loyalty_points_redeemed?: number | null
          mpesa_amount?: number | null
          mpesa_code?: string | null
          payment_method?: string
          refund_reason?: string | null
          shop_id?: string
          status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          cash_at_end: number | null
          cash_at_start: number
          created_at: string | null
          end_time: string | null
          id: string
          notes: string | null
          shop_id: string
          start_time: string | null
          user_id: string
        }
        Insert: {
          cash_at_end?: number | null
          cash_at_start: number
          created_at?: string | null
          end_time?: string | null
          id?: string
          notes?: string | null
          shop_id: string
          start_time?: string | null
          user_id: string
        }
        Update: {
          cash_at_end?: number | null
          cash_at_start?: number
          created_at?: string | null
          end_time?: string | null
          id?: string
          notes?: string | null
          shop_id?: string
          start_time?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shifts_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_settings: {
        Row: {
          created_at: string | null
          id: string
          key: string
          shop_id: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          shop_id: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          shop_id?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "shop_settings_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_subscriptions: {
        Row: {
          id?: string
          created_at: string
          currency: string
          current_period_ends_at: string | null
          current_period_started_at: string | null
          grace_ends_at: string | null
          last_payment_at: string | null
          metadata: Json
          monthly_price: number
          provider: string
          shop_id: string
          status: string
          trial_ends_at: string | null
          trial_started_at: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          created_at?: string
          currency?: string
          current_period_ends_at?: string | null
          current_period_started_at?: string | null
          grace_ends_at?: string | null
          last_payment_at?: string | null
          metadata?: Json
          monthly_price?: number
          provider?: string
          shop_id: string
          status?: string
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          created_at?: string
          currency?: string
          current_period_ends_at?: string | null
          current_period_started_at?: string | null
          grace_ends_at?: string | null
          last_payment_at?: string | null
          metadata?: Json
          monthly_price?: number
          provider?: string
          shop_id?: string
          status?: string
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_subscriptions_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: true
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_users: {
        Row: {
          created_at: string | null
          id: string
          role: string
          shop_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: string
          shop_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          shop_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_users_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shops: {
        Row: {
          address: string | null
          business_type: string
          capabilities: Json
          country_code: string | null
          created_at: string | null
          currency: string | null
          email: string | null
          id: string
          locale: string | null
          logo_url: string | null
          name: string
          phone: string | null
          receipt_footer: string | null
          receipt_header: string | null
          tax_rate: number | null
          updated_at: string | null
                  auto_print_receipt: boolean | null
          enable_low_stock_alerts: boolean | null
        }
        Insert: {
          address?: string | null
          business_type?: string
          capabilities?: Json
          country_code?: string | null
          created_at?: string | null
          currency?: string | null
          email?: string | null
          id?: string
          locale?: string | null
          logo_url?: string | null
          name: string
          phone?: string | null
          receipt_footer?: string | null
          receipt_header?: string | null
          tax_rate?: number | null
          updated_at?: string | null
                  auto_print_receipt?: boolean | null
          enable_low_stock_alerts?: boolean | null
        }
        Update: {
          address?: string | null
          business_type?: string
          capabilities?: Json
          country_code?: string | null
          created_at?: string | null
          currency?: string | null
          email?: string | null
          id?: string
          locale?: string | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          receipt_footer?: string | null
          receipt_header?: string | null
          tax_rate?: number | null
          updated_at?: string | null
                  auto_print_receipt?: boolean | null
          enable_low_stock_alerts?: boolean | null
        }
        Relationships: []
      }
      staff: {
        Row: {
          created_at: string | null
          department: string | null
          email: string | null
          full_name: string
          hire_date: string | null
          id: string
          phone: string | null
          position: string | null
          salary: number | null
          shop_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          email?: string | null
          full_name: string
          hire_date?: string | null
          id?: string
          phone?: string | null
          position?: string | null
          salary?: number | null
          shop_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          email?: string | null
          full_name?: string
          hire_date?: string | null
          id?: string
          phone?: string | null
          position?: string | null
          salary?: number | null
          shop_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_history: {
        Row: {
          change_type: string
          created_at: string | null
          id: string
          new_stock: number
          notes: string | null
          previous_stock: number
          product_id: string
          quantity_change: number
          shop_id: string
        }
        Insert: {
          change_type: string
          created_at?: string | null
          id?: string
          new_stock: number
          notes?: string | null
          previous_stock: number
          product_id: string
          quantity_change: number
          shop_id: string
        }
        Update: {
          change_type?: string
          created_at?: string | null
          id?: string
          new_stock?: number
          notes?: string | null
          previous_stock?: number
          product_id?: string
          quantity_change?: number
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_history_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_received: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          paid_amount: number | null
          received_by: string | null
          received_date: string
          shop_id: string
          status: string
          supplier_id: string | null
          total_amount: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          paid_amount?: number | null
          received_by?: string | null
          received_date?: string
          shop_id: string
          status?: string
          supplier_id?: string | null
          total_amount?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          paid_amount?: number | null
          received_by?: string | null
          received_date?: string
          shop_id?: string
          status?: string
          supplier_id?: string | null
          total_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_received_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_received_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_received_items: {
        Row: {
          buying_price: number
          id: string
          product_id: string
          quantity: number
          stock_received_id: string
        }
        Insert: {
          buying_price: number
          id?: string
          product_id: string
          quantity: number
          stock_received_id: string
        }
        Update: {
          buying_price?: number
          id?: string
          product_id?: string
          quantity?: number
          stock_received_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_received_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_received_items_stock_received_id_fkey"
            columns: ["stock_received_id"]
            isOneToOne: false
            referencedRelation: "stock_received"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_payments: {
        Row: {
          amount: number
          billing_period_months: number | null
          callback_payload: Json
          completed_at: string | null
          created_at: string
          currency: string
          expires_at: string | null
          external_id: string
          id: string
          initiated_by: string | null
          message: string | null
          paid_for_period_end: string | null
          paid_for_period_start: string | null
          payment_channel: string
          phone_number: string
          provider: string
          provider_reference: string | null
          request_payload: Json
          response_payload: Json
          shop_id: string
          status: string
          transaction_reference: string | null
          updated_at: string
          utility_reference: string | null
                  proof_url: string | null
          rejection_reason: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount: number
          billing_period_months?: number | null
          callback_payload?: Json
          completed_at?: string | null
          created_at?: string
          currency?: string
          expires_at?: string | null
          external_id: string
          id?: string
          initiated_by?: string | null
          message?: string | null
          paid_for_period_end?: string | null
          paid_for_period_start?: string | null
          payment_channel: string
          phone_number: string
          provider?: string
          provider_reference?: string | null
          request_payload?: Json
          response_payload?: Json
          shop_id: string
          status?: string
          transaction_reference?: string | null
          updated_at?: string
          utility_reference?: string | null
                  proof_url?: string | null
          rejection_reason?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          billing_period_months?: number | null
          callback_payload?: Json
          completed_at?: string | null
          created_at?: string
          currency?: string
          expires_at?: string | null
          external_id?: string
          id?: string
          initiated_by?: string | null
          message?: string | null
          paid_for_period_end?: string | null
          paid_for_period_start?: string | null
          payment_channel?: string
          phone_number?: string
          provider?: string
          provider_reference?: string | null
          request_payload?: Json
          response_payload?: Json
          shop_id?: string
          status?: string
          transaction_reference?: string | null
          updated_at?: string
          utility_reference?: string | null
                  proof_url?: string | null
          rejection_reason?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_payments_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_payments: {
        Row: {
          amount: number
          id: string
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          shop_id: string
          supplier_id: string
        }
        Insert: {
          amount: number
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          shop_id: string
          supplier_id: string
        }
        Update: {
          amount?: number
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          shop_id?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_payments_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_payments_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          shop_id: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          shop_id: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          shop_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      todos: {
        Row: {
          alert_at: string | null
          completed: boolean
          created_at: string | null
          description: string | null
          due_date: string | null
          due_time: string | null
          id: string
          shop_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          alert_at?: string | null
          completed?: boolean
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          id?: string
          shop_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          alert_at?: string | null
          completed?: boolean
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          id?: string
          shop_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "todos_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      complete_draft_sale_transaction: {
        Args: {
          p_customer_id?: string
          p_discount?: number
          p_draft_id?: string
          p_items?: Json
          p_notes?: string
          p_payment_method?: string
          p_tax?: number
        }
        Returns: Json
      }
      complete_sale_transaction: {
        Args: {
          p_customer_id?: string
          p_discount?: number
          p_items?: Json
          p_payment_method?: string
          p_tax?: number
        }
        Returns: Json
      }
      create_order_transaction: {
        Args: {
          p_customer_id?: string
          p_delivery_date?: string
          p_items?: Json
          p_notes?: string
          p_paid_amount?: number
          p_status?: string
        }
        Returns: Json
      }
      create_purchase_transaction: {
        Args: {
          p_supplier_id?: string
          p_items?: Json
          p_status?: string
          p_notes?: string
          p_received_date?: string
          p_paid_amount?: number
        }
        Returns: Database["public"]["Tables"]["stock_received"]["Row"]
      }
      delete_purchase_transaction: {
        Args: {
          p_purchase_id: string
        }
        Returns: boolean
      }
      get_user_shop_id: {
        Args: {
          _user_id: string
        }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      receive_stock_transaction: {
        Args: {
          p_buying_price?: number
          p_notes?: string
          p_product_id: string
          p_quantity?: number
          p_supplier_id?: string
        }
        Returns: Database["public"]["Tables"]["stock_received"]["Row"]
      }
      update_order_transaction: {
        Args: {
          p_delivery_date?: string
          p_items?: Json
          p_notes?: string
          p_order_id: string
          p_paid_amount?: number
          p_status?: string
        }
        Returns: Json
      }
      update_purchase_transaction: {
        Args: {
          p_purchase_id: string
          p_supplier_id?: string
          p_items?: Json
          p_status?: string
          p_notes?: string
          p_paid_amount?: number
        }
        Returns: Database["public"]["Tables"]["stock_received"]["Row"]
      }
    }
    Enums: {
      app_role: "owner" | "manager" | "cashier" | "staff" | "hr"
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
      app_role: ["owner", "manager", "cashier", "staff", "hr"],
    },
  },
} as const
