/**
 * Test script to verify Gemini API keys work and list available models
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

const API_KEY = 'AIzaSyC1MVvHCTFpFZTwUA3XG8IANZ-m5qfJZu0'

async function testKey() {
  console.log('🔍 Testing Gemini API Key...\n')
  
  try {
    const genAI = new GoogleGenerativeAI(API_KEY)
    
    // Try gemini-pro first (most common free tier model)
    console.log('Testing gemini-pro model...')
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
    
    const result = await model.generateContent('Say "API key is working!"')
    const response = await result.response
    const text = response.text()
    
    console.log('✅ SUCCESS!')
    console.log('Response:', text)
    console.log('\n✅ API key is valid and working!')
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    console.log('\nTroubleshooting:')
    console.log('1. Verify the API key is active in Google AI Studio')
    console.log('2. Check if the key has the correct permissions')
    console.log('3. Visit: https://aistudio.google.com/app/apikey')
  }
}

testKey()
