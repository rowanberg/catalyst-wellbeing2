import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import * as bcrypt from 'bcryptjs';
import { invalidateUserCaches } from '@/lib/cache/cacheManager';

// Use bcrypt for secure password hashing
// Cost factor of 12 provides good security/performance balance
const BCRYPT_ROUNDS = 12;

export async function POST(request: Request) {
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
    
    const { password } = await request.json();

    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Auth error in setup-password:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Hash password using bcrypt
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Update wallet with password (bcrypt includes salt in the hash)
    const { error: updateError } = await supabase
      .from('student_wallets')
      .update({
        transaction_password_hash: passwordHash,
        updated_at: new Date().toISOString()
      })
      .eq('student_id', user.id);

    if (updateError) {
      console.error('Error setting password:', updateError);
      return NextResponse.json({ error: 'Failed to set password' }, { status: 500 });
    }

    // Invalidate wallet cache so fresh data is fetched
    invalidateUserCaches(user.id);

    // Log security event
    await supabase
      .from('wallet_security_logs')
      .insert({
        wallet_id: user.id,
        action_type: 'password_set',
        action_details: 'Transaction password was set',
        success: true
      });

    return NextResponse.json({ success: true, message: 'Transaction password set successfully' });
  } catch (error) {
    console.error('Error in setup-password POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
