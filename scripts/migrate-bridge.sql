-- TapThat X Bridge Database Migration
-- Script to create tables for bridge functionality

-- Push Subscriptions Table
-- Stores user's push notification subscriptions (one per device/browser)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id SERIAL PRIMARY KEY,
  user_address VARCHAR(42) NOT NULL,
  subscription_endpoint TEXT NOT NULL,
  subscription_keys JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_address, subscription_endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_address);

-- Bridge Requests Table
-- Stores pending/completed bridge requests from NFC taps
CREATE TABLE IF NOT EXISTS bridge_requests (
  id SERIAL PRIMARY KEY,
  request_id VARCHAR(66) NOT NULL UNIQUE,
  user_address VARCHAR(42) NOT NULL,
  chip_address VARCHAR(42) NOT NULL,
  source_chain INTEGER NOT NULL,
  dest_chain INTEGER NOT NULL,
  token_address VARCHAR(42) NOT NULL,
  amount VARCHAR(78) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  chip_signature TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  nonce VARCHAR(66) NOT NULL,
  tx_hash VARCHAR(66),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '15 minutes',
  completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bridge_requests_user ON bridge_requests(user_address);
CREATE INDEX IF NOT EXISTS idx_bridge_requests_status ON bridge_requests(status);
CREATE INDEX IF NOT EXISTS idx_bridge_requests_request_id ON bridge_requests(request_id);

-- Function to auto-expire old requests (optional cleanup)
CREATE OR REPLACE FUNCTION expire_old_bridge_requests()
RETURNS void AS $$
BEGIN
  UPDATE bridge_requests
  SET status = 'expired'
  WHERE status = 'pending'
  AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Success message
SELECT 'Bridge migration completed successfully!' AS message;
