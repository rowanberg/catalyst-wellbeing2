import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data, error } = await supabase.rpc('reset_expired_cooldowns')
    
    if (error) throw error

    console.log(`Reset ${data} keys from cooldown`)
    
    return new Response(
      JSON.stringify({ reset_count: data, success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error resetting cooldowns:', error)
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
