import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { password } = await request.json();

    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate salt and hash password
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);

    // Update wallet with password
    const { error: updateError } = await supabase
      .from('student_wallets')
      .update({
        transaction_password_hash: passwordHash,
        password_salt: salt,
        password_set_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('student_id', user.id);

    if (updateError) {
      console.error('Error setting password:', updateError);
      return NextResponse.json({ error: 'Failed to set password' }, { status: 500 });
    }

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
