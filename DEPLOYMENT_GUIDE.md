
# 🚀 CoachFlow Deployment Guide

## ❌ Current Issue: 404 Error on Netlify

### Root Cause
Your Netlify deployment is showing a 404 error because the **build process is failing** due to missing environment variables.

### How the Build Process Works
1. Netlify runs: `node build.js`
2. The build script requires `SUPABASE_URL` and `SUPABASE_ANON_KEY`
3. If missing → build exits with error → no `dist/` folder created → **404 error**

---

## ✅ Solution: Configure Environment Variables

### Step 1: Add Environment Variables in Netlify

1. **Go to Netlify Dashboard**
   - Navigate to your site: https://app.netlify.com/
   - Click on your CoachFlow site

2. **Open Environment Variables**
   - Go to: **Site settings** → **Environment variables**
   - Or use direct link: `https://app.netlify.com/sites/YOUR-SITE-NAME/configuration/env`

3. **Add These Required Variables:**

   | Key | Value | Required |
   |-----|-------|----------|
   | `SUPABASE_URL` | `https://xxxxx.supabase.co` | ✅ **REQUIRED** |
   | `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | ✅ **REQUIRED** |
   | `STRIPE_PUBLISHABLE_KEY` | `pk_test_51...` or `pk_live_51...` | ⚠️ Optional |
   | `STRIPE_PRICE_BASIC` | `price_1QMabc...` | ⚠️ Optional |
   | `STRIPE_PRICE_PREMIUM` | `price_1QMdef...` | ⚠️ Optional |
   | `STRIPE_PRICE_ELITE` | `price_1QMghi...` | ⚠️ Optional |

   **Note:** The Stripe variables are optional. If not set, the site will work in demo mode without payment functionality.

4. **Click "Save"** after adding each variable

### Step 2: Trigger a New Build

After adding the environment variables:

1. Go to: **Deploys** → **Trigger deploy** → **Deploy site**
2. Watch the build log for success
3. ✅ Your site should now be live!

---

## 🔍 How to Verify the Build Succeeded

### Check Build Logs

1. Go to **Deploys** in Netlify
2. Click on the latest deploy
3. Click **View deploy details**
4. Look for these success messages:

```
🚀 Starte Build-Prozess...
✅ dist/ Ordner erstellt
📋 Environment Variables:
   ✅ SUPABASE_URL: https://xxxxx...
   ✅ SUPABASE_ANON_KEY: eyJhbGci...
✅ Build erfolgreich abgeschlossen!
```

### What Indicates Success
- ✅ Build status: **Published**
- ✅ No errors in build log
- ✅ Deploy time: Usually 30-60 seconds
- ✅ Site loads without 404 error

### What Indicates Failure
- ❌ Build status: **Failed**
- ❌ Error message: "Supabase Environment Variables fehlen!"
- ❌ Deploy time: Very short (< 10 seconds)
- ❌ Site shows 404 error

---

## 🔧 Project Configuration Overview

### Build Settings (netlify.toml)
```toml
[build]
  publish = "dist"
  command = "node build.js"
