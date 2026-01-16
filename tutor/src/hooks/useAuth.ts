import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { StudentProfile } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
    user: User | null
    profile: StudentProfile | null
    session: Session | null
    isLoading: boolean
    error: string | null
}

export function useAuth() {
    const [state, setState] = useState<AuthState>({
        user: null,
        profile: null,
        session: null,
        isLoading: true,
        error: null,
    })

    // Fetch student profile
    const fetchProfile = useCallback(async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', userId)
                .single()

            if (error) throw error

            return data as StudentProfile
        } catch (error: any) {
            console.error('Error fetching profile:', error)
            return null
        }
    }, [])

    // Initialize auth state
    useEffect(() => {
        const initAuth = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession()

                if (error) throw error

                if (session?.user) {
                    const profile = await fetchProfile(session.user.id)

                    // Only allow students to use AstraTutor
                    if (profile && profile.role !== 'student') {
                        setState({
                            user: null,
                            profile: null,
                            session: null,
                            isLoading: false,
                            error: 'AstraTutor is only available for students',
                        })
                        return
                    }

                    setState({
                        user: session.user,
                        profile,
                        session,
                        isLoading: false,
                        error: null,
                    })
                } else {
                    setState(prev => ({ ...prev, isLoading: false }))
                }
            } catch (error: any) {
                console.error('Auth init error:', error)
                setState(prev => ({
                    ...prev,
                    isLoading: false,
                    error: error.message,
                }))
            }
        }

        initAuth()

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_IN' && session?.user) {
                    const profile = await fetchProfile(session.user.id)
                    setState({
                        user: session.user,
                        profile,
                        session,
                        isLoading: false,
                        error: null,
                    })
                } else if (event === 'SIGNED_OUT') {
                    setState({
                        user: null,
                        profile: null,
                        session: null,
                        isLoading: false,
                        error: null,
                    })
                }
            }
        )

        return () => subscription.unsubscribe()
    }, [fetchProfile])

    // Sign in with email/password
    const signIn = async (email: string, password: string) => {
        setState(prev => ({ ...prev, isLoading: true, error: null }))

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) throw error

            return { success: true, data }
        } catch (error: any) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error.message,
            }))
            return { success: false, error: error.message }
        }
    }

    // Sign out
    const signOut = async () => {
        try {
            await supabase.auth.signOut()
        } catch (error: any) {
            console.error('Sign out error:', error)
        }
    }

    return {
        ...state,
        signIn,
        signOut,
        isAuthenticated: !!state.user && !!state.profile,
    }
}
