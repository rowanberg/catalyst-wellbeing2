import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import admin from 'firebase-admin'

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    try {
        if (process.env.FIREBASE_PROJECT_ID) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                }),
            })
            console.log('✅ Firebase Admin initialized')
        } else {
            console.warn('⚠️ Firebase Admin not initialized: Missing FIREBASE_PROJECT_ID')
        }
    } catch (error) {
        console.error('❌ Firebase Admin initialization error:', error)
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Verify authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { token, notification, data } = body

        if (!token || !notification) {
            return NextResponse.json(
                { error: 'Token and notification are required' },
                { status: 400 }
            )
        }

        // Send notification using Firebase Admin SDK
        const message: admin.messaging.Message = {
            token: token,
            notification: {
                title: notification.title,
                body: notification.body,
            },
            data: data || {},
            webpush: {
                fcmOptions: {
                    link: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
                }
            }
        }

        const response = await admin.messaging().send(message)

        console.log('✅ FCM notification sent successfully:', response)

        return NextResponse.json(
            { success: true, messageId: response },
            { status: 200 }
        )

    } catch (error: any) {
        console.error('❌ Error sending FCM notification:', error)

        // Handle specific FCM errors
        if (error.code === 'messaging/invalid-registration-token' ||
            error.code === 'messaging/registration-token-not-registered') {
            return NextResponse.json(
                { error: 'Invalid or expired token', code: error.code },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: 'Failed to send notification', details: error.message },
            { status: 500 }
        )
    }
}
