
// ============================================
// Coach Authentication Handler
// ============================================

// Configuration
const SUPABASE_URL = "__SUPABASE_URL__";
const SUPABASE_ANON_KEY = "__SUPABASE_ANON_KEY__";
const DEBUG = true;

function debugLog(...args) {
    if (DEBUG) {
        console.log('[COACH AUTH]', ...args);
    }
}

// Initialize Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper function to show messages
function showMessage(message, type = 'error') {
    const container = document.getElementById('messageContainer');
    const className = type === 'success' ? 'success-message' : 'error-message';
    container.innerHTML = `<div class="${className}">${message}</div>`;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}

// Helper function to generate slug from business name
function generateSlug(text) {
    return text
        .toLowerCase()
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// ============================================
// REGISTER PAGE
// ============================================

if (window.location.pathname.includes('coach-register')) {
    const registerForm = document.getElementById('registerForm');
    const businessNameInput = document.getElementById('businessName');
    const slugInput = document.getElementById('slug');

    // Auto-generate slug from business name
    businessNameInput?.addEventListener('input', (e) => {
        const slug = generateSlug(e.target.value);
        slugInput.value = slug;
    });

    registerForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const businessName = document.getElementById('businessName').value;
        const slug = document.getElementById('slug').value;
        const description = document.getElementById('description').value;
        const acceptTerms = document.getElementById('acceptTerms').checked;

        if (!acceptTerms) {
            showMessage('Bitte akzeptiere die AGB und Datenschutzerklärung.');
            return;
        }

        // Validate slug format
        if (!/^[a-z0-9-]+$/.test(slug)) {
            showMessage('Der Slug darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten.');
            return;
        }

        try {
            debugLog('Starting coach registration...', { email, slug });

            // 1. Register user with Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        name: name,
                        role: 'coach'
                    }
                }
            });

            if (authError) {
                throw new Error(authError.message);
            }

            debugLog('User created:', authData);

            // 2. Create coach profile
            const { data: coachData, error: coachError } = await supabase
                .from('coaches')
                .insert({
                    auth_user_id: authData.user.id,
                    email: email,
                    name: name,
                    business_name: businessName,
                    slug: slug,
                    description: description
                })
                .select()
                .single();

            if (coachError) {
                debugLog('Coach creation error:', coachError);
                throw new Error('Fehler beim Erstellen des Coach-Profils: ' + coachError.message);
            }

            debugLog('Coach profile created:', coachData);

            // 3. Update profile role
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ role: 'coach' })
                .eq('id', authData.user.id);

            if (profileError) {
                debugLog('Profile update error:', profileError);
            }

            showMessage('Registrierung erfolgreich! Du wirst zum Dashboard weitergeleitet...', 'success');
            
            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
                window.location.href = 'coach-dashboard.html';
            }, 2000);

        } catch (error) {
            debugLog('Registration error:', error);
            showMessage(error.message || 'Fehler bei der Registrierung. Bitte versuche es erneut.');
        }
    });
}

// ============================================
// LOGIN PAGE
// ============================================

if (window.location.pathname.includes('coach-login')) {
    const loginForm = document.getElementById('loginForm');

    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            debugLog('Starting coach login...', { email });

            // Sign in with Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (authError) {
                throw new Error(authError.message);
            }

            debugLog('Login successful:', authData);

            // Verify user is a coach
            const { data: coachData, error: coachError } = await supabase
                .from('coaches')
                .select('*')
                .eq('auth_user_id', authData.user.id)
                .single();

            if (coachError || !coachData) {
                // Not a coach account
                await supabase.auth.signOut();
                throw new Error('Dieser Account ist kein Coach-Account. Bitte registriere dich als Coach.');
            }

            debugLog('Coach verified:', coachData);

            // Redirect to dashboard
            window.location.href = 'coach-dashboard.html';

        } catch (error) {
            debugLog('Login error:', error);
            showMessage(error.message || 'Fehler beim Login. Bitte überprüfe deine Zugangsdaten.');
        }
    });
}

// ============================================
// SESSION CHECK (for all coach pages)
// ============================================

async function checkCoachSession() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
            debugLog('No session found, redirecting to login...');
            if (!window.location.pathname.includes('coach-login') && 
                !window.location.pathname.includes('coach-register')) {
                window.location.href = 'coach-login.html';
            }
            return null;
        }

        // Verify user is a coach
        const { data: coachData, error: coachError } = await supabase
            .from('coaches')
            .select('*')
            .eq('auth_user_id', session.user.id)
            .single();

        if (coachError || !coachData) {
            debugLog('User is not a coach, redirecting to login...');
            await supabase.auth.signOut();
            if (!window.location.pathname.includes('coach-login') && 
                !window.location.pathname.includes('coach-register')) {
                window.location.href = 'coach-login.html';
            }
            return null;
        }

        debugLog('Coach session verified:', coachData);
        return { session, coach: coachData };

    } catch (error) {
        debugLog('Session check error:', error);
        return null;
    }
}

// Export for use in other scripts
window.checkCoachSession = checkCoachSession;
window.supabaseCoach = supabase;
