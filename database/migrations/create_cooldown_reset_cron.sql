-- Create Supabase Edge Function cron job to reset expired cooldowns
-- This should be run every minute to automatically reset keys whose cooldown period has expired

-- Note: This is the SQL definition. You need to deploy this as a Supabase Edge Function
-- with cron schedule: "* * * * *" (every minute)

-- For manual testing/execution:
SELECT reset_expired_cooldowns();

-- Expected Supabase Edge Function code (save as supabase/functions/reset-cooldowns/index.ts):
/*
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
*/

-- Alternative: Use pg_cron extension (if available on your Supabase plan)
-- SELECT cron.schedule(
--   'reset-api-key-cooldowns',
--   '* * * * *', -- Every minute
--   $$SELECT reset_expired_cooldowns();$$
-- );

-- To deploy via Supabase CLI:
-- 1. Create file: supabase/functions/reset-cooldowns/index.ts (with code above)
-- 2. Deploy: supabase functions deploy reset-cooldowns
-- 3. Set cron schedule in Supabase Dashboard:
--    Functions → reset-cooldowns → Settings → Cron Schedule: "* * * * *"
