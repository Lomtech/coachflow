// ============================================
// BUILD SCRIPT - CoachFlow with Environment Variables
// ============================================
// This script replaces placeholders in source files with actual
// environment variables during Netlify deployment
// ============================================

const fs = require("fs");
const path = require("path");

console.log("\n🚀 Starting Build Process...\n");
console.log("═══════════════════════════════════════════════════════════");

// ============================================
// 1. SETUP - Create dist directory
// ============================================
const distDir = path.join(__dirname, "dist");
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
  console.log("✅ Created dist/ directory");
} else {
  console.log("📁 Using existing dist/ directory");
}

// ============================================
// 2. ENVIRONMENT VARIABLES - Load and Validate
// ============================================
console.log("\n📋 Environment Variables Status:");
console.log("───────────────────────────────────────────────────────────");

const envVars = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
  STRIPE_PRICE_BASIC: process.env.STRIPE_PRICE_BASIC,
  STRIPE_PRICE_PREMIUM: process.env.STRIPE_PRICE_PREMIUM,
  STRIPE_PRICE_ELITE: process.env.STRIPE_PRICE_ELITE,
};

// Track missing required variables
const missingRequired = [];
const missingOptional = [];

// Check required variables
if (!envVars.SUPABASE_URL) {
  console.log("   ❌ SUPABASE_URL: NOT SET (REQUIRED)");
  missingRequired.push("SUPABASE_URL");
} else {
  console.log(`   ✅ SUPABASE_URL: ${envVars.SUPABASE_URL.substring(0, 30)}...`);
}

if (!envVars.SUPABASE_ANON_KEY) {
  console.log("   ❌ SUPABASE_ANON_KEY: NOT SET (REQUIRED)");
  missingRequired.push("SUPABASE_ANON_KEY");
} else {
  console.log(`   ✅ SUPABASE_ANON_KEY: ${envVars.SUPABASE_ANON_KEY.substring(0, 20)}...`);
}

// Check optional variables
if (!envVars.STRIPE_PUBLISHABLE_KEY) {
  console.log("   ⚠️  STRIPE_PUBLISHABLE_KEY: NOT SET (Demo mode will be used)");
  missingOptional.push("STRIPE_PUBLISHABLE_KEY");
} else {
  console.log(`   ✅ STRIPE_PUBLISHABLE_KEY: ${envVars.STRIPE_PUBLISHABLE_KEY.substring(0, 20)}...`);
}

if (!envVars.STRIPE_PRICE_BASIC) {
  console.log("   ⚠️  STRIPE_PRICE_BASIC: NOT SET (Optional)");
  missingOptional.push("STRIPE_PRICE_BASIC");
} else {
  console.log(`   ✅ STRIPE_PRICE_BASIC: ${envVars.STRIPE_PRICE_BASIC}`);
}

if (!envVars.STRIPE_PRICE_PREMIUM) {
  console.log("   ⚠️  STRIPE_PRICE_PREMIUM: NOT SET (Optional)");
  missingOptional.push("STRIPE_PRICE_PREMIUM");
} else {
  console.log(`   ✅ STRIPE_PRICE_PREMIUM: ${envVars.STRIPE_PRICE_PREMIUM}`);
}

if (!envVars.STRIPE_PRICE_ELITE) {
  console.log("   ⚠️  STRIPE_PRICE_ELITE: NOT SET (Optional)");
  missingOptional.push("STRIPE_PRICE_ELITE");
} else {
  console.log(`   ✅ STRIPE_PRICE_ELITE: ${envVars.STRIPE_PRICE_ELITE}`);
}

// ============================================
// 3. ERROR HANDLING - Check required variables
// ============================================
if (missingRequired.length > 0) {
  console.log("\n❌ BUILD FAILED - Missing Required Environment Variables");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("\n🔑 Missing Variables:");
  missingRequired.forEach(varName => {
    console.log(`   • ${varName}`);
  });
  console.log("\n📖 How to Fix:");
  console.log("   1. Go to your Netlify Dashboard");
  console.log("   2. Navigate to: Site Settings → Build & Deploy → Environment");
  console.log("   3. Click 'Add Variable' and add the following:");
  console.log("");
  console.log("   Variable Name: SUPABASE_URL");
  console.log("   Variable Value: https://your-project-id.supabase.co");
  console.log("");
  console.log("   Variable Name: SUPABASE_ANON_KEY");
  console.log("   Variable Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...");
  console.log("");
  console.log("   4. Find your Supabase credentials at:");
  console.log("      https://app.supabase.com/project/YOUR_PROJECT/settings/api");
  console.log("");
  console.log("   5. After adding variables, trigger a new deployment");
  console.log("═══════════════════════════════════════════════════════════\n");
  process.exit(1);
}

