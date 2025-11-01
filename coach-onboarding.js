// ============================================
// Coach Onboarding Script
// ============================================

const SUPABASE_URL = '__SUPABASE_URL__';
const SUPABASE_ANON_KEY = '__SUPABASE_ANON_KEY__';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// State
let currentStep = 1;
let selectedNiche = '';
let subdomainAvailable = false;
let currentUser = null;

// Elements
const progressFill = document.getElementById('progressFill');
const alertBox = document.getElementById('alertBox');

// Form data storage
const onboardingData = {
  fullName: '',
  phone: '',
  bio: '',
  instagram: '',
  website: '',
  niche: '',
  specializations: [],
  subdomain: ''
};

// ============================================
// Initialization
// ============================================

(async function init() {
  // Check if user is authenticated
  const { data: { session } } = await supabaseClient.auth.getSession();
  
  if (!session) {
    // Not logged in, redirect to registration
    window.location.href = 'coach-register.html';
    return;
  }
  
  currentUser = session.user;
  
  // Check if coach profile already exists
  const { data: existingCoach } = await supabaseClient
    .from('coaches')
    .select('*')
    .eq('user_id', currentUser.id)
    .single();
  
  if (existingCoach && existingCoach.onboarding_completed) {
    // Already completed onboarding, redirect to dashboard
    window.location.href = 'coach-dashboard.html';
    return;
  }
  
  // Pre-fill email and name if available
  if (currentUser.user_metadata?.full_name) {
    document.getElementById('fullName').value = currentUser.user_metadata.full_name;
  } else if (sessionStorage.getItem('coachName')) {
    document.getElementById('fullName').value = sessionStorage.getItem('coachName');
  }
  
  setupEventListeners();
})();

// ============================================
// Event Listeners
// ============================================

function setupEventListeners() {
  // Niche selection
  document.querySelectorAll('.niche-option').forEach(option => {
    option.addEventListener('click', function() {
      // Remove selected from all
      document.querySelectorAll('.niche-option').forEach(opt => {
        opt.classList.remove('selected');
      });
      
      // Add selected to clicked
      this.classList.add('selected');
      selectedNiche = this.dataset.niche;
      
      // Enable next button
      document.getElementById('step2Next').disabled = false;
    });
  });
  
  // Subdomain input validation
  const subdomainInput = document.getElementById('subdomain');
  let checkTimeout;
  
  subdomainInput.addEventListener('input', function() {
    // Clear previous timeout
    clearTimeout(checkTimeout);
    
    // Force lowercase and remove invalid characters
    this.value = this.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    
    // Show checking status
    const statusEl = document.getElementById('subdomainStatus');
    statusEl.textContent = 'Verfügbarkeit wird geprüft...';
    statusEl.className = 'subdomain-status checking';
    
    // Disable complete button while checking
    document.getElementById('completeBtn').disabled = true;
    
    // Check availability after 500ms of no typing
    checkTimeout = setTimeout(async () => {
      await checkSubdomainAvailability(this.value);
    }, 500);
  });
}

// ============================================
// Subdomain Availability Check
// ============================================

async function checkSubdomainAvailability(subdomain) {
  const statusEl = document.getElementById('subdomainStatus');
  const completeBtn = document.getElementById('completeBtn');
  
  // Validate format
  if (!subdomain || subdomain.length < 3) {
    statusEl.textContent = 'Subdomain muss mindestens 3 Zeichen lang sein';
    statusEl.className = 'subdomain-status unavailable';
    completeBtn.disabled = true;
    subdomainAvailable = false;
    return;
  }
  
  if (subdomain.length > 30) {
    statusEl.textContent = 'Subdomain darf maximal 30 Zeichen lang sein';
    statusEl.className = 'subdomain-status unavailable';
    completeBtn.disabled = true;
    subdomainAvailable = false;
    return;
  }
  
  try {
    // Check if subdomain is available using the database function
    const { data, error } = await supabaseClient
      .rpc('is_subdomain_available', { subdomain_to_check: subdomain });
    
    if (error) {
      throw error;
    }
    
    if (data === true) {
      statusEl.textContent = `✓ ${subdomain}.coachflow.app ist verfügbar!`;
      statusEl.className = 'subdomain-status available';
      completeBtn.disabled = false;
      subdomainAvailable = true;
    } else {
      statusEl.textContent = 'Diese Subdomain ist bereits vergeben';
      statusEl.className = 'subdomain-status unavailable';
      completeBtn.disabled = true;
      subdomainAvailable = false;
    }
  } catch (error) {
    console.error('Error checking subdomain:', error);
    statusEl.textContent = 'Fehler bei der Überprüfung. Bitte versuche es erneut.';
    statusEl.className = 'subdomain-status unavailable';
    completeBtn.disabled = true;
    subdomainAvailable = false;
  }
}

// ============================================
// Navigation Functions
// ============================================

