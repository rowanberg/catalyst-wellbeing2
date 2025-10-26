/**
 * IndexedDB utility for offline storage using Dexie.js
 * Stores dashboard data, auth tokens, and offline action queue
 */

import Dexie, { Table } from 'dexie';

// Dashboard data interface
interface CachedDashboard {
  id?: number;
  userId: string;
  dashboardType: 'student' | 'teacher' | 'admin' | 'parent';
  data: any;
  timestamp: number;
  etag?: string;
}

// Auth session interface
interface AuthSession {
  id?: number;
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: any;
  timestamp: number;
}

// Offline action queue interface
interface OfflineAction {
  id?: number;
  url: string;
  method: string;
  headers?: any;
  body?: any;
  timestamp: number;
  retries: number;
  status: 'pending' | 'syncing' | 'failed';
}

// User preferences interface
interface UserPreference {
  id?: number;
  key: string;
  value: any;
  timestamp: number;
}

// Cached profile interface
interface CachedProfile {
  id?: number;
  userId: string;
  profile: any;
  timestamp: number;
}

// Create Dexie database class
class CatalystDatabase extends Dexie {
  dashboards!: Table<CachedDashboard>;
  authSessions!: Table<AuthSession>;
  offlineQueue!: Table<OfflineAction>;
  preferences!: Table<UserPreference>;
  profiles!: Table<CachedProfile>;

  constructor() {
    super('CatalystPWA');
    
    // Define database schema
    this.version(1).stores({
      dashboards: '++id, userId, dashboardType, timestamp',
      authSessions: '++id, userId, timestamp, expiresAt',
      offlineQueue: '++id, status, timestamp',
      preferences: '++id, key, timestamp',
      profiles: '++id, userId, timestamp'
    });
  }
}

// Initialize database instance only on client-side
let dbInstance: CatalystDatabase | null = null;

if (typeof window !== 'undefined') {
  dbInstance = new CatalystDatabase();
}

export const db = dbInstance as CatalystDatabase;

/**
 * Dashboard Data Management
 */
export const DashboardCache = {
  /**
   * Save dashboard data with compression
   */
  async save(userId: string, dashboardType: string, data: any): Promise<void> {
    if (!db) return; // Skip in SSR
    try {
      // Compress JSON data
      const compressed = this.compressData(data);
      
      // Check if entry exists
      const existing = await db.dashboards
        .where({ userId, dashboardType })
        .first();
      
      if (existing) {
        // Update existing entry
        await db.dashboards.update(existing.id!, {
          data: compressed,
          timestamp: Date.now()
        });
      } else {
        // Create new entry
        await db.dashboards.add({
          userId,
          dashboardType: dashboardType as any,
          data: compressed,
          timestamp: Date.now()
        });
      }
      
      // Clean old entries (keep last 10 per type)
      await this.cleanup(dashboardType);
    } catch (error) {
      console.error('[IndexedDB] Failed to save dashboard:', error);
    }
  },
  
  /**
   * Get cached dashboard data
   */
  async get(userId: string, dashboardType: string): Promise<any> {
    if (!db) return null; // Skip in SSR
    try {
      const entry = await db.dashboards
        .where({ userId, dashboardType })
        .first();
      
      if (entry) {
        // Check if cache is still valid (5 minutes)
        const age = Date.now() - entry.timestamp;
        if (age < 5 * 60 * 1000) {
          return this.decompressData(entry.data);
        }
      }
      
      return null;
    } catch (error) {
      console.error('[IndexedDB] Failed to get dashboard:', error);
      return null;
    }
  },
  
  /**
   * Compress data using JSON string manipulation
   */
  compressData(data: any): string {
    const json = JSON.stringify(data);
    // Simple compression: remove whitespace
    return json.replace(/\s+/g, ' ').trim();
  },
  
  /**
   * Decompress data
   */
  decompressData(data: string): any {
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  },
  
  /**
   * Clean old cache entries
   */
  async cleanup(dashboardType: string): Promise<void> {
    const entries = await db.dashboards
      .where('dashboardType')
      .equals(dashboardType)
      .reverse()
      .sortBy('timestamp');
    
    // Keep only the 10 most recent entries
    if (entries.length > 10) {
      const toDelete = entries.slice(10);
      await Promise.all(
        toDelete.map(entry => db.dashboards.delete(entry.id!))
      );
    }
  }
};

/**
 * Authentication Management
 */
