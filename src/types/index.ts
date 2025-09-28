export interface User {
  id: string
  email: string
  role: 'student' | 'parent' | 'teacher' | 'admin'
  school_id: string
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  user_id: string
  first_name: string
  last_name: string
  role: 'student' | 'parent' | 'teacher' | 'admin'
  school_id: string
  avatar_url?: string
  xp: number
  gems: number
  level: number
  strengths?: string[]
  created_at: string
  updated_at: string
}

export interface School {
  id: string
  name: string
  address: string
  phone: string
  email: string
  admin_id: string
  school_code: string
  created_at: string
  updated_at: string
}

export interface CourageLogEntry {
  id: string
  user_id: string
  content: string
  created_at: string
}

export interface GratitudeEntry {
  id: string
  user_id: string
  content: string
  created_at: string
}

export interface HelpRequest {
  id: string
  student_id: string
  message: string
  status: 'pending' | 'acknowledged' | 'resolved'
  created_at: string
}

export interface HabitTracker {
  id: string
  user_id: string
  date: string
  sleep_hours: number
  water_glasses: number
  created_at: string
}

export interface KindnessCounter {
  id: string
  user_id: string
  count: number
  last_updated: string
}

export interface AuthState {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  error: string | null
}
