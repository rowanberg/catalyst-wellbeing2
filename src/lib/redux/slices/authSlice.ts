import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { supabase } from '@/lib/supabaseClient'
import { AuthState, User, Profile } from '@/types'

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
    if (!data.user) throw new Error('Login failed')
    
    // Check if email is confirmed
    if (!data.user.email_confirmed_at) {
      throw new Error('Please confirm your email before logging in. Check your inbox for a confirmation link.')
    }
    
    // Fetch user profile via API route (bypasses RLS)
    const response = await fetch('/api/get-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: data.user.id }),
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Profile not found. Please contact your school administrator.')
    }
    
    const profile = await response.json()
    console.log('SignIn - Profile fetched:', profile)
    return { user: data.user, profile }
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
    // Use API route to fetch profile (bypasses RLS)
    const response = await fetch('/api/get-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to fetch profile')
    }
    
    return await response.json()
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
      if (state.profile) {
        state.profile.xp += action.payload
        state.profile.level = Math.floor(state.profile.xp / 100) + 1
      }
    },
    updateGems: (state, action: PayloadAction<number>) => {
      if (state.profile) {
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
          } as User
        }
        state.profile = action.payload.profile
        state.error = null
      })
      .addCase(signIn.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Sign in failed'
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
          } as User
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