export const AuthStorage = {
  /**
   * Save auth session (1 month expiry)
   */
  async saveSession(session: any): Promise<void> {
    if (!db) return; // Skip in SSR
    try {
      const expiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days
      
      // Clear existing sessions for user
      await db.authSessions
        .where('userId')
        .equals(session.user.id)
        .delete();
      
      // Save new session
      await db.authSessions.add({
        userId: session.user.id,
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        expiresAt,
        user: session.user,
        timestamp: Date.now()
      });
      
      console.log('[Auth] Session saved to IndexedDB');
    } catch (error) {
      console.error('[Auth] Failed to save session:', error);
    }
  },
  
  /**
   * Get stored session
   */
  async getSession(): Promise<any> {
    if (!db) return null; // Skip in SSR
    try {
      // Get most recent session
      const session = await db.authSessions
        .orderBy('timestamp')
        .reverse()
        .first();
      
      if (session) {
        // Check if expired
        if (Date.now() < session.expiresAt) {
          return {
            access_token: session.accessToken,
            refresh_token: session.refreshToken,
            user: session.user
          };
        } else {
          // Session expired, delete it
          await db.authSessions.delete(session.id!);
        }
      }
      
      return null;
    } catch (error) {
      console.error('[Auth] Failed to get session:', error);
      return null;
    }
  },
  
  /**
   * Clear all sessions
   */
  async clearSessions(): Promise<void> {
    if (!db) return; // Skip in SSR
    await db.authSessions.clear();
  },
  
  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession();
    return !!session;
  }
};

/**
 * Offline Queue Management
 */
export const OfflineQueue = {
  /**
   * Add action to offline queue
   */
  async add(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retries' | 'status'>): Promise<void> {
    if (!db) return; // Skip in SSR
    try {
      await db.offlineQueue.add({
        ...action,
        timestamp: Date.now(),
        retries: 0,
        status: 'pending'
      });
      
      console.log('[OfflineQueue] Action queued:', action.url);
      
      // Request background sync if available
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          if ('sync' in registration) {
            await (registration as any).sync.register('sync-offline-data');
          }
        } catch (e) {
          // Background sync not available
        }
      }
    } catch (error) {
      console.error('[OfflineQueue] Failed to queue action:', error);
    }
  },
  
  /**
   * Get pending actions
   */
  async getPending(): Promise<OfflineAction[]> {
    if (!db) return []; // Skip in SSR
    return await db.offlineQueue
      .where('status')
      .equals('pending')
      .toArray();
  },
  
  /**
   * Mark action as syncing
   */
  async markSyncing(id: number): Promise<void> {
    if (!db) return; // Skip in SSR
    await db.offlineQueue.update(id, { 
      status: 'syncing' 
    });
  },
  
  /**
   * Mark action as failed and increment retries
   */
  async markFailed(id: number): Promise<void> {
    if (!db) return; // Skip in SSR
    const action = await db.offlineQueue.get(id);
    if (action) {
      if (action.retries >= 3) {
        // Max retries reached, remove from queue
        await db.offlineQueue.delete(id);
      } else {
        await db.offlineQueue.update(id, {
          status: 'pending',
          retries: action.retries + 1
        });
      }
    }
  },
  
  /**
   * Remove successfully synced action
   */
  async remove(id: number): Promise<void> {
    if (!db) return; // Skip in SSR
    await db.offlineQueue.delete(id);
  },
  
  /**
   * Clear all queued actions
   */
  async clear(): Promise<void> {
    if (!db) return; // Skip in SSR
    await db.offlineQueue.clear();
  },
  
  /**
   * Process offline queue
   */
  async processQueue(): Promise<void> {
    const actions = await this.getPending();
    
    for (const action of actions) {
      try {
        await this.markSyncing(action.id!);
        
        const response = await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body ? JSON.stringify(action.body) : undefined
        });
        
        if (response.ok) {
          await this.remove(action.id!);
          console.log('[OfflineQueue] Synced:', action.url);
        } else {
          await this.markFailed(action.id!);
        }
      } catch (error) {
        await this.markFailed(action.id!);
        console.error('[OfflineQueue] Sync failed:', error);
      }
    }
  }
};

/**
 * User Preferences Management
 */
