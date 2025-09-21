-- Fix parent_child_relationships table foreign key constraints
-- Drop the existing table if it exists with wrong constraints
DROP TABLE IF EXISTS parent_child_relationships CASCADE;

-- Recreate the table with correct foreign key references
CREATE TABLE parent_child_relationships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id UUID NOT NULL,
    child_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Add foreign key constraints that reference the correct profiles table
    CONSTRAINT fk_parent_child_parent FOREIGN KEY (parent_id) REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_parent_child_child FOREIGN KEY (child_id) REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Ensure unique parent-child pairs
    UNIQUE(parent_id, child_id)
);

-- Create indexes for faster lookups
CREATE INDEX idx_parent_child_parent_id ON parent_child_relationships(parent_id);
CREATE INDEX idx_parent_child_child_id ON parent_child_relationships(child_id);

-- Enable RLS
ALTER TABLE parent_child_relationships ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Parents can view their own children relationships" ON parent_child_relationships
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM profiles WHERE id = parent_id
        )
    );

CREATE POLICY "Parents can insert their own children relationships" ON parent_child_relationships
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM profiles WHERE id = parent_id
        )
    );

CREATE POLICY "Parents can delete their own children relationships" ON parent_child_relationships
    FOR DELETE USING (
        auth.uid() IN (
            SELECT user_id FROM profiles WHERE id = parent_id
        )
    );

-- Students can view relationships where they are the child
CREATE POLICY "Students can view relationships where they are the child" ON parent_child_relationships
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM profiles WHERE id = child_id
        )
    );

-- Admins and teachers can view relationships for students in their school
CREATE POLICY "Admins and teachers can view relationships in their school" ON parent_child_relationships
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p1, profiles p2
            WHERE p1.user_id = auth.uid()
            AND p1.role IN ('admin', 'teacher')
            AND p2.id = child_id
            AND p1.school_id = p2.school_id
        )
    );

-- Grant necessary permissions
GRANT ALL ON parent_child_relationships TO authenticated;
GRANT ALL ON parent_child_relationships TO service_role;
