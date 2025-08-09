-- Organizations
CREATE TABLE orgs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  config_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id),
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'student',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content Packs
CREATE TABLE content_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id),
  pack_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transcripts
CREATE TABLE transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id),
  user_id UUID REFERENCES users(id),
  session_id TEXT NOT NULL,
  payload_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id),
  user_id UUID REFERENCES users(id),
  type TEXT NOT NULL,
  data_json JSONB,
  ts TIMESTAMPTZ DEFAULT NOW()
);

-- Provider Candidates (Tech Radar)
CREATE TABLE provider_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor TEXT NOT NULL,
  category TEXT NOT NULL,
  capabilities TEXT[] DEFAULT '{}',
  fit_score INT DEFAULT 0,
  risk_score INT DEFAULT 0,
  status TEXT DEFAULT 'new',
  data_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_packs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can read own transcripts"
  ON transcripts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Org admins can read org transcripts"
  ON transcripts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.org_id = transcripts.org_id
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Org members can read org content packs"
  ON content_packs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.org_id = content_packs.org_id
    )
  );
