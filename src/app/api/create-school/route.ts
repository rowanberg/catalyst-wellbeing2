import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { generateSchoolEncryptionKey, generateSchoolCode } from '@/lib/schoolEncryption'

export async function POST(request: NextRequest) {
  try {
    const { name, address, phone, email, adminUserId } = await request.json()

    if (!name || !address || !phone || !email || !adminUserId) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 })
    }

    // Generate unique encryption key and school code
    const encryptionKey = generateSchoolEncryptionKey()
    const schoolCode = generateSchoolCode(name)

    // Create school with encryption key
    const { data: school, error: schoolError } = await supabaseAdmin
      .from('schools')
      .insert({
        name,
        address,
        phone,
        email,
        admin_id: adminUserId,
        school_code: schoolCode,
        messaging_encryption_key: encryptionKey
      })
      .select()
      .single()

    if (schoolError) {
      console.error('Error creating school:', schoolError)
      return NextResponse.json({ 
        error: 'Failed to create school',
        details: schoolError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      school: {
        id: school.id,
        name: school.name,
        schoolCode: school.school_code,
        encryptionKey: school.messaging_encryption_key
      }
    })

  } catch (error) {
    console.error('Create school API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
