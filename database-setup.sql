-- ============================================
-- CoachFlow Database Schema
-- ============================================
-- This script sets up all tables, indexes, RLS policies, and functions
-- for the CoachFlow platform.
-- 
-- Execute this in your Supabase SQL Editor to set up the database.
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. COACHES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS coaches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  subdomain TEXT NOT NULL UNIQUE,
  profile_image_url TEXT,
  bio TEXT,
  coaching_niche TEXT, -- e.g., "Fitness", "Yoga", "Life Coaching"
  specializations TEXT[], -- Array of specializations
  phone TEXT,
  website TEXT,
  instagram TEXT,
  facebook TEXT,
  linkedin TEXT,
  
  -- Stripe Connect info
  stripe_account_id TEXT UNIQUE,
  stripe_onboarding_complete BOOLEAN DEFAULT FALSE,
  
  -- Settings
  brand_color TEXT DEFAULT '#3B82F6',
  brand_logo_url TEXT,
  welcome_message TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  email_verified BOOLEAN DEFAULT FALSE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for coaches
CREATE INDEX IF NOT EXISTS idx_coaches_user_id ON coaches(user_id);
CREATE INDEX IF NOT EXISTS idx_coaches_subdomain ON coaches(subdomain);
CREATE INDEX IF NOT EXISTS idx_coaches_email ON coaches(email);
CREATE INDEX IF NOT EXISTS idx_coaches_stripe_account ON coaches(stripe_account_id);

-- ============================================
-- 2. PACKAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  
  -- Package details
  name TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  
  -- Pricing
  price_amount DECIMAL(10, 2) NOT NULL,
  price_currency TEXT DEFAULT 'EUR',
  stripe_price_id TEXT,
  billing_interval TEXT DEFAULT 'month', -- 'month', 'year', 'one_time'
  
  -- Features
  features JSONB, -- Array of feature objects: [{ text: "Feature 1", included: true }]
  
  -- Access control
  duration_days INTEGER, -- null = lifetime access
  max_members INTEGER, -- null = unlimited
  
  -- Display settings
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_published BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for packages
CREATE INDEX IF NOT EXISTS idx_packages_coach_id ON packages(coach_id);
CREATE INDEX IF NOT EXISTS idx_packages_is_active ON packages(is_active);
CREATE INDEX IF NOT EXISTS idx_packages_is_published ON packages(is_published);

-- ============================================
-- 3. PACKAGE_CONTENT TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS package_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  
  -- Content details
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL, -- 'video', 'document', 'image', 'text', 'link'
  
  -- Content location
  content_url TEXT, -- Supabase Storage URL or Cloudflare Stream URL
  cloudflare_video_id TEXT, -- For Cloudflare Stream videos
  file_size_bytes BIGINT,
  duration_seconds INTEGER, -- For videos
  
  -- Text content (for type='text')
  text_content TEXT,
  
  -- Organization
  section_name TEXT, -- Group content into sections
  display_order INTEGER DEFAULT 0,
  
  -- Access control
  is_preview BOOLEAN DEFAULT FALSE, -- Can be viewed without subscription
  is_published BOOLEAN DEFAULT TRUE,
  
  -- Engagement tracking
  view_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for package_content
CREATE INDEX IF NOT EXISTS idx_package_content_package_id ON package_content(package_id);
CREATE INDEX IF NOT EXISTS idx_package_content_type ON package_content(content_type);
CREATE INDEX IF NOT EXISTS idx_package_content_section ON package_content(section_name);

