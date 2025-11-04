// ============================================
// BUILD SCRIPT - Multi-Tenant SaaS (FINAL)
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

// Price IDs - nutze die alten Namen aus deiner Config
const STRIPE_PRICE_BASIC = process.env.STRIPE_PRICE_BASIC;
const STRIPE_PRICE_PREMIUM = process.env.STRIPE_PRICE_PREMIUM;
const STRIPE_PRICE_ELITE = process.env.STRIPE_PRICE_ELITE;

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
// 3. PRÜFE WELCHE DATEIEN VORHANDEN SIND
// ============================================
const hasMultitenantFiles = fs.existsSync(
  path.join(__dirname, "app-multitenant.js")
);
const hasOldIndexFile = fs.existsSync(
  path.join(__dirname, "index_multitenant.html")
);
const hasNewIndexFile = fs.existsSync(path.join(__dirname, "index.html"));

console.log("\n📁 Verfügbare Dateien:");
console.log(
  "   " + (hasMultitenantFiles ? "✅" : "❌") + " app-multitenant.js"
);
console.log(
  "   " + (hasOldIndexFile ? "✅" : "❌") + " index_multitenant.html"
);
console.log("   " + (hasNewIndexFile ? "✅" : "❌") + " index.html");

// ============================================
// 4. APP.JS VERARBEITEN
// ============================================
console.log("\n🔧 Verarbeite JavaScript...");

let appJsSource = "app.js";
if (hasMultitenantFiles) {
  appJsSource = "app-multitenant.js";
}

if (!fs.existsSync(path.join(__dirname, appJsSource))) {
  console.error(`\n❌ FEHLER: ${appJsSource} nicht gefunden!`);
  process.exit(1);
}

let appJs = fs.readFileSync(path.join(__dirname, appJsSource), "utf8");

// Ersetze Credentials
appJs = appJs.replace(/DEIN_SUPABASE_URL/g, SUPABASE_URL);
appJs = appJs.replace(/DEIN_SUPABASE_ANON_KEY/g, SUPABASE_ANON_KEY);
appJs = appJs.replace(
  /DEIN_STRIPE_PUBLISHABLE_KEY/g,
  STRIPE_PUBLISHABLE_KEY || "DEIN_STRIPE_PUBLISHABLE_KEY"
);

// Ersetze Price IDs (beide Varianten für Kompatibilität)
if (STRIPE_PRICE_BASIC) {
  appJs = appJs.replace(/price_BASIC_ID/g, STRIPE_PRICE_BASIC);
  appJs = appJs.replace(/price_COACH_BASIC_ID/g, STRIPE_PRICE_BASIC);
  appJs = appJs.replace(/price_CUSTOMER_BASIC_ID/g, STRIPE_PRICE_BASIC);
  console.log("   ✅ STRIPE_PRICE_BASIC ersetzt");
}

if (STRIPE_PRICE_PREMIUM) {
  appJs = appJs.replace(/price_PREMIUM_ID/g, STRIPE_PRICE_PREMIUM);
  appJs = appJs.replace(/price_COACH_PREMIUM_ID/g, STRIPE_PRICE_PREMIUM);
  appJs = appJs.replace(/price_CUSTOMER_PREMIUM_ID/g, STRIPE_PRICE_PREMIUM);
  console.log("   ✅ STRIPE_PRICE_PREMIUM ersetzt");
}

if (STRIPE_PRICE_ELITE) {
  appJs = appJs.replace(/price_ELITE_ID/g, STRIPE_PRICE_ELITE);
  appJs = appJs.replace(/price_COACH_ELITE_ID/g, STRIPE_PRICE_ELITE);
  appJs = appJs.replace(/price_CUSTOMER_ELITE_ID/g, STRIPE_PRICE_ELITE);
  console.log("   ✅ STRIPE_PRICE_ELITE ersetzt");
}

// Schreibe app.js
fs.writeFileSync(path.join(distDir, "app.js"), appJs);
console.log("   ✅ app.js → dist/app.js");

// ============================================
// 5. INDEX.HTML VERARBEITEN
// ============================================
console.log("\n🔧 Verarbeite HTML...");

let indexSource = "index.html";
if (!hasNewIndexFile && hasOldIndexFile) {
  indexSource = "index_multitenant.html";
}

if (!fs.existsSync(path.join(__dirname, indexSource))) {
  console.error(`\n❌ FEHLER: ${indexSource} nicht gefunden!`);
  process.exit(1);
}

let indexHtml = fs.readFileSync(path.join(__dirname, indexSource), "utf8");

// Ersetze JavaScript-Referenzen
indexHtml = indexHtml.replace(/app-multitenant\.js/g, "app.js");
indexHtml = indexHtml.replace(/src="app\.js"/g, 'src="app.js"'); // Normalisierung

