import { ReactNode } from "react";

export type UserRole = 'student' | 'lab_manager' | 'admin';

export interface users {
  id: string;
  email: string;
  role: UserRole;
  department: string;
  created_at: string;
  image_url: string | null;
  
}

export interface Equipment {
  remainingUnits: number;
  id: string;
  name: string;
  category: string;
  lab_id: string;
  description: string;
  manufacturer: string;
  model: string;
  image_url: string;
  quantity: number;
  units_under_maintenance: number;
  units_under_reservation: number;
  detailed_specs: {
    dimensions: string;
    weight: string;
    power_requirements: string;
    calibration_interval: string;
    safety_requirements: string;
    operating_conditions: string;
  };
  lab?: Lab;
  specifications: Record<string, string>;
  maintenance_schedule?: maintenance_schedules;
  status: 'operational' | 'maintenance' | 'out_of_order' | 'reserved';
  created_at: string;
  updated_at: string;
}

export interface Reservation {
  users: any;
  id: string;
  user_id: string;
  equipment_id: string;
  quantity: number;
  start_time: string;
  end_time: string;
  purpose: string;
  status: 'pending' | 'approved' | 'denied' | 'cancelled'| 'completed';
  created_at: string;
  updated_at: string;
  equipment?: Equipment;
  lab?: Lab;
}

export interface Lab {
  image_url: string;
  users: any;
  id: string;
  name: string;
  location: string;
  manager_id: string;
  description: string;
  created_at: string;
  updated_at: string;
  features: string;
  status: 'available' | 'occupied' | 'maintenance';
  capacity: number;

}

export interface maintenance_schedules {
  id: string;
  equipment_id: string;
  scheduled_date: string;
  type: string;
  description: string;
  technician_notes: string;
  units: number;
  completed_at: string;
  status: 'scheduled' | 'completed' | 'cancelled'| 'in_progress';
  created_at: string;
  updated_at: string;
  equipment?: Equipment;
  lab?: Lab;
  users?: users;
}

export interface lab_maintenance_schedules {
  id: string;
  lab_id: string;
  scheduled_date: string;
  type: string;
  description: string;
  status: 'scheduled' | 'completed' | 'cancelled'| 'in_progress';
  technician_notes: string;
  completed_at: string;
  created_at: string;
  updated_at: string;
  lab?: Lab;
  users?: users;
}

export interface lab_reservations {
  id: string;
  lab_id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  purpose: string;
  attendees: number;
  status: 'pending' | 'approved' | 'denied' | 'cancelled' | 'completed';
  created_at: string;
  updated_at: string;
  lab?: Lab;
  users?: users;
  


  
}

export interface equipment_categories {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  equipment?: Equipment[];
  lab?: Lab[];
}

export interface ImportMetaEnv {
  VITE_SUPABASE_SERVICE_ROLE_KEY: string;
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
}

declare global {
  interface ImportMeta {
    env: ImportMetaEnv;
  }
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
  sender?: {
    email: string;
  };
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  created_by: string;
  isOptimistic?: boolean;
}
export type LocalNotification = Notification & {
  id?: string;
  title?: string;
  message?: string;
  type?: string;
  read?: boolean;
  created_at?: string;
  created_by?: string; // Add this field
  isOptimistic?: boolean;
};
export interface NotificationState {
  open: boolean;
  message: string;
  severity: 'Success' | 'Error' | 'Info' | 'Warning' | 'System';
}
export interface user_notification_preferences{
  id: string;
  user_id: string;
  email: boolean;
  reservation_updates: boolean;
  maintenance_alerts: boolean;
  system_announcements: boolean;
  created_at: string;
  updated_at: string;
}
export interface AutoApprovalSetting{
  id: string;
  target_type: string;
  enabled: boolean;
  created_by: string;
  last_modified_by: string;
  target_id: string  | null;
  created_at: string;
  updated_at: string;


}

export interface AutoApprovalLog{
  performed_by_role: ReactNode;
  performed_by_email: ReactNode;
  target_name: ReactNode;
  id: string;
  setting_id: string;
  action: string;
  performed_by: string;
  target_id: string;
  created_at: string;
 
  }


  export interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
  }

  export interface AuthContextType {
    user: users | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, department: string) => Promise<void>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    updatePassword: (newPassword: string) => Promise<void>;
    resendConfirmation: (email: string) => Promise<void>;
  }