// Display warnings for optional variables
if (missingOptional.length > 0) {
  console.log("\n⚠️  Optional Variables Not Set:");
  console.log("───────────────────────────────────────────────────────────");
  missingOptional.forEach(varName => {
    console.log(`   • ${varName}`);
  });
  console.log("\n   ℹ️  The site will work in demo mode without Stripe.");
  console.log("   ℹ️  To enable real payments, add Stripe variables in Netlify.");
}

// ============================================
// 4. PROCESS APP.JS - Replace placeholders
// ============================================
console.log("\n🔧 Processing app.js...");
console.log("───────────────────────────────────────────────────────────");

let appJs = fs.readFileSync(path.join(__dirname, "app.js"), "utf8");

// Replace placeholders with actual values or keep placeholders if not set
appJs = appJs.replace(/__SUPABASE_URL__/g, envVars.SUPABASE_URL || "__SUPABASE_URL__");
appJs = appJs.replace(/__SUPABASE_ANON_KEY__/g, envVars.SUPABASE_ANON_KEY || "__SUPABASE_ANON_KEY__");
appJs = appJs.replace(/__STRIPE_PUBLISHABLE_KEY__/g, envVars.STRIPE_PUBLISHABLE_KEY || "__STRIPE_PUBLISHABLE_KEY__");
appJs = appJs.replace(/__STRIPE_PRICE_BASIC__/g, envVars.STRIPE_PRICE_BASIC || "__STRIPE_PRICE_BASIC__");
appJs = appJs.replace(/__STRIPE_PRICE_PREMIUM__/g, envVars.STRIPE_PRICE_PREMIUM || "__STRIPE_PRICE_PREMIUM__");
appJs = appJs.replace(/__STRIPE_PRICE_ELITE__/g, envVars.STRIPE_PRICE_ELITE || "__STRIPE_PRICE_ELITE__");

console.log("   ✅ Replaced SUPABASE_URL");
console.log("   ✅ Replaced SUPABASE_ANON_KEY");
console.log("   " + (envVars.STRIPE_PUBLISHABLE_KEY ? "✅" : "⚠️ ") + " Replaced STRIPE_PUBLISHABLE_KEY");
console.log("   " + (envVars.STRIPE_PRICE_BASIC ? "✅" : "⚠️ ") + " Replaced STRIPE_PRICE_BASIC");
console.log("   " + (envVars.STRIPE_PRICE_PREMIUM ? "✅" : "⚠️ ") + " Replaced STRIPE_PRICE_PREMIUM");
console.log("   " + (envVars.STRIPE_PRICE_ELITE ? "✅" : "⚠️ ") + " Replaced STRIPE_PRICE_ELITE");

// Write processed app.js to dist
fs.writeFileSync(path.join(distDir, "app.js"), appJs);
console.log("   ✅ Created dist/app.js");

// ============================================
// 5. PROCESS SUCCESS.HTML (if exists)
// ============================================
if (fs.existsSync(path.join(__dirname, "success.html"))) {
  console.log("\n🔧 Processing success.html...");
  console.log("───────────────────────────────────────────────────────────");
  
  let successHtml = fs.readFileSync(path.join(__dirname, "success.html"), "utf8");
  
  successHtml = successHtml.replace(/__SUPABASE_URL__/g, envVars.SUPABASE_URL || "__SUPABASE_URL__");
  successHtml = successHtml.replace(/__SUPABASE_ANON_KEY__/g, envVars.SUPABASE_ANON_KEY || "__SUPABASE_ANON_KEY__");
  
  fs.writeFileSync(path.join(distDir, "success.html"), successHtml);
  console.log("   ✅ Created dist/success.html");
}

// ============================================
// 6. COPY MAIN FILES WITH CACHE-BUSTING
// ============================================
console.log("\n📁 Copying main files...");
console.log("───────────────────────────────────────────────────────────");

// Create build timestamp for cache-busting
const buildVersion = Date.now();
console.log(`   🔖 Build version: ${buildVersion}`);

// Copy and modify index.html with cache-busting
if (fs.existsSync(path.join(__dirname, "index.html"))) {
  let indexHtml = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  
  // Add version to app.js
  indexHtml = indexHtml.replace(
    /<script src="app\.js"><\/script>/g,
    `<script src="app.js?v=${buildVersion}"></script>`
  );
  
  // Add version to app-dynamic-coach.js
  indexHtml = indexHtml.replace(
    /<script src="app-dynamic-coach\.js"><\/script>/g,
    `<script src="app-dynamic-coach.js?v=${buildVersion}"></script>`
  );
  
  // Add version to styles.css
  indexHtml = indexHtml.replace(
    /<link rel="stylesheet" href="styles\.css">/g,
    `<link rel="stylesheet" href="styles.css?v=${buildVersion}">`
  );
  
  fs.writeFileSync(path.join(distDir, "index.html"), indexHtml);
  console.log("   ✅ index.html (with cache-busting)");
}

