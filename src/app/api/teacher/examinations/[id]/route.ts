import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET a specific exam by ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { id: examId } = await params

        console.log('📋 GET Exam - ID:', examId)

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            console.error('❌ Auth error:', authError)
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        console.log('👤 User authenticated:', user.id)

        // Get teacher profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, role')
            .eq('user_id', user.id)
            .single()

        if (profileError || !profile || profile.role !== 'teacher') {
            console.error('❌ Profile error:', profileError)
            return NextResponse.json({ error: 'Teacher access required' }, { status: 403 })
        }

        console.log('👨‍🏫 Teacher profile ID:', profile.id)

        // First check if exam exists at all
        const { data: examExists, error: existsError } = await supabase
            .from('examinations')
            .select('id, teacher_id')
            .eq('id', examId)
            .maybeSingle()

        console.log('🔍 Exam exists check:', { examExists, existsError })

        if (existsError) {
            console.error('❌ Error checking exam existence:', existsError)
            return NextResponse.json({ error: 'Database error' }, { status: 500 })
        }

        if (!examExists) {
            console.error('❌ Exam not found in database')
            return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
        }

        if (examExists.teacher_id !== profile.id) {
            console.error('❌ Access denied - exam belongs to different teacher')
            console.log('Exam teacher_id:', examExists.teacher_id, 'Profile ID:', profile.id)
            return NextResponse.json({ error: 'Access denied - not your exam' }, { status: 403 })
        }

        // Fetch the exam with exam_questions
        const { data: exam, error: examError } = await supabase
            .from('examinations')
            .select(`
        *,
        questions:exam_questions(*)
      `)
            .eq('id', examId)
            .eq('teacher_id', profile.id)
            .single()

        if (examError) {
            console.error('❌ Error fetching exam details:', examError)
            return NextResponse.json({ error: 'Failed to fetch exam', details: examError.message }, { status: 500 })
        }

        console.log('✅ Exam fetched successfully:', exam.title)
        return NextResponse.json({ exam })
    } catch (error: any) {
        console.error('❌ Unexpected error in GET exam:', error)
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        )
    }
}

// PUT (Update) a specific exam
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { id: examId } = await params

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get teacher profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, role')
            .eq('user_id', user.id)
            .single()

        if (profileError || !profile || profile.role !== 'teacher') {
            return NextResponse.json({ error: 'Teacher access required' }, { status: 403 })
        }

        const body = await request.json()
        const {
            title,
            description,
            subject,
            grade_level,
            difficulty_level,
            total_marks,
            duration_minutes,
            start_time,
            end_time,
            is_published,
            exam_type,
            max_attempts,
            questions
        } = body

        // Verify exam belongs to this teacher
        const { data: existingExam, error: verifyError } = await supabase
            .from('examinations')
            .select('id, teacher_id')
            .eq('id', examId)
            .eq('teacher_id', profile.id)
            .single()

        if (verifyError || !existingExam) {
            return NextResponse.json(
                { error: 'Exam not found or access denied' },
                { status: 404 }
            )
        }

        // Update exam metadata
        const { data: updatedExam, error: updateError } = await supabase
            .from('examinations')
            .update({
                title,
                description,
                subject,
                grade_level,
                difficulty_level,
                total_marks,
                total_questions: questions?.length || 0,
                duration_minutes,
                start_time,
                end_time,
                is_published,
                exam_type,
                max_attempts,
                updated_at: new Date().toISOString()
            })
            .eq('id', examId)
            .select()
            .single()

        if (updateError) {
            console.error('Error updating exam:', updateError)
            return NextResponse.json(
                { error: 'Failed to update exam', details: updateError.message },
                { status: 500 }
            )
        }

        // Update questions if provided - use exam_questions table
        if (questions && Array.isArray(questions)) {
            // Delete existing questions
            await supabase
                .from('exam_questions')
                .delete()
                .eq('examination_id', examId)

            // Insert new questions
            const questionsToInsert = questions.map((q: any, index: number) => ({
                examination_id: examId,
                question_text: q.question_text,
                question_type: q.question_type,
                options: q.options,
                correct_answer: q.correct_answer,
                marks: q.marks,
                order: index + 1
            }))

            const { error: questionsError } = await supabase
                .from('exam_questions')
                .insert(questionsToInsert)

            if (questionsError) {
                console.error('Error updating questions:', questionsError)
                return NextResponse.json(
                    { error: 'Failed to update questions', details: questionsError.message },
                    { status: 500 }
                )
            }
        }

        return NextResponse.json({
            success: true,
            exam: updatedExam,
            message: 'Exam updated successfully'
        })
    } catch (error: any) {
        console.error('Error in PUT exam:', error)
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        )
    }
}

// DELETE a specific exam
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { id: examId } = await params

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get teacher profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, role')
            .eq('user_id', user.id)
            .single()

        if (profileError || !profile || profile.role !== 'teacher') {
            return NextResponse.json({ error: 'Teacher access required' }, { status: 403 })
        }

        // Verify exam belongs to this teacher and delete
        const { error: deleteError } = await supabase
            .from('examinations')
            .delete()
            .eq('id', examId)
            .eq('teacher_id', profile.id)

        if (deleteError) {
            console.error('Error deleting exam:', deleteError)
            return NextResponse.json(
                { error: 'Failed to delete exam', details: deleteError.message },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'Exam deleted successfully'
        })
    } catch (error: any) {
        console.error('Error in DELETE exam:', error)
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        )
    }
}
