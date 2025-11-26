import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'
import { isOTPExpired } from '@/lib/otp-generator'

const MAX_ATTEMPTS = 5

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { email, otp } = body

        // Validate input
        if (!email || !otp) {
            return NextResponse.json(
                { error: 'Email and OTP are required' },
                { status: 400 }
            )
        }

        // Validate OTP format (6 digits)
        if (!/^\d{6}$/.test(otp)) {
            return NextResponse.json(
                { error: 'Invalid OTP format' },
                { status: 400 }
            )
        }

        // Get latest OTP for this email
        const supabase = await createClient()
        const { data: otpRecords, error: fetchError } = await supabase
            .from('otp_verifications')
            .select('*')
            .eq('email', email)
            .eq('verified', false)
            .order('created_at', { ascending: false })
            .limit(1)

        if (fetchError) {
            console.error('Database error:', fetchError)
            return NextResponse.json(
                { error: 'Failed to verify OTP' },
                { status: 500 }
            )
        }

        if (!otpRecords || otpRecords.length === 0) {
            return NextResponse.json(
                { error: 'No OTP found. Please request a new one.' },
                { status: 404 }
            )
        }

        const otpRecord = otpRecords[0]

        // Check if OTP is expired
        if (isOTPExpired(new Date(otpRecord.expires_at))) {
            return NextResponse.json(
                { error: 'OTP has expired. Please request a new one.' },
                { status: 400 }
            )
        }

        // Check attempts
        if (otpRecord.attempts >= MAX_ATTEMPTS) {
            return NextResponse.json(
                { error: 'Too many failed attempts. Please request a new OTP.' },
                { status: 429 }
            )
        }

        // Verify OTP using constant-time comparison
        const isValid = await bcrypt.compare(otp, otpRecord.otp_hash)

        if (!isValid) {
            // Increment attempts
            await supabase
                .from('otp_verifications')
                .update({ attempts: otpRecord.attempts + 1 })
                .eq('id', otpRecord.id)

            const remainingAttempts = MAX_ATTEMPTS - (otpRecord.attempts + 1)
            return NextResponse.json(
                {
                    error: 'Invalid OTP',
                    remainingAttempts: Math.max(0, remainingAttempts),
                },
                { status: 400 }
            )
        }

        // Mark as verified
        const { error: updateError } = await supabase
            .from('otp_verifications')
            .update({ verified: true })
            .eq('id', otpRecord.id)

        if (updateError) {
            console.error('Update error:', updateError)
            return NextResponse.json(
                { error: 'Failed to verify OTP' },
                { status: 500 }
            )
        }

        // Clean up old OTPs for this email (optional)
        await supabase
            .from('otp_verifications')
            .delete()
            .eq('email', email)
            .neq('id', otpRecord.id)

        return NextResponse.json({
            success: true,
            message: 'Email verified successfully',
            role: otpRecord.role,
        })
    } catch (error) {
        console.error('Verify OTP error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
