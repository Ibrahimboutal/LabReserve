export const DEPARTMENTS = [
    'Chemistry',
    'Physics',
    'Biology',
    'Engineering',
    'Computer Science',
    'Other',
  ] as const;
  
  export const MAINTENANCE_TYPES = [
    'Routine Inspection',
    'Calibration',
    'Repair',
    'Preventive Maintenance',
    'Software Update',
    'Hardware Update',
    'Safety Check',
  ] as const;
  
  export const EQUIPMENT_CATEGORIES = [
    'Microscopes',
    'Spectrometers',
    'Centrifuges',
    'Analyzers',
    'Measuring Equipment',
    'Safety Equipment',
    'Other',
  ] as const;
  
  export const EQUIPMENT_STATUS = {
    OPERATIONAL: 'operational',
    MAINTENANCE: 'maintenance',
    OUT_OF_ORDER: 'out_of_order',
  } as const;
  
  export const RESERVATION_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    DENIED: 'denied',
    CANCELLED: 'cancelled',
  } as const;
  
  export const USER_ROLES = {
    STUDENT: 'student',
    LAB_MANAGER: 'lab_manager',
    ADMIN: 'admin',
  } as const;
  
  export const MAINTENANCE_STATUS = {
    SCHEDULED: 'scheduled',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  } as const;