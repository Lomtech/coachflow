# ⚡ Quick Fix Guide - CoachFlow 404 Error

**Your site is showing 404 because environment variables are missing in Netlify.**

---

## 🎯 5-Minute Fix

### Step 1: Go to Netlify Dashboard
Open: https://app.netlify.com/

### Step 2: Select Your Site
Click on your **CoachFlow** site

### Step 3: Open Environment Variables
Navigate to:
```
Site settings → Environment variables
```

Or use this direct link format:
```
https://app.netlify.com/sites/YOUR-SITE-NAME/configuration/env
```

### Step 4: Add These Variables

Click **Add a variable** and add each of these:

#### Variable 1 (REQUIRED) ✅
```
Key:   SUPABASE_URL
Value: https://your-project.supabase.co
```
**Where to find it:** Supabase Dashboard → Project Settings → API → Project URL

#### Variable 2 (REQUIRED) ✅
```
Key:   SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
**Where to find it:** Supabase Dashboard → Project Settings → API → Project API keys → `anon` `public`

#### Variable 3 (OPTIONAL) ⚠️
```
Key:   STRIPE_PUBLISHABLE_KEY
Value: pk_test_51... or pk_live_51...
```
**Where to find it:** Stripe Dashboard → Developers → API keys → Publishable key

**Note:** If you don't add Stripe keys, the site will work in demo mode (no payments).

### Step 5: Save Variables
Click **Save** after adding each variable

### Step 6: Trigger Deploy
1. Go to **Deploys** tab
2. Click **Trigger deploy**
3. Select **Deploy site**
4. Wait ~60 seconds

### Step 7: ✅ Done!
Your site should now be live at: `https://your-site.netlify.app`

---

## 🔍 How to Know It Worked

### ✅ Success Indicators

1. **Build Log Shows:**
   ```
   ✅ Build erfolgreich abgeschlossen!
   ✅ Supabase URL & Key gesetzt
   Published at: https://your-site.netlify.app
   ```

2. **Site Loads:**
   - No 404 error
   - You see the FittiCoach homepage
   - Login button works

3. **Build Time:**
   - Takes ~45-90 seconds (normal)
   - Not 5 seconds (that means it failed)

### ❌ Still Failing?

1. **Check Build Log:**
   - Deploys → Latest deploy → View details
   - Look for error messages

2. **Common Issues:**
   - ❌ Environment variables not saved
   - ❌ Typo in variable names (must match exactly)
   - ❌ Wrong Supabase credentials
   - ❌ Supabase project is paused

3. **Fix:**
   - Double-check variable names (case-sensitive!)
   - Verify credentials in Supabase dashboard
   - Wake up Supabase project if paused

---

## 📋 Visual Checklist

```
[ ] 1. Opened Netlify Dashboard
[ ] 2. Selected CoachFlow site
[ ] 3. Went to Site settings → Environment variables
[ ] 4. Added SUPABASE_URL
[ ] 5. Added SUPABASE_ANON_KEY
[ ] 6. Added STRIPE_PUBLISHABLE_KEY (optional)
[ ] 7. Clicked Save for each variable
[ ] 8. Went to Deploys tab
[ ] 9. Clicked Trigger deploy → Deploy site
[ ] 10. Waited for build to complete
[ ] 11. Checked build log for success
[ ] 12. Visited site URL
[ ] 13. No more 404 error! ✅
```

---

## 🎉 That's It!

Your CoachFlow site should now be live and working.

**Need more help?** See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

**Want to understand what happened?** See [DIAGNOSIS_AND_FIX_SUMMARY.md](./DIAGNOSIS_AND_FIX_SUMMARY.md) for technical details.
