export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      equipment: {
        Row: {
          id: string
          name: string
          category: string
          lab_id: string
          description: string | null
          manufacturer: string | null
          model: string | null
          image_url: string | null
          detailed_specs: Json | null
          specifications: Json | null
          maintenance_schedule: Json | null
          status: 'operational' | 'maintenance' | 'out_of_order'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          lab_id: string
          description?: string | null
          manufacturer?: string | null
          model?: string | null
          image_url?: string | null
          detailed_specs?: Json | null
          specifications?: Json | null
          maintenance_schedule?: Json | null
          status?: 'operational' | 'maintenance' | 'out_of_order'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          lab_id?: string
          description?: string | null
          manufacturer?: string | null
          model?: string | null
          image_url?: string | null
          detailed_specs?: Json | null
          specifications?: Json | null
          maintenance_schedule?: Json | null
          status?: 'operational' | 'maintenance' | 'out_of_order'
          created_at?: string
          updated_at?: string
        }
      }
      equipment_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      maintenance_schedules: {
        Row: {
          id: string
          equipment_id: string
          scheduled_date: string
          type: string
          description: string | null
          status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
          technician_notes: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          equipment_id: string
          scheduled_date: string
          type: string
          description?: string | null
          status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
          technician_notes?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          equipment_id?: string
          scheduled_date?: string
          type?: string
          description?: string | null
          status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
          technician_notes?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      reservations: {
        Row: {
          id: string
          user_id: string
          equipment_id: string
          start_time: string
          end_time: string
          purpose: string
          status: 'pending' | 'approved' | 'denied' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          equipment_id: string
          start_time: string
          end_time: string
          purpose: string
          status?: 'pending' | 'approved' | 'denied' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          equipment_id?: string
          start_time?: string
          end_time?: string
          purpose?: string
          status?: 'pending' | 'approved' | 'denied' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          role: 'student' | 'lab_manager' | 'admin'
          department: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role?: 'student' | 'lab_manager' | 'admin'
          department: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'student' | 'lab_manager' | 'admin'
          department?: string
          created_at?: string
          updated_at?: string
        }
      }
      lab: {
        Row: {
          id: string
          name: string
          location: string
          description: string | null
          manager_id: string
          status: 'available' | 'occupied' | 'maintenance';
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          location: string
          description?: string | null
          manager_id: string
          status?: 'available' | 'occupied' | 'maintenance';
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          location?: string
          description?: string | null
          manager_id?: string
          status?: 'available' | 'occupied' | 'maintenance';
          created_at?: string
          updated_at?: string
        }
      }
      lab_reservations: {
        Row: {
          id: string
          user_id: string
          lab_id: string
          start_time: string
          end_time: string
          purpose: string
          status: 'pending' | 'approved' | 'denied' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          lab_id: string
          start_time: string
          end_time: string
          purpose: string
          status?: 'pending' | 'approved' | 'denied' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          lab_id?: string
          start_time?: string
          end_time?: string
          purpose?: string
          status?: 'pending' | 'approved' | 'denied' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
      }
      lab_maintenance_schedules: {
        Row: {
          id: string
          lab_id: string
          scheduled_date: string
          type: string
          description: string | null
          status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
          technician_notes: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
          }
        Insert: {
          id?: string
          lab_id: string
          scheduled_date: string
          type: string
          description?: string | null
          status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
          technician_notes?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          lab_id?: string
          scheduled_date?: string
          type?: string
          description?: string | null
          status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
          technician_notes?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      Messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          subject: string
          body: string
          status: 'sent' | 'received' | 'read'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          subject: string
          body: string
          status?: 'sent' | 'received' | 'read'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string
          subject?: string
          body?: string
          status?: 'sent' | 'received' | 'read'
          created_at?: string
          updated_at?: string
        }
      }
      Notifications: {
        Row: {
          id: string
          user_id: string
          message: string
          type: 'info' | 'warning' | 'error'
          status: 'unread' | 'read'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          message: string
          type?: 'info' | 'warning' | 'error'
          status?: 'unread' | 'read'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          message?: string
          type?: 'info' | 'warning' | 'error'
          status?: 'unread' | 'read'
          created_at?: string
          updated_at?: string
        }
      }
      AutoApprovalSetting: {
        Row: {
          id: string
          target_type: string
          enabled: boolean
          created_by: string
          last_modified_by: string
          target_id: string | null
          created_at: string
          updated_at: string
          }
        Insert: {
          id?: string
          target_type: string
          enabled?: boolean
          created_by: string
          last_modified_by: string
          target_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          target_type?: string
          enabled?: boolean
          created_by?: string
          last_modified_by?: string
          target_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      AutoApprovalLog: {
        Row: {
          id: string
          setting_id: string
          action: string
          performed_by: string
          target_id: string
          created_at: string
          performed_by_role: string
          performed_by_email: string
          target_name: string
        }
        Insert: {
          id?: string
          setting_id: string
          action: string
          performed_by: string
          target_id: string
          created_at?: string
          performed_by_role?: string
          performed_by_email?: string
          target_name?: string
        }
        Update: {
          id?: string
          setting_id?: string
          action?: string
          performed_by?: string
          target_id?: string
          created_at?: string
        }
      }
      user_notification_preferences: {
        Row: {
            id: string;
            user_id: string;
            email: boolean;
            reservation_updates: boolean;
            maintenance_alerts: boolean;
            system_announcements: boolean;
            created_at: string;
            updated_at: string;
        }
        Insert: {
            id?: string;
            user_id: string;
            email?: boolean;
            reservation_updates?: boolean;
            maintenance_alerts?: boolean;
            system_announcements?: boolean;
            created_at?: string;
            updated_at?: string;
        }
        Update: {
            id?: string;
            user_id?: string;
            email?: boolean;
            reservation_updates?: boolean;
            maintenance_alerts?: boolean;
            system_announcements?: boolean;
            created_at?: string;
            updated_at?: string;
        }
      }

    }
  }
}