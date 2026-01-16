-- Add security columns to nfc_readers
ALTER TABLE nfc_readers 
ADD COLUMN IF NOT EXISTS device_secret TEXT;

-- Create function to generate random secret if not exists
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Update existing readers with a random secret if they don't have one
UPDATE nfc_readers 
SET device_secret = encode(gen_random_bytes(32), 'hex') 
WHERE device_secret IS NULL;

-- Make device_secret required and unique for future
ALTER TABLE nfc_readers
ALTER COLUMN device_secret SET NOT NULL,
ADD CONSTRAINT nfc_readers_device_secret_unique UNIQUE (device_secret);

-- Create table for pending command queue (for remote commands like open_door, restart)
CREATE TABLE IF NOT EXISTS nfc_command_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reader_id UUID REFERENCES nfc_readers(id) ON DELETE CASCADE,
  command TEXT NOT NULL,
  params JSONB,
  status TEXT DEFAULT 'pending', -- pending, sent, executed, failed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  executed_at TIMESTAMPTZ
);

-- Index for fast polling
CREATE INDEX IF NOT EXISTS idx_nfc_command_queue_pending 
ON nfc_command_queue(reader_id) 
WHERE status = 'pending';

COMMENT ON COLUMN nfc_readers.device_secret IS '32-byte hex encoded secret key for HMAC authentication';
