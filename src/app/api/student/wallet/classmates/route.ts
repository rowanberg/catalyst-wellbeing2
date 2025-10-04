import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
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

    // Use admin client for database operations to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's profile with student tag using admin client
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, first_name, last_name, student_tag')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get user's class assignments
    const { data: manualClassmates, error: manualError } = await supabaseAdmin
      .from('student_class_assignments')
      .select(`
        class_id,
        classes!inner(
          name,
          grade_levels(name)
        )
      `)
      .eq('student_id', user.id)
      .eq('is_active', true);

    if (manualError || !manualClassmates || manualClassmates.length === 0) {
      return NextResponse.json({ 
        currentStudent: {
          id: profile.id,
          name: `${profile.first_name} ${profile.last_name}`,
          studentTag: profile.student_tag
        },
        classmates: [] 
      });
    }

    const classIds = manualClassmates.map((c: any) => c.class_id);

    // Get all students in same classes
    const { data: sameClassStudents, error: studentsError } = await supabaseAdmin
      .from('student_class_assignments')
      .select(`
        student_id,
        profiles!inner(
          id,
          first_name,
          last_name,
          student_tag
        ),
        classes!inner(
          name,
          grade_levels(name)
        )
      `)
      .in('class_id', classIds)
      .neq('student_id', user.id)
      .eq('is_active', true);


    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      return NextResponse.json({ error: 'Failed to fetch classmates' }, { status: 500 });
    }

    // Get wallet addresses for classmates
    const studentIds = sameClassStudents?.map((s: any) => s.student_id) || [];
    const { data: wallets } = await supabaseAdmin
      .from('student_wallets')
      .select('student_id, wallet_address')
      .in('student_id', studentIds);

    const walletMap = new Map(wallets?.map((w: any) => [w.student_id, w.wallet_address]) || []);

    // Format response
    const formattedClassmates = sameClassStudents?.map((s: any) => ({
      id: s.profiles?.id,
      firstName: s.profiles?.first_name,
      lastName: s.profiles?.last_name,
      fullName: `${s.profiles?.first_name || ''} ${s.profiles?.last_name || ''}`,
      studentTag: s.profiles?.student_tag,
      walletAddress: walletMap.get(s.student_id) || null,
      className: s.classes?.name || 'Unknown',
      gradeLevel: s.classes?.grade_levels?.name || 'Unknown'
    })) || [];

    // Remove duplicates
    const uniqueClassmates = Array.from(
      new Map(formattedClassmates.map((c: any) => [c.id, c])).values()
    );

    return NextResponse.json({
      currentStudent: {
        id: profile.id,
        name: `${profile.first_name} ${profile.last_name}`,
        studentTag: profile.student_tag
      },
      classmates: uniqueClassmates
    });

  } catch (error) {
    console.error('Error in classmates GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
