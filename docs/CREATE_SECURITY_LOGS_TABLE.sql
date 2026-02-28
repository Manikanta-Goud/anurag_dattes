-- ================================================================
-- 🔒 SECURITY LOGS TABLE
-- Run this in your Supabase SQL Editor:
-- Dashboard → SQL Editor → New Query → Paste → Run
-- ================================================================

CREATE TABLE IF NOT EXISTS security_logs (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- What kind of attack?
  event_type          TEXT NOT NULL,
  -- Examples: 'IDOR_ATTEMPT', 'UNAUTHENTICATED_ACCESS',
  --           'RATE_LIMIT_EXCEEDED', 'SUSPICIOUS_ACTIVITY'

  severity            TEXT DEFAULT 'high',
  -- Values: 'low', 'medium', 'high', 'critical'

  -- Which API endpoint was targeted?
  endpoint            TEXT,

  -- Who is the ATTACKER? (filled when logged in)
  attacker_clerk_id   TEXT,     -- Clerk user ID (permanent identity)
  attacker_profile_id UUID,     -- DB profile UUID
  attacker_name       TEXT,     -- Their display name
  attacker_email      TEXT,     -- Their email address

  -- Whose data were they trying to steal?
  target_user_id      UUID,

  -- Network info
  ip_address          TEXT,
  user_agent          TEXT,     -- Their browser info

  -- Human-readable description
  details             TEXT,

  -- When did it happen?
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by attacker email (most common admin query)
CREATE INDEX IF NOT EXISTS idx_security_logs_attacker_email
  ON security_logs (attacker_email);

-- Index for filtering by severity
CREATE INDEX IF NOT EXISTS idx_security_logs_severity
  ON security_logs (severity);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at
  ON security_logs (created_at DESC);

-- Index for event type filtering
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type
  ON security_logs (event_type);

-- Row Level Security: only service role (your backend) can read/write
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

-- Only allow the service role (supabaseAdmin) to access this table
-- Regular users cannot read security logs even if they try
CREATE POLICY "Service role only"
  ON security_logs
  FOR ALL
  USING (auth.role() = 'service_role');

-- ================================================================
-- USEFUL QUERIES FOR ADMIN (run in SQL Editor anytime):
-- ================================================================

-- See all recent attacks (last 24 hours):
-- SELECT * FROM security_logs
-- WHERE created_at > NOW() - INTERVAL '24 hours'
-- ORDER BY created_at DESC;

-- See TOP ATTACKERS (who tried the most times):
-- SELECT attacker_email, attacker_name, COUNT(*) as attempts
-- FROM security_logs
-- WHERE attacker_email IS NOT NULL
-- GROUP BY attacker_email, attacker_name
-- ORDER BY attempts DESC;

-- See all HIGH severity events:
-- SELECT * FROM security_logs
-- WHERE severity = 'high'
-- ORDER BY created_at DESC;

-- See what one specific user tried to do:
-- SELECT * FROM security_logs
-- WHERE attacker_email = 'suspicious@anurag.edu.in'
-- ORDER BY created_at DESC;