// Cache-Busting
const buildVersion = Date.now();
indexHtml = indexHtml.replace(
  /<script src="app\.js"><\/script>/g,
  `<script src="app.js?v=${buildVersion}"></script>`
);

// CSS Referenzen fixen
indexHtml = indexHtml.replace(/styles-multitenant-addon\.css/g, "styles.css");

// Fix: Deprecated Meta Tag
if (indexHtml.includes('name="apple-mobile-web-app-capable"')) {
  indexHtml = indexHtml.replace(
    '<meta name="apple-mobile-web-app-capable" content="yes" />',
    '<meta name="mobile-web-app-capable" content="yes" />\n    <meta name="apple-mobile-web-app-capable" content="yes" />'
  );
}

// Füge Permissions Policy für Payment hinzu
if (!indexHtml.includes("Permissions-Policy")) {
  const headEndIndex = indexHtml.indexOf("</head>");
  if (headEndIndex > -1) {
    indexHtml =
      indexHtml.slice(0, headEndIndex) +
      '    <meta http-equiv="Permissions-Policy" content="payment=*">\n' +
      indexHtml.slice(headEndIndex);
  }
}

fs.writeFileSync(path.join(distDir, "index.html"), indexHtml);
console.log("   ✅ index.html → dist/index.html");

// ============================================
// 6. CSS VERARBEITEN
// ============================================
console.log("\n🎨 Verarbeite CSS...");

let finalCss = "";

// Haupt-CSS
if (fs.existsSync(path.join(__dirname, "styles.css"))) {
  finalCss = fs.readFileSync(path.join(__dirname, "styles.css"), "utf8");
  console.log("   ✅ styles.css geladen");
}

// Addon-CSS (falls vorhanden)
if (fs.existsSync(path.join(__dirname, "styles-multitenant-addon.css"))) {
  const addonCss = fs.readFileSync(
    path.join(__dirname, "styles-multitenant-addon.css"),
    "utf8"
  );
  finalCss += "\n\n/* === MULTI-TENANT ADDON === */\n\n" + addonCss;
  console.log("   ✅ styles-multitenant-addon.css hinzugefügt");
}

if (finalCss) {
  fs.writeFileSync(path.join(distDir, "styles.css"), finalCss);
  console.log("   ✅ styles.css → dist/styles.css");
}

// ============================================
// 7. WEITERE DATEIEN KOPIEREN
// ============================================
console.log("\n📁 Kopiere weitere Dateien...");

const filesToCopy = [
  "viewer.html",
  "impressum.html",
  "datenschutz.html",
  "cookies.html",
  "agb.html",
  "success.html",
];

let copiedFiles = 0;
filesToCopy.forEach((file) => {
  if (fs.existsSync(path.join(__dirname, file))) {
    fs.copyFileSync(path.join(__dirname, file), path.join(distDir, file));
    console.log(`   ✅ ${file}`);
    copiedFiles++;
  }
});

// ============================================
// 8. NETLIFY CONFIG
// ============================================
console.log("\n⚙️ Erstelle Netlify-Dateien...");

// _redirects
const redirectsContent = `# SPA Routing
/*  /index.html  200

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

// _headers (KRITISCH für MIME Types!)
const headersContent = `# MIME Types Fix
/*.js
  Content-Type: application/javascript; charset=utf-8
  Cache-Control: public, max-age=31536000, immutable
  X-Content-Type-Options: nosniff

/*.css
  Content-Type: text/css; charset=utf-8
  Cache-Control: public, max-age=31536000, immutable

/*.html
  Content-Type: text/html; charset=utf-8
  Cache-Control: public, max-age=0, must-revalidate

/
  Content-Type: text/html; charset=utf-8
  X-Frame-Options: DENY
  Permissions-Policy: payment=*
`;
fs.writeFileSync(path.join(distDir, "_headers"), headersContent);
console.log("   ✅ _headers (MIME Fix!)");

// ============================================
// 9. ZUSAMMENFASSUNG
// ============================================
console.log("\n═════════════════════════════════════════════");
console.log("✅ Build erfolgreich abgeschlossen!");
console.log("═════════════════════════════════════════════");

console.log("\n📦 Erstellte Dateien:");
console.log("   ✅ app.js (mit Credentials)");
console.log("   ✅ index.html (mit Fixes)");
console.log("   ✅ styles.css");
console.log(`   ✅ ${copiedFiles} zusätzliche Dateien`);
console.log("   ✅ _redirects");
console.log("   ✅ _headers (MIME Types Fix!)");

console.log("\n🔑 Konfiguration:");
console.log("   ✅ Supabase URL & Key gesetzt");
console.log(
  "   " +
    (STRIPE_PUBLISHABLE_KEY ? "✅" : "⚠️") +
    " Stripe " +
    (STRIPE_PUBLISHABLE_KEY ? "aktiviert" : "Demo-Modus")
);

console.log("\n🚀 Bereit für Deployment!");
console.log("═════════════════════════════════════════════\n");
