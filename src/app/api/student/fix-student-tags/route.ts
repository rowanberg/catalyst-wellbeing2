import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  try {
    // Use admin client to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Generate unique student tag
    const generateStudentTag = (): string => {
      const timestamp = Date.now().toString().slice(-8);
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      return timestamp + random;
    };

    // Find all profiles without student tags (only null or empty, never change existing ones)
    const { data: profilesWithoutTags, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('id, user_id, first_name, student_tag')
      .or('student_tag.is.null,student_tag.eq.');

    if (fetchError) {
      console.error('Error fetching profiles:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
    }

    if (!profilesWithoutTags || profilesWithoutTags.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'All profiles already have student tags',
        updatedCount: 0 
      });
    }

    console.log(`Found ${profilesWithoutTags.length} profiles without student tags`);

    // IMPORTANT: Only generate tags for profiles that truly don't have one
    // Never modify existing tags to maintain consistency
    const profilesToUpdate = profilesWithoutTags.filter(profile => 
      !profile.student_tag || profile.student_tag.trim() === ''
    );

    if (profilesToUpdate.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'All profiles already have valid student tags',
        updatedCount: 0 
      });
    }

    const updatedProfiles: any[] = [];
    
    // Update each profile individually to ensure no conflicts
    for (const profile of profilesToUpdate) {
      const newTag = generateStudentTag();
      
      // Double-check that this profile still doesn't have a tag before updating
      const { data: currentProfile } = await supabaseAdmin
        .from('profiles')
        .select('student_tag')
        .eq('id', profile.id)
        .single();
      
      // Only update if still no tag (prevents race conditions)
      if (!currentProfile?.student_tag || currentProfile.student_tag.trim() === '') {
        const { data: updated, error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({ student_tag: newTag })
          .eq('id', profile.id)
          .select('id, first_name, student_tag')
          .single();

        if (!updateError && updated) {
          updatedProfiles.push(updated);
        }
      }
    }

    return NextResponse.json({ 
      success: true,
      message: `Generated student tags for ${updatedProfiles.length} profiles`,
      updatedCount: updatedProfiles.length,
      updatedProfiles: updatedProfiles
    });

  } catch (error) {
    console.error('Error in fix-student-tags:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
