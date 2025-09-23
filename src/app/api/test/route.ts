import { NextResponse } from 'next/server'

export async function GET() {
  console.log('🎯 Test API route called')
  return NextResponse.json({ message: 'Test API route working', timestamp: new Date().toISOString() })
}

export async function POST() {
  console.log('🎯 Test POST API route called')
  return NextResponse.json({ message: 'Test POST API route working', timestamp: new Date().toISOString() })
}
