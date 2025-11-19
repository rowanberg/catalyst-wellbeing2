import { NextRequest, NextResponse } from 'next/server'
import { authenticateStudent, isAuthError } from '@/lib/auth/api-auth'

export async function GET(request: NextRequest) {
	try {
		const auth = await authenticateStudent(request)
		
		if (isAuthError(auth)) {
			return NextResponse.json({ error: auth.error }, { status: auth.status })
		}

		const { supabase, userId } = auth

		// Get student profile
		const { data: profile, error: profileError } = await supabase
			.from('profiles')
			.select('*')
			.eq('user_id', userId)
			.single()

		if (profileError) {
			console.error('Profile fetch error:', profileError)
			return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
		}

		return NextResponse.json({ 
			profile,
			success: true 
		})

	} catch (error) {
		console.error('Student profile error:', error)
		return NextResponse.json({ 
			error: 'Internal server error',
			details: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 })
	}
}
