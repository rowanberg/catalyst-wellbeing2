// Common TypeScript type definitions for API routes and components

export type User = {
  id: string;
  email?: string;
  [key: string]: any;
};

export type Profile = {
  id?: string;
  user_id?: string;
  school_id?: string;
  role?: string;
  first_name?: string;
  last_name?: string;
  [key: string]: any;
};

export type School = {
  id: string;
  name?: string;
  school_code?: string;
  address?: string;
  phone?: string;
  email?: string;
  [key: string]: any;
};

export type AuthError = {
  message?: string;
  status?: number;
  [key: string]: any;
} | null;

export type Notification = {
  school_id: string;
  type: string;
  title: string;
  message: string;
  severity: string;
  [key: string]: any;
};

export type ClassData = {
  id: string;
  class_name?: string;
  subject?: string;
  room_number?: string;
  grade_level_id?: string;
  school_id?: string;
  current_students?: number;
  [key: string]: any;
};

export type WalletData = {
  student_id?: string;
  wallet_address?: string;
  mind_gems_balance?: number;
  fluxon_balance?: string | number;
  is_active?: boolean;
  is_locked?: boolean;
  [key: string]: any;
};

export type SetupData = {
  status?: string;
  setup_completed?: boolean;
  [key: string]: any;
};

export type Recommendation = {
  type: string;
  message: string;
  action: string;
};

export type ActivityData = {
  week: string;
  students: number;
  teachers: number;
  parents: number;
};

export type MeetingSlot = {
  school_id: string;
  teacher_id: string;
  date: string;
  start_time: string;
  end_time: string;
  meeting_type: string;
  location?: string;
  virtual_meeting_link?: string;
  notes?: string;
};

export type ContactData = {
  id: string;
  studentTag: string;
  fullName: string;
  walletAddress: string;
  isFavorite: boolean;
  transactionCount: number;
};

export type CircleData = {
  id: number;
  color: string;
  x: number;
  y: number;
};
