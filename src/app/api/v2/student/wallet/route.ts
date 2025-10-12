/**
 * Student Wallet API v2
 * Enhanced version with improved security, caching, and audit logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { withCache, generateUserCacheKey, invalidateUserCaches } from '@/lib/cache/cacheManager';
import { withRateLimit } from '@/lib/security/rateLimiter';
import { withVersioning, isFeatureEnabled, extractAPIVersion } from '@/lib/api/versioning';

// V2 handler with enhanced features
async function handleV2(request: NextRequest) {
  return withRateLimit(request, async () => {
    try {
      const version = extractAPIVersion(request);
      
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
                );
              } catch {
                // Ignore server component errors
              }
            },
          },
        }
      );

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return NextResponse.json({ 
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
          version
        }, { status: 401 });
      }

      // Check for advanced caching if enabled in this version
      const useAdvancedCaching = isFeatureEnabled(version, 'advancedCaching');
      const { searchParams } = new URL(request.url);
      const forceRefresh = searchParams.get('force_refresh') === 'true';

      // Get user profile to access student_tag and gems
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('student_tag, first_name, last_name, gems')
        .eq('user_id', user.id);

      // Generate unique student tag helper
      const generateStudentTag = (): string => {
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return timestamp + random;
      };

      let profile = profiles?.[0];
      if (profileError || !profile) {
        // Create profile using regular client with RLS
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            first_name: user.email?.split('@')[0] || 'Student',
            last_name: '',
            role: 'student',
            student_tag: generateStudentTag(),
            gems: 0,
            created_at: new Date().toISOString()
          })
          .select('student_tag, first_name, last_name, gems')
          .single();

        if (createError) {
          return NextResponse.json({ 
            error: 'Failed to create profile',
            code: 'PROFILE_CREATE_ERROR',
            version
          }, { status: 500 });
        }
        profile = newProfile;
      }

      // Check if wallet exists for this user
      const { data: wallet, error: walletError } = await supabase
        .from('student_wallets')
        .select('*')
        .eq('student_id', user.id)
        .single();

      // If wallet doesn't exist, return 404
      if (!wallet) {
        return NextResponse.json({ 
          error: 'Wallet not found',
          code: 'WALLET_NOT_FOUND',
          version
        }, { status: 404 });
      }

      // Function to fetch fresh wallet data
      const fetchWalletData = async () => {
        return {
          id: wallet.id,
          studentTag: profile.student_tag,
          walletAddress: wallet.wallet_address,
          mindGemsBalance: profile.gems || 0, // V2 uses full field name
          fluxonBalance: parseFloat(wallet.fluxon_balance),
          walletNickname: wallet.wallet_nickname,
          walletLevel: wallet.wallet_level,
          walletXp: wallet.wallet_xp,
          trustScore: wallet.trust_score,
          dailyLimitGems: wallet.daily_limit_gems,
          dailyLimitFluxon: parseFloat(wallet.daily_limit_fluxon),
          dailySpentGems: wallet.daily_spent_gems,
          dailySpentFluxon: parseFloat(wallet.daily_spent_fluxon),
          totalTransactionsSent: wallet.total_transactions_sent,
          totalTransactionsReceived: wallet.total_transactions_received,
          isLocked: wallet.is_locked,
          lastTransactionAt: wallet.last_transaction_at,
          achievements: wallet.achievements || [],
          settings: wallet.settings || {},
          cached: false
        };
      };

      let walletData;
      
      if (useAdvancedCaching) {
        // Use caching for v2
        const cacheKey = generateUserCacheKey(user.id, 'wallet');
        walletData = await withCache(
          'wallet',
          cacheKey,
          fetchWalletData,
          { forceRefresh }
        );
        
        // Mark if data came from cache
        if (!forceRefresh && walletData.cached !== false) {
          walletData.cached = true;
        }
      } else {
        // No caching for older versions
        walletData = await fetchWalletData();
      }

      const response = NextResponse.json({
        success: true,
        wallet: walletData,
        version,
        features: {
          enhancedSecurity: isFeatureEnabled(version, 'enhancedSecurity'),
          auditLogging: isFeatureEnabled(version, 'auditLogging'),
          advancedCaching: isFeatureEnabled(version, 'advancedCaching'),
          decimalArithmetic: isFeatureEnabled(version, 'decimalArithmetic')
        }
      });
      
      // Add cache headers for v2
      if (useAdvancedCaching) {
        response.headers.set('X-Cache-Status', walletData.cached ? 'HIT' : 'MISS');
        response.headers.set('Cache-Control', 'private, max-age=300'); // 5 minutes
      }
      
      return response;

    } catch (error: any) {
      console.error('Wallet API v2 error');
      return NextResponse.json({ 
        error: 'Failed to load wallet data. Please try again.',
        code: 'WALLET_ERROR',
        version: extractAPIVersion(request)
      }, { status: 500 });
    }
  }, 'wallet');
}

// V1 handler for backward compatibility
async function handleV1(request: NextRequest) {
  return withRateLimit(request, async () => {
    try {
      const version = extractAPIVersion(request);
      
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
                );
              } catch {
                // Ignore server component errors
              }
            },
          },
        }
      );

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Simplified v1 logic without caching and enhanced features
      const { data: profiles } = await supabase
        .from('profiles')
        .select('student_tag, first_name, last_name, gems')
        .eq('user_id', user.id);

      const profile = profiles?.[0];
      if (!profile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      }

      const { data: wallet } = await supabase
        .from('student_wallets')
        .select('*')
        .eq('student_id', user.id)
        .single();

      if (!wallet) {
        return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
      }

      // V1 response format (legacy field names)
      const walletData = {
        id: wallet.id,
        studentTag: profile.student_tag,
        walletAddress: wallet.wallet_address,
        gems: profile.gems || 0, // V1 used 'gems'
        fluxon: parseFloat(wallet.fluxon_balance), // V1 used 'fluxon'
        walletNickname: wallet.wallet_nickname,
        isLocked: wallet.is_locked
      };

      return NextResponse.json({
        success: true,
        wallet: walletData
      });

    } catch (error: any) {
      console.error('Wallet API v1 error');
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }, 'general');
}

// Export versioned handler
export const GET = withVersioning({
  v1: handleV1,
  v2: handleV2
});

// POST method for cache invalidation (v2 only)
export async function POST(request: NextRequest) {
  const version = extractAPIVersion(request);
  
  if (version === 'v1') {
    return NextResponse.json({
      error: 'Cache invalidation not supported in v1',
      code: 'FEATURE_NOT_SUPPORTED',
      version
    }, { status: 400 });
  }

  return withRateLimit(request, async () => {
    try {
      const { action, userId } = await request.json();
      
      if (action === 'invalidate_cache' && userId) {
        invalidateUserCaches(userId);
        return NextResponse.json({ 
          success: true, 
          message: 'Cache invalidated',
          version
        });
      }
      
      return NextResponse.json({ 
        error: 'Invalid action',
        code: 'INVALID_ACTION',
        version
      }, { status: 400 });
    } catch (error) {
      return NextResponse.json({ 
        error: 'Failed to process request',
        code: 'CACHE_ERROR',
        version
      }, { status: 500 });
    }
  }, 'general');
}
