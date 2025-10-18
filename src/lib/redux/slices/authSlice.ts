import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { supabase } from '@/lib/supabaseClient'
import type { User } from '@supabase/supabase-js'

// Profile type definition
interface Profile {
  id: string
  user_id: string
  first_name: string
  last_name: string
  email?: string
  role: string
  school_id?: string
  school_code?: string
  xp?: number
  gems?: number
  level?: number
  [key: string]: any
}

// Auth state interface
interface AuthState {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  error: string | null
}

// Profile cache with sessionStorage persistence
const CACHE_TTL = 5000 // 5 seconds
const CACHE_KEY_PREFIX = 'profile_cache_'

// In-flight requests cache (in-memory only for true concurrent calls)
const inFlightRequests = new Map<string, Promise<Profile>>()

// Helper function to fetch profile with deduplication
const fetchProfileWithCache = async (userId: string): Promise<Profile> => {
  const now = Date.now()
  const cacheKey = `${CACHE_KEY_PREFIX}${userId}`
  
  // Check sessionStorage for recent cached data
  if (typeof window !== 'undefined') {
    try {
      const cached = sessionStorage.getItem(cacheKey)
      if (cached) {
        const { data, timestamp } = JSON.parse(cached)
        if (now - timestamp < CACHE_TTL) {
          console.log('🔄 [AUTH] Using cached profile from sessionStorage')
          return data as Profile
        } else {
          sessionStorage.removeItem(cacheKey)
        }
      }
    } catch (e) {
      // Ignore cache errors
    }
  }
  
  // Check for in-flight request (concurrent calls)
  if (inFlightRequests.has(userId)) {
    console.log('🔄 [AUTH] Reusing in-flight profile request')
    return inFlightRequests.get(userId)!
  }

  // Create new request
  const requestPromise = fetch('/api/get-profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  }).then(async response => {
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to fetch profile')
    }
    const data = await response.json()
    
    // Cache in sessionStorage
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: now }))
      } catch (e) {
        // Ignore storage errors
      }
    }
    
    return data
  })

  inFlightRequests.set(userId, requestPromise)

  // Clean up in-flight cache
  requestPromise.finally(() => {
    inFlightRequests.delete(userId)
  })

  return requestPromise
}

const initialState: AuthState = {
  user: null,
  profile: null,
  isLoading: false,
  error: null,
}

// Async thunks
export const signIn = createAsyncThunk(
  'auth/signIn',
  async ({ email, password }: { email: string; password: string }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw error
    if (!data.user || !data.session) throw new Error('Login failed')
    
    // Check if email is confirmed
    if (!data.user.email_confirmed_at) {
      throw new Error('Please confirm your email before logging in. Check your inbox for a confirmation link.')
    }
    
    // Force session refresh to ensure cookies are set properly
    // This is critical for server-side API routes to read the session
    await supabase.auth.refreshSession()
    
    // Small delay to ensure cookies are propagated
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Fetch user profile with deduplication
    const profile = await fetchProfileWithCache(data.user.id)
    console.log('✅ SignIn - Session established, profile fetched:', profile)
    return { user: data.user, profile, session: data.session }
  }
)

// Check for existing session on app load
export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async () => {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) throw error
    if (!session?.user) return null
    
    // Fetch user profile with deduplication
    const profile = await fetchProfileWithCache(session.user.id)
    console.log('CheckAuth - Session restored:', { user: session.user, profile })
    return { user: session.user, profile }
  }
)

export const signUp = createAsyncThunk(
  'auth/signUp',
  async ({
    email,
    password,
    firstName,
    lastName,
    role,
    schoolId,
    gradeLevel,
    className
  }: {
    email: string
    password: string
    firstName: string
    lastName: string
    role: string
    schoolId: string
    gradeLevel?: string
    className?: string
  }) => {
    // Create user and profile via API route (uses admin client)
    const response = await fetch('/api/create-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        firstName,
        lastName,
        role,
        schoolCode: schoolId,
        gradeLevel,
        className,
      }),
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to create account')
    }
    
    const result = await response.json()
    return { user: result.user, profile: result.profile }
  }
)

export const signOut = createAsyncThunk('auth/signOut', async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
})

export const fetchProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (userId: string) => {
    // Use cached profile fetch to prevent duplicates
    return await fetchProfileWithCache(userId)
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload
    },
    setProfile: (state, action: PayloadAction<Profile | null>) => {
      state.profile = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
    updateXP: (state, action: PayloadAction<number>) => {
      if (state.profile && state.profile.xp !== undefined) {
        state.profile.xp += action.payload
        state.profile.level = Math.floor(state.profile.xp / 100) + 1
      }
    },
    updateGems: (state, action: PayloadAction<number>) => {
      if (state.profile && state.profile.gems !== undefined) {
        state.profile.gems += action.payload
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Sign In
      .addCase(signIn.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.isLoading = false
        // Map Supabase user to our User type via profile data
        if (action.payload.profile) {
          state.user = {
            id: action.payload.user.id,
            email: action.payload.user.email || '',
            role: action.payload.profile.role,
            school_id: action.payload.profile.school_id,
            created_at: action.payload.user.created_at || '',
            updated_at: action.payload.user.updated_at || ''
          } as unknown as User
        }
        state.profile = action.payload.profile
        state.error = null
      })
      .addCase(signIn.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Sign in failed'
      })
      // Check Auth (session restoration)
      .addCase(checkAuth.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isLoading = false
        if (action.payload) {
          if (action.payload.profile) {
            state.user = {
              id: action.payload.user.id,
              email: action.payload.user.email || '',
              role: action.payload.profile.role,
              school_id: action.payload.profile.school_id,
              created_at: action.payload.user.created_at || '',
              updated_at: action.payload.user.updated_at || ''
            } as unknown as User
          }
          state.profile = action.payload.profile
        }
        state.error = null
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.isLoading = false
        // Don't set error on session check failure (user just isn't logged in)
        state.user = null
        state.profile = null
      })
      // Sign Up
      .addCase(signUp.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(signUp.fulfilled, (state, action) => {
        state.isLoading = false
        // Map Supabase user to our User type via profile data
        if (action.payload.profile && action.payload.user) {
          state.user = {
            id: action.payload.user.id,
            email: action.payload.user.email || '',
            role: action.payload.profile.role,
            school_id: action.payload.profile.school_id,
            created_at: action.payload.user.created_at || '',
            updated_at: action.payload.user.updated_at || ''
          } as unknown as User
        }
        state.profile = action.payload.profile
      })
      .addCase(signUp.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Sign up failed'
      })
      // Sign Out
      .addCase(signOut.fulfilled, (state) => {
        state.user = null
        state.profile = null
        state.error = null
      })
      // Fetch Profile
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.profile = action.payload
      })
  },
})

export const { setUser, setProfile, clearError, updateXP, updateGems } = authSlice.actions
export default authSlice.reducer
