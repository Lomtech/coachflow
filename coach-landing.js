const SUPABASE_URL = '__SUPABASE_URL__';
const SUPABASE_ANON_KEY = '__SUPABASE_ANON_KEY__';
const STRIPE_PUBLISHABLE_KEY = '__STRIPE_PUBLISHABLE_KEY__';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const stripe = Stripe(STRIPE_PUBLISHABLE_KEY);

let currentCoach = null;

(async function init() {
  try {
    // Get subdomain from URL parameter or actual subdomain
    const urlParams = new URLSearchParams(window.location.search);
    const subdomainParam = urlParams.get('subdomain');
    
    let subdomain = subdomainParam;
    
    if (!subdomain) {
      // Extract subdomain from hostname
      const hostname = window.location.hostname;
      const parts = hostname.split('.');
      
      // Check if we have a subdomain (e.g., coachname.coachflow.app)
      if (parts.length > 2 && parts[0] !== 'www') {
        subdomain = parts[0];
      }
    }
    
    if (!subdomain) {
      showError('Kein Coach gefunden');
      return;
    }
    
    // Load coach profile
    const { data: coach, error } = await supabaseClient
      .from('coaches')
      .select('*')
      .eq('subdomain', subdomain)
      .eq('is_active', true)
      .single();
    
    if (error || !coach) {
      showError('Coach nicht gefunden');
      return;
    }
    
    currentCoach = coach;
    
    // Load packages
    await loadLandingPage();
    
  } catch (error) {
    console.error('Init error:', error);
    showError('Fehler beim Laden der Seite');
  }
})();

async function loadLandingPage() {
  // Update coach info
  document.getElementById('coachName').textContent = currentCoach.full_name;
  document.getElementById('heroTitle').textContent = `Willkommen bei ${currentCoach.full_name}`;
  document.getElementById('heroBio').textContent = currentCoach.bio || 'Dein Weg zum Erfolg beginnt hier';
  document.getElementById('aboutText').textContent = currentCoach.bio || '';
  
  // Load packages
  const { data: packages, error } = await supabaseClient
    .from('packages')
    .select('*')
    .eq('coach_id', currentCoach.id)
    .eq('is_published', true)
    .eq('is_active', true)
    .order('display_order', { ascending: true });
  
  if (error) {
    console.error('Error loading packages:', error);
  }
  
  const packagesGrid = document.getElementById('packagesGrid');
  
  if (!packages || packages.length === 0) {
    packagesGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #6b7280;">Noch keine Pakete verfügbar</p>';
  } else {
    packagesGrid.innerHTML = packages.map(pkg => `
      <div class="package-card">
        <h4>${pkg.name}</h4>
        <div class="price">
          €${pkg.price_amount}
          <span>/${pkg.billing_interval === 'month' ? 'Monat' : pkg.billing_interval === 'year' ? 'Jahr' : 'einmalig'}</span>
        </div>
        <p>${pkg.short_description || pkg.description || ''}</p>
        ${pkg.features ? `
          <ul>
            ${JSON.parse(pkg.features).slice(0, 5).map(f => `<li>✓ ${f.text || f}</li>`).join('')}
          </ul>
        ` : ''}
        <button class="btn-subscribe" onclick="subscribeToPackage('${pkg.id}', '${pkg.stripe_price_id || ''}')">
          Jetzt abonnieren
        </button>
      </div>
    `).join('');
  }
  
  // Show content, hide loading
  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('landingContent').style.display = 'block';
}

async function subscribeToPackage(packageId, stripePriceId) {
  if (!stripePriceId) {
    alert('Zahlung ist für dieses Paket noch nicht konfiguriert. Bitte kontaktiere den Coach direkt.');
    return;
  }
  
  try {
    // Here you would create a Stripe Checkout session
    // For now, we'll show a message
    alert('Stripe Checkout wird geöffnet... (Integration in Entwicklung)');
    
    // TODO: Create Stripe Checkout session via Netlify function
    // const response = await fetch('/.netlify/functions/create-checkout-session', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ packageId, coachId: currentCoach.id })
    // });
    // const { sessionId } = await response.json();
    // await stripe.redirectToCheckout({ sessionId });
    
  } catch (error) {
    console.error('Subscribe error:', error);
    alert('Fehler beim Starten des Checkout-Prozesses');
  }
}

function showError(message) {
  document.getElementById('loadingState').innerHTML = `
    <div style="text-align: center; padding: 100px 20px;">
      <h2 style="font-size: 48px; margin-bottom: 20px;">⚠️</h2>
      <h3 style="font-size: 24px; color: #1f2937; margin-bottom: 12px;">${message}</h3>
      <p style="color: #6b7280;">Bitte überprüfe die URL und versuche es erneut.</p>
      <a href="/" style="display: inline-block; margin-top: 24px; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px;">Zur Startseite</a>
    </div>
  `;
}