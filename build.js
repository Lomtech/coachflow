// ============================================
// EINFACHES BUILD-SCRIPT - FittiCoach1
// ============================================
const fs = require("fs");
const path = require("path");

console.log("\n🚀 Starte Build-Prozess...\n");

// ============================================
// 1. SETUP
// ============================================
const distDir = path.join(__dirname, "dist");
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
  console.log("✅ dist/ Ordner erstellt");
}

// ============================================
// 2. ENVIRONMENT VARIABLES
// ============================================
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY;
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
// 3. APP.JS VERARBEITEN
// ============================================
console.log("\n🔧 Verarbeite app.js...");

let appJs = fs.readFileSync(path.join(__dirname, "app.js"), "utf8");

// Ersetze ALLE Vorkommen der Platzhalter (global mit /g flag)
appJs = appJs.replace(/DEIN_SUPABASE_URL/g, SUPABASE_URL);
appJs = appJs.replace(/DEIN_SUPABASE_ANON_KEY/g, SUPABASE_ANON_KEY);
appJs = appJs.replace(
  /DEIN_STRIPE_PUBLISHABLE_KEY/g,
  STRIPE_PUBLISHABLE_KEY || "DEIN_STRIPE_PUBLISHABLE_KEY"
);

console.log("   ✅ Credentials ersetzt");

// Ersetze Price IDs
if (STRIPE_PRICE_BASIC) {
  appJs = appJs.replace(/price_BASIC_ID/g, STRIPE_PRICE_BASIC);
  console.log("   ✅ STRIPE_PRICE_BASIC ersetzt");
}

if (STRIPE_PRICE_PREMIUM) {
  appJs = appJs.replace(/price_PREMIUM_ID/g, STRIPE_PRICE_PREMIUM);
  console.log("   ✅ STRIPE_PRICE_PREMIUM ersetzt");
}

if (STRIPE_PRICE_ELITE) {
  appJs = appJs.replace(/price_ELITE_ID/g, STRIPE_PRICE_ELITE);
  console.log("   ✅ STRIPE_PRICE_ELITE ersetzt");
}

// Schreibe app.js
fs.writeFileSync(path.join(distDir, "app.js"), appJs);
console.log("   ✅ app.js → dist/app.js");

// ============================================
// 4. SUCCESS.HTML (falls vorhanden)
// ============================================
if (fs.existsSync(path.join(__dirname, "success.html"))) {
  console.log("\n🔧 Verarbeite success.html...");

  let successHtml = fs.readFileSync(
    path.join(__dirname, "success.html"),
    "utf8"
  );

  successHtml = successHtml.replace(/DEIN_SUPABASE_URL/g, SUPABASE_URL);
  successHtml = successHtml.replace(
    /DEIN_SUPABASE_ANON_KEY/g,
    SUPABASE_ANON_KEY
  );

  fs.writeFileSync(path.join(distDir, "success.html"), successHtml);
  console.log("   ✅ success.html → dist/success.html");
}

// ============================================
// 5. HAUPTDATEIEN KOPIEREN MIT CACHE-BUSTING
// ============================================
console.log("\n📁 Kopiere Hauptdateien...");

// Erstelle Build-Timestamp für Cache-Busting
const buildVersion = Date.now();
console.log(`   🔖 Build-Version: ${buildVersion}`);

// Kopiere und modifiziere index.html für Cache-Busting
if (fs.existsSync(path.join(__dirname, "index.html"))) {
  let indexHtml = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

  // Füge Version zu app.js hinzu
  indexHtml = indexHtml.replace(
    /<script src="app\.js"><\/script>/g,
    `<script src="app.js?v=${buildVersion}"></script>`
  );

  // Füge Version zu styles.css hinzu
  indexHtml = indexHtml.replace(
    /<link rel="stylesheet" href="styles\.css">/g,
    `<link rel="stylesheet" href="styles.css?v=${buildVersion}">`
  );

  fs.writeFileSync(path.join(distDir, "index.html"), indexHtml);
  console.log("   ✅ index.html (mit Cache-Busting)");
}

// Kopiere andere Dateien normal
const otherFiles = ["styles.css", "viewer.html"];

otherFiles.forEach((file) => {
  if (fs.existsSync(path.join(__dirname, file))) {
    fs.copyFileSync(path.join(__dirname, file), path.join(distDir, file));
    console.log(`   ✅ ${file}`);
  }
});

// ============================================
// 6. DSGVO-SEITEN
// ============================================
console.log("\n📄 Kopiere DSGVO-Seiten...");

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
  console.warn(`\n⚠️ WARNUNG: Nur ${copiedLegal}/4 DSGVO-Seiten gefunden!`);
}

// ============================================
// 7. NETLIFY KONFIGURATION
// ============================================
console.log("\n⚙️ Erstelle Netlify-Konfiguration...");

// _redirects
const redirectsContent = `/*  /index.html  200`;
fs.writeFileSync(path.join(distDir, "_redirects"), redirectsContent);
console.log("   ✅ _redirects");

// ============================================
// 8. ZUSAMMENFASSUNG
// ============================================
console.log("\n═════════════════════════════════════════════");
console.log("✅ Build erfolgreich abgeschlossen!");
console.log("═════════════════════════════════════════════");

console.log("\n📦 Erstelle Dateien:");
console.log("   ✅ app.js (mit Credentials)");
console.log("   ✅ index.html");
console.log("   ✅ styles.css");
if (fs.existsSync(path.join(distDir, "viewer.html"))) {
  console.log("   ✅ viewer.html");
}
if (fs.existsSync(path.join(distDir, "success.html"))) {
  console.log("   ✅ success.html");
}
console.log(`   ✅ ${copiedLegal}/4 DSGVO-Seiten`);

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
