import { NextRequest, NextResponse } from 'next/server';
import { LRUCache } from 'lru-cache';

interface RateLimiterOptions {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Max number of requests per interval
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}

class RateLimiter {
  private cache: LRUCache<string, number[]>;
  private options: RateLimiterOptions;

  constructor(options: RateLimiterOptions) {
    this.options = options;
    this.cache = new LRUCache<string, number[]>({
      max: options.uniqueTokenPerInterval || 500,
      ttl: options.interval || 60000,
    });
  }

  private getKey(identifier: string, route: string): string {
    return `${identifier}:${route}`;
  }

  check(identifier: string, route: string): RateLimitInfo {
    const key = this.getKey(identifier, route);
    const now = Date.now();
    const windowStart = now - this.options.interval;

    // Get existing requests in current window
    const requests = this.cache.get(key) || [];
    const recentRequests = requests.filter(timestamp => timestamp > windowStart);

    // Update cache with recent requests
    this.cache.set(key, recentRequests);

    const remaining = Math.max(0, this.options.uniqueTokenPerInterval - recentRequests.length);
    const reset = now + this.options.interval;

    return {
      limit: this.options.uniqueTokenPerInterval,
      remaining,
      reset
    };
  }

  consume(identifier: string, route: string): RateLimitInfo {
    const key = this.getKey(identifier, route);
    const now = Date.now();
    const windowStart = now - this.options.interval;

    // Get existing requests in current window
    const requests = this.cache.get(key) || [];
    const recentRequests = requests.filter(timestamp => timestamp > windowStart);

    // Add current request
    recentRequests.push(now);

    // Update cache
    this.cache.set(key, recentRequests);

    const remaining = Math.max(0, this.options.uniqueTokenPerInterval - recentRequests.length);
    const reset = now + this.options.interval;

    return {
      limit: this.options.uniqueTokenPerInterval,
      remaining,
      reset
    };
  }

  isRateLimited(identifier: string, route: string): boolean {
    const info = this.check(identifier, route);
    return info.remaining <= 0;
  }
}

// Create rate limiters for different endpoints
export const rateLimiters = {
  // Moderate rate limit for authentication endpoints (increased for better UX)
  auth: new RateLimiter({
    interval: 5 * 60 * 1000, // 5 minutes
    uniqueTokenPerInterval: 20, // 20 attempts per 5 minutes (more reasonable)
  }),

  // Moderate rate limit for wallet operations (increased for page load with multiple endpoints)
  wallet: new RateLimiter({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 30, // 30 operations per minute (allows multiple page loads)
  }),

  // Standard rate limit for general API calls
  general: new RateLimiter({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 60, // 60 requests per minute
  }),

  // Strict rate limit for help requests
  helpRequest: new RateLimiter({
    interval: 60 * 60 * 1000, // 1 hour
    uniqueTokenPerInterval: 3, // 3 help requests per hour
  }),

  // File upload rate limit
  upload: new RateLimiter({
    interval: 60 * 60 * 1000, // 1 hour
    uniqueTokenPerInterval: 10, // 10 uploads per hour
  }),
};

// Helper function to get client identifier
export function getClientIdentifier(request: NextRequest): string {
  // Try to get user ID from auth
  const userId = request.headers.get('x-user-id');
  if (userId) return `user:${userId}`;

  // Fallback to IP address
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';

  return `ip:${ip}`;
}

// Middleware helper for rate limiting
export async function withRateLimit(
  request: NextRequest,
  handler: () => Promise<NextResponse>,
  limiterType: 'auth' | 'wallet' | 'general' | 'helpRequest' | 'upload' = 'general'
): Promise<NextResponse> {
  const limiter = rateLimiters[limiterType];
  const identifier = getClientIdentifier(request);
  const route = request.nextUrl.pathname;

  // Skip rate limiting for session checks (read-only GET requests)
  if (route.includes('/api/auth/session') && request.method === 'GET') {
    return handler();
  }

  // Skip rate limiting for profile fetching (read-only POST requests)
  if (route.includes('/api/get-profile') && request.method === 'POST') {
    return handler();
  }

  // Skip rate limiting for wallet GET requests (read-only operations)
  if (route.includes('/api/student/wallet') && request.method === 'GET') {
    return handler();
  }

  // Check if rate limited before making the request
  if (limiter.isRateLimited(identifier, route)) {
    const info = limiter.check(identifier, route);

    return NextResponse.json(
      {
        error: 'Too many requests',
        message: 'You have exceeded the rate limit. Please try again later.',
        retryAfter: Math.ceil((info.reset - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': info.limit.toString(),
          'X-RateLimit-Remaining': info.remaining.toString(),
          'X-RateLimit-Reset': new Date(info.reset).toISOString(),
          'Retry-After': Math.ceil((info.reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  // Execute handler first to check if it succeeds
  const response = await handler();

  // Only consume rate limit on failed requests (4xx, 5xx errors) or for auth endpoints
  const shouldConsumeLimit =
    response.status >= 400 ||
    limiterType === 'helpRequest' ||
    limiterType === 'upload';

  let info;
  if (shouldConsumeLimit) {
    info = limiter.consume(identifier, route);
  } else {
    // Just check, don't consume for successful requests
    info = limiter.check(identifier, route);
  }

  // Add rate limit headers to response
  response.headers.set('X-RateLimit-Limit', info.limit.toString());
  response.headers.set('X-RateLimit-Remaining', info.remaining.toString());
  response.headers.set('X-RateLimit-Reset', new Date(info.reset).toISOString());

  return response;
}

// Export default rate limiter instance for general use
const defaultRateLimiter = new RateLimiter({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 60, // 60 requests per minute
});

export default defaultRateLimiter;
