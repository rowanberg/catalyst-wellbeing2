-- Fix RLS Policies for AI Quota System
-- Allows service role to manage quotas

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own quota" ON public.user_ai_quotas;
DROP POLICY IF EXISTS "Users can view own request logs" ON public.ai_request_logs;

-- User quotas: Users can view their own, service role can manage all
CREATE POLICY "Users can view own quota" 
ON public.user_ai_quotas 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to quotas" 
ON public.user_ai_quotas 
FOR ALL 
TO service_role 
USING (true);

-- Request logs: Users can view their own, service role can manage all
CREATE POLICY "Users can view own request logs" 
ON public.ai_request_logs 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to logs" 
ON public.ai_request_logs 
FOR ALL 
TO service_role 
USING (true);
