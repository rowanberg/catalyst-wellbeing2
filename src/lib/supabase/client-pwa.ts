/**
 * Supabase Client with PWA Offline Support
 * Uses environment variables for secure configuration
 * Implements auth persistence with IndexedDB
 */

import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';
import { AuthStorage, OfflineQueue } from '@/lib/db/indexeddb';

// Environment variables (never expose service role key here!)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // Only use anon/public key

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

/**
 * Custom storage adapter for Supabase Auth using IndexedDB
 * Provides 1-month persistence for auth sessions
 */
const customAuthStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (key === 'supabase.auth.token') {
      const session = await AuthStorage.getSession();
      return session ? JSON.stringify(session) : null;
    }
    return null;
  },
  
  setItem: async (key: string, value: string): Promise<void> => {
    if (key === 'supabase.auth.token') {
      try {
        const session = JSON.parse(value);
        await AuthStorage.saveSession(session);
      } catch (error) {
        console.error('[Auth] Failed to save session:', error);
      }
    }
  },
  
  removeItem: async (key: string): Promise<void> => {
    if (key === 'supabase.auth.token') {
      await AuthStorage.clearSessions();
    }
  }
};

/**
 * Create Supabase client with offline support
 */
export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: customAuthStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    },
    global: {
      headers: {
        'x-client-type': 'pwa'
      }
    },
    db: {
      schema: 'public'
    }
  }
);

/**
 * Enhanced fetch with offline queue support
 */
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = async function(...args: any[]): Promise<Response> {
    const [resource, config] = args;
    const url = typeof resource === 'string' ? resource : resource.url;
  
  // Check if this is a Supabase API call
  if (url && url.includes(supabaseUrl)) {
    // Check online status
    if (!navigator.onLine) {
      // Handle offline scenario
      const method = config?.method || 'GET';
      
      if (method !== 'GET') {
        // Queue non-GET requests for later sync
        await OfflineQueue.add({
          url,
          method,
          headers: config?.headers,
          body: config?.body
        });
        
        // Return fake success response
        return new Response(
          JSON.stringify({ 
            success: true, 
            offline: true,
            message: 'Action queued for sync' 
          }),
          { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    }
  }
  
  // Proceed with original fetch
  return originalFetch.apply(this, args as any);
  };
}

/**
 * Auth helper functions with offline support
 */
export const AuthHelpers = {
  /**
   * Sign in with email/password
   */
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      // Session automatically saved to IndexedDB via custom storage
      return { data, error: null };
    } catch (error) {
      console.error('[Auth] Sign in failed:', error);
      return { data: null, error };
    }
  },
  
  /**
   * Sign up with email/password
   */
  async signUp(email: string, password: string, metadata?: any) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      console.error('[Auth] Sign up failed:', error);
      return { data: null, error };
    }
  },
  
  /**
   * Sign out
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear IndexedDB session
      await AuthStorage.clearSessions();
      
      return { error: null };
    } catch (error) {
      console.error('[Auth] Sign out failed:', error);
      return { error };
    }
  },
  
  /**
   * Get current session with auto-refresh
   */
  async getSession(): Promise<Session | null> {
    try {
      // First check IndexedDB for persistent session
      const storedSession = await AuthStorage.getSession();
      
      if (storedSession) {
        // Validate and refresh if needed
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          // Try to refresh using stored refresh token
          const { data, error: refreshError } = await supabase.auth.refreshSession({
            refresh_token: storedSession.refresh_token
          });
          
          if (!refreshError && data.session) {
            await AuthStorage.saveSession(data.session);
            return data.session;
          }
        }
        
        return session;
      }
      
      // No stored session, check Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Save to IndexedDB for persistence
        await AuthStorage.saveSession(session);
      }
      
      return session;
    } catch (error) {
      console.error('[Auth] Failed to get session:', error);
      return null;
    }
  },
  
  /**
   * Get current user
   */
  async getUser() {
    const session = await this.getSession();
    return session?.user || null;
  },
  
  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession();
    return !!session;
  },
  
  /**
   * Refresh session
   */
  async refreshSession() {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) throw error;
      
      if (session) {
        await AuthStorage.saveSession(session);
      }
      
      return { session, error: null };
    } catch (error) {
      console.error('[Auth] Failed to refresh session:', error);
      return { session: null, error };
    }
  }
};

/**
 * Setup auth state change listener and network monitoring (client-side only)
 */
if (typeof window !== 'undefined') {
  // Auth state change listener
  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('[Auth] State changed:', event);
    
    if (session) {
      // Save session to IndexedDB on any auth change
      await AuthStorage.saveSession(session);
      
      // Process offline queue when authenticated
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        await OfflineQueue.processQueue();
      }
    } else {
      // Clear session from IndexedDB on sign out
      await AuthStorage.clearSessions();
    }
  });

  // Network status monitoring
  // Process offline queue when coming back online
  window.addEventListener('online', async () => {
    console.log('[Network] Back online, processing offline queue...');
    await OfflineQueue.processQueue();
  });
  
  window.addEventListener('offline', () => {
    console.log('[Network] Gone offline, switching to offline mode');
  });
}

export default supabase;
