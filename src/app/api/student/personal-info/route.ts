import { NextRequest, NextResponse } from 'next/server'
import { authenticateStudent, isAuthError } from '@/lib/auth/api-auth'
import crypto from 'crypto'

// ============================================================================
// AES-256-GCM Encryption for Sensitive Student Data
// ============================================================================
// REQUIRED: Set STUDENT_INFO_ENCRYPTION_KEY in your .env file
// Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

const ENCRYPTION_KEY_HEX = process.env.STUDENT_INFO_ENCRYPTION_KEY

// Validate encryption key - NO FALLBACKS for security
function getEncryptionKey(): Buffer {
    if (!ENCRYPTION_KEY_HEX) {
        throw new Error('STUDENT_INFO_ENCRYPTION_KEY environment variable is not set. Cannot encrypt sensitive data.')
    }

    // Validate key is 64 hex characters (32 bytes = 256 bits)
    if (!/^[a-fA-F0-9]{64}$/.test(ENCRYPTION_KEY_HEX)) {
        throw new Error('STUDENT_INFO_ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)')
    }

    return Buffer.from(ENCRYPTION_KEY_HEX, 'hex')
}

// Encrypt sensitive text using AES-256-GCM
function encrypt(plaintext: string): string {
    if (!plaintext || plaintext.trim() === '') return ''

    const key = getEncryptionKey()
    const iv = crypto.randomBytes(12) // 96-bit IV for GCM (NIST recommended)
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)

    let encrypted = cipher.update(plaintext, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    const authTag = cipher.getAuthTag()

    // Format: iv:authTag:ciphertext (all hex)
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

// Decrypt AES-256-GCM encrypted text
function decrypt(encryptedData: string): string {
    if (!encryptedData || !encryptedData.includes(':')) return ''

    try {
        const parts = encryptedData.split(':')
        if (parts.length !== 3) return ''

        const [ivHex, authTagHex, ciphertext] = parts
        const key = getEncryptionKey()

        const decipher = crypto.createDecipheriv(
            'aes-256-gcm',
            key,
            Buffer.from(ivHex, 'hex')
        )
        decipher.setAuthTag(Buffer.from(authTagHex, 'hex'))

        let decrypted = decipher.update(ciphertext, 'hex', 'utf8')
        decrypted += decipher.final('utf8')
        return decrypted
    } catch (error) {
        console.error('Decryption error:', error)
        return ''
    }
}

// Fields that require encryption (sensitive PII)
const ENCRYPTED_FIELDS = [
    'primary_guardian_name',
    'guardian_phone',
    'guardian_email',
    'secondary_contact_name',
    'secondary_contact_phone',
    'emergency_contact_name',
    'emergency_contact_phone',
    'medical_notes'
]

// All valid database fields by step
const STEP_FIELDS: Record<number, string[]> = {
    1: ['admission_number', 'roll_number', 'class_or_grade', 'section', 'academic_year'],
    2: ['date_of_birth', 'gender', 'nationality'],
    3: ['primary_guardian_name', 'primary_guardian_relationship', 'guardian_phone', 'guardian_email', 'secondary_contact_name', 'secondary_contact_phone'],
    4: ['education_board', 'medium_of_instruction', 'subjects_enrolled', 'stream'],
    5: ['preferred_language', 'comfort_sharing_emotions', 'support_contact_preference'],
    6: ['emergency_contact_name', 'emergency_contact_phone', 'medical_notes'],
    7: ['parent_consent_app_usage', 'data_processing_consent', 'wellbeing_visibility', 'share_mood_details', 'share_survey_text_answers', 'allow_ai_wellbeing_guidance']
}

// Process data for storage - encrypt sensitive fields
function processDataForStorage(data: Record<string, any>): Record<string, any> {
    if (!data) return {}

    const result: Record<string, any> = {}

    for (const [key, value] of Object.entries(data)) {
        if (value === undefined || value === null) continue

        if (ENCRYPTED_FIELDS.includes(key)) {
            // Encrypt sensitive field
            if (typeof value === 'string' && value.trim() !== '') {
                result[`${key}_encrypted`] = encrypt(value)
            }
        } else {
            // Regular field - store as-is
            result[key] = value
        }
    }

    return result
}

// Process data from storage - decrypt sensitive fields
function processDataFromStorage(data: Record<string, any>): Record<string, any> {
    if (!data) return {}

    const result = { ...data }

    for (const field of ENCRYPTED_FIELDS) {
        const encryptedKey = `${field}_encrypted`
        if (result[encryptedKey]) {
            result[field] = decrypt(result[encryptedKey])
            delete result[encryptedKey]
        }
    }

    return result
}

// GET: Fetch student personal info
export async function GET(request: NextRequest) {
    try {
        const auth = await authenticateStudent(request)
        if (isAuthError(auth)) {
            return NextResponse.json({ error: auth.error }, { status: auth.status })
        }

        const { supabase, profile } = auth

        const { data: info, error } = await supabase
            .from('student_personal_info')
            .select('*')
            .eq('profile_id', profile.id)
            .single()

        if (error && error.code === 'PGRST116') {
            // No record exists - return initial state
            return NextResponse.json({
                info: {
                    profile_id: profile.id,
                    school_id: profile.school_id,
                    setup_step: 1,
                    setup_completed: false,
                    preferred_language: 'English',
                    comfort_sharing_emotions: 'neutral',
                    support_contact_preference: 'teacher',
                    wellbeing_visibility: 'student_only',
                    share_mood_details: false,
                    share_survey_text_answers: false,
                    allow_ai_wellbeing_guidance: true
                },
                isNew: true
            })
        }

        if (error) {
            console.error('Error fetching student info:', error)
            return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
        }

        return NextResponse.json({
            info: processDataFromStorage(info),
            isNew: false
        })

    } catch (error: any) {
        console.error('Student info GET error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}

// POST: Create or update student personal info (step-by-step save)
export async function POST(request: NextRequest) {
    try {
        const auth = await authenticateStudent(request)
        if (isAuthError(auth)) {
            return NextResponse.json({ error: auth.error }, { status: auth.status })
        }

        const { supabase, profile } = auth
        const body = await request.json()
        const { step, data, markComplete } = body

        if (!data || typeof data !== 'object') {
            return NextResponse.json({ error: 'Invalid data provided' }, { status: 400 })
        }

        // Validate step number
        if (step && (step < 1 || step > 7)) {
            return NextResponse.json({ error: 'Invalid step number' }, { status: 400 })
        }

        // Process and encrypt sensitive fields
        const processedData = processDataForStorage(data)

        // Build upsert payload with required fields
        const payload: Record<string, any> = {
            profile_id: profile.id,
            school_id: profile.school_id,
            ...processedData,
            updated_at: new Date().toISOString()
        }

        // Update step progress
        if (step) {
            payload.setup_step = step
        }

        // Mark as complete
        if (markComplete) {
            payload.setup_completed = true
            payload.setup_completed_at = new Date().toISOString()
            payload.setup_step = 8
        }

        // Record consent timestamp
        if (data.parent_consent_app_usage || data.data_processing_consent) {
            payload.consent_timestamp = new Date().toISOString()
        }

        console.log(`📝 [StudentInfo] Saving step ${step} for profile ${profile.id}:`, Object.keys(processedData))

        // Upsert the record
        const { data: result, error } = await supabase
            .from('student_personal_info')
            .upsert(payload, { onConflict: 'profile_id' })
            .select()
            .single()

        if (error) {
            console.error('Student info upsert error:', error)
            return NextResponse.json({ error: 'Failed to save data' }, { status: 500 })
        }

        console.log(`✅ [StudentInfo] Step ${step} saved successfully`)

        return NextResponse.json({
            success: true,
            message: markComplete ? 'Profile setup completed!' : `Step ${step} saved`,
            info: processDataFromStorage(result),
            currentStep: result.setup_step
        })

    } catch (error: any) {
        console.error('Student info POST error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}

// PATCH: Update specific field (auto-save)
export async function PATCH(request: NextRequest) {
    try {
        const auth = await authenticateStudent(request)
        if (isAuthError(auth)) {
            return NextResponse.json({ error: auth.error }, { status: auth.status })
        }

        const { supabase, profile } = auth
        const { field, value } = await request.json()

        if (!field || typeof field !== 'string') {
            return NextResponse.json({ error: 'Field name required' }, { status: 400 })
        }

        // Check if record exists, create if not
        const { data: existing } = await supabase
            .from('student_personal_info')
            .select('id')
            .eq('profile_id', profile.id)
            .single()

        const payload: Record<string, any> = {
            updated_at: new Date().toISOString()
        }

        // Handle encrypted vs regular fields
        if (ENCRYPTED_FIELDS.includes(field)) {
            if (value && typeof value === 'string' && value.trim() !== '') {
                payload[`${field}_encrypted`] = encrypt(value)
            } else {
                payload[`${field}_encrypted`] = null
            }
        } else {
            payload[field] = value
        }

        let result
        if (existing) {
            // Update existing record
            const { data, error } = await supabase
                .from('student_personal_info')
                .update(payload)
                .eq('profile_id', profile.id)
                .select()
                .single()

            if (error) {
                console.error('Student info PATCH error:', error)
                return NextResponse.json({ error: 'Failed to update field' }, { status: 500 })
            }
            result = data
        } else {
            // Create new record with this field
            const { data, error } = await supabase
                .from('student_personal_info')
                .insert({
                    profile_id: profile.id,
                    school_id: profile.school_id,
                    setup_step: 1,
                    ...payload
                })
                .select()
                .single()

            if (error) {
                console.error('Student info PATCH insert error:', error)
                return NextResponse.json({ error: 'Failed to save field' }, { status: 500 })
            }
            result = data
        }

        return NextResponse.json({
            success: true,
            field,
            saved: true
        })

    } catch (error: any) {
        console.error('Student info PATCH error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
