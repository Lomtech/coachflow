// ============================================
// FIXED BUILD SCRIPT - Multi-Tenant SaaS
// ============================================
const fs = require("fs");
const path = require("path");

console.log("\n🚀 Starte Build-Prozess...\n");

// ============================================
// 1. SETUP
// ============================================
const distDir = path.join(__dirname, "dist");
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
  console.log("🗑️  Alter dist/ Ordner gelöscht");
}
fs.mkdirSync(distDir);
console.log("✅ Neuer dist/ Ordner erstellt");

// ============================================
// 2. ENVIRONMENT VARIABLES
// ============================================
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY;

// Coach Price IDs
const STRIPE_PRICE_COACH_BASIC = process.env.STRIPE_PRICE_COACH_BASIC;
const STRIPE_PRICE_COACH_PREMIUM = process.env.STRIPE_PRICE_COACH_PREMIUM;
const STRIPE_PRICE_COACH_ELITE = process.env.STRIPE_PRICE_COACH_ELITE;

// Customer Price IDs
const STRIPE_PRICE_CUSTOMER_BASIC = process.env.STRIPE_PRICE_CUSTOMER_BASIC;
const STRIPE_PRICE_CUSTOMER_PREMIUM = process.env.STRIPE_PRICE_CUSTOMER_PREMIUM;
const STRIPE_PRICE_CUSTOMER_ELITE = process.env.STRIPE_PRICE_CUSTOMER_ELITE;

// Validierung
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("\n❌ FEHLER: Supabase Environment Variables fehlen!");
  console.error("Benötigt: SUPABASE_URL, SUPABASE_ANON_KEY\n");
  process.exit(1);
}

console.log("📋 Environment Variables:");
console.log("   ✅ SUPABASE_URL:", SUPABASE_URL.substring(0, 30) + "...");
console.log(
  "   ✅ SUPABASE_ANON_KEY:",
  SUPABASE_ANON_KEY.substring(0, 20) + "..."
);
console.log(
  "   " + (STRIPE_PUBLISHABLE_KEY ? "✅" : "⚠️") + " STRIPE_PUBLISHABLE_KEY:",
  STRIPE_PUBLISHABLE_KEY
    ? STRIPE_PUBLISHABLE_KEY.substring(0, 20) + "..."
    : "nicht gesetzt"
);

// ============================================
// 3. APP.JS VERARBEITEN
// ============================================
console.log("\n🔧 Verarbeite app-multitenant.js...");

let appJs = fs.readFileSync(path.join(__dirname, "app-multitenant.js"), "utf8");

// Ersetze Credentials
appJs = appJs.replace(/DEIN_SUPABASE_URL/g, SUPABASE_URL);
appJs = appJs.replace(/DEIN_SUPABASE_ANON_KEY/g, SUPABASE_ANON_KEY);
appJs = appJs.replace(
  /DEIN_STRIPE_PUBLISHABLE_KEY/g,
  STRIPE_PUBLISHABLE_KEY || "DEIN_STRIPE_PUBLISHABLE_KEY"
);

// Ersetze Coach Price IDs
if (STRIPE_PRICE_COACH_BASIC) {
  appJs = appJs.replace(/price_COACH_BASIC_ID/g, STRIPE_PRICE_COACH_BASIC);
  console.log("   ✅ STRIPE_PRICE_COACH_BASIC ersetzt");
}
if (STRIPE_PRICE_COACH_PREMIUM) {
  appJs = appJs.replace(/price_COACH_PREMIUM_ID/g, STRIPE_PRICE_COACH_PREMIUM);
  console.log("   ✅ STRIPE_PRICE_COACH_PREMIUM ersetzt");
}
if (STRIPE_PRICE_COACH_ELITE) {
  appJs = appJs.replace(/price_COACH_ELITE_ID/g, STRIPE_PRICE_COACH_ELITE);
  console.log("   ✅ STRIPE_PRICE_COACH_ELITE ersetzt");
}

// Ersetze Customer Price IDs
if (STRIPE_PRICE_CUSTOMER_BASIC) {
  appJs = appJs.replace(
    /price_CUSTOMER_BASIC_ID/g,
    STRIPE_PRICE_CUSTOMER_BASIC
  );
  console.log("   ✅ STRIPE_PRICE_CUSTOMER_BASIC ersetzt");
}
if (STRIPE_PRICE_CUSTOMER_PREMIUM) {
  appJs = appJs.replace(
    /price_CUSTOMER_PREMIUM_ID/g,
    STRIPE_PRICE_CUSTOMER_PREMIUM
  );
  console.log("   ✅ STRIPE_PRICE_CUSTOMER_PREMIUM ersetzt");
}
if (STRIPE_PRICE_CUSTOMER_ELITE) {
  appJs = appJs.replace(
    /price_CUSTOMER_ELITE_ID/g,
    STRIPE_PRICE_CUSTOMER_ELITE
  );
  console.log("   ✅ STRIPE_PRICE_CUSTOMER_ELITE ersetzt");
}

// Schreibe app.js
fs.writeFileSync(path.join(distDir, "app.js"), appJs);
console.log("   ✅ app.js → dist/app.js");

