import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { generateSchoolEncryptionKey, generateSchoolCode, encryptMessage } from '@/lib/schoolEncryption'

export async function POST(request: NextRequest) {
  try {
    console.log('Setting up demo data for school isolation testing...')

    // Create two demo schools
    const schools = [
      {
        name: 'Greenwood Elementary',
        address: '123 Oak Street, Springfield',
        phone: '555-0101',
        email: 'admin@greenwood.edu',
        encryptionKey: generateSchoolEncryptionKey(),
        schoolCode: generateSchoolCode('Greenwood Elementary')
      },
      {
        name: 'Riverside High School',
        address: '456 River Road, Springfield',
        phone: '555-0202',
        email: 'admin@riverside.edu',
        encryptionKey: generateSchoolEncryptionKey(),
        schoolCode: generateSchoolCode('Riverside High School')
      }
    ]

    const createdSchools = []
    
    for (const school of schools) {
      // Create school
      const { data: createdSchool, error: schoolError } = await supabaseAdmin
        .from('schools')
        .insert({
          name: school.name,
          address: school.address,
          phone: school.phone,
          email: school.email,
          admin_id: '00000000-0000-0000-0000-000000000000', // Placeholder admin ID
          school_code: school.schoolCode,
          messaging_encryption_key: school.encryptionKey
        })
        .select()
        .single()

      if (schoolError) {
        console.error(`Error creating ${school.name}:`, schoolError)
        continue
      }

      createdSchools.push({ ...createdSchool, encryptionKey: school.encryptionKey })

      // Create demo students for each school
      const students = [
        {
          firstName: school.name.includes('Greenwood') ? 'Emma' : 'Alex',
          lastName: school.name.includes('Greenwood') ? 'Johnson' : 'Chen',
          grade: school.name.includes('Greenwood') ? '3' : '9',
          class: school.name.includes('Greenwood') ? 'A' : 'B'
        },
        {
          firstName: school.name.includes('Greenwood') ? 'Liam' : 'Maya',
          lastName: school.name.includes('Greenwood') ? 'Williams' : 'Patel',
          grade: school.name.includes('Greenwood') ? '4' : '10',
          class: school.name.includes('Greenwood') ? 'B' : 'A'
        }
      ]

      for (const student of students) {
        // Create user account (this would normally be done through Supabase Auth)
        const userId = `demo-${school.schoolCode.toLowerCase()}-${student.firstName.toLowerCase()}`
        
        // Create profile
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            user_id: userId,
            first_name: student.firstName,
            last_name: student.lastName,
            role: 'student',
            school_id: createdSchool.id,
            grade_level: student.grade,
            class_name: student.class,
            xp: Math.floor(Math.random() * 1000),
            gems: Math.floor(Math.random() * 100),
            level: Math.floor(Math.random() * 10) + 1
          })
          .select()
          .single()

        if (profileError) {
          console.error(`Error creating profile for ${student.firstName}:`, profileError)
          continue
        }

        // Create help requests for each student
        const helpMessages = [
          'I need help with my math homework',
          'I am feeling worried about the upcoming test',
          'Can someone help me understand this science project?',
          'I am having trouble making friends in class'
        ]

        const urgencyLevels = ['low', 'medium', 'high']
        const statuses = ['pending', 'acknowledged']

        for (let i = 0; i < 2; i++) {
          const message = helpMessages[Math.floor(Math.random() * helpMessages.length)]
          const urgency = urgencyLevels[Math.floor(Math.random() * urgencyLevels.length)]
          const status = statuses[Math.floor(Math.random() * statuses.length)]
          
          // Encrypt message with school's key
          const encryptedMessage = encryptMessage(message, school.encryptionKey)

          const { error: helpError } = await supabaseAdmin
            .from('help_requests')
            .insert({
              student_id: userId,
              message: message,
              encrypted_message: encryptedMessage,
              school_encryption_key: school.encryptionKey,
              urgency: urgency,
              status: status,
              created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
            })

          if (helpError) {
            console.error(`Error creating help request:`, helpError)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Demo data created successfully',
      schools: createdSchools.map(s => ({
        id: s.id,
        name: s.name,
        schoolCode: s.school_code,
        studentsCreated: 2,
        helpRequestsCreated: 4
      }))
    })

  } catch (error) {
    console.error('Setup demo data error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to setup demo data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