-- ============================================
-- 4. SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE RESTRICT,
  
  -- Customer details
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  customer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Stripe details
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  stripe_payment_intent_id TEXT,
  
  -- Subscription status
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'paused', 'cancelled', 'expired'
  
  -- Dates
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ, -- null = ongoing subscription
  cancelled_at TIMESTAMPTZ,
  
  -- Payment
  amount_paid DECIMAL(10, 2),
  currency TEXT DEFAULT 'EUR',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_coach_id ON subscriptions(coach_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_package_id ON subscriptions(package_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_email ON subscriptions(customer_email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_user_id ON subscriptions(customer_user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub_id ON subscriptions(stripe_subscription_id);

-- ============================================
-- 5. MEMBER_PROGRESS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS member_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES package_content(id) ON DELETE CASCADE,
  
  -- Progress tracking
  completed BOOLEAN DEFAULT FALSE,
  completion_percentage INTEGER DEFAULT 0, -- 0-100 for videos
  last_position_seconds INTEGER DEFAULT 0, -- For video resume
  
  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: one progress record per subscription per content
  UNIQUE(subscription_id, content_id)
);

-- Indexes for member_progress
CREATE INDEX IF NOT EXISTS idx_member_progress_subscription_id ON member_progress(subscription_id);
CREATE INDEX IF NOT EXISTS idx_member_progress_content_id ON member_progress(content_id);
CREATE INDEX IF NOT EXISTS idx_member_progress_completed ON member_progress(completed);

-- ============================================
-- 6. REVENUE_ANALYTICS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS revenue_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  
  -- Time period
  period_date DATE NOT NULL, -- Daily aggregation
  
  -- Metrics
  new_subscriptions INTEGER DEFAULT 0,
  cancelled_subscriptions INTEGER DEFAULT 0,
  active_subscriptions INTEGER DEFAULT 0,
  revenue_amount DECIMAL(10, 2) DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  
  -- By package (JSONB for flexibility)
  package_breakdown JSONB, -- { package_id: { subs: N, revenue: X } }
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: one record per coach per day
  UNIQUE(coach_id, period_date)
);

-- Indexes for revenue_analytics
CREATE INDEX IF NOT EXISTS idx_revenue_analytics_coach_id ON revenue_analytics(coach_id);
CREATE INDEX IF NOT EXISTS idx_revenue_analytics_period_date ON revenue_analytics(period_date);

-- ============================================
-- 7. CONTENT_VIEWS TABLE (for detailed analytics)
-- ============================================
CREATE TABLE IF NOT EXISTS content_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL REFERENCES package_content(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  
  -- View details
  view_duration_seconds INTEGER,
  completion_percentage INTEGER,
  
  -- Timestamps
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for content_views
CREATE INDEX IF NOT EXISTS idx_content_views_content_id ON content_views(content_id);
CREATE INDEX IF NOT EXISTS idx_content_views_subscription_id ON content_views(subscription_id);
CREATE INDEX IF NOT EXISTS idx_content_views_viewed_at ON content_views(viewed_at);

-- ============================================
-- 8. SUBDOMAIN_RESERVATIONS TABLE
-- ============================================
-- Track reserved/blocked subdomains
CREATE TABLE IF NOT EXISTS subdomain_reservations (
  subdomain TEXT PRIMARY KEY,
  reserved_by TEXT DEFAULT 'system',
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pre-populate with reserved subdomains
INSERT INTO subdomain_reservations (subdomain, reason) VALUES
  ('www', 'System reserved'),
  ('app', 'System reserved'),
  ('api', 'System reserved'),
  ('admin', 'System reserved'),
  ('dashboard', 'System reserved'),
  ('blog', 'System reserved'),
  ('support', 'System reserved'),
  ('help', 'System reserved'),
  ('mail', 'System reserved'),
  ('ftp', 'System reserved')
ON CONFLICT (subdomain) DO NOTHING;

-- ============================================
-- 9. TRIGGERS FOR UPDATED_AT
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_coaches_updated_at
  BEFORE UPDATE ON coaches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_packages_updated_at
  BEFORE UPDATE ON packages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_package_content_updated_at
  BEFORE UPDATE ON package_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_revenue_analytics_updated_at
  BEFORE UPDATE ON revenue_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_views ENABLE ROW LEVEL SECURITY;

-- ============================================
-- COACHES POLICIES
-- ============================================

-- Coaches can read their own data
CREATE POLICY "Coaches can view own profile"
  ON coaches FOR SELECT
  USING (auth.uid() = user_id);

-- Coaches can update their own data
CREATE POLICY "Coaches can update own profile"
  ON coaches FOR UPDATE
  USING (auth.uid() = user_id);

-- Coaches can insert their own data (registration)
CREATE POLICY "Users can create coach profile"
  ON coaches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Public can view active coaches by subdomain (for landing pages)
CREATE POLICY "Public can view coach by subdomain"
  ON coaches FOR SELECT
  USING (is_active = TRUE);

-- ============================================
-- PACKAGES POLICIES
-- ============================================

-- Coaches can manage their own packages
CREATE POLICY "Coaches can view own packages"
  ON packages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM coaches
      WHERE coaches.id = packages.coach_id
      AND coaches.user_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can insert own packages"
  ON packages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM coaches
      WHERE coaches.id = packages.coach_id
      AND coaches.user_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can update own packages"
  ON packages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM coaches
      WHERE coaches.id = packages.coach_id
      AND coaches.user_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can delete own packages"
  ON packages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM coaches
      WHERE coaches.id = packages.coach_id
      AND coaches.user_id = auth.uid()
    )
  );

-- Public can view published packages (for landing pages)
CREATE POLICY "Public can view published packages"
  ON packages FOR SELECT
  USING (is_published = TRUE AND is_active = TRUE);

-- ============================================
-- PACKAGE_CONTENT POLICIES
-- ============================================

-- Coaches can manage their own content
CREATE POLICY "Coaches can manage own content"
  ON package_content FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM packages
      JOIN coaches ON packages.coach_id = coaches.id
      WHERE packages.id = package_content.package_id
      AND coaches.user_id = auth.uid()
    )
  );

-- Members can view content they have access to
CREATE POLICY "Members can view subscribed content"
  ON package_content FOR SELECT
  USING (
    is_published = TRUE AND (
      is_preview = TRUE OR
      EXISTS (
        SELECT 1 FROM subscriptions
        WHERE subscriptions.package_id = package_content.package_id
        AND subscriptions.customer_user_id = auth.uid()
        AND subscriptions.status = 'active'
      )
    )
  );

