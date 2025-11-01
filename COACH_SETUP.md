# CoachFlow - Coach Onboarding System Setup Guide

This guide will walk you through setting up the complete coach onboarding system for CoachFlow.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Database Setup](#database-setup)
3. [Supabase Storage Configuration](#supabase-storage-configuration)
4. [Environment Variables](#environment-variables)
5. [Build Process](#build-process)
6. [Subdomain Configuration](#subdomain-configuration)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

The coach onboarding system consists of:

- **Coach Registration & Onboarding**: Multi-step wizard for new coaches
- **Coach Dashboard**: Main dashboard with stats, quick actions, and activity feed
- **Package Management**: Create, edit, and publish coaching packages
- **Content Management**: Upload and organize videos, documents, and other content
- **Member Management**: View and manage subscribed members
- **Analytics**: Revenue tracking and statistics
- **Dynamic Landing Pages**: Each coach gets their own subdomain with a custom landing page
- **Subdomain Routing**: Automatic routing based on subdomain detection

---

## 🗄️ Database Setup

### Step 1: Run the Database Setup SQL

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the `database-setup.sql` file from the repository
4. Copy all contents and paste into the SQL editor
5. Click **Run** to execute the script

This will create:
- All necessary tables (`coaches`, `packages`, `package_content`, `subscriptions`, etc.)
- Indexes for optimal performance
- Row Level Security (RLS) policies
- Utility functions (`is_subdomain_available`, `get_coach_stats`)
- Triggers for automatic timestamp updates

### Step 2: Verify Tables

After running the script, verify that all tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see:
- coaches
- packages
- package_content
- subscriptions
- member_progress
- revenue_analytics
- content_views
- subdomain_reservations

---

## 📦 Supabase Storage Configuration

### Create Storage Buckets

1. In Supabase Dashboard, go to **Storage**
2. Create the following buckets:

#### Bucket 1: `coach-profiles`
- **Purpose**: Coach profile images and brand logos
- **Public**: Yes
- **File size limit**: 5MB
- **Allowed MIME types**: image/jpeg, image/png, image/webp

**RLS Policy**:
```sql
-- Allow coaches to upload to their own folder
CREATE POLICY "Coaches can upload profile images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'coach-profiles' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public to read
CREATE POLICY "Public can view profile images"
ON storage.objects FOR SELECT
USING (bucket_id = 'coach-profiles');

-- Allow coaches to update their own files
CREATE POLICY "Coaches can update own profile images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'coach-profiles' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Bucket 2: `package-images`
- **Purpose**: Featured images for packages
- **Public**: Yes
- **File size limit**: 5MB
- **Allowed MIME types**: image/jpeg, image/png, image/webp

#### Bucket 3: `content-uploads`
- **Purpose**: Course content (videos, PDFs, documents)
- **Public**: No (protected by RLS)
- **File size limit**: 500MB
- **Allowed MIME types**: video/*, application/pdf, image/*, text/*

**RLS Policy**:
```sql
-- Coaches can upload to their own folder
CREATE POLICY "Coaches can upload content"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'content-uploads' AND
  EXISTS (
    SELECT 1 FROM coaches
    WHERE coaches.user_id = auth.uid()
    AND (storage.foldername(name))[1] = coaches.id::text
  )
);

-- Members can download content they have access to
CREATE POLICY "Members can download subscribed content"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'content-uploads' AND
  EXISTS (
    -- Check if user has active subscription to content's package
    -- (This would need more complex logic based on your content organization)
  )
);
```

---

## ⚙️ Environment Variables

### Required Environment Variables

Set these in your Netlify dashboard (**Site settings → Environment variables**):

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_live_or_test_key
STRIPE_SECRET_KEY=sk_live_or_test_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Optional: Existing price IDs (if using fixed prices)
STRIPE_PRICE_BASIC=price_xxx
STRIPE_PRICE_PREMIUM=price_xxx
STRIPE_PRICE_ELITE=price_xxx

# Cloudflare Stream (for video hosting)
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_STREAM_API_TOKEN=your-api-token

# Resend (for emails)
RESEND_API_KEY=re_your_api_key
```

### Getting the Values

**Supabase**:
1. Go to Supabase Dashboard → Settings → API
2. Copy `Project URL` → `SUPABASE_URL`
3. Copy `anon public` key → `SUPABASE_ANON_KEY`

**Stripe**:
1. Go to Stripe Dashboard → Developers → API keys
2. Copy your Publishable key (starts with `pk_`)
3. Copy your Secret key (starts with `sk_`)
4. Set up webhooks and get webhook secret

**Cloudflare Stream** (optional for video):
1. Go to Cloudflare Dashboard → Stream
2. Get Account ID from the URL
3. Create API token with Stream permissions

**Resend** (optional for emails):
1. Go to Resend Dashboard → API Keys
2. Create a new API key

---

## 🔨 Build Process

### Local Development

```bash
# Install dependencies
npm install

# Run local development server
npm run dev

# Build for production
npm run build
```

### How the Build Script Works

The `scripts/build.js` file:

1. **Validates** all required environment variables
2. **Processes** all JavaScript files listed in `FILES_TO_PROCESS`
3. **Replaces** placeholder values with actual environment variables:
   - `__SUPABASE_URL__` → Your Supabase URL
   - `__SUPABASE_ANON_KEY__` → Your Supabase anon key
   - `__STRIPE_PUBLISHABLE_KEY__` → Your Stripe key
4. **Copies** all HTML, CSS, and other static files to `dist/`
5. **Outputs** production-ready files to the `dist/` directory

### Files Processed by Build Script

JavaScript files with environment variable replacement:
- `coach-register.js`
- `coach-onboarding.js`
- `coach-dashboard-main.js`
- `coach-packages.js`
- `coach-content.js`
- `coach-members.js`
- `coach-analytics.js`
- `coach-landing.js`
- `subdomain-router.js`
- `dashboard.js`
- `landing.js`
- `member-portal.js`

HTML files copied as-is:
- All `coach-*.html` files
- `index.html`, `login.html`, `dashboard.html`
- Legal pages (AGB, Datenschutz, Impressum)

---

## 🌐 Subdomain Configuration

### How Subdomain Routing Works

The `subdomain-router.js` script:

1. Detects the subdomain from `window.location.hostname`
2. Checks if a coach with that subdomain exists in the database
3. If found, redirects to `coach-landing.html?subdomain=<coach-subdomain>`
4. If not found, displays the main CoachFlow landing page

### Netlify Subdomain Setup

#### Option 1: Wildcard DNS (Recommended)

1. Go to your DNS provider (e.g., Cloudflare, Namecheap)
2. Add a wildcard DNS record:
   ```
   Type: CNAME
   Name: *
   Value: your-site.netlify.app
   ```

3. In Netlify, go to **Domain settings → Domain management**
4. Add custom domain: `*.coachflow.app` (or your domain)
5. Netlify will automatically handle SSL certificates

#### Option 2: Individual Subdomains

For each coach, manually add their subdomain:
1. In Netlify: **Domain settings → Add domain**
2. Add: `coachname.coachflow.app`
3. Point DNS to your Netlify site

### Testing Subdomains Locally

For local testing without actual subdomains:

1. Edit your `/etc/hosts` file (macOS/Linux) or `C:\Windows\System32\drivers\etc\hosts` (Windows)
2. Add entries:
   ```
   127.0.0.1 testcoach.localhost
   127.0.0.1 anothercoach.localhost
   ```

3. Access in browser: `http://testcoach.localhost:8888`

Alternatively, use the URL parameter method:
```
http://localhost:8888/coach-landing.html?subdomain=testcoach
```

---

## 🧪 Testing

### Test the Complete Flow

1. **Register as a Coach**:
   - Go to `/coach-register.html`
   - Create account with email and password
   - Verify email (check Supabase Auth → Users)

2. **Complete Onboarding**:
   - Fill in profile information
   - Select coaching niche
   - Choose a unique subdomain
   - Complete onboarding wizard

3. **Access Dashboard**:
   - Should be redirected to `/coach-dashboard-main.html`
   - Verify all stats load correctly
   - Check that sidebar navigation works

4. **Create a Package**:
   - Go to **Pakete** in sidebar
   - Click "Neues Paket"
   - Fill in package details
   - Save and publish

5. **View Landing Page**:
   - Click "Meine Landing Page" in sidebar
   - Verify that package appears
   - Test subscribe button

6. **Test Subdomain Routing**:
   - Visit `yoursubdomain.coachflow.app` (or use URL parameter)
   - Verify landing page loads with correct coach data
   - Verify packages display

### Database Verification Queries

```sql
-- Check if coach was created
SELECT * FROM coaches WHERE email = 'your-test-email@example.com';

-- Check if subdomain is available
SELECT is_subdomain_available('testcoach');

-- Get coach stats
SELECT get_coach_stats('coach-uuid-here');

-- View all packages for a coach
SELECT * FROM packages WHERE coach_id = 'coach-uuid-here';
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "Coach not found" Error

**Problem**: Navigating to coach landing page shows "Coach nicht gefunden"

**Solutions**:
- Verify coach exists in database: `SELECT * FROM coaches WHERE subdomain = 'yoursubdomain'`
- Check `is_active = true` and `onboarding_completed = true`
- Verify RLS policies are set correctly
- Check browser console for errors

#### 2. Subdomain Not Working

**Problem**: Subdomain doesn't redirect to coach landing page

**Solutions**:
- Verify DNS records are set up correctly (use `dig` or `nslookup`)
- Check Netlify domain settings
- Verify `subdomain-router.js` is loaded on index page
- Test with URL parameter method first: `?subdomain=yoursubdomain`

#### 3. Build Fails

**Problem**: `npm run build` fails with errors

**Solutions**:
- Check that all environment variables are set in Netlify
- Verify all new files exist in the repository
- Check `scripts/build.js` for correct file paths
- Look at build logs in Netlify dashboard

#### 4. RLS Policy Errors

**Problem**: "new row violates row-level security policy" error

**Solutions**:
- Check that user is authenticated: `SELECT auth.uid()`
- Verify RLS policies are created and enabled
- Test queries in Supabase SQL editor as authenticated user
- Temporarily disable RLS for testing (re-enable after!)

#### 5. Environment Variables Not Replaced

**Problem**: Seeing `__SUPABASE_URL__` in production

**Solutions**:
- Verify environment variables are set in Netlify (not just locally)
- Check that build command runs `node scripts/build.js`
- Verify files are in `FILES_TO_PROCESS` array in build.js
- Clear Netlify cache and redeploy

### Debug Mode

Enable debug logging by adding to your JavaScript files:

```javascript
// At the top of any JS file
const DEBUG = true;

if (DEBUG) {
  console.log('Debug info:', variableName);
}
```

### Getting Help

If you encounter issues:

1. Check browser console for JavaScript errors
2. Check Netlify deploy logs for build errors
3. Check Supabase logs for database errors
4. Review RLS policies in Supabase Dashboard
5. Test individual components in isolation

---

## 📁 Project Structure

```
coachflow/
├── index.html                      # Main landing page (with subdomain router)
├── coach-register.html             # Coach registration form
├── coach-onboarding.html           # Multi-step onboarding wizard
├── coach-dashboard-main.html       # Coach dashboard homepage
├── coach-packages.html             # Package management
├── coach-content.html              # Content upload interface
├── coach-members.html              # Member overview
├── coach-analytics.html            # Analytics dashboard
├── coach-landing.html              # Dynamic coach landing page template
│
├── coach-register.js               # Registration logic
├── coach-onboarding.js             # Onboarding wizard logic
├── coach-dashboard-main.js         # Dashboard logic
├── coach-packages.js               # Package CRUD operations
├── coach-content.js                # Content management
├── coach-members.js                # Member management
├── coach-analytics.js              # Analytics logic
├── coach-landing.js                # Dynamic landing page logic
├── subdomain-router.js             # Subdomain detection & routing
│
├── database-setup.sql              # Complete database schema
├── COACH_SETUP.md                  # This setup guide
│
├── scripts/
│   └── build.js                    # Build script with env variable replacement
│
├── netlify/
│   └── functions/                  # Netlify serverless functions (webhooks, etc.)
│
├── package.json                    # Dependencies and scripts
├── netlify.toml                    # Netlify configuration
└── README.md                       # Project overview
```

---

## 🚀 Deployment Checklist

Before going live:

- [ ] Database setup complete (all tables created)
- [ ] Storage buckets created with RLS policies
- [ ] All environment variables set in Netlify
- [ ] Build script tested and working
- [ ] Subdomain DNS configured (wildcard CNAME)
- [ ] SSL certificates active for subdomains
- [ ] Test coach registration flow end-to-end
- [ ] Test package creation and publishing
- [ ] Test subdomain routing
- [ ] Stripe webhook configured (if using payments)
- [ ] Email templates configured (if using Resend)
- [ ] Legal pages updated (AGB, Datenschutz, Impressum)
- [ ] Analytics tracking set up (optional)

---

## 🎉 Next Steps

After successful setup:

1. **Create test coach account** and verify all features
2. **Set up Stripe Connect** for coach payments (separate setup)
3. **Configure email notifications** (welcome emails, subscription confirmations)
4. **Add video streaming** integration (Cloudflare Stream or similar)
5. **Implement content protection** (secure video URLs, token-based access)
6. **Add analytics tracking** (Google Analytics, Plausible, etc.)
7. **Create marketing materials** for coach acquisition
8. **Set up monitoring** (Sentry for errors, Uptime monitoring)

---

## 📞 Support

For questions or issues:
- Email: support@coachflow.de
- GitHub Issues: https://github.com/Digitalbay-GmbH/CoachFlow/issues
- Documentation: https://docs.coachflow.app

---

**Last Updated**: November 2025
**Version**: 1.0.0
