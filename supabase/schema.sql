-- CoachFlow Supabase Database Schema
-- Run this script in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- COACHES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS coaches (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  stripe_customer_id TEXT,
  stripe_account_id TEXT,
  stripe_account_onboarded BOOLEAN DEFAULT FALSE,
  plan TEXT NOT NULL CHECK (plan IN ('basic', 'premium', 'elite')),
  subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS coaches_email_idx ON coaches(email);
CREATE INDEX IF NOT EXISTS coaches_stripe_account_idx ON coaches(stripe_account_id);

-- ============================================
-- TIERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price > 0),
  description TEXT NOT NULL,
  stripe_price_id TEXT,
  stripe_product_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Each coach can only have one tier
  UNIQUE(coach_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS tiers_coach_id_idx ON tiers(coach_id);

-- ============================================
-- CONTENT TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  tier_id UUID REFERENCES tiers(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS content_coach_id_idx ON content(coach_id);
CREATE INDEX IF NOT EXISTS content_tier_id_idx ON content(tier_id);
CREATE INDEX IF NOT EXISTS content_created_at_idx ON content(created_at DESC);

-- ============================================
-- CUSTOMERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  tier_id UUID REFERENCES tiers(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT NOT NULL CHECK (subscription_status IN ('active', 'cancelled', 'past_due', 'unpaid')),
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate active subscriptions
  UNIQUE(user_id, coach_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS customers_coach_id_idx ON customers(coach_id);
CREATE INDEX IF NOT EXISTS customers_user_id_idx ON customers(user_id);
CREATE INDEX IF NOT EXISTS customers_subscription_status_idx ON customers(subscription_status);
CREATE INDEX IF NOT EXISTS customers_stripe_subscription_idx ON customers(stripe_subscription_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- ============================================
-- COACHES POLICIES
-- ============================================

-- Coaches can read their own data
CREATE POLICY "Coaches can read own data"
ON coaches FOR SELECT
USING (auth.uid() = id);

-- Coaches can update their own data
CREATE POLICY "Coaches can update own data"
ON coaches FOR UPDATE
USING (auth.uid() = id);

-- Service role can insert coaches (used by webhook)
-- Note: Service role bypasses RLS, but we add this for clarity

-- ============================================
-- TIERS POLICIES
-- ============================================

-- Anyone can read tiers (needed for member portal)
CREATE POLICY "Anyone can read tiers"
ON tiers FOR SELECT
TO authenticated, anon
USING (true);

-- Coaches can insert their own tier
CREATE POLICY "Coaches can insert own tier"
ON tiers FOR INSERT
WITH CHECK (auth.uid() = coach_id);

-- Coaches can update their own tier
CREATE POLICY "Coaches can update own tier"
ON tiers FOR UPDATE
USING (auth.uid() = coach_id);

-- Coaches can delete their own tier
CREATE POLICY "Coaches can delete own tier"
ON tiers FOR DELETE
USING (auth.uid() = coach_id);

-- ============================================
-- CONTENT POLICIES
-- ============================================

-- Anyone can read content (needed for member portal)
CREATE POLICY "Anyone can read content"
ON content FOR SELECT
TO authenticated, anon
USING (true);

-- Coaches can insert their own content
CREATE POLICY "Coaches can insert own content"
ON content FOR INSERT
WITH CHECK (auth.uid() = coach_id);

-- Coaches can update their own content
CREATE POLICY "Coaches can update own content"
ON content FOR UPDATE
USING (auth.uid() = coach_id);

-- Coaches can delete their own content
CREATE POLICY "Coaches can delete own content"
ON content FOR DELETE
USING (auth.uid() = coach_id);

-- ============================================
-- CUSTOMERS POLICIES
-- ============================================

-- Coaches can read their own customers
CREATE POLICY "Coaches can read own customers"
ON customers FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM coaches WHERE id = coach_id
  )
);

-- Customers can read their own subscriptions
CREATE POLICY "Customers can read own subscriptions"
ON customers FOR SELECT
USING (auth.uid() = user_id);

-- Service role can insert/update customers (used by webhook)
-- Note: Service role bypasses RLS

-- ============================================
-- STORAGE POLICIES
-- ============================================

-- Create storage buckets (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('videos', 'videos', true),
  ('documents', 'documents', true),
  ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Videos bucket policies
CREATE POLICY "Coaches can upload videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'videos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view videos"
ON storage.objects FOR SELECT
TO authenticated, anon
USING (bucket_id = 'videos');

CREATE POLICY "Coaches can delete own videos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'videos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Documents bucket policies
CREATE POLICY "Coaches can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view documents"
ON storage.objects FOR SELECT
TO authenticated, anon
USING (bucket_id = 'documents');

CREATE POLICY "Coaches can delete own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Images bucket policies
CREATE POLICY "Coaches can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view images"
ON storage.objects FOR SELECT
TO authenticated, anon
USING (bucket_id = 'images');

CREATE POLICY "Coaches can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_coaches_updated_at
BEFORE UPDATE ON coaches
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tiers_updated_at
BEFORE UPDATE ON tiers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_updated_at
BEFORE UPDATE ON content
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON customers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HELPER VIEWS (Optional, for analytics)
-- ============================================

-- View for coach statistics
CREATE OR REPLACE VIEW coach_stats AS
SELECT 
  c.id,
  c.name,
  c.email,
  c.plan,
  COUNT(DISTINCT cu.id) as total_customers,
  COUNT(DISTINCT CASE WHEN cu.subscription_status = 'active' THEN cu.id END) as active_customers,
  COUNT(DISTINCT co.id) as total_content
FROM coaches c
LEFT JOIN customers cu ON c.id = cu.coach_id
LEFT JOIN content co ON c.id = co.coach_id
GROUP BY c.id, c.name, c.email, c.plan;

-- Grant access to coach_stats view
GRANT SELECT ON coach_stats TO authenticated;

-- ============================================
-- SEED DATA (Optional, for testing)
-- ============================================

-- Insert a test coach (uncomment for testing)
-- INSERT INTO auth.users (id, email) VALUES ('test-coach-uuid', 'coach@test.com');
-- INSERT INTO coaches (id, email, name, plan) VALUES ('test-coach-uuid', 'coach@test.com', 'Test Coach', 'basic');
