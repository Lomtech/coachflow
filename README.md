
# 🏋️ CoachFlow - SaaS Platform for Fitness Coaches

A modern, DSGVO-compliant membership platform for fitness, yoga, and freelance coaches to create automated membership websites with video content, subscription management, and integrated payments.

## 🚀 Tech Stack

- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Hosting:** Netlify
- **Payments:** Stripe Connect
- **Video:** Cloudflare Stream
- **Email:** Resend.com

## ⚡ Features

- ✅ User Authentication (Email/Password + Magic Links)
- ✅ Subscription Management (Basic, Premium, Elite tiers)
- ✅ Stripe Checkout Integration
- ✅ Video Content Platform
- ✅ DSGVO Compliance (Cookie Consent, Privacy Pages)
- ✅ Responsive Design
- ✅ Subdomain Support for Coaches
- ✅ Upgrade/Downgrade Flow

## 📁 Project Structure

```
CoachFlow/
├── index.html          # Landing page
├── viewer.html         # Video player page
├── success.html        # Payment success page
├── app.js              # Main application logic
├── styles.css          # Global styles
├── build.js            # Build script for deployment
├── package.json        # Dependencies & scripts
├── netlify.toml        # Netlify configuration
├── .gitignore          # Git ignore rules
├── impressum.html      # Legal: Imprint
├── datenschutz.html    # Legal: Privacy Policy
├── cookies.html        # Legal: Cookie Policy
├── agb.html            # Legal: Terms of Service
└── DEPLOYMENT_GUIDE.md # Deployment instructions
```

## 🔧 Setup & Installation

### Prerequisites

- Node.js >= 14.0.0
- Netlify account
- Supabase account
- Stripe account (optional for payments)

### Environment Variables

Create these in your Netlify dashboard or `.env` file for local development:

```bash
# Required
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional (for Stripe payments)
STRIPE_PUBLISHABLE_KEY=pk_test_51... or pk_live_51...
STRIPE_PRICE_BASIC=price_1QMabc...
STRIPE_PRICE_PREMIUM=price_1QMdef...
STRIPE_PRICE_ELITE=price_1QMghi...
```

### Local Development

```bash
# 1. Clone the repository
git clone https://github.com/[your-username]/CoachFlow.git
cd CoachFlow

# 2. Set environment variables
export SUPABASE_URL="https://xxxxx.supabase.co"
export SUPABASE_ANON_KEY="eyJhbGci..."

# 3. Build the project
npm run build

# 4. Serve locally
npm run dev
# or serve the built version:
npm run serve:dist

# 5. Open browser
# Visit http://localhost:3000
```

### Deployment to Netlify

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

**Quick Deploy:**
1. Push code to GitHub
2. Connect repository to Netlify
3. Add environment variables in Netlify dashboard
4. Deploy! 🚀

## 🏗️ Build Process

The build script (`build.js`) performs these steps:

1. ✅ Validates required environment variables
2. ✅ Creates `dist/` output folder
3. ✅ Injects environment variables into `app.js`
4. ✅ Adds cache-busting to HTML files
5. ✅ Copies all static assets to `dist/`
6. ✅ Creates `_redirects` for SPA routing

## 🔐 Security

### Environment Variables
- ✅ All sensitive credentials use environment variables
- ✅ No hardcoded API keys in source code
- ✅ Build-time injection of secrets
- ✅ `.gitignore` prevents committing secrets

### Public vs Secret Keys
- **Public (Safe to expose):** Supabase URL & Anon Key, Stripe Publishable Key
- **Secret (Never expose):** Supabase Service Role Key, Stripe Secret Key

### Best Practices
- Enable Supabase Row Level Security (RLS)
- Use Stripe webhooks for payment verification
- Implement rate limiting on sensitive endpoints
- Regular security audits

## 📊 Supabase Setup

### Required Tables

```sql
-- Users table (managed by Supabase Auth)
-- profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT,
  subscription_tier TEXT CHECK (subscription_tier IN ('free', 'basic', 'premium', 'elite')),
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read/update their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

## 💳 Stripe Setup

### Required Products & Prices

Create these in your Stripe Dashboard:

1. **Basic Membership** - €49/month
2. **Premium Membership** - €99/month
3. **Elite Membership** - €199/month

Get the Price IDs and add them to your environment variables.

### Webhook Configuration

Set up a webhook endpoint for:
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## 🎨 Customization

### Branding
- Update logo in navigation: `<a href="/" class="logo">🏋️ Your Brand</a>`
- Modify color scheme in `styles.css`:
  ```css
  :root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    /* ... */
  }
  ```

### Content
- Edit hero section in `index.html`
- Update membership tiers and pricing
- Customize legal pages (impressum, datenschutz, etc.)

### Features
- Add more subscription tiers
- Integrate additional payment methods
- Add analytics tracking
- Implement referral system

## 🐛 Troubleshooting

### 404 Error on Netlify
**Cause:** Missing environment variables causing build failure

**Solution:** Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` in Netlify → Site settings → Environment variables, then redeploy.

### Build Fails Locally
**Cause:** Environment variables not set

**Solution:**
```bash
export SUPABASE_URL="https://xxxxx.supabase.co"
export SUPABASE_ANON_KEY="eyJhbGci..."
npm run build
```

### Stripe Checkout Not Working
**Cause:** Missing Stripe configuration

**Solution:** Add `STRIPE_PUBLISHABLE_KEY` and price IDs to environment variables.

## 📝 NPM Scripts

```bash
npm run build       # Build project (runs build.js)
npm run dev         # Start local dev server
npm run serve:dist  # Serve built dist/ folder
npm run clean       # Remove dist/ folder
npm run rebuild     # Clean + Build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For issues or questions:
- Check [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- Review build logs in Netlify
- Check browser console for errors (F12)
- Open an issue on GitHub

## 🎯 Roadmap

- [ ] Multi-language support
- [ ] Mobile apps (iOS/Android)
- [ ] Live streaming integration
- [ ] Community features (comments, likes)
- [ ] Advanced analytics dashboard
- [ ] White-label solutions for coaches
- [ ] Integration with fitness trackers

---

**Built with ❤️ for fitness coaches worldwide**

**Version:** 2.0.0  
**Last Updated:** November 1, 2025