// Copy other main files
const otherFiles = ["styles.css", "viewer.html"];
otherFiles.forEach((file) => {
  if (fs.existsSync(path.join(__dirname, file))) {
    fs.copyFileSync(path.join(__dirname, file), path.join(distDir, file));
    console.log(`   ✅ ${file}`);
  }
});

// ============================================
// 6.1 PROCESS AND COPY COACH FILES
// ============================================
console.log("\n📁 Processing coach platform files...");
console.log("───────────────────────────────────────────────────────────");

// Process coach-auth.js
if (fs.existsSync(path.join(__dirname, "coach-auth.js"))) {
  let coachAuthJs = fs.readFileSync(path.join(__dirname, "coach-auth.js"), "utf8");
  coachAuthJs = coachAuthJs.replace(/__SUPABASE_URL__/g, envVars.SUPABASE_URL || "__SUPABASE_URL__");
  coachAuthJs = coachAuthJs.replace(/__SUPABASE_ANON_KEY__/g, envVars.SUPABASE_ANON_KEY || "__SUPABASE_ANON_KEY__");
  fs.writeFileSync(path.join(distDir, "coach-auth.js"), coachAuthJs);
  console.log("   ✅ coach-auth.js (processed)");
}

// Process app-dynamic-coach.js
if (fs.existsSync(path.join(__dirname, "app-dynamic-coach.js"))) {
  fs.copyFileSync(path.join(__dirname, "app-dynamic-coach.js"), path.join(distDir, "app-dynamic-coach.js"));
  console.log("   ✅ app-dynamic-coach.js");
}

// Copy coach dashboard files
const coachFiles = [
  "coach-register.html",
  "coach-login.html", 
  "coach-dashboard.html",
  "coach-dashboard.js",
  "coach-dashboard.css"
];

coachFiles.forEach((file) => {
  if (fs.existsSync(path.join(__dirname, file))) {
    fs.copyFileSync(path.join(__dirname, file), path.join(distDir, file));
    console.log(`   ✅ ${file}`);
  }
});

// ============================================
// 7. COPY LEGAL/DSGVO PAGES
// ============================================
console.log("\n📄 Copying legal pages...");
console.log("───────────────────────────────────────────────────────────");

const legalFiles = [
  "impressum.html",
  "datenschutz.html",
  "cookies.html",
  "agb.html",
];

let copiedLegal = 0;
legalFiles.forEach((file) => {
  if (fs.existsSync(path.join(__dirname, file))) {
    fs.copyFileSync(path.join(__dirname, file), path.join(distDir, file));
    console.log(`   ✅ ${file}`);
    copiedLegal++;
  }
});

if (copiedLegal < 4) {
  console.warn(`\n   ⚠️  Warning: Only ${copiedLegal}/4 legal pages found!`);
}

// ============================================
// 8. CREATE NETLIFY CONFIGURATION FILES
// ============================================
console.log("\n⚙️  Creating Netlify configuration...");
console.log("───────────────────────────────────────────────────────────");

// Create _redirects for SPA routing
const redirectsContent = `/*  /index.html  200`;
fs.writeFileSync(path.join(distDir, "_redirects"), redirectsContent);
console.log("   ✅ _redirects");

// ============================================
// 9. BUILD SUMMARY
// ============================================
console.log("\n═══════════════════════════════════════════════════════════");
console.log("✅ BUILD COMPLETED SUCCESSFULLY!");
console.log("═══════════════════════════════════════════════════════════");

console.log("\n📦 Created Files:");
console.log("   ✅ app.js (with injected environment variables)");
console.log("   ✅ index.html (with cache-busting)");
console.log("   ✅ styles.css");
if (fs.existsSync(path.join(distDir, "viewer.html"))) {
  console.log("   ✅ viewer.html");
}
if (fs.existsSync(path.join(distDir, "success.html"))) {
  console.log("   ✅ success.html");
}
console.log(`   ✅ ${copiedLegal}/4 legal pages`);
console.log("   ✅ _redirects");

console.log("\n🔑 Configuration:");
console.log("   ✅ Supabase: Configured");
console.log("   " + (envVars.STRIPE_PUBLISHABLE_KEY ? "✅ Stripe: Enabled" : "⚠️  Stripe: Demo mode"));

console.log("\n🚀 Ready for Deployment!");
console.log("   • All files are in the dist/ directory");
console.log("   • Netlify will serve files from dist/");
console.log("   • Cache-busting is enabled for static assets");

console.log("\n💡 Security Note:");
console.log("   • SUPABASE_ANON_KEY is a public key - safe to expose");
console.log("   • STRIPE_PUBLISHABLE_KEY is a public key - safe to expose");
console.log("   • Using environment variables is still best practice");
console.log("   • Never commit .env files or expose secret keys!");

console.log("\n═══════════════════════════════════════════════════════════\n");
