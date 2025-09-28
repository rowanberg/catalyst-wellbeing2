-- Parent-Child Messaging System Database Schema

-- Create family_conversations table to group messages between parent and child
CREATE TABLE IF NOT EXISTS family_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique conversations per parent-child pair
    UNIQUE(parent_id, child_id)
);

-- Create family_messages table for actual messages
CREATE TABLE IF NOT EXISTS family_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES family_conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    message_text TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_family_conversations_parent ON family_conversations(parent_id);
CREATE INDEX IF NOT EXISTS idx_family_conversations_child ON family_conversations(child_id);
CREATE INDEX IF NOT EXISTS idx_family_messages_conversation ON family_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_family_messages_sender ON family_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_family_messages_receiver ON family_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_family_messages_created_at ON family_messages(created_at DESC);

-- Enable RLS
ALTER TABLE family_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for family_conversations
CREATE POLICY "Users can view their own family conversations" ON family_conversations
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM profiles WHERE id = parent_id
            UNION
            SELECT user_id FROM profiles WHERE id = child_id
        )
    );

CREATE POLICY "Parents can create conversations with their children" ON family_conversations
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM profiles WHERE id = parent_id
        )
        AND EXISTS (
            SELECT 1 FROM parent_child_relationships 
            WHERE parent_id = family_conversations.parent_id 
            AND child_id = family_conversations.child_id
        )
    );

CREATE POLICY "Students can create conversations with their parents" ON family_conversations
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM profiles WHERE id = child_id
        )
        AND EXISTS (
            SELECT 1 FROM parent_child_relationships 
            WHERE parent_id = family_conversations.parent_id 
            AND child_id = family_conversations.child_id
        )
    );

-- RLS Policies for family_messages
CREATE POLICY "Users can view messages in their conversations" ON family_messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT id FROM family_conversations
            WHERE auth.uid() IN (
                SELECT user_id FROM profiles WHERE id = parent_id
                UNION
                SELECT user_id FROM profiles WHERE id = child_id
            )
        )
    );

CREATE POLICY "Users can send messages in their conversations" ON family_messages
    FOR INSERT WITH CHECK (
        conversation_id IN (
            SELECT id FROM family_conversations
            WHERE auth.uid() IN (
                SELECT user_id FROM profiles WHERE id = parent_id
                UNION
                SELECT user_id FROM profiles WHERE id = child_id
            )
        )
        AND auth.uid() IN (
            SELECT user_id FROM profiles WHERE id = sender_id
        )
    );

CREATE POLICY "Users can update their own messages" ON family_messages
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT user_id FROM profiles WHERE id = sender_id
        )
    );

-- Grant permissions
GRANT ALL ON family_conversations TO authenticated;
GRANT ALL ON family_messages TO authenticated;
GRANT ALL ON family_conversations TO service_role;
GRANT ALL ON family_messages TO service_role;

-- Function to automatically create conversation when first message is sent
CREATE OR REPLACE FUNCTION create_family_conversation_if_not_exists(
    p_parent_id UUID,
    p_child_id UUID
) RETURNS UUID AS $$
DECLARE
    conversation_id UUID;
BEGIN
    -- Try to find existing conversation
    SELECT id INTO conversation_id
    FROM family_conversations
    WHERE parent_id = p_parent_id AND child_id = p_child_id;
    
    -- If not found, create new conversation
    IF conversation_id IS NULL THEN
        INSERT INTO family_conversations (parent_id, child_id)
        VALUES (p_parent_id, p_child_id)
        RETURNING id INTO conversation_id;
    END IF;
    
    RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
