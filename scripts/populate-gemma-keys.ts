/**
 * Script to populate Gemma API keys in Supabase
 * Run with: npx tsx scripts/populate-gemma-keys.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Sample API keys for each model (replace with actual keys)
const sampleKeys = {
  'gemma-3-27b': [
    'GEMMA_27B_KEY_001',
    'GEMMA_27B_KEY_002',
    'GEMMA_27B_KEY_003',
    'GEMMA_27B_KEY_004',
    'GEMMA_27B_KEY_005',
  ],
  'gemma-3-12b': [
    'GEMMA_12B_KEY_001',
    'GEMMA_12B_KEY_002',
    'GEMMA_12B_KEY_003',
    'GEMMA_12B_KEY_004',
    'GEMMA_12B_KEY_005',
  ],
  'gemma-3-4b': [
    'GEMMA_4B_KEY_001',
    'GEMMA_4B_KEY_002',
    'GEMMA_4B_KEY_003',
    'GEMMA_4B_KEY_004',
    'GEMMA_4B_KEY_005',
  ]
}

async function populateGemmaKeys() {
  console.log('🚀 Starting Gemma API key population...')
  
  let totalInserted = 0
  let totalErrors = 0

  for (const [modelName, keys] of Object.entries(sampleKeys)) {
    console.log(`\n📦 Processing ${modelName}...`)
    
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      
      try {
        // Check if key already exists
        const { data: existing } = await supabase
          .from('gemma_api_keys')
          .select('id')
          .eq('encrypted_api_key', key)
          .single()

        if (existing) {
          console.log(`   ⏭️  Key ${i + 1} already exists, skipping...`)
          continue
        }

        // Insert new key
        const { error } = await supabase
          .from('gemma_api_keys')
          .insert({
            model_name: modelName,
            encrypted_api_key: key,
            priority_order: (i + 1) * 10, // 10, 20, 30, etc.
            is_disabled: false,
            rpm_used: 0,
            tpm_used: 0,
            rpd_used: 0,
            current_minute_timestamp: new Date().toISOString(),
            last_daily_reset: new Date().toISOString()
          })

        if (error) {
          console.error(`   ❌ Error inserting key ${i + 1}:`, error.message)
          totalErrors++
        } else {
          console.log(`   ✅ Key ${i + 1} inserted successfully`)
          totalInserted++
        }
      } catch (error: any) {
        console.error(`   ❌ Unexpected error for key ${i + 1}:`, error.message)
        totalErrors++
      }
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('📊 Population Summary:')
  console.log(`   ✅ Successfully inserted: ${totalInserted} keys`)
  console.log(`   ❌ Errors encountered: ${totalErrors}`)
  
  // Show current key distribution
  console.log('\n📈 Current Key Distribution:')
  for (const modelName of Object.keys(sampleKeys)) {
    const { count } = await supabase
      .from('gemma_api_keys')
      .select('*', { count: 'exact', head: true })
      .eq('model_name', modelName)
    
    console.log(`   ${modelName}: ${count || 0} keys`)
  }
  
  console.log('\n✨ Gemma API key population complete!')
  console.log('\n⚠️  IMPORTANT: Replace the sample keys with actual Gemma API keys')
  console.log('   Update the encrypted_api_key values in the gemma_api_keys table')
}

// Run the script
populateGemmaKeys()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
