import { NextRequest, NextResponse } from 'next/server'
import { authenticateStudent, isAuthError } from '@/lib/auth/api-auth'

export async function GET(request: NextRequest) {
	try {
		const auth = await authenticateStudent(request)
		
		if (isAuthError(auth)) {
			return NextResponse.json({ error: auth.error }, { status: auth.status })
		}

		// Return default settings structure
		// Note: These settings are persisted in localStorage on the client
		// Database columns don't exist, so we return defaults
		const settings = {
			theme: 'fiery-rose', // Default theme
			notifications: true,
			soundEffects: true,
			privateProfile: false,
			autoSave: true,
			animations: true,
			hapticFeedback: true,
			dataSync: true,
			fontSize: 16,
			language: 'English'
		}

		return NextResponse.json({ 
			settings,
			success: true 
		})

	} catch (error) {
		console.error('Student settings error:', error)
		return NextResponse.json({ 
			error: 'Internal server error',
			details: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 })
	}
}

export async function PUT(request: NextRequest) {
	try {
		const auth = await authenticateStudent(request)
		
		if (isAuthError(auth)) {
			return NextResponse.json({ error: auth.error }, { status: auth.status })
		}

		const body = await request.json()
		const { settings } = body
		
		if (!settings) {
			return NextResponse.json({ error: 'Settings data required' }, { status: 400 })
		}

		// Settings are persisted in localStorage on the client side
		// Theme is saved with key 'catalyst-theme-preference'
		// No database update needed as profiles table doesn't have these columns
		// Just validate authentication and return success
		
		console.log('Settings received (persisted in localStorage):', {
			theme: settings.theme,
			notifications: settings.notifications,
			soundEffects: settings.soundEffects,
			privateProfile: settings.privateProfile,
			autoSave: settings.autoSave,
			animations: settings.animations,
			hapticFeedback: settings.hapticFeedback,
			dataSync: settings.dataSync,
			fontSize: settings.fontSize,
			language: settings.language
		})

		return NextResponse.json({ 
			success: true,
			message: 'Settings updated successfully (persisted in localStorage)'
		})

	} catch (error) {
		console.error('Update settings error:', error)
		return NextResponse.json({ 
			error: 'Internal server error',
			details: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 })
	}
}
