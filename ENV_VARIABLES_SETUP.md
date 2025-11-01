# CoachFlow Environment Variables Setup Guide

## 🔐 Overview

This guide explains how to set up environment variables for the CoachFlow project on Netlify. The project uses a secure build process that injects environment variables during deployment, ensuring API keys are **never committed to the repository**.

## 🏗️ How It Works

### Build Process Flow

1. **Developer commits code** with placeholder variables (e.g., `__SUPABASE_URL__`)
2. **Netlify starts build** and loads environment variables from its secure vault
3. **Build script runs** (`scripts/build.js`) and replaces placeholders with actual values
4. **Processed files** are written to the `dist/` directory
5. **Netlify deploys** the built files with real API keys injected

### Security Benefits

✅ **No keys in repository** - Placeholders only, no real API keys  
✅ **No keys in version control** - Git history stays clean  
✅ **Team safety** - Developers can't accidentally expose keys  
✅ **Easy key rotation** - Update keys in Netlify UI without code changes  

---

## 📋 Required Environment Variables

You need to set these environment variables in the **Netlify UI** for your site:

### 1. Supabase Configuration

| Variable Name | Description | Where to Find |
|--------------|-------------|---------------|
| `SUPABASE_URL` | Your Supabase project URL | https://app.supabase.com/project/_/settings/api |
| `SUPABASE_ANON_KEY` | Public anonymous key (safe for frontend) | https://app.supabase.com/project/_/settings/api |
| `SUPABASE_SERVICE_KEY` | Service role key (backend only - **never expose in frontend!**) | https://app.supabase.com/project/_/settings/api |

### 2. Stripe Configuration

| Variable Name | Description | Where to Find |
|--------------|-------------|---------------|
| `STRIPE_SECRET_KEY` | Secret key for backend API calls | https://dashboard.stripe.com/test/apikeys |
| `STRIPE_PUBLISHABLE_KEY` | Publishable key for frontend | https://dashboard.stripe.com/test/apikeys |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | https://dashboard.stripe.com/test/webhooks |

### 3. Stripe Price IDs (Coach Plans)

| Variable Name | Description | Where to Find |
|--------------|-------------|---------------|
| `STRIPE_PRICE_BASIC` | Price ID for Basic Plan (49€/month) | https://dashboard.stripe.com/test/products |
| `STRIPE_PRICE_PREMIUM` | Price ID for Premium Plan (199€/month) | https://dashboard.stripe.com/test/products |
| `STRIPE_PRICE_ELITE` | Price ID for Elite Plan (399€/month) | https://dashboard.stripe.com/test/products |

### 4. Email Configuration

| Variable Name | Description | Where to Find |
|--------------|-------------|---------------|
| `RESEND_API_KEY` | API key for sending transactional emails | https://resend.com/api-keys |

### 5. Deployment Configuration

| Variable Name | Description | Set by |
|--------------|-------------|--------|
| `URL` | Your Netlify site URL | Automatically set by Netlify |

---

## 🚀 Setting Environment Variables in Netlify

### Step-by-Step Instructions

1. **Log in to Netlify**
   - Go to https://app.netlify.com
   - Navigate to your CoachFlow site

2. **Open Environment Variables Settings**
   - Click on **Site settings**
   - Go to **Environment variables** in the left sidebar
   - Or use this direct link format: `https://app.netlify.com/sites/YOUR-SITE-NAME/settings/env`

3. **Add Each Variable**
   - Click **Add a variable** or **Add a single variable**
   - Enter the **Key** (exact name from the table above)
   - Enter the **Value** (your actual API key)
   - Select **Scopes**: 
     - ✅ All scopes (recommended)
     - Or select specific: Builds, Functions, Runtime
   - Click **Save**

4. **Repeat for All Variables**
   - Add all required variables from the tables above
   - Double-check spelling and casing (they must match exactly)

5. **Trigger a New Build**
   - After adding all variables, trigger a new deployment
   - Go to **Deploys** tab
   - Click **Trigger deploy** → **Deploy site**

### Example Configuration

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_KEY=eyJhbGci...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_BASIC=price_...
STRIPE_PRICE_PREMIUM=price_...
STRIPE_PRICE_ELITE=price_...

# Email
RESEND_API_KEY=re_...
```

---

## 🧪 Testing the Build Process

### Local Testing (Before Deploying)

You can test the build process locally using Netlify CLI:

```bash
# Install Netlify CLI (if not already installed)
npm install -g netlify-cli

# Link to your Netlify site
netlify link

# Pull environment variables from Netlify
netlify env:list

