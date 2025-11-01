
// CoachFlow Member Portal

// These placeholders will be replaced with actual environment variables during build
const SUPABASE_URL = '__SUPABASE_URL__';
const SUPABASE_ANON_KEY = '__SUPABASE_ANON_KEY__';
const STRIPE_PUBLISHABLE_KEY = '__STRIPE_PUBLISHABLE_KEY__';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let stripe = null;

let coachId = null;
let coach = null;
let tier = null;
let currentUser = null;
let currentTab = 'videos';

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  // Get coach ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  coachId = urlParams.get('coach');
  
  if (!coachId) {
    alert('Ungültiger Link');
    return;
  }
  
  // Initialize Stripe
  if (typeof Stripe !== 'undefined') {
    stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
  }
  
  await loadCoachData();
  await checkAuth();
  setupEventListeners();
});

// Load Coach & Tier Data
async function loadCoachData() {
  // Load coach
  const { data: coachData } = await supabase
    .from('coaches')
    .select('*')
    .eq('id', coachId)
    .single();
  
  if (!coachData) {
    alert('Coach nicht gefunden');
    return;
  }
  
  coach = coachData;
  document.getElementById('coachNameTitle').textContent = coach.name + ' - Membership';
  
  // Load tier
  const { data: tierData } = await supabase
    .from('tiers')
    .select('*')
    .eq('coach_id', coachId)
    .single();
  
  if (tierData) {
    tier = tierData;
    displayTierInfo();
  }
}

function displayTierInfo() {
  if (!tier) return;
  
  document.getElementById('tierName').textContent = tier.name;
  document.getElementById('tierPrice').textContent = `€${tier.price} / Monat`;
  document.getElementById('tierDescription').textContent = tier.description;
}

// Authentication
async function checkAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session) {
    currentUser = session.user;
    await checkSubscription();
  } else {
    showGuestView();
  }
}

async function checkSubscription() {
  const { data } = await supabase
    .from('customers')
    .select('*')
    .eq('user_id', currentUser.id)
    .eq('coach_id', coachId)
    .eq('subscription_status', 'active')
    .single();
  
  if (data) {
    showMemberView(data);
  } else {
    showGuestView();
  }
}

function showGuestView() {
  document.getElementById('guestView').style.display = 'block';
  document.getElementById('memberView').style.display = 'none';
  document.getElementById('loginBtn').style.display = 'block';
  document.getElementById('logoutBtn').style.display = 'none';
}

function showMemberView(subscription) {
  document.getElementById('guestView').style.display = 'none';
  document.getElementById('memberView').style.display = 'block';
  document.getElementById('loginBtn').style.display = 'none';
  document.getElementById('logoutBtn').style.display = 'block';
  
  // Display subscription info
  document.getElementById('memberTierName').textContent = tier.name;
  document.getElementById('memberStatus').textContent = 'Aktiv ✓';
  
  if (subscription.current_period_end) {
    const date = new Date(subscription.current_period_end).toLocaleDateString('de-DE');
    document.getElementById('nextPayment').textContent = date;
  }
  
  // Load content
  loadContent();
}

// Event Listeners
function setupEventListeners() {
  document.getElementById('loginBtn').addEventListener('click', () => {
    document.getElementById('loginModal').style.display = 'block';
  });
  
  document.getElementById('logoutBtn').addEventListener('click', logout);
  document.getElementById('subscribeBtn').addEventListener('click', subscribe);
  document.getElementById('authForm').addEventListener('submit', handleAuth);
  document.getElementById('registerBtn').addEventListener('click', handleRegister);
  
  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTab = btn.getAttribute('data-tab');
      loadContent();
    });
  });
  
  // Modal close
  document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', function() {
      this.closest('.modal').style.display = 'none';
    });
  });
  
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      e.target.style.display = 'none';
    }
  });
}

async function handleAuth(e) {
  e.preventDefault();
  
  const email = document.getElementById('authEmail').value;
  const password = document.getElementById('authPassword').value;
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) {
    alert('Login fehlgeschlagen: ' + error.message);
    return;
  }
  
  document.getElementById('loginModal').style.display = 'none';
  currentUser = data.user;
  await checkSubscription();
}

async function handleRegister() {
  const email = document.getElementById('authEmail').value;
  const password = document.getElementById('authPassword').value;
  
  if (!email || !password) {
    alert('Bitte E-Mail und Passwort eingeben');
    return;
  }
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });
  
  if (error) {
    alert('Registrierung fehlgeschlagen: ' + error.message);
    return;
  }
  
  alert('Registrierung erfolgreich! Bitte logge dich ein.');
}

async function logout() {
  await supabase.auth.signOut();
  currentUser = null;
  showGuestView();
}

// Subscription
async function subscribe() {
  if (!currentUser) {
    alert('Bitte melde dich zuerst an');
    document.getElementById('loginModal').style.display = 'block';
    return;
  }
  
  if (!stripe) {
    alert('Stripe ist nicht verfügbar');
    return;
  }
  
  const btn = document.getElementById('subscribeBtn');
  btn.disabled = true;
  btn.textContent = 'Wird geladen...';
  
  try {
    const response = await fetch('/.netlify/functions/create-customer-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        coachId,
        tierId: tier.id,
        customerId: currentUser.id,
        customerEmail: currentUser.email
      })
    });
    
    if (!response.ok) {
      throw new Error('Fehler beim Erstellen der Checkout-Session');
    }
    
    const { sessionId } = await response.json();
    
    const { error } = await stripe.redirectToCheckout({
      sessionId
    });
    
    if (error) {
      alert('Fehler: ' + error.message);
    }
  } catch (error) {
    console.error('Subscribe error:', error);
    alert('Fehler: ' + error.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Jetzt Mitglied werden';
  }
}

// Content Loading
async function loadContent() {
  const { data } = await supabase
    .from('content')
    .select('*')
    .eq('coach_id', coachId)
    .order('created_at', { ascending: false });
  
  const contentDisplay = document.getElementById('contentDisplay');
  contentDisplay.innerHTML = '';
  
  if (!data || data.length === 0) {
    contentDisplay.innerHTML = '<p>Noch keine Inhalte verfügbar</p>';
    return;
  }
  
  // Filter by tab
  const filtered = data.filter(item => {
    if (currentTab === 'videos') return item.file_type.startsWith('video/');
    if (currentTab === 'documents') return item.file_type === 'application/pdf';
    if (currentTab === 'images') return item.file_type.startsWith('image/');
    return false;
  });
  
  if (filtered.length === 0) {
    contentDisplay.innerHTML = '<p>Keine Inhalte in dieser Kategorie</p>';
    return;
  }
  
  filtered.forEach(item => {
    const card = document.createElement('div');
    card.className = 'content-card';
    
    const icon = currentTab === 'videos' ? '🎥' :
                 currentTab === 'documents' ? '📄' : '🖼️';
    
    card.innerHTML = `
      <div class="content-icon">${icon}</div>
      <h4>${item.title}</h4>
      <button onclick="viewContent('${item.id}', '${item.file_url}', '${item.title}', '${currentTab}')" class="btn btn-primary">
        Ansehen
      </button>
    `;
    
    contentDisplay.appendChild(card);
  });
}

window.viewContent = function(id, url, title, type) {
  if (type === 'videos') {
    document.getElementById('videoTitle').textContent = title;
    document.getElementById('videoPlayer').src = url;
    document.getElementById('videoModal').style.display = 'block';
  } else if (type === 'documents') {
    window.open(url, '_blank');
  } else if (type === 'images') {
    window.open(url, '_blank');
  }
};
