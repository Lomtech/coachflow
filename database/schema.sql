-- ============================================
-- CoachFlow Multi-Tenant Database Schema
-- ============================================

-- Coach-Tabelle: Speichert alle registrierten Coaches
CREATE TABLE IF NOT EXISTS coaches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    business_name TEXT,
    slug TEXT UNIQUE NOT NULL, -- URL-Parameter wie ?coach=slug
    description TEXT,
    logo_url TEXT,
    stripe_account_id TEXT, -- Stripe Connect Account ID
    stripe_onboarding_complete BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index für schnellere Slug-Suche
CREATE INDEX IF NOT EXISTS idx_coaches_slug ON coaches(slug);
CREATE INDEX IF NOT EXISTS idx_coaches_auth_user_id ON coaches(auth_user_id);

-- Pakete-Tabelle: Von Coaches erstellte Membership-Pakete
CREATE TABLE IF NOT EXISTS packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'EUR',
    billing_interval TEXT DEFAULT 'month', -- month, year
    stripe_price_id TEXT, -- Stripe Price ID
    stripe_product_id TEXT, -- Stripe Product ID
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    features JSONB DEFAULT '[]'::jsonb, -- Array von Features
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_packages_coach_id ON packages(coach_id);
CREATE INDEX IF NOT EXISTS idx_packages_active ON packages(is_active) WHERE is_active = TRUE;

-- Content-Tabelle: Von Coaches hochgeladene Inhalte
CREATE TABLE IF NOT EXISTS content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID REFERENCES packages(id) ON DELETE CASCADE NOT NULL,
    coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, -- 'video', 'document', 'image', 'text'
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT, -- URL zu Supabase Storage oder Cloudflare Stream
    file_size BIGINT, -- in bytes
    mime_type TEXT,
    thumbnail_url TEXT,
    text_content TEXT, -- für type='text'
    metadata JSONB DEFAULT '{}'::jsonb, -- zusätzliche Metadaten
    is_published BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_package_id ON content(package_id);
CREATE INDEX IF NOT EXISTS idx_content_coach_id ON content(coach_id);
CREATE INDEX IF NOT EXISTS idx_content_type ON content(type);

