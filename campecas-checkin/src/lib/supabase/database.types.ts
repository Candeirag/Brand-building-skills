// Tipos do banco de dados no formato gerado por `supabase gen types typescript`.
// Após alterar as migrations, regenere com: npm run db:types

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12";
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string | null;
          role: Database["public"]["Enums"]["user_role"];
          active: boolean;
          must_change_password: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          full_name: string;
          document: string | null;
          phone: string | null;
          whatsapp: string | null;
          anonymized_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          document?: string | null;
          phone?: string | null;
          whatsapp?: string | null;
          anonymized_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          document?: string | null;
          phone?: string | null;
          whatsapp?: string | null;
          anonymized_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      vehicles: {
        Row: {
          id: string;
          plate: string;
          brand: string | null;
          model: string | null;
          year: number | null;
          color: string | null;
          customer_id: string | null;
          last_mileage: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          plate: string;
          brand?: string | null;
          model?: string | null;
          year?: number | null;
          color?: string | null;
          customer_id?: string | null;
          last_mileage?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          plate?: string;
          brand?: string | null;
          model?: string | null;
          year?: number | null;
          color?: string | null;
          customer_id?: string | null;
          last_mileage?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vehicles_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      checklist_items: {
        Row: {
          key: string;
          label: string;
          group_name: string;
          position: number;
          active: boolean;
          created_at: string;
        };
        Insert: {
          key: string;
          label: string;
          group_name?: string;
          position?: number;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          key?: string;
          label?: string;
          group_name?: string;
          position?: number;
          active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      inspections: {
        Row: {
          id: string;
          number: string | null;
          status: Database["public"]["Enums"]["inspection_status"];
          vehicle_id: string | null;
          customer_id: string | null;
          plate: string | null;
          brand: string | null;
          model: string | null;
          year: number | null;
          color: string | null;
          mileage: number | null;
          fuel_level: Database["public"]["Enums"]["fuel_level"] | null;
          owner_name: string | null;
          owner_document: string | null;
          owner_phone: string | null;
          owner_whatsapp: string | null;
          inspector_id: string;
          inspector_name: string | null;
          mechanic_id: string | null;
          mechanic_name: string | null;
          notes: string | null;
          checklist_confirmed: boolean;
          started_at: string;
          updated_at: string;
          finalized_at: string | null;
          finalized_by: string | null;
          is_blank: boolean;
          service_request: string | null;
        };
        Insert: {
          id?: string;
          number?: string | null;
          status?: Database["public"]["Enums"]["inspection_status"];
          vehicle_id?: string | null;
          customer_id?: string | null;
          plate?: string | null;
          brand?: string | null;
          model?: string | null;
          year?: number | null;
          color?: string | null;
          mileage?: number | null;
          fuel_level?: Database["public"]["Enums"]["fuel_level"] | null;
          owner_name?: string | null;
          owner_document?: string | null;
          owner_phone?: string | null;
          owner_whatsapp?: string | null;
          inspector_id?: string;
          inspector_name?: string | null;
          mechanic_id?: string | null;
          mechanic_name?: string | null;
          notes?: string | null;
          checklist_confirmed?: boolean;
          started_at?: string;
          updated_at?: string;
          finalized_at?: string | null;
          finalized_by?: string | null;
          is_blank?: boolean;
          service_request?: string | null;
        };
        Update: {
          id?: string;
          number?: string | null;
          status?: Database["public"]["Enums"]["inspection_status"];
          vehicle_id?: string | null;
          customer_id?: string | null;
          plate?: string | null;
          brand?: string | null;
          model?: string | null;
          year?: number | null;
          color?: string | null;
          mileage?: number | null;
          fuel_level?: Database["public"]["Enums"]["fuel_level"] | null;
          owner_name?: string | null;
          owner_document?: string | null;
          owner_phone?: string | null;
          owner_whatsapp?: string | null;
          inspector_id?: string;
          inspector_name?: string | null;
          mechanic_id?: string | null;
          mechanic_name?: string | null;
          notes?: string | null;
          checklist_confirmed?: boolean;
          started_at?: string;
          updated_at?: string;
          finalized_at?: string | null;
          finalized_by?: string | null;
          is_blank?: boolean;
          service_request?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "inspections_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inspections_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      inspection_items: {
        Row: {
          inspection_id: string;
          item_key: string;
          item_label: string;
          group_name: string;
          position: number;
          status: Database["public"]["Enums"]["checklist_status"] | null;
          notes: string | null;
          updated_at: string;
        };
        Insert: {
          inspection_id: string;
          item_key: string;
          item_label: string;
          group_name: string;
          position?: number;
          status?: Database["public"]["Enums"]["checklist_status"] | null;
          notes?: string | null;
          updated_at?: string;
        };
        Update: {
          inspection_id?: string;
          item_key?: string;
          item_label?: string;
          group_name?: string;
          position?: number;
          status?: Database["public"]["Enums"]["checklist_status"] | null;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inspection_items_inspection_id_fkey";
            columns: ["inspection_id"];
            isOneToOne: false;
            referencedRelation: "inspections";
            referencedColumns: ["id"];
          },
        ];
      };
      inspection_photos: {
        Row: {
          id: string;
          inspection_id: string;
          category: Database["public"]["Enums"]["photo_category"];
          item_key: string | null;
          storage_path: string;
          caption: string | null;
          mime_type: string;
          size_bytes: number | null;
          width: number | null;
          height: number | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          inspection_id: string;
          category: Database["public"]["Enums"]["photo_category"];
          item_key?: string | null;
          storage_path: string;
          caption?: string | null;
          mime_type?: string;
          size_bytes?: number | null;
          width?: number | null;
          height?: number | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          inspection_id?: string;
          category?: Database["public"]["Enums"]["photo_category"];
          item_key?: string | null;
          storage_path?: string;
          caption?: string | null;
          mime_type?: string;
          size_bytes?: number | null;
          width?: number | null;
          height?: number | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inspection_photos_inspection_id_fkey";
            columns: ["inspection_id"];
            isOneToOne: false;
            referencedRelation: "inspections";
            referencedColumns: ["id"];
          },
        ];
      };
      report_links: {
        Row: {
          id: string;
          inspection_id: string;
          token: string;
          created_by: string | null;
          created_at: string;
          expires_at: string;
          revoked_at: string | null;
          revoked_by: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [
          {
            foreignKeyName: "report_links_inspection_id_fkey";
            columns: ["inspection_id"];
            isOneToOne: false;
            referencedRelation: "inspections";
            referencedColumns: ["id"];
          },
        ];
      };
      report_deliveries: {
        Row: {
          id: string;
          inspection_id: string;
          link_id: string;
          channel: string;
          sent_by: string | null;
          sent_by_name: string | null;
          sent_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [
          {
            foreignKeyName: "report_deliveries_inspection_id_fkey";
            columns: ["inspection_id"];
            isOneToOne: false;
            referencedRelation: "inspections";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_log: {
        Row: {
          id: number;
          actor_id: string | null;
          action: string;
          entity: string;
          entity_id: string | null;
          details: Json;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_staff: { Args: never; Returns: boolean };
      is_admin: { Args: never; Returns: boolean };
      inspection_is_draft: { Args: { p_inspection_id: string }; Returns: boolean };
      finalize_inspection: {
        Args: { p_inspection_id: string };
        Returns: { id: string; number: string; finalized_at: string }[];
      };
      anonymize_customer: { Args: { p_customer_id: string }; Returns: undefined };
      admin_create_member: {
        Args: {
          p_email: string;
          p_password: string;
          p_full_name: string;
          p_role: Database["public"]["Enums"]["user_role"];
        };
        Returns: string;
      };
      admin_set_member_password: { Args: { p_user_id: string; p_password: string }; Returns: undefined };
      get_or_create_report_link: {
        Args: { p_inspection_id: string };
        Returns: { token: string; expires_at: string }[];
      };
      revoke_report_link: { Args: { p_inspection_id: string }; Returns: number };
      register_report_delivery: { Args: { p_inspection_id: string }; Returns: string };
      public_report: { Args: { p_token: string; p_server_key: string }; Returns: Json };
    };
    Enums: {
      user_role: "admin" | "inspector" | "mechanic";
      inspection_status: "draft" | "finalized";
      checklist_status: "ok" | "damaged" | "not_checked" | "not_applicable";
      photo_category: "front" | "rear" | "left_side" | "right_side" | "dashboard" | "damage" | "extra";
      fuel_level: "reserve" | "quarter" | "half" | "three_quarters" | "full";
    };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Update"];
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];
