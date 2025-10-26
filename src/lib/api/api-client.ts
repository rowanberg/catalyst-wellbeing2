/**
 * API Client with Capacitor Support
 * Automatically uses backend URL when in Capacitor APK
 */

/**
 * Get the correct API base URL
 * - In browser/dev: uses relative URLs (/api/...)
 * - In Capacitor APK: uses full backend URL
 */
export function getApiUrl(endpoint: string): string {
  // Check if running in Capacitor
  const isCapacitor = typeof window !== 'undefined' && 
    (window as any).Capacitor !== undefined;
  
  // Use backend URL if in Capacitor, otherwise relative URL
  const baseUrl = isCapacitor && process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL
    : '';
  
  // Ensure endpoint starts with /
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  return `${baseUrl}${cleanEndpoint}`;
}

/**
 * Fetch wrapper with automatic API URL resolution
 * Use this instead of fetch() for all API calls
 */
export async function apiFetch(endpoint: string, options?: RequestInit): Promise<Response> {
  const url = getApiUrl(endpoint);
  
  // Add default headers
  const headers = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };
  
  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Check if running in Capacitor environment
 */
export function isCapacitorApp(): boolean {
  return typeof window !== 'undefined' && 
    (window as any).Capacitor !== undefined;
}

/**
 * Check if features requiring server are available
 */
export function hasServerFeatures(): boolean {
  return !isCapacitorApp();
}