export const Preferences = {
  /**
   * Set preference
   */
  async set(key: string, value: any): Promise<void> {
    if (!db) return; // Skip in SSR
    try {
      const existing = await db.preferences
        .where('key')
        .equals(key)
        .first();
      
      if (existing) {
        await db.preferences.update(existing.id!, {
          value,
          timestamp: Date.now()
        });
      } else {
        await db.preferences.add({
          key,
          value,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('[Preferences] Failed to set:', error);
    }
  },
  
  /**
   * Get preference
   */
  async get(key: string): Promise<any> {
    if (!db) return null; // Skip in SSR
    try {
      const pref = await db.preferences
        .where('key')
        .equals(key)
        .first();
      
      return pref?.value || null;
    } catch (error) {
      console.error('[Preferences] Failed to get:', error);
      return null;
    }
  },
  
  /**
   * Remove preference
   */
  async remove(key: string): Promise<void> {
    if (!db) return; // Skip in SSR
    const pref = await db.preferences
      .where('key')
      .equals(key)
      .first();
    
    if (pref) {
      await db.preferences.delete(pref.id!);
    }
  }
};

/**
 * Profile Cache Management
 * Fixes the 200+ API calls issue by caching profiles in IndexedDB
 */
export const ProfileCache = {
  /**
   * Get cached profile from IndexedDB
   * @param userId - User ID to fetch profile for
   * @returns Cached profile or null if not found/expired
   */
  async get(userId: string): Promise<any | null> {
    if (!db) return null; // Skip in SSR
    try {
      const entry = await db.profiles
        .where({ userId })
        .first();
      
      if (!entry) {
        console.log('[ProfileCache] MISS for user:', userId);
        return null;
      }
      
      // Check if cache is expired (5 minutes TTL)
      const age = Date.now() - entry.timestamp;
      const TTL = 5 * 60 * 1000; // 5 minutes
      
      if (age > TTL) {
        console.log('[ProfileCache] EXPIRED for user:', userId, `(age: ${Math.round(age/1000)}s)`);
        await db.profiles.delete(entry.id!);
        return null;
      }
      
      console.log('[ProfileCache] HIT for user:', userId, `(age: ${Math.round(age/1000)}s)`);
      return entry.profile;
    } catch (error) {
      console.error('[ProfileCache] Error getting profile:', error);
      return null;
    }
  },
  
  /**
   * Save profile to IndexedDB cache
   * @param userId - User ID
   * @param profile - Profile data to cache
   */
  async set(userId: string, profile: any): Promise<void> {
    if (!db) return; // Skip in SSR
    try {
      const existing = await db.profiles
        .where({ userId })
        .first();
      
      if (existing) {
        // Update existing entry
        await db.profiles.update(existing.id!, {
          profile,
          timestamp: Date.now()
        });
      } else {
        // Create new entry
        await db.profiles.add({
          userId,
          profile,
          timestamp: Date.now()
        });
      }
      
      console.log('[ProfileCache] STORED for user:', userId);
    } catch (error) {
      console.error('[ProfileCache] Error saving profile:', error);
    }
  },
  
  /**
   * Invalidate profile cache for a user
   * @param userId - User ID to invalidate
   */
  async invalidate(userId: string): Promise<void> {
    if (!db) return; // Skip in SSR
    try {
      await db.profiles
        .where({ userId })
        .delete();
      
      console.log('[ProfileCache] INVALIDATED for user:', userId);
    } catch (error) {
      console.error('[ProfileCache] Error invalidating profile:', error);
    }
  },
  
  /**
   * Clear all cached profiles
   */
  async clear(): Promise<void> {
    if (!db) return; // Skip in SSR
    try {
      await db.profiles.clear();
      console.log('[ProfileCache] CLEARED all profiles');
    } catch (error) {
      console.error('[ProfileCache] Error clearing profiles:', error);
    }
  },
  
  /**
   * Clean up expired profile entries
   */
  async cleanup(): Promise<void> {
    try {
      const TTL = 5 * 60 * 1000; // 5 minutes
      const expiredTime = Date.now() - TTL;
      
      const deleted = await db.profiles
        .where('timestamp')
        .below(expiredTime)
        .delete();
      
      if (deleted > 0) {
        console.log('[ProfileCache] Cleaned up', deleted, 'expired profiles');
      }
    } catch (error) {
      console.error('[ProfileCache] Error during cleanup:', error);
    }
  }
};

/**
 * Initialize IndexedDB and clean old entries
 */
export async function initializeDB(): Promise<void> {
  try {
    await db.open();
    
    // Clean old cache entries on startup
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    // Clean old dashboards
    await db.dashboards
      .where('timestamp')
      .below(oneWeekAgo)
      .delete();
    
    // Clean expired sessions
    await db.authSessions
      .where('expiresAt')
      .below(Date.now())
      .delete();
    
    console.log('[IndexedDB] Database initialized');
  } catch (error) {
    console.error('[IndexedDB] Failed to initialize:', error);
  }
}

// Auto-initialize on import
if (typeof window !== 'undefined') {
  initializeDB();
}
