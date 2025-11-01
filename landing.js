
// CoachFlow Landing Page - Stripe Checkout Integration

// These placeholders will be replaced with actual environment variables during build
const STRIPE_PUBLISHABLE_KEY = '__STRIPE_PUBLISHABLE_KEY__';

const STRIPE_PRICES = {
  basic: '__STRIPE_PRICE_BASIC__',
  premium: '__STRIPE_PRICE_PREMIUM__',
  elite: '__STRIPE_PRICE_ELITE__',
};

let stripe = null;

// Initialize Stripe
document.addEventListener('DOMContentLoaded', () => {
  if (typeof Stripe !== 'undefined') {
    stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
    console.log('Stripe initialized');
  } else {
    console.error('Stripe.js not loaded');
  }

  // Setup form handlers
  setupFormHandler('basicForm', 'basic');
  setupFormHandler('premiumForm', 'premium');
  setupFormHandler('eliteForm', 'elite');
});

function setupFormHandler(formId, plan) {
  const form = document.getElementById(formId);
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = form.querySelector('input[name="name"]').value;
    const email = form.querySelector('input[name="email"]').value;
    
    if (!name || !email) {
      alert('Bitte fülle alle Felder aus');
      return;
    }

    await handleCheckout(plan, email, name);
  });
}

async function handleCheckout(plan, email, name) {
  if (!stripe) {
    alert('Stripe ist nicht verfügbar. Bitte lade die Seite neu.');
    return;
  }

  const button = event.target.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = 'Wird geladen...';

  try {
    // Call Netlify function to create checkout session
    const response = await fetch('/.netlify/functions/create-coach-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plan,
        email,
        name
      })
    });

    if (!response.ok) {
      throw new Error('Fehler beim Erstellen der Checkout-Session');
    }

    const { sessionId } = await response.json();

    // Redirect to Stripe Checkout
    const { error } = await stripe.redirectToCheckout({
      sessionId: sessionId
    });

    if (error) {
      console.error('Stripe error:', error);
      alert('Fehler: ' + error.message);
    }
  } catch (error) {
    console.error('Checkout error:', error);
    alert('Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
  } finally {
    button.disabled = false;
    button.textContent = plan.charAt(0).toUpperCase() + plan.slice(1) + ' wählen';
  }
}

// Smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth'
      });
    }
  });
});