-- Subscriptions-Tabelle: Erweitert für Coach-Zuordnung
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE NOT NULL,
    package_id UUID REFERENCES packages(id) ON DELETE SET NULL,
    stripe_subscription_id TEXT UNIQUE,
    stripe_customer_id TEXT,
    status TEXT NOT NULL, -- active, canceled, past_due, etc.
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_coach_id ON subscriptions(coach_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_package_id ON subscriptions(package_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- User Profiles erweitern (falls noch nicht vorhanden)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'member', -- 'member', 'coach', 'admin'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Coaches RLS
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;

-- Coaches können ihre eigenen Daten sehen und bearbeiten
CREATE POLICY "Coaches can view their own data"
    ON coaches FOR SELECT
    USING (auth.uid() = auth_user_id);

CREATE POLICY "Coaches can update their own data"
    ON coaches FOR UPDATE
    USING (auth.uid() = auth_user_id);

-- Jeder kann aktive Coaches sehen (für Landing Pages)
CREATE POLICY "Anyone can view active coaches"
    ON coaches FOR SELECT
    USING (is_active = TRUE);

-- Packages RLS
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

-- Coaches können ihre eigenen Pakete verwalten
CREATE POLICY "Coaches can manage their own packages"
    ON packages FOR ALL
    USING (coach_id IN (
        SELECT id FROM coaches WHERE auth_user_id = auth.uid()
    ));

-- Jeder kann aktive Pakete sehen
CREATE POLICY "Anyone can view active packages"
    ON packages FOR SELECT
    USING (is_active = TRUE);

-- Content RLS
ALTER TABLE content ENABLE ROW LEVEL SECURITY;

-- Coaches können ihren eigenen Content verwalten
CREATE POLICY "Coaches can manage their own content"
    ON content FOR ALL
    USING (coach_id IN (
        SELECT id FROM coaches WHERE auth_user_id = auth.uid()
    ));

-- Mitglieder können Content ihrer Subscriptions sehen
CREATE POLICY "Members can view content of their subscriptions"
    ON content FOR SELECT
    USING (
        is_published = TRUE 
        AND package_id IN (
            SELECT package_id FROM subscriptions 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- Subscriptions RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- User können ihre eigenen Subscriptions sehen
CREATE POLICY "Users can view their own subscriptions"
    ON subscriptions FOR SELECT
    USING (user_id = auth.uid());

-- Coaches können Subscriptions ihrer Pakete sehen
CREATE POLICY "Coaches can view subscriptions to their packages"
    ON subscriptions FOR SELECT
    USING (coach_id IN (
        SELECT id FROM coaches WHERE auth_user_id = auth.uid()
    ));

-- Profiles RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (id = auth.uid());

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Trigger für updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Updated_at Trigger für alle Tabellen
CREATE TRIGGER update_coaches_updated_at
    BEFORE UPDATE ON coaches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_packages_updated_at
    BEFORE UPDATE ON packages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_updated_at
    BEFORE UPDATE ON content
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Funktion: Automatisches Erstellen eines Coach-Profils nach Registrierung
CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger für automatisches Profil-Erstellen
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_profile_for_new_user();

-- ============================================
-- STORAGE BUCKETS (für Supabase Storage)
-- ============================================

-- Bucket für Coach-Logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('coach-logos', 'coach-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Bucket für Content-Dateien (Dokumente, Bilder)
INSERT INTO storage.buckets (id, name, public)
VALUES ('content-files', 'content-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies für coach-logos
CREATE POLICY "Coaches can upload their own logos"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'coach-logos' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Anyone can view coach logos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'coach-logos');

CREATE POLICY "Coaches can update their own logos"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'coach-logos'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Storage Policies für content-files
CREATE POLICY "Coaches can upload content files"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'content-files'
        AND EXISTS (
            SELECT 1 FROM coaches 
            WHERE auth_user_id = auth.uid()
            AND id::text = (storage.foldername(name))[1]
        )
    );

CREATE POLICY "Members can view content files"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'content-files'
        AND EXISTS (
            SELECT 1 FROM content c
            JOIN subscriptions s ON c.package_id = s.package_id
            WHERE s.user_id = auth.uid()
            AND s.status = 'active'
            AND c.file_url LIKE '%' || name || '%'
        )
    );

CREATE POLICY "Coaches can manage their content files"
    ON storage.objects FOR ALL
    USING (
        bucket_id = 'content-files'
        AND EXISTS (
            SELECT 1 FROM coaches
            WHERE auth_user_id = auth.uid()
            AND id::text = (storage.foldername(name))[1]
        )
    );

-- ============================================
-- VIEWS für Dashboard-Statistiken
-- ============================================

-- View: Coach Dashboard Stats
CREATE OR REPLACE VIEW coach_dashboard_stats AS
SELECT 
    c.id AS coach_id,
    c.name AS coach_name,
    COUNT(DISTINCT s.id) AS total_members,
    COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'active') AS active_members,
    COUNT(DISTINCT p.id) AS total_packages,
    COUNT(DISTINCT co.id) AS total_content,
    SUM(p.price) FILTER (WHERE s.status = 'active') AS monthly_revenue
FROM coaches c
LEFT JOIN packages p ON c.id = p.coach_id
LEFT JOIN subscriptions s ON c.id = s.coach_id
LEFT JOIN content co ON c.id = co.coach_id
GROUP BY c.id, c.name;

-- View: Package Statistics
CREATE OR REPLACE VIEW package_stats AS
SELECT 
    p.id AS package_id,
    p.coach_id,
    p.name AS package_name,
    p.price,
    COUNT(DISTINCT s.id) AS total_subscriptions,
    COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'active') AS active_subscriptions,
    COUNT(DISTINCT c.id) AS content_count
FROM packages p
LEFT JOIN subscriptions s ON p.id = s.package_id
LEFT JOIN content c ON p.id = c.package_id
GROUP BY p.id, p.coach_id, p.name, p.price;

-- Grant permissions on views
GRANT SELECT ON coach_dashboard_stats TO authenticated;
GRANT SELECT ON package_stats TO authenticated;

-- ============================================
-- SEED DATA (Optional - für Testing)
-- ============================================

-- Beispiel-Coach (kann nach dem Testing entfernt werden)
-- INSERT INTO coaches (email, name, business_name, slug, description)
-- VALUES (
--     'demo@coachflow.com',
--     'Demo Coach',
--     'Demo Fitness Studio',
--     'demo-coach',
--     'Dies ist ein Demo-Coach-Account für Testing'
-- );
