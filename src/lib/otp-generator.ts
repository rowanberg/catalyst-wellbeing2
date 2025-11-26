/**
 * Generates a cryptographically secure 6-digit OTP
 */
export function generateOTP(): string {
    const digits = '0123456789'
    let otp = ''

    // Use crypto.getRandomValues for cryptographically secure random numbers
    const randomBytes = new Uint32Array(6)
    crypto.getRandomValues(randomBytes)

    for (let i = 0; i < 6; i++) {
        otp += digits[randomBytes[i] % 10]
    }

    return otp
}

/**
 * Calculate OTP expiry time (5 minutes from now)
 */
export function getOTPExpiry(): Date {
    const expiry = new Date()
    expiry.setMinutes(expiry.getMinutes() + 5)
    return expiry
}

/**
 * Check if OTP is expired
 */
export function isOTPExpired(expiryDate: Date): boolean {
    return new Date() > new Date(expiryDate)
}
