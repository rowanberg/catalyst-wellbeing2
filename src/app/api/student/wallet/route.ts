import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET() {
  try {
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

    // Use Supabase client with proper RLS instead of admin bypass
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
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
      }
      // Use the newly created profile
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
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    // Format response
    const walletData = {
      id: wallet.id,
      studentTag: profile.student_tag,
      walletAddress: wallet.wallet_address,
      mindGemsBalance: profile.gems || 0, // Use gems from profiles table (same as dashboard)
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
      hasTransactionPassword: !!wallet.transaction_password_hash,
      achievements: wallet.achievements || [],
      lastTransactionAt: wallet.last_transaction_at
    };

    return NextResponse.json(walletData);
  } catch (error) {
    console.error('Error in wallet GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
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
    const body = await request.json();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update wallet settings
    const { error: updateError } = await supabase
      .from('student_wallets')
      .update({
        wallet_nickname: body.walletNickname,
        daily_limit_gems: body.dailyLimitGems,
        daily_limit_fluxon: body.dailyLimitFluxon,
        settings: body.settings,
        updated_at: new Date().toISOString()
      })
      .eq('student_id', user.id);

    if (updateError) {
      console.error('Error updating wallet:', updateError);
      return NextResponse.json({ error: 'Failed to update wallet' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in wallet PATCH:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
