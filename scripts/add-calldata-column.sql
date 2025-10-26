-- Add call_data column to bridge_requests table
-- This stores the original callData that was signed, needed for signature verification

ALTER TABLE bridge_requests
ADD COLUMN IF NOT EXISTS call_data TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bridge_requests_call_data ON bridge_requests(call_data);

SELECT 'call_data column added successfully!' AS message;
