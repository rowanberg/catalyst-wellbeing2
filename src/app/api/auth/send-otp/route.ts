import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'
import { generateOTP, getOTPExpiry } from '@/lib/otp-generator'
import { sendEmail } from '@/lib/email/smtp'
import { generateOTPEmail, generateOTPEmailText } from '@/lib/email/templates'

// Rate limiting map (in-memory, consider Redis for production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(email: string): boolean {
    const now = Date.now()
    const limit = rateLimitMap.get(email)

    if (!limit || now > limit.resetAt) {
        // Reset or create new limit
        rateLimitMap.set(email, { count: 1, resetAt: now + 60 * 60 * 1000 }) // 1 hour
        return true
    }

    if (limit.count >= 3) {
        return false // Rate limit exceeded
    }

    limit.count++
    return true
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { email, role, firstName, lastName } = body

        // Validate input
        if (!email || !role) {
            return NextResponse.json(
                { error: 'Email and role are required' },
                { status: 400 }
            )
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            )
        }

        // Validate role
        const validRoles = ['student', 'teacher', 'parent', 'admin']
        if (!validRoles.includes(role)) {
            return NextResponse.json(
                { error: 'Invalid role' },
                { status: 400 }
            )
        }

        // Check rate limit
        if (!checkRateLimit(email)) {
            return NextResponse.json(
                { error: 'Too many OTP requests. Please try again later.' },
                { status: 429 }
            )
        }

        // Generate OTP
        const otp = generateOTP()
        const expiresAt = getOTPExpiry()

        // Hash OTP
        const saltRounds = 10
        const otpHash = await bcrypt.hash(otp, saltRounds)

        // Save to database
        const supabase = await createClient()
        const { error: dbError } = await supabase
            .from('otp_verifications')
            .insert({
                email,
                otp_hash: otpHash,
                role,
                expires_at: expiresAt.toISOString(),
            })

        if (dbError) {
            console.error('Database error:', dbError)
            return NextResponse.json(
                { error: 'Failed to generate OTP' },
                { status: 500 }
            )
        }

        // Send email
        try {
            const htmlContent = generateOTPEmail({
                otp,
                expiryMinutes: 5,
                role: role as 'student' | 'teacher' | 'parent' | 'admin',
                email,
                firstName,
                lastName,
            })

            const textContent = generateOTPEmailText({
                otp,
                expiryMinutes: 5,
                role: role as 'student' | 'teacher' | 'parent' | 'admin',
                email,
                firstName,
                lastName,
            })

            await sendEmail({
                to: email,
                subject: `${firstName ? firstName + ', verify' : 'Verify'} your CatalystWells account`,
                html: htmlContent,
                text: textContent,
            })

            return NextResponse.json({
                success: true,
                message: 'OTP sent successfully to your email',
            })
        } catch (emailError) {
            console.error('Email error:', emailError)
            // Delete the OTP from database since email failed
            await supabase
                .from('otp_verifications')
                .delete()
                .eq('email', email)
                .eq('otp_hash', otpHash)

            return NextResponse.json(
                { error: 'Failed to send verification email. Please try again.' },
                { status: 500 }
            )
        }
    } catch (error) {
        console.error('Send OTP error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
