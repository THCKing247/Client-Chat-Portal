-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Apps table: defines available apps/assets
CREATE TABLE IF NOT EXISTS apps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients table (optional, for multi-tenant)
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client users: links users to clients with roles
CREATE TABLE IF NOT EXISTS client_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user', -- 'admin', 'user', etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, client_id)
);

-- User apps: links users to apps they can access (scoped by client if multi-tenant)
CREATE TABLE IF NOT EXISTS user_apps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id UUID NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE, -- Optional: for multi-tenant
  role TEXT NOT NULL DEFAULT 'user', -- 'admin', 'user', 'viewer', etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, app_id, client_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_apps_user_id ON user_apps(user_id);
CREATE INDEX IF NOT EXISTS idx_user_apps_app_id ON user_apps(app_id);
CREATE INDEX IF NOT EXISTS idx_user_apps_client_id ON user_apps(client_id);
CREATE INDEX IF NOT EXISTS idx_client_users_user_id ON client_users(user_id);
CREATE INDEX IF NOT EXISTS idx_client_users_client_id ON client_users(client_id);

-- RLS Policies

-- Enable RLS
ALTER TABLE apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_apps ENABLE ROW LEVEL SECURITY;

-- Apps: everyone can read (for listing)
CREATE POLICY "Apps are viewable by everyone" ON apps
  FOR SELECT USING (true);

-- Clients: users can only see clients they belong to
CREATE POLICY "Users can view their own clients" ON clients
  FOR SELECT USING (
    id IN (
      SELECT client_id FROM client_users WHERE user_id = auth.uid()
    )
  );

-- Client users: users can view their own client_user records
CREATE POLICY "Users can view their own client_user records" ON client_users
  FOR SELECT USING (user_id = auth.uid());

-- Client users: admins can manage client_users for their client
CREATE POLICY "Admins can manage client_users for their client" ON client_users
  FOR ALL USING (
    client_id IN (
      SELECT client_id FROM client_users 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- User apps: users can only read their own app entitlements
CREATE POLICY "Users can view their own app entitlements" ON user_apps
  FOR SELECT USING (user_id = auth.uid());

-- User apps: admins can manage user_apps for their client
CREATE POLICY "Admins can manage user_apps for their client" ON user_apps
  FOR ALL USING (
    client_id IN (
      SELECT client_id FROM client_users 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR client_id IS NULL -- Allow if no client_id (single-tenant mode)
  );

-- Insert default apps
INSERT INTO apps (slug, name, domain) VALUES
  ('chat', 'Chatbot', 'chat.apextsgroup.com'),
  ('dc', 'Data Center', 'dc.apextsgroup.com')
ON CONFLICT (slug) DO NOTHING;

