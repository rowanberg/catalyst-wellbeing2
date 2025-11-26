import nodemailer from 'nodemailer'

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

// Create reusable transporter
export function createSMTPTransporter() {
    validateSMTPConfig()

    const config = {
        host: process.env.TURBO_SMTP_HOST,
        port: parseInt(process.env.TURBO_SMTP_PORT || '465'),
        secure: parseInt(process.env.TURBO_SMTP_PORT || '465') === 465, // true for 465, false for other ports
        auth: {
            user: process.env.TURBO_SMTP_USER,
            pass: process.env.TURBO_SMTP_PASS,
        },
    }

    console.log('🔌 [SMTP] Creating transporter with:', {
        host: config.host,
        port: config.port,
        secure: config.secure,
        user: config.auth.user,
        hasPass: !!config.auth.pass
    })

    return nodemailer.createTransport(config)
}

/**
 * Send email via TurboSMTP
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

    console.log('📧 [SMTP] Attempting to send email:', {
        to: options.to,
        from: fromAddress,
        subject: options.subject
    })

    try {
        const info = await transporter.sendMail({
            from: fromAddress,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text || options.html.replace(/<[^>]*>/g, ''), // Fallback to stripped HTML
        })

        console.log(`✅ [SMTP] Email sent successfully to ${options.to}. MessageID: ${info.messageId}`)
    } catch (error: any) {
        console.error('❌ [SMTP] Failed to send email:', {
            error: error.message,
            code: error.code,
            command: error.command,
            response: error.response
        })
        throw new Error(`Failed to send verification email: ${error.message}`)
    }
}
