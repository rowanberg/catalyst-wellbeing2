/**
 * Offline API Wrapper
 * Integrates IndexedDB caching with API calls for offline support
 */

import { DashboardCache, OfflineQueue } from '@/lib/db/indexeddb';
import { supabase } from '@/lib/supabase/client-pwa';

/**
 * Wrapper for dashboard API calls with offline support
 */
export class OfflineAPI {
  /**
   * Fetch student dashboard with caching
   */
  static async fetchStudentDashboard(): Promise<any> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('Not authenticated');
    
    // Check cache first
    const cached = await DashboardCache.get(user.id, 'student');
    if (cached && typeof navigator !== 'undefined' && !navigator.onLine) {
      console.log('[OfflineAPI] Serving student dashboard from cache');
      return cached;
    }
    
    try {
      // Try to fetch fresh data
      const response = await fetch('/api/student/dashboard', {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Save to cache for offline use
        await DashboardCache.save(user.id, 'student', data);
        
        return data;
      } else if (cached) {
        // If fetch failed but we have cache, use it
        console.log('[OfflineAPI] API failed, using cached student dashboard');
        return cached;
      }
      
      throw new Error(`API responded with ${response.status}`);
    } catch (error) {
      // If offline or error, return cached data
      if (cached) {
        console.log('[OfflineAPI] Offline, using cached student dashboard');
        return cached;
      }
      throw error;
    }
  }
  
  /**
   * Fetch teacher dashboard with caching
   */
  static async fetchTeacherDashboard(teacherId: string): Promise<any> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('Not authenticated');
    
    const cached = await DashboardCache.get(user.id, 'teacher');
    if (cached && typeof navigator !== 'undefined' && !navigator.onLine) {
      console.log('[OfflineAPI] Serving teacher dashboard from cache');
      return cached;
    }
    
    try {
      const response = await fetch(`/api/teacher/data?teacher_id=${teacherId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        await DashboardCache.save(user.id, 'teacher', data);
        return data;
      } else if (cached) {
        return cached;
      }
      
      throw new Error(`API responded with ${response.status}`);
    } catch (error) {
      if (cached) {
        console.log('[OfflineAPI] Offline, using cached teacher dashboard');
        return cached;
      }
      throw error;
    }
  }
  
  /**
   * Fetch admin dashboard with caching
   */
  static async fetchAdminDashboard(): Promise<any> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('Not authenticated');
    
    const cached = await DashboardCache.get(user.id, 'admin');
    if (cached && typeof navigator !== 'undefined' && !navigator.onLine) {
      console.log('[OfflineAPI] Serving admin dashboard from cache');
      return cached;
    }
    
    try {
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        await DashboardCache.save(user.id, 'admin', data);
        return data;
      } else if (cached) {
        return cached;
      }
      
      throw new Error(`API responded with ${response.status}`);
    } catch (error) {
      if (cached) {
        console.log('[OfflineAPI] Offline, using cached admin dashboard');
        return cached;
      }
      throw error;
    }
  }
  
  /**
   * Fetch parent dashboard with caching
   */
  static async fetchParentDashboard(): Promise<any> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('Not authenticated');
    
    const cached = await DashboardCache.get(user.id, 'parent');
    if (cached && typeof navigator !== 'undefined' && !navigator.onLine) {
      console.log('[OfflineAPI] Serving parent dashboard from cache');
      return cached;
    }
    
    try {
      const response = await fetch('/api/parent/dashboard', {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        await DashboardCache.save(user.id, 'parent', data);
        return data;
      } else if (cached) {
        return cached;
      }
      
      throw new Error(`API responded with ${response.status}`);
    } catch (error) {
      if (cached) {
        console.log('[OfflineAPI] Offline, using cached parent dashboard');
        return cached;
      }
      throw error;
    }
  }
  
  /**
   * Submit form data with offline queue
   */
  static async submitForm(endpoint: string, data: any): Promise<any> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      // Queue for later if offline
      await OfflineQueue.add({
        url: endpoint,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: data
      });
      
      return {
        success: true,
        offline: true,
        message: 'Your submission will be processed when you\'re back online'
      };
    }
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        return await response.json();
      }
      
      throw new Error(`API responded with ${response.status}`);
    } catch (error) {
      // Queue for later if request failed
      await OfflineQueue.add({
        url: endpoint,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: data
      });
      
      return {
        success: true,
        offline: true,
        message: 'Your submission has been saved and will be synced later'
      };
    }
  }
  
  /**
   * Clear all cached data
   */
  static async clearCache(): Promise<void> {
    const { db } = await import('@/lib/db/indexeddb');
    await db.dashboards.clear();
    console.log('[OfflineAPI] Cache cleared');
  }
  
  /**
   * Prefetch all dashboards for offline use
   */
  static async prefetchDashboards(): Promise<void> {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;
      
      // Get user profile to determine role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      if (!profile) return;
      
      console.log('[OfflineAPI] Prefetching dashboards for offline use...');
      
      // Prefetch based on role
      switch (profile.role) {
        case 'student':
          await this.fetchStudentDashboard();
          break;
        case 'teacher':
          await this.fetchTeacherDashboard(user.id);
          break;
        case 'admin':
          await this.fetchAdminDashboard();
          break;
        case 'parent':
          await this.fetchParentDashboard();
          break;
      }
      
      console.log('[OfflineAPI] Dashboards prefetched successfully');
    } catch (error) {
      console.error('[OfflineAPI] Failed to prefetch dashboards:', error);
    }
  }
}

/**
 * Manual prefetch initialization
 * Call this from client components after mount to avoid SSR issues
 */
export function initializeOfflineAPI() {
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && navigator.onLine) {
    // Prefetch after a short delay to not block initial load
    setTimeout(() => {
      OfflineAPI.prefetchDashboards();
    }, 5000);
  }
}
