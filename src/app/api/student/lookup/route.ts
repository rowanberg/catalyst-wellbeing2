import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateStudent, isAuthError } from '@/lib/auth/api-auth';

export async function POST(request: NextRequest) {
  try {
    const { studentTag } = await request.json();

    if (!studentTag || studentTag.length !== 12) {
      return NextResponse.json({ error: 'Invalid student tag' }, { status: 400 });
    }

    const auth = await authenticateStudent(request);

    if (isAuthError(auth)) {
      if (auth.status === 401) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      if (auth.status === 403) {
        return NextResponse.json({ error: 'Student access required' }, { status: 403 });
      }

      return NextResponse.json({ error: auth.error || 'Authentication failed' }, { status: auth.status });
    }

    // Use admin client to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Look up student by student tag
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, user_id, first_name, last_name, student_tag, role')
      .eq('student_tag', studentTag)
      .eq('role', 'student')
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Check if student has a wallet (use user_id, not profile.id)
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from('student_wallets')
      .select('wallet_address')
      .eq('student_id', profile.user_id)
      .single();

    if (!wallet) {
      return NextResponse.json({ 
        error: 'Student does not have a wallet', 
        student: {
          name: `${profile.first_name} ${profile.last_name}`,
          studentTag: profile.student_tag
        }
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      student: {
        id: profile.user_id, // Use user_id for consistency
        name: `${profile.first_name} ${profile.last_name}`,
        firstName: profile.first_name,
        lastName: profile.last_name,
        studentTag: profile.student_tag,
        walletAddress: wallet.wallet_address
      }
    });

  } catch (error) {
    console.error('Error in student lookup:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
