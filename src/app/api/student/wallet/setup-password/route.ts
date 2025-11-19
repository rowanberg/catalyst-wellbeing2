import { NextRequest, NextResponse } from 'next/server';
import * as bcrypt from 'bcryptjs';
import { invalidateUserCaches } from '@/lib/cache/cacheManager';
import { authenticateStudent, isAuthError } from '@/lib/auth/api-auth';

// Use bcrypt for secure password hashing
// Cost factor of 12 provides good security/performance balance
const BCRYPT_ROUNDS = 12;

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const auth = await authenticateStudent(request);
    
    if (isAuthError(auth)) {
      if (auth.status === 401) {
        console.error('Auth error in setup-password: Unauthorized');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      if (auth.status === 403) {
        return NextResponse.json({ error: 'Student access required' }, { status: 403 });
      }
      
      console.error('Auth error in setup-password:', auth.error);
      return NextResponse.json({ error: auth.error || 'Authentication failed' }, { status: auth.status });
    }
    
    const { supabase, userId } = auth;

    // Hash password using bcrypt
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Update wallet with password (bcrypt includes salt in the hash)
    const { error: updateError } = await supabase
      .from('student_wallets')
      .update({
        transaction_password_hash: passwordHash,
        updated_at: new Date().toISOString()
      })
      .eq('student_id', userId);

    if (updateError) {
      console.error('Error setting password:', updateError);
      return NextResponse.json({ error: 'Failed to set password' }, { status: 500 });
    }

    // Invalidate wallet cache so fresh data is fetched
    invalidateUserCaches(userId);

    // Log security event
    await supabase
      .from('wallet_security_logs')
      .insert({
        wallet_id: userId,
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
