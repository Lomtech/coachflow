
// ============================================
// Coach Registration Script
// ============================================

const SUPABASE_URL = '__SUPABASE_URL__';
const SUPABASE_ANON_KEY = '__SUPABASE_ANON_KEY__';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Form elements
const form = document.getElementById('registerForm');
const submitBtn = document.getElementById('submitBtn');
const btnText = document.getElementById('btnText');
const btnSpinner = document.getElementById('btnSpinner');
const alertBox = document.getElementById('alertBox');

// Input fields
const fullNameInput = document.getElementById('fullName');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');

// Error displays
const fullNameError = document.getElementById('fullNameError');
const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');
const confirmPasswordError = document.getElementById('confirmPasswordError');

// ============================================
// Validation Functions
// ============================================

function validateFullName(name) {
  if (!name || name.trim().length < 2) {
    return 'Name muss mindestens 2 Zeichen lang sein';
  }
  return null;
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return 'Bitte gebe eine gültige E-Mail-Adresse ein';
  }
  return null;
}

function validatePassword(password) {
  if (!password || password.length < 8) {
    return 'Passwort muss mindestens 8 Zeichen lang sein';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Passwort muss mindestens einen Großbuchstaben enthalten';
  }
  if (!/[a-z]/.test(password)) {
    return 'Passwort muss mindestens einen Kleinbuchstaben enthalten';
  }
  if (!/[0-9]/.test(password)) {
    return 'Passwort muss mindestens eine Zahl enthalten';
  }
  return null;
}

function validateConfirmPassword(password, confirmPassword) {
  if (password !== confirmPassword) {
    return 'Passwörter stimmen nicht überein';
  }
  return null;
}

// ============================================
// Show Alert Function
// ============================================

function showAlert(message, type = 'error') {
  alertBox.textContent = message;
  alertBox.className = `alert ${type}`;
  alertBox.style.display = 'block';
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    alertBox.style.display = 'none';
  }, 5000);
}

// ============================================
// Loading State
// ============================================

function setLoading(loading) {
  if (loading) {
    submitBtn.disabled = true;
    btnText.style.display = 'none';
    btnSpinner.style.display = 'block';
  } else {
    submitBtn.disabled = false;
    btnText.style.display = 'inline';
    btnSpinner.style.display = 'none';
  }
}

// ============================================
// Real-time Validation
// ============================================

fullNameInput.addEventListener('blur', () => {
  const error = validateFullName(fullNameInput.value);
  fullNameError.textContent = error || '';
});

emailInput.addEventListener('blur', () => {
  const error = validateEmail(emailInput.value);
  emailError.textContent = error || '';
});

passwordInput.addEventListener('blur', () => {
  const error = validatePassword(passwordInput.value);
  passwordError.textContent = error || '';
});

confirmPasswordInput.addEventListener('blur', () => {
  const error = validateConfirmPassword(passwordInput.value, confirmPasswordInput.value);
  confirmPasswordError.textContent = error || '';
});

// ============================================
// Form Submission
// ============================================

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Clear previous errors
  fullNameError.textContent = '';
  emailError.textContent = '';
  passwordError.textContent = '';
  confirmPasswordError.textContent = '';
  
  // Get form values
  const fullName = fullNameInput.value.trim();
  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;
  
  // Validate all fields
  let hasErrors = false;
  
  const fullNameErr = validateFullName(fullName);
  if (fullNameErr) {
    fullNameError.textContent = fullNameErr;
    hasErrors = true;
  }
  
  const emailErr = validateEmail(email);
  if (emailErr) {
    emailError.textContent = emailErr;
    hasErrors = true;
  }
  
  const passwordErr = validatePassword(password);
  if (passwordErr) {
    passwordError.textContent = passwordErr;
    hasErrors = true;
  }
  
  const confirmPasswordErr = validateConfirmPassword(password, confirmPassword);
  if (confirmPasswordErr) {
    confirmPasswordError.textContent = confirmPasswordErr;
    hasErrors = true;
  }
  
  if (hasErrors) {
    showAlert('Bitte korrigiere die markierten Fehler', 'error');
    return;
  }
  
  // Start loading
  setLoading(true);
  
  try {
    // Step 1: Sign up user with Supabase Auth
    const { data: authData, error: authError } = await supabaseClient.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${window.location.origin}/coach-onboarding.html`
      }
    });
    
    if (authError) {
      throw new Error(authError.message);
    }
    
    if (!authData.user) {
      throw new Error('Registrierung fehlgeschlagen. Bitte versuche es erneut.');
    }
    
    // Show success message
    showAlert(
      'Registrierung erfolgreich! Bitte bestätige deine E-Mail-Adresse. Du wirst zur Onboarding-Seite weitergeleitet...',
      'success'
    );
    
    // Store email temporarily for onboarding
    sessionStorage.setItem('coachEmail', email);
    sessionStorage.setItem('coachName', fullName);
    
    // Wait 2 seconds then redirect to onboarding
    setTimeout(() => {
      window.location.href = 'coach-onboarding.html';
    }, 2000);
    
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle specific error messages
    let errorMessage = 'Registrierung fehlgeschlagen. Bitte versuche es erneut.';
    
    if (error.message.includes('already registered')) {
      errorMessage = 'Diese E-Mail-Adresse ist bereits registriert. Bitte melde dich an.';
    } else if (error.message.includes('email')) {
      errorMessage = 'Ungültige E-Mail-Adresse. Bitte überprüfe deine Eingabe.';
    } else if (error.message.includes('password')) {
      errorMessage = 'Passwort erfüllt nicht die Anforderungen.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    showAlert(errorMessage, 'error');
    setLoading(false);
  }
});

// ============================================
// Check if already logged in
// ============================================

(async function checkAuth() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  
  if (session) {
    // Check if coach profile exists
    const { data: coach } = await supabaseClient
      .from('coaches')
      .select('onboarding_completed')
      .eq('user_id', session.user.id)
      .single();
    
    if (coach && coach.onboarding_completed) {
      // Redirect to dashboard
      window.location.href = 'coach-dashboard.html';
    } else {
      // Redirect to onboarding
      window.location.href = 'coach-onboarding.html';
    }
  }
})();