// ============================================
// 4. INDEX.HTML VERARBEITEN (FIX für Netlify)
// ============================================
console.log("\n🔧 Verarbeite index.html...");

let indexHtml = fs.readFileSync(
  path.join(__dirname, "index_multitenant.html"),
  "utf8"
);

// Ersetze app-multitenant.js → app.js
indexHtml = indexHtml.replace(/app-multitenant\.js/g, "app.js");

// Füge Cache-Busting hinzu
const buildVersion = Date.now();
indexHtml = indexHtml.replace(
  /<script src="app\.js"><\/script>/g,
  `<script src="app.js?v=${buildVersion}"></script>`
);

// Fix: Deprecated Meta Tag
indexHtml = indexHtml.replace(
  '<meta name="apple-mobile-web-app-capable" content="yes" />',
  '<meta name="mobile-web-app-capable" content="yes" />\n    <meta name="apple-mobile-web-app-capable" content="yes" />'
);

// Füge Payment Policy hinzu (Fix für Payment Error)
indexHtml = indexHtml.replace(
  '<meta name="mobile-web-app-capable" content="yes" />',
  '<meta name="mobile-web-app-capable" content="yes" />\n    <permissions-policy content="payment=*">'
);

fs.writeFileSync(path.join(distDir, "index.html"), indexHtml);
console.log("   ✅ index.html (mit Fixes)");

// ============================================
// 5. CSS DATEIEN KOMBINIEREN
// ============================================
console.log("\n🎨 Kombiniere CSS Dateien...");

let mainCss = fs.readFileSync(path.join(__dirname, "styles.css"), "utf8");
let addonCss = "";

if (fs.existsSync(path.join(__dirname, "styles-multitenant-addon.css"))) {
  addonCss = fs.readFileSync(
    path.join(__dirname, "styles-multitenant-addon.css"),
    "utf8"
  );
}

// Kombiniere CSS
const combinedCss =
  mainCss + "\n\n/* === MULTI-TENANT ADDON STYLES === */\n\n" + addonCss;
fs.writeFileSync(path.join(distDir, "styles.css"), combinedCss);
console.log("   ✅ styles.css (kombiniert)");

// ============================================
// 6. WEITERE DATEIEN KOPIEREN
// ============================================
console.log("\n📁 Kopiere weitere Dateien...");

const filesToCopy = [
  "viewer.html",
  "impressum.html",
  "datenschutz.html",
  "cookies.html",
  "agb.html",
];

let copiedFiles = 0;
filesToCopy.forEach((file) => {
  if (fs.existsSync(path.join(__dirname, file))) {
    fs.copyFileSync(path.join(__dirname, file), path.join(distDir, file));
    console.log(`   ✅ ${file}`);
    copiedFiles++;
  } else {
    console.log(`   ⚠️ ${file} nicht gefunden (übersprungen)`);
  }
});

// ============================================
// 7. _REDIRECTS für Netlify
// ============================================
console.log("\n⚙️ Erstelle Netlify-Konfiguration...");

const redirectsContent = `# Netlify Redirects
/*  /index.html  200

# API Routes (falls vorhanden)
/api/*  /.netlify/functions/:splat  200

# Security Headers
/*
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: payment=*
`;

fs.writeFileSync(path.join(distDir, "_redirects"), redirectsContent);
console.log("   ✅ _redirects");

// ============================================
// 8. _HEADERS für Netlify (WICHTIG!)
// ============================================
const headersContent = `# Netlify Headers

# JavaScript Files
/*.js
  Content-Type: application/javascript; charset=utf-8
  Cache-Control: public, max-age=31536000, immutable

# CSS Files
/*.css
  Content-Type: text/css; charset=utf-8
  Cache-Control: public, max-age=31536000, immutable

# HTML Files
/*.html
  Content-Type: text/html; charset=utf-8
  Cache-Control: public, max-age=0, must-revalidate

# Root
/
  Content-Type: text/html; charset=utf-8
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: payment=*
`;

fs.writeFileSync(path.join(distDir, "_headers"), headersContent);
console.log("   ✅ _headers (MIME Types Fix)");

// ============================================
// 9. ZUSAMMENFASSUNG
// ============================================
console.log("\n═════════════════════════════════════════════");
console.log("✅ Build erfolgreich abgeschlossen!");
console.log("═════════════════════════════════════════════");

console.log("\n📦 Erstellte Dateien:");
console.log("   ✅ app.js (mit Credentials)");
console.log("   ✅ index.html (mit Fixes)");
console.log("   ✅ styles.css (kombiniert)");
console.log(`   ✅ ${copiedFiles} zusätzliche Dateien`);
console.log("   ✅ _redirects");
console.log("   ✅ _headers (MIME Fix!)");

console.log("\n🔑 Konfiguration:");
console.log("   ✅ Supabase URL & Key gesetzt");
console.log(
  "   " +
    (STRIPE_PUBLISHABLE_KEY ? "✅" : "⚠️") +
    " Stripe " +
    (STRIPE_PUBLISHABLE_KEY ? "aktiviert" : "Demo-Modus")
);

console.log("\n🚀 Bereit für Netlify Deployment!");
console.log("   Führe aus: netlify deploy --prod");
console.log("═════════════════════════════════════════════\n");
