#!/usr/bin/env node

/**
 * CoachFlow Build Script
 * 
 * Ersetzt __PLACEHOLDER__ in Frontend-JS-Dateien durch echte Umgebungsvariablen.
 * Läuft während des Netlify-Builds und stellt sicher, dass sensible Keys nie im Repo landen.
 */

const fs = require('fs');
const path = require('path');

// === Terminal-Farben ===
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// === Umgebungsvariablen ===
const ENV_VARS = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
  STRIPE_PRICE_BASIC: process.env.STRIPE_PRICE_BASIC,
  STRIPE_PRICE_PREMIUM: process.env.STRIPE_PRICE_PREMIUM,
  STRIPE_PRICE_ELITE: process.env.STRIPE_PRICE_ELITE,
};

// === Dateien zum Verarbeiten (JS mit Platzhaltern) ===
const JS_FILES_TO_PROCESS = [
  'dashboard.js',
  'landing.js',
  'member-portal.js',
  'coach-register.js',
  'coach-onboarding.js',
  'coach-dashboard-main.js',
  'coach-packages.js',
  'coach-content.js',
  'coach-members.js',
  'coach-analytics.js',
  'coach-landing.js',
  'subdomain-router.js',
];

// === Statische Dateien (kopieren, nicht verarbeiten) ===
const STATIC_FILES_TO_COPY = [
  'index.html',
  'dashboard.html',
  'login.html',
  'member-portal.html',
  'coach-register.html',
  'coach-onboarding.html',
  'coach-dashboard-main.html',
  'coach-packages.html',
  'coach-content.html',
  'coach-members.html',
  'coach-analytics.html',
  'coach-landing.html',
  'agb.html',
  'datenschutz.html',
  'impressum.html',
  'styles.css',
  'netlify.toml',
  '.gitignore',
];

// === Pfade ===
const ROOT_DIR = path.join(__dirname, '..');
const SRC_DIR = ROOT_DIR;
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const FUNCTIONS_SRC = path.join(SRC_DIR, 'netlify');
const FUNCTIONS_DIST = path.join(DIST_DIR, 'netlify');

// === Hilfsfunktionen ===

/**
 * Escaped Sonderzeichen für RegExp
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Validiert, dass alle erforderlichen Umgebungsvariablen gesetzt sind
 */
function validateEnvVars() {
  log('\n🔍 Validierung der Umgebungsvariablen...', 'blue');

  const missing = [];
  let allValid = true;

  for (const [key, value] of Object.entries(ENV_VARS)) {
    if (!value || value.trim() === '') {
      missing.push(key);
      allValid = false;
      log(`  ❌ Fehlt: ${key}`, 'red');
    } else {
      const display = value.length > 12 ? `${value.substring(0, 12)}...` : value;
      log(`  ✅ ${key} = ${display}`, 'green');
    }
  }

  if (!allValid) {
    log('\n❌ Build fehlgeschlagen: Fehlende Umgebungsvariablen', 'red');
    log('Bitte setzen Sie diese in den Netlify-Einstellungen:', 'yellow');
    missing.forEach(key => log(`   • ${key}`, 'yellow'));
    log('\nPfad: Site Settings → Build & Deploy → Environment', 'cyan');
    process.exit(1);
  }

  log('✅ Alle Umgebungsvariablen validiert', 'green');
}

/**
 * Erstellt das dist-Verzeichnis, falls nicht vorhanden
 */
function ensureDistDirectory() {
  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
    log(`📁 dist-Verzeichnis erstellt: ${DIST_DIR}`, 'blue');
  }
}

/**
 * Ersetzt __PLACEHOLDER__ durch echte Werte
 */
function replacePlaceholders(content) {
  let result = content;

  for (const [key, value] of Object.entries(ENV_VARS)) {
    const placeholder = `__${key}__`;
    const regex = new RegExp(escapeRegExp(placeholder), 'g');
    result = result.replace(regex, value);
  }

  return result;
}

/**
 * Verarbeitet eine einzelne JS-Datei
 */
function processJsFile(filename) {
  const srcPath = path.join(SRC_DIR, filename);
  const distPath = path.join(DIST_DIR, filename);

  if (!fs.existsSync(srcPath)) {
    log(`  ⚠️  Quelle nicht gefunden: ${filename}`, 'yellow');
    return;
  }

  try {
    let content = fs.readFileSync(srcPath, 'utf8');
    const processedContent = replacePlaceholders(content);
    fs.writeFileSync(distPath, processedContent, 'utf8');
    log(`  ✅ ${filename} → dist/${filename}`, 'green');
  } catch (err) {
    log(`  ❌ Fehler bei ${filename}: ${err.message}`, 'red');
    throw err;
  }
}

/**
 * Kopiert statische Dateien
 */
function copyStaticFiles() {
  log('\n📦 Kopiere statische Dateien...', 'blue');

  STATIC_FILES_TO_COPY.forEach(file => {
    const srcPath = path.join(SRC_DIR, file);
    const distPath = path.join(DIST_DIR, file);

    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, distPath);
      log(`  ✅ ${file}`, 'green');
    }
  });
}

/**
 * Kopiert das netlify/-Verzeichnis rekursiv (Functions)
 */
function copyFunctionsDirectory() {
  if (!fs.existsSync(FUNCTIONS_SRC)) {
    log(`  ⚠️  netlify/ Verzeichnis nicht gefunden – überspringe`, 'yellow');
    return;
  }

  log(`\n🔧 Kopiere Netlify Functions: ${FUNCTIONS_SRC} → ${FUNCTIONS_DIST}`, 'blue');

  function copyRecursive(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    entries.forEach(entry => {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        copyRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    });
  }

  copyRecursive(FUNCTIONS_SRC, FUNCTIONS_DIST);
  log(`  ✅ Netlify Functions kopiert`, 'green');
}

/**
 * Haupt-Build-Funktion
 */
function build() {
  log('\n🚀 CoachFlow Build-Prozess gestartet', 'cyan');
  log('═'.repeat(60), 'blue');

  try {
    // 1. Validierung
    validateEnvVars();

    // 2. dist-Verzeichnis
    ensureDistDirectory();

    // 3. JS-Dateien verarbeiten
    log('\n🔧 Verarbeite JavaScript-Dateien mit Umgebungsvariablen...', 'blue');
    JS_FILES_TO_PROCESS.forEach(processJsFile);

    // 4. Statische Dateien kopieren
    copyStaticFiles();

    // 5. Netlify Functions kopieren
    copyFunctionsDirectory();

    // Erfolg
    log('\n' + '═'.repeat(60), 'green');
    log('✅ Build erfolgreich abgeschlossen!', 'green');
    log('📂 Ausgabeverzeichnis: dist/', 'cyan');
    log('🌐 Bereit für Netlify Deploy', 'cyan');
    log('═'.repeat(60), 'green');
    log('\n');

  } catch (error) {
    log('\n❌ Build fehlgeschlagen:', 'red');
    log(error.message, 'red');
    console.error(error);
    process.exit(1);
  }
}

// === Ausführung ===
build();