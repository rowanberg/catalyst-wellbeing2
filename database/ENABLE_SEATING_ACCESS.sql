-- Simple one-command fix for all seating permissions

-- Enable RLS on tables if not already enabled
ALTER TABLE seat_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE seating_charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Students can view seat assignments" ON seat_assignments;
DROP POLICY IF EXISTS "Students can view seating charts" ON seating_charts;
DROP POLICY IF EXISTS "Students can view classes" ON classes;

-- Create new policies
CREATE POLICY "Students can view seat assignments"
ON seat_assignments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Students can view seating charts"
ON seating_charts FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Students can view classes"
ON classes FOR SELECT
TO authenticated
USING (true);

-- Verify
SELECT 'Policies created successfully!' as result;
