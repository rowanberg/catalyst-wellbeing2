import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateStudent, isAuthError } from '@/lib/auth/api-auth';

export async function GET(request: NextRequest) {
  try {
    // Use admin client for database operations to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
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
    
    const { userId } = auth;

    // Get user's profile with student tag using admin client
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, first_name, last_name, student_tag')
      .eq('id', userId)
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
      .eq('student_id', userId)
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
      .neq('student_id', userId)
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