```

This means:
- Netlify runs `node build.js` to create the `dist/` folder
- The `dist/` folder contains your final website files
- Netlify serves files from the `dist/` folder

### Build Process (build.js)

The build script:
1. ✅ Validates environment variables (fails if missing)
2. ✅ Replaces placeholders in `app.js` with real credentials
3. ✅ Adds cache-busting to HTML files
4. ✅ Copies all files to `dist/` folder
5. ✅ Creates `_redirects` for SPA routing

---

## 🛡️ Security Best Practices

### ✅ Current Security (Good!)
- ✅ No API keys hardcoded in source code
- ✅ Environment variables used for all credentials
- ✅ Build-time injection of secrets
- ✅ .gitignore prevents committing secrets

### 🔐 What Gets Exposed
- **Public (OK):** Supabase URL and Anon Key (these are meant to be public)
- **Public (OK):** Stripe Publishable Key (meant to be public)
- **Never exposed:** Supabase Service Role Key (keep this secret!)
- **Never exposed:** Stripe Secret Key (keep this secret!)

### Additional Security Recommendations
1. Enable Row Level Security (RLS) in Supabase
2. Set up Supabase Auth policies
3. Use Stripe webhooks for payment verification
4. Consider Netlify Functions for sensitive operations

---

## 🐛 Troubleshooting

### Issue: Still Getting 404 After Adding Variables

**Solution:**
1. Verify variables are saved in Netlify (check Site settings → Environment variables)
2. Trigger a **new deploy** (Netlify doesn't auto-redeploy when env vars change)
3. Check build logs for errors
4. Clear your browser cache (Ctrl+Shift+R / Cmd+Shift+R)

### Issue: Build Succeeds But Site is Broken

**Solution:**
1. Check browser console for JavaScript errors (F12)
2. Verify Supabase credentials are correct
3. Check if Supabase project is active
4. Test Stripe keys if using payments

### Issue: "Module not found" Error

**Solution:**
Your build.js uses only Node.js built-in modules, so this shouldn't happen. If it does:
1. Check that Node.js version is >= 14 (specified in package.json)
2. Verify package.json exists in repository

### Issue: Stripe Payments Not Working

**Solution:**
1. Verify `STRIPE_PUBLISHABLE_KEY` is set
2. Verify `STRIPE_PRICE_*` variables are set
3. Check that Stripe keys match the environment (test vs live)
4. Use Stripe dashboard to test payment flows

---

## 📋 Deployment Checklist

Before deploying to production:

### Required
- [ ] ✅ Add `SUPABASE_URL` to Netlify environment variables
- [ ] ✅ Add `SUPABASE_ANON_KEY` to Netlify environment variables
- [ ] ✅ Trigger new build in Netlify
- [ ] ✅ Verify site loads without 404 error
- [ ] ✅ Test login/logout functionality

### Optional (for full functionality)
- [ ] ⚠️ Add Stripe publishable key
- [ ] ⚠️ Add Stripe price IDs (Basic, Premium, Elite)
- [ ] ⚠️ Test payment flow
- [ ] ⚠️ Set up Stripe webhooks
- [ ] ⚠️ Configure custom domain
- [ ] ⚠️ Enable SSL certificate
- [ ] ⚠️ Set up email notifications (Resend.com)

### Production Readiness
- [ ] 🔐 Enable Supabase Row Level Security (RLS)
- [ ] 🔐 Configure Supabase Auth policies
- [ ] 📧 Update email templates
- [ ] 🏷️ Replace placeholder text in HTML files
- [ ] 📱 Test on mobile devices
- [ ] 🌍 Test in different browsers
- [ ] 📊 Set up analytics (optional)

---

## 🎯 Quick Fix Summary

**TL;DR - To fix your 404 error:**

1. **Go to Netlify:** https://app.netlify.com/
2. **Find your site** → Site settings → Environment variables
3. **Add these two variables:**
   - `SUPABASE_URL` = Your Supabase URL
   - `SUPABASE_ANON_KEY` = Your Supabase Anon Key
4. **Save variables**
5. **Go to Deploys** → Trigger deploy → Deploy site
6. **Wait ~60 seconds** → ✅ Site should be live!

---

## 📞 Need Help?

If you're still experiencing issues:
1. Check the build logs in Netlify
2. Look for error messages in browser console (F12)
3. Verify all credentials are correct
4. Test locally first: `npm run build && npm run serve:dist`

---

## 🔄 Local Development

To test the build locally:

```bash
# Set environment variables (Linux/Mac)
export SUPABASE_URL="https://xxxxx.supabase.co"
export SUPABASE_ANON_KEY="eyJhbGci..."

# Or on Windows
set SUPABASE_URL=https://xxxxx.supabase.co
set SUPABASE_ANON_KEY=eyJhbGci...

# Run build
npm run build

# Serve the dist folder
npm run serve:dist
```

Open http://localhost:3000 to test locally.

---

**Last Updated:** November 1, 2025
**Project:** CoachFlow (FittiCoach)
**Issue Fixed:** 404 Error due to missing environment variables