# Run the build script
node scripts/build.js

# Check the dist/ directory
ls dist/
cat dist/dashboard.js | head -20
```

### Verify in Production

After deploying, verify the environment variables were injected correctly:

1. **Open your live site** (e.g., https://coachflow.netlify.app)
2. **Open browser DevTools** (F12)
3. **Go to Console tab**
4. **Type and check variables** (they should show real values, not placeholders):
   ```javascript
   console.log(typeof SUPABASE_URL);  // Should be "string", not undefined
   ```
5. **Check Network tab** - API calls should work without errors

---

## 🔍 Troubleshooting

### Build Fails with "Missing environment variables"

**Problem:** Build script reports missing required environment variables.

**Solution:**
1. Check variable names in Netlify UI match exactly (case-sensitive)
2. Ensure all required variables are set
3. Clear cache and retry: **Deploys** → **Trigger deploy** → **Clear cache and deploy site**

### Site Shows `__PLACEHOLDER__` Values

**Problem:** Placeholders are visible in the deployed site instead of real values.

**Solution:**
1. Verify environment variables are set in Netlify UI
2. Check the build logs to ensure `scripts/build.js` ran successfully
3. Ensure `publish` directory in `netlify.toml` is set to `dist`

### API Calls Fail with 401/403 Errors

**Problem:** API requests return authentication errors.

**Solution:**
1. Verify API keys are correct in Netlify UI
2. Check key permissions in respective dashboards (Supabase, Stripe)
3. For Supabase: Ensure ANON_KEY is used in frontend, SERVICE_KEY only in backend
4. For Stripe: Ensure you're using test keys for testing, live keys for production

### Functions Not Found (404)

**Problem:** Netlify Functions return 404 errors.

**Solution:**
1. Verify `functions` path in `netlify.toml` is `dist/netlify/functions`
2. Check build logs to ensure functions were copied to dist directory
3. Ensure environment variables are set with scope **Functions**

---

## 📝 File Structure After Build

```
coachflow/
├── scripts/
│   └── build.js              # Build script that injects env vars
├── dist/                     # Built files (created during build)
│   ├── dashboard.js          # With real API keys injected
│   ├── landing.js            # With real API keys injected
│   ├── member-portal.js      # With real API keys injected
│   ├── index.html
│   ├── styles.css
│   └── netlify/
│       └── functions/        # Backend functions (use process.env)
├── dashboard.js              # Source with placeholders
├── landing.js                # Source with placeholders
├── member-portal.js          # Source with placeholders
├── netlify.toml              # Build configuration
└── .env.example              # Template for local development
```

---

## 🔄 Updating Environment Variables

### When to Update

- 🔑 **Key rotation** - Regularly rotate API keys for security
- 🏗️ **Environment change** - Switching from test to production
- 💰 **Price changes** - Updating Stripe price IDs
- 🐛 **Debugging** - Testing with different keys

### How to Update

1. **Update in Netlify UI**
   - Go to **Site settings** → **Environment variables**
   - Find the variable to update
   - Click **Options** (⋯) → **Edit**
   - Update the value
   - Click **Save**

2. **Trigger Rebuild**
   - Go to **Deploys** tab
   - Click **Trigger deploy** → **Deploy site**
   - Wait for build to complete

3. **Verify Changes**
   - Test your site functionality
   - Check API calls in browser DevTools

---

## 📚 Additional Resources

- [Netlify Environment Variables Documentation](https://docs.netlify.com/environment-variables/overview/)
- [Supabase API Keys Documentation](https://supabase.com/docs/guides/api#api-keys)
- [Stripe API Keys Documentation](https://stripe.com/docs/keys)
- [Resend API Documentation](https://resend.com/docs/introduction)

---

## ⚠️ Security Best Practices

1. **Never commit `.env` file** - It's in `.gitignore` for a reason
2. **Use test keys for development** - Don't use production keys in testing
3. **Rotate keys regularly** - Change API keys every 90 days
4. **Limit key permissions** - Use read-only keys where possible
5. **Monitor usage** - Check API dashboards for unusual activity
6. **Service key in backend only** - Never expose `SUPABASE_SERVICE_KEY` in frontend
7. **Use environment-specific keys** - Separate test/staging/production keys

---

## 📞 Support

If you encounter issues:
1. Check the build logs in Netlify for detailed error messages
2. Verify all environment variables are set correctly
3. Test the build process locally using Netlify CLI
4. Review this documentation for troubleshooting steps

---

**Last Updated:** November 1, 2025  
**Version:** 1.0.0
