-- Add configuration column to nfc_readers table
ALTER TABLE nfc_readers 
ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{
  "access_control": {
    "require_pin": false,
    "allow_unknown_cards": false,
    "working_hours_only": false,
    "working_hours_start": "06:00",
    "working_hours_end": "22:00"
  },
  "notifications": {
    "alert_on_denied": true,
    "alert_on_multiple_attempts": true,
    "alert_threshold": 3
  },
  "behavior": {
    "auto_lock_duration": 5,
    "beep_on_success": true,
    "beep_on_failure": true,
    "led_color_success": "green",
    "led_color_failure": "red"
  },
  "maintenance": {
    "auto_restart": false,
    "health_check_interval": 300,
    "log_level": "info"
  }
}'::jsonb;

-- Add reader tags for categorization
ALTER TABLE nfc_readers 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add reader notes
ALTER TABLE nfc_readers 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add maximum capacity for location
ALTER TABLE nfc_readers 
ADD COLUMN IF NOT EXISTS max_capacity INTEGER;

-- Add current occupancy counter
ALTER TABLE nfc_readers 
ADD COLUMN IF NOT EXISTS current_occupancy INTEGER DEFAULT 0;

COMMENT ON COLUMN nfc_readers.config IS 'Per-reader configuration in JSON format';
COMMENT ON COLUMN nfc_readers.tags IS 'Tags for categorizing readers (e.g., high-security, public, restricted)';
COMMENT ON COLUMN nfc_readers.notes IS 'Admin notes about this reader';
COMMENT ON COLUMN nfc_readers.max_capacity IS 'Maximum allowed occupancy for this location';
COMMENT ON COLUMN nfc_readers.current_occupancy IS 'Current number of people in this location';
