// ============================================
// Subdomain Router
// Detects subdomain and routes to appropriate page
// ============================================

const SUPABASE_URL = '__SUPABASE_URL__';
const SUPABASE_ANON_KEY = '__SUPABASE_ANON_KEY__';

(async function detectSubdomain() {
  // Only run on main index page
  if (!window.location.pathname.match(/^\/?(index.html)?$/)) {
    return;
  }
  
  try {
    const hostname = window.location.hostname;
    
    // Split hostname (e.g., coachname.coachflow.app -> ['coachname', 'coachflow', 'app'])
    const parts = hostname.split('.');
    
    // Check if we have a subdomain
    if (parts.length <= 2) {
      // No subdomain (e.g., coachflow.app or localhost)
      console.log('No subdomain detected - showing main landing page');
      return;
    }
    
    const subdomain = parts[0];
    
    // Skip www and common subdomains
    const skipSubdomains = ['www', 'app', 'admin', 'api', 'mail', 'ftp'];
    if (skipSubdomains.includes(subdomain)) {
      console.log('System subdomain detected - showing main landing page');
      return;
    }
    
    console.log('Coach subdomain detected:', subdomain);
    
    // Check if coach exists in database
    const { createClient } = supabase;
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    const { data: coach, error } = await supabaseClient
      .from('coaches')
      .select('subdomain, is_active, onboarding_completed')
      .eq('subdomain', subdomain)
      .single();
    
    if (coach && coach.is_active && coach.onboarding_completed) {
      console.log('Valid coach found - redirecting to coach landing page');
      window.location.href = `coach-landing.html?subdomain=${subdomain}`;
    } else {
      console.log('Coach not found or inactive - showing main landing page');
    }
    
  } catch (error) {
    console.error('Subdomain detection error:', error);
    // On error, just show the main landing page
  }
})();