-- ============================================
-- SUBSCRIPTIONS POLICIES
-- ============================================

-- Coaches can view their own subscriptions
CREATE POLICY "Coaches can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM coaches
      WHERE coaches.id = subscriptions.coach_id
      AND coaches.user_id = auth.uid()
    )
  );

-- Members can view their own subscriptions
CREATE POLICY "Members can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (customer_user_id = auth.uid());

-- System can insert subscriptions (via Stripe webhook)
CREATE POLICY "Service role can manage subscriptions"
  ON subscriptions FOR ALL
  USING (true);

-- ============================================
-- MEMBER_PROGRESS POLICIES
-- ============================================

-- Members can manage their own progress
CREATE POLICY "Members can manage own progress"
  ON member_progress FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM subscriptions
      WHERE subscriptions.id = member_progress.subscription_id
      AND subscriptions.customer_user_id = auth.uid()
    )
  );

-- Coaches can view progress of their members
CREATE POLICY "Coaches can view member progress"
  ON member_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM subscriptions
      JOIN coaches ON subscriptions.coach_id = coaches.id
      WHERE subscriptions.id = member_progress.subscription_id
      AND coaches.user_id = auth.uid()
    )
  );

-- ============================================
-- REVENUE_ANALYTICS POLICIES
-- ============================================

-- Coaches can view their own analytics
CREATE POLICY "Coaches can view own analytics"
  ON revenue_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM coaches
      WHERE coaches.id = revenue_analytics.coach_id
      AND coaches.user_id = auth.uid()
    )
  );

-- ============================================
-- CONTENT_VIEWS POLICIES
-- ============================================

-- Members can insert their own views
CREATE POLICY "Members can track own views"
  ON content_views FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM subscriptions
      WHERE subscriptions.id = content_views.subscription_id
      AND subscriptions.customer_user_id = auth.uid()
    )
  );

-- Coaches can view analytics
CREATE POLICY "Coaches can view content analytics"
  ON content_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM package_content
      JOIN packages ON package_content.package_id = packages.id
      JOIN coaches ON packages.coach_id = coaches.id
      WHERE package_content.id = content_views.content_id
      AND coaches.user_id = auth.uid()
    )
  );

-- ============================================
-- 11. UTILITY FUNCTIONS
-- ============================================

-- Function to check subdomain availability
CREATE OR REPLACE FUNCTION is_subdomain_available(subdomain_to_check TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if subdomain is reserved
  IF EXISTS (SELECT 1 FROM subdomain_reservations WHERE subdomain = subdomain_to_check) THEN
    RETURN FALSE;
  END IF;
  
  -- Check if subdomain is already taken by a coach
  IF EXISTS (SELECT 1 FROM coaches WHERE subdomain = subdomain_to_check) THEN
    RETURN FALSE;
  END IF;
  
  -- Subdomain is available
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get coach statistics
CREATE OR REPLACE FUNCTION get_coach_stats(coach_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_packages', (SELECT COUNT(*) FROM packages WHERE coach_id = coach_uuid),
    'published_packages', (SELECT COUNT(*) FROM packages WHERE coach_id = coach_uuid AND is_published = TRUE),
    'total_subscriptions', (SELECT COUNT(*) FROM subscriptions WHERE coach_id = coach_uuid),
    'active_subscriptions', (SELECT COUNT(*) FROM subscriptions WHERE coach_id = coach_uuid AND status = 'active'),
    'total_revenue', (SELECT COALESCE(SUM(amount_paid), 0) FROM subscriptions WHERE coach_id = coach_uuid),
    'total_content', (
      SELECT COUNT(*) FROM package_content pc
      JOIN packages p ON pc.package_id = p.id
      WHERE p.coach_id = coach_uuid
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 12. STORAGE BUCKETS SETUP
-- ============================================
-- Note: Execute this separately in Supabase Dashboard → Storage

-- Create storage buckets (do this in Supabase Dashboard):
-- 1. coach-profiles (for profile images and logos)
-- 2. package-images (for package featured images)
-- 3. content-uploads (for documents, images, etc.)
-- 4. member-uploads (for user-generated content if needed)

-- Example RLS policies for storage buckets:
-- Bucket: coach-profiles
--   - Coaches can upload to their own folder: coaches/{user_id}/*
--   - Public can read all files
-- 
-- Bucket: content-uploads
--   - Coaches can upload to their own folder: coaches/{coach_id}/*
--   - Members can read files from packages they're subscribed to

-- ============================================
-- SETUP COMPLETE
-- ============================================
-- 
-- Next steps:
-- 1. Run this script in Supabase SQL Editor
-- 2. Create storage buckets in Supabase Dashboard
-- 3. Set up Stripe webhooks
-- 4. Configure Cloudflare Stream for videos
-- 5. Update environment variables in Netlify
-- ============================================
