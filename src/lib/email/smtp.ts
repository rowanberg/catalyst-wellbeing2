import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

// Cache the transporter instance to avoid creating new connections
let cachedTransporter: Transporter | null = null

// Validate required environment variables
function validateSMTPConfig() {
    const required = [
        'TURBO_SMTP_USER',
        'TURBO_SMTP_PASS',
        'TURBO_SMTP_HOST',
        'TURBO_SMTP_PORT',
        'TURBO_SMTP_FROM',
    ]

    const missing = required.filter((key) => !process.env[key])

    if (missing.length > 0) {
        throw new Error(`Missing required SMTP environment variables: ${missing.join(', ')}`)
    }
}

// Create or return cached transporter
export function createSMTPTransporter() {
    // Return cached transporter if available
    if (cachedTransporter) {
        return cachedTransporter
    }

    validateSMTPConfig()

    const config = {
        host: process.env.TURBO_SMTP_HOST,
        port: parseInt(process.env.TURBO_SMTP_PORT || '465'),
        secure: parseInt(process.env.TURBO_SMTP_PORT || '465') === 465, // true for 465, false for other ports
        auth: {
            user: process.env.TURBO_SMTP_USER,
            pass: process.env.TURBO_SMTP_PASS,
        },
        pool: true, // Use connection pooling for better performance
        maxConnections: 5, // Allow up to 5 concurrent connections
        maxMessages: 100, // Reuse connection for up to 100 messages
    }

    console.log('🔌 [SMTP] Creating new transporter with connection pooling:', {
        host: config.host,
        port: config.port,
        secure: config.secure,
        user: config.auth.user,
        hasPass: !!config.auth.pass,
        pool: config.pool
    })

    cachedTransporter = nodemailer.createTransport(config)
    return cachedTransporter
}

/**
 * Send email via TurboSMTP (with connection pooling for performance)
 */
export async function sendEmail(options: {
    to: string
    subject: string
    html: string
    text?: string
    from?: string
}): Promise<void> {
    const transporter = createSMTPTransporter()

    const fromAddress = options.from || `"CatalystWells" <${process.env.TURBO_SMTP_FROM}>`

    console.log('📧 [SMTP] Sending email (using pooled connection):', {
        to: options.to,
        from: fromAddress,
        subject: options.subject
    })

    const startTime = Date.now()

    try {
        const info = await transporter.sendMail({
            from: fromAddress,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text || options.html.replace(/<[^>]*>/g, ''), // Fallback to stripped HTML
        })

        const duration = Date.now() - startTime
        console.log(`✅ [SMTP] Email sent in ${duration}ms to ${options.to}. MessageID: ${info.messageId}`)
    } catch (error: any) {
        const duration = Date.now() - startTime
        console.error(`❌ [SMTP] Failed to send email after ${duration}ms:`, {
            error: error.message,
            code: error.code,
            command: error.command,
            response: error.response
        })
        throw new Error(`Failed to send verification email: ${error.message}`)
    }
}
