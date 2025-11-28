import { createClient } from '@/lib/supabase/server'

interface NotificationPayload {
    title: string
    body: string
    data?: Record<string, string>
}

/**
 * Send FCM push notification to a user
 * @param userId - The auth.users.id of the recipient
 * @param payload - Notification title, body, and optional data
 * @returns Promise<boolean> - Success status
 */
export async function sendFCMNotification(
    userId: string,
    payload: NotificationPayload
): Promise<boolean> {
    try {
        const supabase = await createClient()

        // Get active FCM tokens for this user
        const { data: tokens, error: tokensError } = await supabase
            .from('fcm_tokens')
            .select('token, device_type')
            .eq('user_id', userId)
            .eq('is_active', true)

        if (tokensError || !tokens || tokens.length === 0) {
            console.log(`⚠️ No active FCM tokens found for user ${userId}`)
            return false
        }

        console.log(`📤 Sending notification to ${tokens.length} device(s) for user ${userId}`)

        // Send notification to Firebase Admin SDK endpoint
        // This will use Firebase Admin SDK to send the push notification
        const notificationPromises = tokens.map(async ({ token, device_type }) => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/send-fcm`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        token,
                        notification: {
                            title: payload.title,
                            body: payload.body,
                        },
                        data: payload.data || {},
                    }),
                })

                if (!response.ok) {
                    const error = await response.json()
                    console.error(`❌ Failed to send FCM to ${device_type}:`, error)
                    return false
                }

                console.log(`✅ FCM sent successfully to ${device_type}`)
                return true
            } catch (error) {
                console.error(`❌ Error sending FCM to ${device_type}:`, error)
                return false
            }
        })

        const results = await Promise.all(notificationPromises)
        const successCount = results.filter(r => r).length

        console.log(`📊 Sent ${successCount}/${tokens.length} notifications successfully`)
        return successCount > 0

    } catch (error) {
        console.error('❌ Error in sendFCMNotification:', error)
        return false
    }
}

/**
 * Send absence notification to a student
 * @param studentId - The student's profile ID
 * @param date - The absence date
 * @returns Promise<boolean> - Success status
 */
export async function sendAbsenceNotification(
    studentId: string,
    date: string
): Promise<boolean> {
    try {
        const supabase = await createClient()

        console.log(`🔍 Looking up student profile for ID: ${studentId}`)

        // Get student's user_id from their profile
        const { data: student, error: studentError } = await supabase
            .from('profiles')
            .select('user_id, first_name, last_name, id')
            .eq('id', studentId)
            .single()

        if (studentError || !student) {
            console.error('❌ Student not found:', studentId, studentError)
            return false
        }

        console.log(`👤 Student found:`, {
            profile_id: student.id,
            user_id: student.user_id,
            name: `${student.first_name} ${student.last_name}`
        })

        // Check for FCM tokens with detailed logging
        const { data: tokens, error: tokenError } = await supabase
            .from('fcm_tokens')
            .select('*')
            .eq('user_id', student.user_id)

        console.log(`🔍 FCM token query result for user_id ${student.user_id}:`, {
            found: tokens?.length || 0,
            tokens: tokens,
            error: tokenError
        })

        if (tokenError) {
            console.error('❌ Error fetching tokens:', tokenError)
        }

        const formattedDate = new Date(date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })

        const payload: NotificationPayload = {
            title: '⚠️ Absence Recorded',
            body: `You were marked absent on ${formattedDate}. Please check with your teacher if this is incorrect.`,
            data: {
                type: 'absence',
                date: date,
                studentId: studentId,
            }
        }

        return await sendFCMNotification(student.user_id, payload)

    } catch (error) {
        console.error('❌ Error sending absence notification:', error)
        return false
    }
}
