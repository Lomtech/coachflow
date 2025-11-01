#!/usr/bin/env node

/**
 * CoachFlow Build Script
 * 
 * This script replaces placeholder variables in frontend JavaScript files
 * with actual environment variables during the build process on Netlify.
 * 
 * This ensures that API keys are never committed to the repository.
 */

const fs = require('fs');
const path = require('path');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Environment variables that should be injected
const ENV_VARS = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
  STRIPE_PRICE_BASIC: process.env.STRIPE_PRICE_BASIC,
  STRIPE_PRICE_PREMIUM: process.env.STRIPE_PRICE_PREMIUM,
  STRIPE_PRICE_ELITE: process.env.STRIPE_PRICE_ELITE,
};

// Files to process (relative to project root)
const FILES_TO_PROCESS = [
  'dashboard.js',
  'landing.js',
  'member-portal.js',
  // Coach onboarding files
  'coach-register.js',
  'coach-onboarding.js',
  // Coach dashboard files
  'coach-dashboard-main.js',
  'coach-packages.js',
  'coach-content.js',
  'coach-members.js',
  'coach-analytics.js',
  // Coach landing and routing
  'coach-landing.js',
  'subdomain-router.js',
];

// Source and destination directories
const SRC_DIR = path.join(__dirname, '..');
const DIST_DIR = path.join(__dirname, '..', 'dist');

/**
 * Validate that all required environment variables are set
 */
function validateEnvVars() {
  log('\n🔍 Validating environment variables...', 'blue');
  
  const missing = [];
  for (const [key, value] of Object.entries(ENV_VARS)) {
    if (!value) {
      missing.push(key);
      log(`  ❌ Missing: ${key}`, 'red');
    } else {
      // Show partial value for verification (first 10 chars + ...)
      const display = value.length > 10 ? `${value.substring(0, 10)}...` : value;
      log(`  ✅ Found: ${key} = ${display}`, 'green');
    }
  }
  
  if (missing.length > 0) {
    log('\n❌ Build failed: Missing required environment variables', 'red');
    log('Please set the following in Netlify UI:', 'yellow');
    missing.forEach(key => log(`  - ${key}`, 'yellow'));
    process.exit(1);
  }
  
  log('✅ All environment variables validated', 'green');
}

/**
 * Create dist directory if it doesn't exist
 */
function ensureDistDirectory() {
  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
    log('\n📁 Created dist directory', 'blue');
  }
}

/**
 * Replace placeholders in file content with environment variables
 */
function replacePlaceholders(content) {
  let result = content;
  
  // Replace each environment variable placeholder
  for (const [key, value] of Object.entries(ENV_VARS)) {
    // Pattern: __ENV_VAR_NAME__
    const placeholder = `__${key}__`;
    result = result.replace(new RegExp(placeholder, 'g'), value);
  }
  
  return result;
}

/**
 * Process a single JavaScript file
 */
function processFile(filename) {
  const srcPath = path.join(SRC_DIR, filename);
  const distPath = path.join(DIST_DIR, filename);
  
  log(`\n📝 Processing ${filename}...`, 'blue');
  
  if (!fs.existsSync(srcPath)) {
    log(`  ⚠️  Source file not found: ${srcPath}`, 'yellow');
    return;
  }
  
  // Read source file
  let content = fs.readFileSync(srcPath, 'utf8');
  
  // Replace placeholders with environment variables
  content = replacePlaceholders(content);
  
  // Write to dist directory
  fs.writeFileSync(distPath, content, 'utf8');
  
  log(`  ✅ Written to dist/${filename}`, 'green');
}

/**
 * Copy all other files (HTML, CSS, etc.) to dist
 */
function copyStaticFiles() {
  log('\n📦 Copying static files...', 'blue');
  
  const filesToCopy = [
    'index.html',
    'dashboard.html',
    'login.html',
    'member-portal.html',
    // Coach pages
    'coach-register.html',
    'coach-onboarding.html',
    'coach-dashboard-main.html',
    'coach-packages.html',
    'coach-content.html',
    'coach-members.html',
    'coach-analytics.html',
    'coach-landing.html',
    // Legal pages
    'agb.html',
    'datenschutz.html',
    'impressum.html',
    // Other files
    'styles.css',
    'netlify.toml',
    '.gitignore',
  ];
  
  filesToCopy.forEach(file => {
    const srcPath = path.join(SRC_DIR, file);
    const distPath = path.join(DIST_DIR, file);
    
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, distPath);
      log(`  ✅ Copied ${file}`, 'green');
    }
  });
  
  // Copy netlify functions directory
  const functionsDir = path.join(SRC_DIR, 'netlify');
  const distFunctionsDir = path.join(DIST_DIR, 'netlify');
  
  if (fs.existsSync(functionsDir)) {
    copyDirectory(functionsDir, distFunctionsDir);
    log(`  ✅ Copied netlify/ directory`, 'green');
  }
}

/**
 * Recursively copy directory
 */
function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Main build function
 */
function build() {
  log('\n🚀 Starting CoachFlow build process...', 'blue');
  log('=' .repeat(50), 'blue');
  
  // Step 1: Validate environment variables
  validateEnvVars();
  
  // Step 2: Ensure dist directory exists
  ensureDistDirectory();
  
  // Step 3: Process JavaScript files
  log('\n🔧 Processing JavaScript files...', 'blue');
  FILES_TO_PROCESS.forEach(processFile);
  
  // Step 4: Copy static files
  copyStaticFiles();
  
  // Done!
  log('\n' + '='.repeat(50), 'green');
  log('✅ Build completed successfully!', 'green');
  log('=' .repeat(50), 'green');
  log('\n📦 Output directory: dist/', 'blue');
  log('\n');
}

// Run the build
try {
  build();
} catch (error) {
  log('\n❌ Build failed with error:', 'red');
  log(error.message, 'red');
  console.error(error);
  process.exit(1);
}
