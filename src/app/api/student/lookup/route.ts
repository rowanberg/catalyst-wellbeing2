import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { studentTag } = await request.json();

    if (!studentTag || studentTag.length !== 12) {
      return NextResponse.json({ error: 'Invalid student tag' }, { status: 400 });
    }

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

    // Get current user for authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
