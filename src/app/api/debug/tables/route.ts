import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const tables = ['profiles', 'schools', 'examinations', 'exam_questions']
    const results: Record<string, any> = {}
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        results[table] = {
          exists: !error,
          error: error?.message,
          sampleData: data
        }
      } catch (err: any) {
        results[table] = {
          exists: false,
          error: err.message
        }
      }
    }
    
    console.log('Table check results:', results)
    
    return NextResponse.json({
      message: 'Database table check',
      results,
      recommendation: results.profiles?.exists ? 
        'Tables exist - ready for examination system' : 
        'Please run the examination_system_schema.sql file in Supabase'
    })
  } catch (error: any) {
    console.error('Table check error:', error)
    return NextResponse.json({ error: 'Table check failed', details: error.message }, { status: 500 })
  }
}
