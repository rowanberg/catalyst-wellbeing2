-- Create gratitude_entries table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.gratitude_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_gratitude_entries_user_created 
  ON public.gratitude_entries(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.gratitude_entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own gratitude entries" ON public.gratitude_entries;
DROP POLICY IF EXISTS "Users can insert own gratitude entries" ON public.gratitude_entries;

-- Create RLS policies
CREATE POLICY "Users can view own gratitude entries" 
ON public.gratitude_entries
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gratitude entries" 
ON public.gratitude_entries
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT ON public.gratitude_entries TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
