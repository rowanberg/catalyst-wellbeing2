-- Gem Transactions Schema for Teacher Credits System
-- This handles the "Issue Credits" functionality where teachers can award mind gems to students

-- Create gem_transactions table
CREATE TABLE IF NOT EXISTS gem_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL CHECK (amount > 0 AND amount <= 500),
    reason TEXT NOT NULL CHECK (length(reason) <= 200),
    transaction_type VARCHAR(20) NOT NULL DEFAULT 'credit_issued' CHECK (transaction_type IN ('credit_issued', 'quest_reward', 'purchase', 'penalty')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    CONSTRAINT valid_amount CHECK (amount BETWEEN 1 AND 500),
    CONSTRAINT valid_reason CHECK (length(trim(reason)) >= 1)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_gem_transactions_student_id ON gem_transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_gem_transactions_teacher_id ON gem_transactions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_gem_transactions_created_at ON gem_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_gem_transactions_type ON gem_transactions(transaction_type);
-- Create separate index for teacher + month queries (avoid function in index)
CREATE INDEX IF NOT EXISTS idx_gem_transactions_teacher_date ON gem_transactions(teacher_id, created_at);

-- Enable Row Level Security
ALTER TABLE gem_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gem_transactions
DROP POLICY IF EXISTS "Teachers can view their own transactions" ON gem_transactions;
CREATE POLICY "Teachers can view their own transactions" ON gem_transactions
    FOR SELECT USING (
        teacher_id = auth.uid() OR 
        student_id = auth.uid()
    );

DROP POLICY IF EXISTS "Teachers can insert transactions" ON gem_transactions;
CREATE POLICY "Teachers can insert transactions" ON gem_transactions
    FOR INSERT WITH CHECK (
        teacher_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'teacher'
        )
    );

-- Students can only view their own transactions
DROP POLICY IF EXISTS "Students can view their transactions" ON gem_transactions;
CREATE POLICY "Students can view their transactions" ON gem_transactions
    FOR SELECT USING (
        student_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'student'
        )
    );

-- Admins can view all transactions
DROP POLICY IF EXISTS "Admins can manage all transactions" ON gem_transactions;
CREATE POLICY "Admins can manage all transactions" ON gem_transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Function to check monthly credit limit (2000 gems per teacher per month)
CREATE OR REPLACE FUNCTION get_monthly_credits_issued(p_teacher_id UUID, p_month TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    total_issued INTEGER;
    start_date DATE;
    end_date DATE;
BEGIN
    -- Parse month and create date range
    start_date := (p_month || '-01')::DATE;
    end_date := start_date + INTERVAL '1 month';
    
    -- Get total credits issued by teacher in the specified month
    SELECT COALESCE(SUM(amount), 0)
    INTO total_issued
    FROM gem_transactions
    WHERE teacher_id = p_teacher_id
    AND transaction_type = 'credit_issued'
    AND created_at >= start_date
    AND created_at < end_date;
    
    RETURN total_issued;
END;
$$;

-- Function to check if teacher has access to student (through shared classes)
CREATE OR REPLACE FUNCTION check_teacher_student_access(p_teacher_id UUID, p_student_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    has_access BOOLEAN := FALSE;
BEGIN
    -- Check if teacher and student share any classes
    SELECT EXISTS (
        SELECT 1 
        FROM teacher_class_assignments tca
        JOIN student_class_assignments sca ON tca.class_id = sca.class_id
        WHERE tca.teacher_id = p_teacher_id
        AND sca.student_id = p_student_id
    ) INTO has_access;
    
    RETURN has_access;
END;
$$;

-- Function to safely increment gems (atomic operation)
CREATE OR REPLACE FUNCTION increment_gems(amount INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- This function is used in UPDATE queries to safely increment gem counts
    -- The actual increment happens in the UPDATE statement: gems = gems + increment_gems(amount)
    RETURN amount;
END;
$$;

-- Trigger to update profile gems when transaction is created
CREATE OR REPLACE FUNCTION update_profile_gems()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only process credit_issued transactions
    IF NEW.transaction_type = 'credit_issued' THEN
        -- Update student's gem count
        UPDATE public.profiles
        SET gems = COALESCE(gems, 0) + NEW.amount,
            updated_at = NOW()
        WHERE user_id = NEW.student_id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_profile_gems ON gem_transactions;
CREATE TRIGGER trigger_update_profile_gems
    AFTER INSERT ON gem_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_gems();

-- Grant necessary permissions
GRANT SELECT, INSERT ON gem_transactions TO authenticated;
GRANT EXECUTE ON FUNCTION get_monthly_credits_issued(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_teacher_student_access(UUID, UUID) TO authenticated;

-- Add gem transaction history view for easy querying
CREATE OR REPLACE VIEW teacher_gem_transactions AS
SELECT 
    gt.id,
    gt.amount,
    gt.reason,
    gt.created_at,
    gt.teacher_id,
    gt.student_id,
    tp.first_name || ' ' || tp.last_name as teacher_name,
    sp.first_name || ' ' || sp.last_name as student_name,
    sp.gems as student_current_gems
FROM gem_transactions gt
JOIN profiles tp ON gt.teacher_id = tp.user_id
JOIN profiles sp ON gt.student_id = sp.user_id
WHERE gt.transaction_type = 'credit_issued'
ORDER BY gt.created_at DESC;

-- Grant access to the view
GRANT SELECT ON teacher_gem_transactions TO authenticated;

-- Insert sample data for testing (optional - remove in production)
-- This creates some sample transactions to test the system
/*
INSERT INTO gem_transactions (student_id, teacher_id, amount, reason, transaction_type) 
SELECT 
    (SELECT user_id FROM profiles WHERE role = 'student' LIMIT 1),
    (SELECT user_id FROM profiles WHERE role = 'teacher' LIMIT 1),
    50,
    'Excellent participation in class discussion',
    'credit_issued'
WHERE EXISTS (SELECT 1 FROM profiles WHERE role = 'student')
AND EXISTS (SELECT 1 FROM profiles WHERE role = 'teacher');
*/

-- Comments for documentation
COMMENT ON TABLE gem_transactions IS 'Tracks all gem transactions including teacher-issued credits, quest rewards, and purchases';
COMMENT ON COLUMN gem_transactions.amount IS 'Number of gems in transaction (1-500 for teacher credits)';
COMMENT ON COLUMN gem_transactions.reason IS 'Reason for transaction (max 200 characters)';
COMMENT ON COLUMN gem_transactions.transaction_type IS 'Type of transaction: credit_issued, quest_reward, purchase, penalty';
COMMENT ON FUNCTION get_monthly_credits_issued IS 'Returns total gems issued by teacher in specified month (YYYY-MM format)';
COMMENT ON FUNCTION check_teacher_student_access IS 'Checks if teacher has access to student through shared class assignments';

-- Monthly limits tracking (simplified to avoid function in GROUP BY)
CREATE OR REPLACE VIEW teacher_monthly_stats AS
SELECT 
    teacher_id,
    EXTRACT(YEAR FROM created_at)::INTEGER as year,
    EXTRACT(MONTH FROM created_at)::INTEGER as month,
    COUNT(*) as transactions_count,
    SUM(amount) as total_issued,
    2000 - COALESCE(SUM(amount), 0) as remaining_allowance
FROM gem_transactions
WHERE transaction_type = 'credit_issued'
GROUP BY teacher_id, EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at)
ORDER BY year DESC, month DESC;

GRANT SELECT ON teacher_monthly_stats TO authenticated;