function nextStep() {
  // Validate current step
  if (!validateStep(currentStep)) {
    return;
  }
  
  // Save current step data
  saveStepData(currentStep);
  
  // Move to next step
  currentStep++;
  showStep(currentStep);
}

function prevStep() {
  currentStep--;
  showStep(currentStep);
}

function showStep(step) {
  // Hide all steps
  document.querySelectorAll('.onboarding-step').forEach(el => {
    el.classList.remove('active');
  });
  
  // Show current step
  document.getElementById(`step${step}`).classList.add('active');
  
  // Update step indicators
  document.querySelectorAll('.step').forEach((el, index) => {
    const stepNum = index + 1;
    el.classList.remove('active', 'completed');
    
    if (stepNum < step) {
      el.classList.add('completed');
    } else if (stepNum === step) {
      el.classList.add('active');
    }
  });
  
  // Update progress bar
  const progress = ((step - 1) / 3) * 100;
  progressFill.style.width = `${progress}%`;
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// Validation Functions
// ============================================

function validateStep(step) {
  if (step === 1) {
    const fullName = document.getElementById('fullName').value.trim();
    const bio = document.getElementById('bio').value.trim();
    
    if (!fullName || fullName.length < 2) {
      showAlert('Bitte gib deinen vollständigen Namen ein', 'error');
      return false;
    }
    
    if (!bio || bio.length < 20) {
      showAlert('Bitte gib eine aussagekräftige Bio ein (mindestens 20 Zeichen)', 'error');
      return false;
    }
    
    return true;
  }
  
  if (step === 2) {
    if (!selectedNiche) {
      showAlert('Bitte wähle deine Coaching-Nische aus', 'error');
      return false;
    }
    
    return true;
  }
  
  if (step === 3) {
    const subdomain = document.getElementById('subdomain').value.trim();
    
    if (!subdomain || subdomain.length < 3) {
      showAlert('Bitte gib eine gültige Subdomain ein (mindestens 3 Zeichen)', 'error');
      return false;
    }
    
    if (!subdomainAvailable) {
      showAlert('Die gewählte Subdomain ist nicht verfügbar', 'error');
      return false;
    }
    
    return true;
  }
  
  return true;
}

// ============================================
// Save Step Data
// ============================================

function saveStepData(step) {
  if (step === 1) {
    onboardingData.fullName = document.getElementById('fullName').value.trim();
    onboardingData.phone = document.getElementById('phone').value.trim();
    onboardingData.bio = document.getElementById('bio').value.trim();
    onboardingData.instagram = document.getElementById('instagram').value.trim();
    onboardingData.website = document.getElementById('website').value.trim();
  }
  
  if (step === 2) {
    onboardingData.niche = selectedNiche;
    const specializationsInput = document.getElementById('specializations').value.trim();
    onboardingData.specializations = specializationsInput
      ? specializationsInput.split(',').map(s => s.trim()).filter(s => s)
      : [];
  }
  
  if (step === 3) {
    onboardingData.subdomain = document.getElementById('subdomain').value.trim().toLowerCase();
  }
}

// ============================================
// Complete Onboarding
// ============================================

async function completeOnboarding() {
  // Validate final step
  if (!validateStep(3)) {
    return;
  }
  
  // Save final step data
  saveStepData(3);
  
  // Disable button and show loading
  const completeBtn = document.getElementById('completeBtn');
  completeBtn.disabled = true;
  completeBtn.textContent = 'Wird erstellt...';
  
  try {
    // Create coach profile in database
    const { data: coach, error: coachError } = await supabaseClient
      .from('coaches')
      .insert({
        user_id: currentUser.id,
        email: currentUser.email,
        full_name: onboardingData.fullName,
        subdomain: onboardingData.subdomain,
        bio: onboardingData.bio,
        coaching_niche: onboardingData.niche,
        specializations: onboardingData.specializations,
        phone: onboardingData.phone || null,
        instagram: onboardingData.instagram || null,
        website: onboardingData.website || null,
        onboarding_completed: true,
        is_active: true
      })
      .select()
      .single();
    
    if (coachError) {
      throw coachError;
    }
    
    // Store coach ID for future use
    sessionStorage.setItem('coachId', coach.id);
    
    // Show completion step
    currentStep = 4;
    showStep(4);
    
  } catch (error) {
    console.error('Error completing onboarding:', error);
    
    let errorMessage = 'Fehler beim Erstellen des Profils. Bitte versuche es erneut.';
    
    if (error.message.includes('duplicate') || error.message.includes('unique')) {
      errorMessage = 'Diese Subdomain oder E-Mail ist bereits vergeben.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    showAlert(errorMessage, 'error');
    
    // Re-enable button
    completeBtn.disabled = false;
    completeBtn.textContent = 'Abschließen';
  }
}

// ============================================
// Alert Functions
// ============================================

function showAlert(message, type = 'error') {
  alertBox.textContent = message;
  alertBox.className = `alert ${type}`;
  alertBox.style.display = 'block';
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    alertBox.style.display = 'none';
  }, 5000);
  
  // Scroll to top to show alert
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
