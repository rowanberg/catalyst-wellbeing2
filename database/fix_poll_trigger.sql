-- Fix the poll analytics trigger that's causing the response_id error

-- Drop the problematic trigger temporarily
DROP TRIGGER IF EXISTS trigger_poll_analytics_on_answer_change ON poll_answers;

-- Recreate the trigger function with proper field access
CREATE OR REPLACE FUNCTION trigger_update_poll_analytics()
RETURNS trigger AS $$
DECLARE
    poll_uuid UUID;
BEGIN
    -- Update analytics for the affected poll
    IF TG_OP = 'DELETE' THEN
        -- For DELETE operations, use OLD record
        SELECT poll_id INTO poll_uuid 
        FROM poll_responses 
        WHERE id = OLD.response_id;
        
        IF poll_uuid IS NOT NULL THEN
            PERFORM update_poll_analytics(poll_uuid);
        END IF;
        RETURN OLD;
    ELSE
        -- For INSERT/UPDATE operations, use NEW record
        SELECT poll_id INTO poll_uuid 
        FROM poll_responses 
        WHERE id = NEW.response_id;
        
        IF poll_uuid IS NOT NULL THEN
            PERFORM update_poll_analytics(poll_uuid);
        END IF;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER trigger_poll_analytics_on_answer_change
    AFTER INSERT OR UPDATE OR DELETE ON poll_answers
    FOR EACH ROW EXECUTE FUNCTION trigger_update_poll_analytics();
