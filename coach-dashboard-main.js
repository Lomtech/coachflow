// ============================================
// Coach Dashboard Main Script
// ============================================

const SUPABASE_URL = '__SUPABASE_URL__';
const SUPABASE_ANON_KEY = '__SUPABASE_ANON_KEY__';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentCoach = null;
let coachStats = null;

// ============================================
// Initialization
// ============================================

(async function init() {
  try {
    // Check authentication
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (!session) {
      window.location.href = 'login.html';
      return;
    }
    
    // Get coach profile
    const { data: coach, error: coachError } = await supabaseClient
      .from('coaches')
      .select('*')
      .eq('user_id', session.user.id)
      .single();
    
    if (coachError || !coach) {
      console.error('Coach not found:', coachError);
      window.location.href = 'coach-register.html';
      return;
    }
    
    if (!coach.onboarding_completed) {
      window.location.href = 'coach-onboarding.html';
      return;
    }
    
    currentCoach = coach;
    
    // Load dashboard data
    await loadDashboard();
    
  } catch (error) {
    console.error('Initialization error:', error);
    alert('Fehler beim Laden des Dashboards');
  }
})();

// ============================================
// Load Dashboard Data
// ============================================

async function loadDashboard() {
  try {
    // Update user info in sidebar
    updateUserInfo();
    
    // Load stats
    await loadStats();
    
    // Load recent activity
    await loadRecentActivity();
    
    // Setup landing page link
    setupLandingPageLink();
    
  } catch (error) {
    console.error('Error loading dashboard:', error);
  }
}

// ============================================
// Update User Info
// ============================================

function updateUserInfo() {
  const userName = document.getElementById('userName');
  const userEmail = document.getElementById('userEmail');
  const userAvatar = document.getElementById('userAvatar');
  
  userName.textContent = currentCoach.full_name;
  userEmail.textContent = currentCoach.email;
  
  // Set avatar to first letter of name
  const firstLetter = currentCoach.full_name.charAt(0).toUpperCase();
  userAvatar.textContent = firstLetter;
}

// ============================================
// Load Statistics
// ============================================

async function loadStats() {
  try {
    // Use the database function to get stats
    const { data, error } = await supabaseClient
      .rpc('get_coach_stats', { coach_uuid: currentCoach.id });
    
    if (error) throw error;
    
    coachStats = data;
    
    // Update stat cards
    document.getElementById('totalPackages').textContent = coachStats.published_packages || 0;
    document.getElementById('activeMembers').textContent = coachStats.active_subscriptions || 0;
    document.getElementById('totalRevenue').textContent = `€${(coachStats.total_revenue || 0).toFixed(2)}`;
    document.getElementById('totalContent').textContent = coachStats.total_content || 0;
    
  } catch (error) {
    console.error('Error loading stats:', error);
    
    // Fallback: Load stats manually
    await loadStatsFallback();
  }
}

async function loadStatsFallback() {
  try {
    // Count packages
    const { count: packageCount } = await supabaseClient
      .from('packages')
      .select('*', { count: 'exact', head: true })
      .eq('coach_id', currentCoach.id)
      .eq('is_published', true);
    
    // Count active subscriptions
    const { count: memberCount } = await supabaseClient
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('coach_id', currentCoach.id)
      .eq('status', 'active');
    
    // Sum revenue
    const { data: subscriptions } = await supabaseClient
      .from('subscriptions')
      .select('amount_paid')
      .eq('coach_id', currentCoach.id);
    
    const totalRevenue = subscriptions?.reduce((sum, sub) => sum + (parseFloat(sub.amount_paid) || 0), 0) || 0;
    
    // Count content
    const { data: packages } = await supabaseClient
      .from('packages')
      .select('id')
      .eq('coach_id', currentCoach.id);
    
    let contentCount = 0;
    if (packages && packages.length > 0) {
      const packageIds = packages.map(p => p.id);
      const { count } = await supabaseClient
        .from('package_content')
        .select('*', { count: 'exact', head: true })
        .in('package_id', packageIds);
      
      contentCount = count || 0;
    }
    
    // Update UI
    document.getElementById('totalPackages').textContent = packageCount || 0;
    document.getElementById('activeMembers').textContent = memberCount || 0;
    document.getElementById('totalRevenue').textContent = `€${totalRevenue.toFixed(2)}`;
    document.getElementById('totalContent').textContent = contentCount;
    
  } catch (error) {
    console.error('Error loading stats fallback:', error);
  }
}

// ============================================
// Load Recent Activity
// ============================================

async function loadRecentActivity() {
  const activityList = document.getElementById('activityList');
  
  try {
    // Get recent subscriptions
    const { data: recentSubs, error } = await supabaseClient
      .from('subscriptions')
      .select(`
        *,
        packages (name)
      `)
      .eq('coach_id', currentCoach.id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    
    if (!recentSubs || recentSubs.length === 0) {
      activityList.innerHTML = `
        <li class="activity-item">
          <div class="activity-icon">📭</div>
          <div class="activity-details">
            <div class="activity-title">Noch keine Aktivitäten</div>
            <div class="activity-time">Erstelle dein erstes Paket um loszulegen</div>
          </div>
        </li>
      `;
      return;
    }
    
    // Render activity items
    activityList.innerHTML = recentSubs.map(sub => {
      const icon = sub.status === 'active' ? '✅' : sub.status === 'cancelled' ? '❌' : '⏸️';
      const timeAgo = getTimeAgo(sub.created_at);
      const packageName = sub.packages?.name || 'Unbekanntes Paket';
      
      return `
        <li class="activity-item">
          <div class="activity-icon">${icon}</div>
          <div class="activity-details">
            <div class="activity-title">
              ${sub.customer_name || sub.customer_email} hat "${packageName}" abonniert
            </div>
            <div class="activity-time">${timeAgo}</div>
          </div>
        </li>
      `;
    }).join('');
    
  } catch (error) {
    console.error('Error loading activity:', error);
    activityList.innerHTML = `
      <li class="activity-item">
        <div class="activity-icon">⚠️</div>
        <div class="activity-details">
          <div class="activity-title">Fehler beim Laden der Aktivitäten</div>
        </div>
      </li>
    `;
  }
}

// ============================================
// Setup Landing Page Link
// ============================================

function setupLandingPageLink() {
  const viewLandingPageBtn = document.getElementById('viewLandingPage');
  
  if (viewLandingPageBtn && currentCoach.subdomain) {
    viewLandingPageBtn.href = `coach-landing.html?subdomain=${currentCoach.subdomain}`;
    viewLandingPageBtn.target = '_blank';
  }
}

// ============================================
// Utility Functions
// ============================================

function getTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) return 'Gerade eben';
  if (seconds < 3600) return `vor ${Math.floor(seconds / 60)} Minuten`;
  if (seconds < 86400) return `vor ${Math.floor(seconds / 3600)} Stunden`;
  if (seconds < 604800) return `vor ${Math.floor(seconds / 86400)} Tagen`;
  
  return date.toLocaleDateString('de-DE', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

// ============================================
// Logout Function
// ============================================

async function logout() {
  try {
    await supabaseClient.auth.signOut();
    window.location.href = 'index.html';
  } catch (error) {
    console.error('Logout error:', error);
    alert('Fehler beim Abmelden');
  }
}
