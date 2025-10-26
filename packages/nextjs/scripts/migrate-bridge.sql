-- TapThat X Bridge Database

-- ============================================================================
-- Push Subscriptions Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id SERIAL PRIMARY KEY,
  user_address VARCHAR(42) NOT NULL,
  subscription_endpoint TEXT NOT NULL,
  subscription_keys JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_address, subscription_endpoint)
);

CREATE INDEX idx_push_user ON push_subscriptions(user_address);

-- ============================================================================
-- Bridge Requests Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS bridge_requests (
  id SERIAL PRIMARY KEY,
  request_id VARCHAR(66) NOT NULL UNIQUE,
  user_address VARCHAR(42) NOT NULL,
  chip_address VARCHAR(42) NOT NULL,
  chip_signature TEXT NOT NULL,
  source_chain INTEGER NOT NULL,
  dest_chain INTEGER NOT NULL,
  token_address VARCHAR(42) NOT NULL,
  amount VARCHAR(78) NOT NULL,
  timestamp BIGINT NOT NULL,
  nonce VARCHAR(66) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '15 minutes'
);

CREATE INDEX idx_bridge_user ON bridge_requests(user_address);
CREATE INDEX idx_bridge_request_id ON bridge_requests(request_id);

-- ============================================================================
-- Verification
-- ============================================================================
SELECT 'Database tables created successfully' AS status;
