// ============================================
// CODE-GLIEDERUNG (Übersicht für schnelle Navigation)
// ============================================
// Suche im Code nach: "// ()>>> GLIEDERUNGSPUNKT X: BEZEICHNUNG"
//
// 1. KONFIGURATION (Supabase & Stripe)
// 2. GLOBALE VARIABLEN & HILFSFUNKTIONEN
// 3. COOKIE-CONSENT & DSGVO
// 4. DEMO-INHALTE & PLAN-HIERARCHIE
// 5. INITIALISIERUNG (DOMContentLoaded)
// 6. AUTHENTIFIZIERUNG (Session & Subscription laden)
// 7. EVENT LISTENERS (Navigation, Modals, Forms, Tabs, Cookie)
// 8. LOGIN & REGISTRATION (handleLogin, handleRegister, logout)
// 9. SUBSCRIPTION & PAYMENT (Klicken, Modal, Stripe/Demo-Zahlung)
// 10. UP- & DOWNGRADE MANAGEMENT (NEU)
// 11. UI-UPDATES (angemeldet/abgemeldet, User-Info)
// 12. CONTENT MANAGEMENT (Laden, Zugriffsprüfung, Item-Erstellung, Tab-Wechsel)
// 13. UTILITY FUNCTIONS (Modal, Alert)
// ============================================

// ============================================
// >>> GLIEDERUNGSPUNKT 1: KONFIGURATION
// ============================================
const SUPABASE_URL = "DEIN_SUPABASE_URL";
const SUPABASE_ANON_KEY = "DEIN_SUPABASE_ANON_KEY";
const STRIPE_PUBLISHABLE_KEY = "DEIN_STRIPE_PUBLISHABLE_KEY";

const STRIPE_PRICES = {
  basic: "price_BASIC_ID",
  premium: "price_PREMIUM_ID",
  elite: "price_ELITE_ID",
};

let stripe = null;
const DEBUG = true;

function debugLog(...args) {
  if (DEBUG) {
    console.log("[DEBUG]", ...args);
  }
}

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
debugLog("Supabase initialisiert:", {
  url: SUPABASE_URL,
  keyPrefix: SUPABASE_ANON_KEY.substring(0, 20) + "...",
});

// ============================================
// >>> GLIEDERUNGSPUNKT 2: GLOBALE VARIABLEN & HILFSFUNKTIONEN
// ============================================
let currentUser = null;
let userSubscription = null;

// ============================================
// >>> GLIEDERUNGSPUNKT 3: COOKIE-CONSENT & DSGVO
// ============================================
const CookieConsent = {
  CONSENT_COOKIE: "fitticoach_cookie_consent",
  CONSENT_EXPIRY_DAYS: 365,
  hasConsent() {
    return localStorage.getItem(this.CONSENT_COOKIE) !== null;
  },
  getConsent() {
    const consent = localStorage.getItem(this.CONSENT_COOKIE);
    return consent ? JSON.parse(consent) : null;
  },
  setConsent(analytics = false, marketing = false) {
    const consent = {
      essential: true,
      analytics: analytics,
      marketing: marketing,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(this.CONSENT_COOKIE, JSON.stringify(consent));
    debugLog("Cookie-Zustimmung gespeichert:", consent);
  },
  showBanner() {
    const banner = document.getElementById("cookieConsent");
    if (banner) {
      banner.style.display = "block";
      setTimeout(() => {
        banner.classList.add("show");
      }, 100);
    }
  },
  hideBanner() {
    const banner = document.getElementById("cookieConsent");
    if (banner) {
      banner.classList.remove("show");
      setTimeout(() => {
        banner.style.display = "none";
      }, 300);
    }
  },
  canUseAnalytics() {
    const consent = this.getConsent();
    return consent && consent.analytics;
  },
  canUseMarketing() {
    const consent = this.getConsent();
    return consent && consent.marketing;
  },
  init() {
    if (!this.hasConsent()) {
      this.showBanner();
    } else {
      debugLog("Cookie-Zustimmung bereits vorhanden");
      if (this.canUseAnalytics()) {
        this.loadAnalytics();
      }
    }
  },
  loadAnalytics() {
    debugLog("Analytics wird geladen (Zustimmung vorhanden)");
  },
};

// ============================================
// >>> GLIEDERUNGSPUNKT 4: DEMO-INHALTE & PLAN-HIERARCHIE
// ============================================
const demoContent = {
  videos: [
    {
      id: 1,
      title: "Ganzkörper-Workout",
      description: "Komplettes 30-Minuten Training",
      url: "https://ftohghotvfgkoeclmwfv.supabase.co/storage/v1/object/public/videos/basic/WhatsApp%20Video%202025-10-30%20at%2002.38.17.mp4",
      thumbnail:
        "https://ftohghotvfgkoeclmwfv.supabase.co/storage/v1/object/public/images/thumbnails/ChatGPT%20Image%2030.%20Okt.%202025,%2012_46_55.png",
      requiredPlan: "basic",
    },
    {
      id: 2,
      title: "Core-Strengthening",
      description: "Intensives Bauchmuskeltraining",
      url: "https://ftohghotvfgkoeclmwfv.supabase.co/storage/v1/object/public/videos/basic/WhatsApp%20Video%202025-10-30%20at%2002.38.17.mp4",
      thumbnail:
        "https://ftohghotvfgkoeclmwfv.supabase.co/storage/v1/object/public/images/thumbnails/ChatGPT%20Image%2030.%20Okt.%202025,%2012_46_55.png",
      requiredPlan: "basic",
    },
    {
      id: 3,
      title: "HIIT Advanced",
      description: "Hochintensives Intervalltraining",
      url: "https://ftohghotvfgkoeclmwfv.supabase.co/storage/v1/object/public/videos/basic/WhatsApp%20Video%202025-10-30%20at%2002.38.17.mp4",
      thumbnail:
        "https://ftohghotvfgkoeclmwfv.supabase.co/storage/v1/object/public/images/thumbnails/ChatGPT%20Image%2030.%20Okt.%202025,%2012_46_55.png",
      requiredPlan: "premium",
    },
    {
      id: 4,
      title: "Yoga & Mobility",
      description: "Flexibilität und Entspannung",
      url: "https://ftohghotvfgkoeclmwfv.supabase.co/storage/v1/object/public/videos/basic/WhatsApp%20Video%202025-10-30%20at%2002.38.17.mp4",
      thumbnail:
        "https://ftohghotvfgkoeclmwfv.supabase.co/storage/v1/object/public/images/thumbnails/ChatGPT%20Image%2030.%20Okt.%202025,%2012_46_55.png",
      requiredPlan: "premium",
    },
    {
      id: 5,
      title: "Personal Training Session",
      description: "Exklusive 1:1 Trainingseinheit",
      url: "https://example.com/video5.mp4",
      thumbnail:
        "https://ftohghotvfgkoeclmwfv.supabase.co/storage/v1/object/public/images/thumbnails/ChatGPT%20Image%2030.%20Okt.%202025,%2012_46_55.png",
      requiredPlan: "elite",
    },
  ],
  documents: [
    {
      id: 1,
      title: "12-Wochen Trainingsplan",
      description: "Strukturierter Aufbauplan",
      url: "https://example.com/doc1.pdf",
      thumbnail:
        "https://ftohghotvfgkoeclmwfv.supabase.co/storage/v1/object/public/images/thumbnails/ChatGPT%20Image%2030.%20Okt.%202025,%2012_46_55.png",
      requiredPlan: "basic",
    },
    {
      id: 2,
      title: "Ernährungsguide Premium",
      description: "Detaillierter Meal-Plan mit Rezepten",
      url: "https://example.com/doc2.pdf",
      thumbnail:
        "https://ftohghotvfgkoeclmwfv.supabase.co/storage/v1/object/public/images/thumbnails/ChatGPT%20Image%2030.%20Okt.%202025,%2012_46_55.png",
      requiredPlan: "premium",
    },
    {
      id: 3,
      title: "Supplement Guide",
      description: "Alles über Nahrungsergänzung",
      url: "https://example.com/doc3.pdf",
      thumbnail:
        "https://ftohghotvfgkoeclmwfv.supabase.co/storage/v1/object/public/images/thumbnails/ChatGPT%20Image%2030.%20Okt.%202025,%2012_46_55.png",
      requiredPlan: "premium",
    },
    {
      id: 4,
      title: "Persönlicher Trainingsplan",
      description: "Individuell auf dich zugeschnitten",
      url: "https://example.com/doc4.pdf",
      thumbnail:
        "https://ftohghotvfgkoeclmwfv.supabase.co/storage/v1/object/public/images/thumbnails/ChatGPT%20Image%2030.%20Okt.%202025,%2012_46_55.png",
      requiredPlan: "elite",
    },
  ],
  images: [
    {
      id: 1,
      title: "Übungskatalog Basics",
      description: "Alle grundlegenden Übungen",
      url: "https://ftohghotvfgkoeclmwfv.supabase.co/storage/v1/object/public/images/thumbnails/ChatGPT%20Image%2030.%20Okt.%202025,%2012_46_55.png",
      thumbnail:
        "https://ftohghotvfgkoeclmwfv.supabase.co/storage/v1/object/public/images/thumbnails/ChatGPT%20Image%2030.%20Okt.%202025,%2012_46_55.png",
      requiredPlan: "basic",
    },
    {
      id: 2,
      title: "Anatomy Guide",
      description: "Muskelgruppen verstehen",
      url: "https://ftohghotvfgkoeclmwfv.supabase.co/storage/v1/object/public/images/thumbnails/ChatGPT%20Image%2030.%20Okt.%202025,%2012_46_55.png",
      thumbnail:
        "https://ftohghotvfgkoeclmwfv.supabase.co/storage/v1/object/public/images/thumbnails/ChatGPT%20Image%2030.%20Okt.%202025,%2012_46_55.png",
      requiredPlan: "premium",
    },
    {
      id: 3,
      title: "Advanced Techniques",
      description: "Fortgeschrittene Trainingsmethoden",
      url: "https://ftohghotvfgkoeclmwfv.supabase.co/storage/v1/object/public/images/thumbnails/ChatGPT%20Image%2030.%20Okt.%202025,%2012_46_55.png",
      thumbnail:
        "https://ftohghotvfgkoeclmwfv.supabase.co/storage/v1/object/public/images/thumbnails/ChatGPT%20Image%2030.%20Okt.%202025,%2012_46_55.png",
      requiredPlan: "elite",
    },
  ],
};

const planHierarchy = {
  basic: 1,
  premium: 2,
  elite: 3,
};

const planPrices = {
  basic: 29,
  premium: 59,
  elite: 99,
};

const planNames = {
  basic: "Basis",
  premium: "Premium",
  elite: "Elite",
};

// ============================================
// >>> GLIEDERUNGSPUNKT 5: INITIALISIERUNG
// ============================================
document.addEventListener("DOMContentLoaded", async () => {
  CookieConsent.init();
  debugLog("STRIPE_PUBLISHABLE_KEY:", STRIPE_PUBLISHABLE_KEY);
  if (CookieConsent.hasConsent()) {
    if (STRIPE_PUBLISHABLE_KEY !== "DEIN_STRIPE_PUBLISHABLE_KEY") {
      debugLog("Stripe Key ist gesetzt, versuche zu initialisieren...");
      if (typeof Stripe === "undefined") {
        console.error("Stripe.js Bibliothek nicht geladen!");
        showAlert(
          "Stripe.js konnte nicht geladen werden. Bitte Seite neu laden.",
          "error"
        );
      } else {
        try {
          stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
          debugLog("Stripe erfolgreich initialisiert");
          console.log("Stripe ist bereit für Zahlungen!");
        } catch (error) {
          console.error("Stripe Initialisierungsfehler:", error);
          showAlert(
            "Stripe konnte nicht geladen werden. Zahlungen sind deaktiviert.",
            "error"
          );
        }
      }
    } else {
      console.warn(
        "Stripe Publishable Key nicht konfiguriert - Demo-Modus aktiv"
      );
    }
  } else {
    console.log("Stripe-Initialisierung wartet auf Cookie-Zustimmung");
  }
  await checkUserSession();
  initializeEventListeners();
});

// ============================================
// >>> GLIEDERUNGSPUNKT 6: AUTHENTIFIZIERUNG
// ============================================
async function checkUserSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session) {
    currentUser = session.user;
    await loadUserSubscription();
    updateUIForLoggedInUser();
  } else {
    updateUIForLoggedOutUser();
  }
}

async function loadUserSubscription() {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", currentUser.id)
    .eq("status", "active")
    .single();
  if (data) {
    userSubscription = data;
  }
}

// ============================================
// >>> GLIEDERUNGSPUNKT 7: EVENT LISTENERS
// ============================================
function initializeEventListeners() {
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      showModal("loginModal");
    });
  }
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }
  const ctaBtn = document.getElementById("ctaBtn");
  if (ctaBtn) {
    ctaBtn.addEventListener("click", () => {
      document.getElementById("pricing").scrollIntoView({ behavior: "smooth" });
    });
  }
  document.querySelectorAll(".close").forEach((closeBtn) => {
    closeBtn.addEventListener("click", function () {
      this.closest(".modal").style.display = "none";
    });
  });
  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
      e.target.style.display = "none";
    }
  });
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", handleRegister);
  }
  const paymentForm = document.getElementById("paymentForm");
  if (paymentForm) {
    paymentForm.addEventListener("submit", handlePayment);
  }
  const showRegisterLink = document.getElementById("showRegister");
  if (showRegisterLink) {
    showRegisterLink.addEventListener("click", (e) => {
      e.preventDefault();
      hideModal("loginModal");
      showModal("registerModal");
    });
  }
  const showLoginLink = document.getElementById("showLogin");
  if (showLoginLink) {
    showLoginLink.addEventListener("click", (e) => {
      e.preventDefault();
      hideModal("registerModal");
      showModal("loginModal");
    });
  }
  document.querySelectorAll(".subscribe-btn").forEach((btn) => {
    btn.addEventListener("click", handleSubscriptionClick);
  });
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabName = btn.getAttribute("data-tab");
      switchTab(tabName);
    });
  });
  const acceptAllBtn = document.getElementById("acceptAll");
  if (acceptAllBtn) {
    acceptAllBtn.addEventListener("click", () => {
      CookieConsent.setConsent(true, true);
      CookieConsent.hideBanner();
      showAlert("Alle Cookies akzeptiert", "success");
      if (
        !stripe &&
        STRIPE_PUBLISHABLE_KEY !== "DEIN_STRIPE_PUBLISHABLE_KEY" &&
        typeof Stripe !== "undefined"
      ) {
        stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
        debugLog("Stripe nach Cookie-Zustimmung initialisiert");
      }
      CookieConsent.loadAnalytics();
    });
  }
  const acceptEssentialBtn = document.getElementById("acceptEssential");
  if (acceptEssentialBtn) {
    acceptEssentialBtn.addEventListener("click", () => {
      CookieConsent.setConsent(false, false);
      CookieConsent.hideBanner();
      showAlert("Nur notwendige Cookies akzeptiert", "success");
      if (
        !stripe &&
        STRIPE_PUBLISHABLE_KEY !== "DEIN_STRIPE_PUBLISHABLE_KEY" &&
        typeof Stripe !== "undefined"
      ) {
        stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
        debugLog("Stripe nach Cookie-Zustimmung initialisiert");
      }
    });
  }
  const openCookieSettings = document.getElementById("openCookieSettings");
  if (openCookieSettings) {
    openCookieSettings.addEventListener("click", (e) => {
      e.preventDefault();
      CookieConsent.showBanner();
    });
  }
}

// ============================================
// >>> GLIEDERUNGSPUNKT 8: LOGIN & REGISTRATION
// ============================================
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  debugLog("Login-Versuch:", { email });
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  debugLog("Login-Antwort:", { data, error });
  if (error) {
    console.error("Login error:", error);
    showAlert("Anmeldung fehlgeschlagen: " + error.message, "error");
    return;
  }
  debugLog("Login erfolgreich!");
  currentUser = data.user;
  await loadUserSubscription();
  updateUIForLoggedInUser();
  hideModal("loginModal");
  showAlert("Erfolgreich angemeldet!", "success");
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById("registerName").value;
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;
  const acceptPrivacy = document.getElementById("acceptPrivacy").checked;
  debugLog("Registrierungsversuch:", {
    name,
    email,
    passwordLength: password.length,
    acceptPrivacy,
  });
  if (!acceptPrivacy) {
    showAlert("Bitte akzeptiere die Datenschutzerklärung und AGB", "error");
    return;
  }
  if (password.length < 6) {
    showAlert("Passwort muss mindestens 6 Zeichen lang sein", "error");
    return;
  }
  try {
    debugLog("Sende Registrierung an Supabase...");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          privacy_accepted: true,
          privacy_accepted_at: new Date().toISOString(),
        },
        emailRedirectTo: window.location.origin,
      },
    });
    debugLog("Supabase Antwort:", { data, error });
    if (error) {
      console.error("Registration error:", error);
      if (error.message.includes("User already registered")) {
        showAlert(
          "Diese E-Mail ist bereits registriert. Bitte melde dich an.",
          "error"
        );
      } else if (error.message.includes("Database error")) {
        showAlert(
          "Datenbankfehler! Bitte öffne die Browser-Konsole (F12) für Details.",
          "error"
        );
      } else if (error.message.includes("Unable to validate email")) {
        showAlert(
          "E-Mail-Format ungültig. Bitte überprüfe die E-Mail-Adresse.",
          "error"
        );
      } else {
        showAlert("Registrierung fehlgeschlagen: " + error.message, "error");
      }
      return;
    }
    debugLog("Registrierung erfolgreich!", data);
    hideModal("registerModal");
    if (
      data.user &&
      data.user.identities &&
      data.user.identities.length === 0
    ) {
      showAlert(
        "Registrierung erfolgreich! Bitte bestätige deine E-Mail, um dich anzumelden.",
        "success"
      );
      debugLog("E-Mail-Bestätigung erforderlich");
    } else if (data.session) {
      debugLog("Auto-Login aktiv");
      currentUser = data.user;
      await loadUserSubscription();
      updateUIForLoggedInUser();
      showAlert("Registrierung und Anmeldung erfolgreich!", "success");
    } else {
      showAlert(
        "Registrierung erfolgreich! Du kannst dich jetzt anmelden.",
        "success"
      );
      debugLog("Manuelle Anmeldung erforderlich");
    }
  } catch (err) {
    console.error("Unexpected error:", err);
    showAlert(
      "Ein unerwarteter Fehler ist aufgetreten. Siehe Browser-Konsole (F12).",
      "error"
    );
  }
}

async function logout() {
  await supabase.auth.signOut();
  currentUser = null;
  userSubscription = null;
  updateUIForLoggedOutUser();
  showAlert("Erfolgreich abgemeldet", "success");
}

// ============================================
// >>> GLIEDERUNGSPUNKT 9: SUBSCRIPTION & PAYMENT
// ============================================
function handleSubscriptionClick(e) {
  const plan = e.target.getAttribute("data-plan");
  if (!currentUser) {
    showAlert("Bitte melde dich zuerst an", "error");
    showModal("loginModal");
    return;
  }

  if (userSubscription) {
    if (userSubscription.plan === plan) {
      showAlert("Du hast bereits diesen Plan", "info");
      return;
    }
    showChangePlanModal(plan);
    return;
  }

  showPaymentModal(plan);
}

function showPaymentModal(plan) {
  document.getElementById("paymentInfo").innerHTML = `
    <div class="alert alert-success">
      <strong>${planNames[plan]}-Plan</strong><br>
      €${planPrices[plan]} / Monat
    </div>
  `;
  document.getElementById("paymentForm").setAttribute("data-plan", plan);
  showModal("paymentModal");
}

async function handlePayment(e) {
  e.preventDefault();
  const plan = e.target.getAttribute("data-plan");
  if (!CookieConsent.hasConsent()) {
    showAlert(
      "Bitte akzeptiere die Cookie-Einstellungen, um fortzufahren.",
      "warning"
    );
    CookieConsent.showBanner();
    return;
  }
  if (!stripe) {
    showAlert(
      "Stripe ist nicht konfiguriert. Demo-Modus wird verwendet.",
      "warning"
    );
    return handleDemoPayment(plan);
  }
  debugLog("Starte Stripe Checkout für Plan:", plan);
  try {
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Wird geladen...";
    const { error: stripeError } = await stripe.redirectToCheckout({
      lineItems: [
        {
          price: STRIPE_PRICES[plan],
          quantity: 1,
        },
      ],
      mode: "subscription",
      successUrl: `${window.location.origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${window.location.origin}/?cancelled=true`,
      customerEmail: currentUser.email,
      clientReferenceId: currentUser.id,
    });
    if (stripeError) {
      console.error("Stripe Checkout Error:", stripeError);
      showAlert(
        "Fehler beim Öffnen der Zahlungsseite: " + stripeError.message,
        "error"
      );
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  } catch (error) {
    console.error("Payment error:", error);
    showAlert("Ein Fehler ist aufgetreten. Bitte versuche es erneut.", "error");
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Zur Zahlung";
    }
  }
}

async function handleDemoPayment(plan) {
  debugLog("Demo-Zahlung für Plan:", plan);
  showAlert("Zahlung wird verarbeitet... (Demo-Modus)", "success");
  await new Promise((resolve) => setTimeout(resolve, 1500));
  const { data, error } = await supabase
    .from("subscriptions")
    .insert([
      {
        user_id: currentUser.id,
        plan: plan,
        status: "active",
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ])
    .select()
    .single();
  if (error) {
    console.error("Subscription error:", error);
    showAlert("Fehler beim Erstellen des Abos", "error");
    return;
  }
  userSubscription = data;
  hideModal("paymentModal");
  updateUIForLoggedInUser();
  showAlert(
    "Zahlung erfolgreich! Willkommen im Mitgliederbereich! (Demo)",
    "success"
  );
}

// ============================================
// >>> GLIEDERUNGSPUNKT 10: UP- & DOWNGRADE MANAGEMENT (NEU)
// ============================================

function showChangePlanModal(newPlan) {
  const currentPlan = userSubscription.plan;
  const currentLevel = planHierarchy[currentPlan];
  const newLevel = planHierarchy[newPlan];
  const isUpgrade = newLevel > currentLevel;

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.id = "changePlanModal";
  modal.style.display = "block";

  const priceDiff = Math.abs(planPrices[newPlan] - planPrices[currentPlan]);

  modal.innerHTML = `
    <div class="modal-content">
      <span class="close">×</span>
      <h2>${isUpgrade ? "Upgrade" : "Downgrade"} deines Plans</h2>
      
      <div class="plan-change-info">
        <div class="current-plan-box">
          <h4>Aktueller Plan</h4>
          <div class="plan-details">
            <strong>${planNames[currentPlan]}</strong>
            <p>€${planPrices[currentPlan]}/Monat</p>
          </div>
        </div>
        
        <div class="arrow-icon">${isUpgrade ? "→" : "←"}</div>
        
        <div class="new-plan-box">
          <h4>Neuer Plan</h4>
          <div class="plan-details">
            <strong>${planNames[newPlan]}</strong>
            <p>€${planPrices[newPlan]}/Monat</p>
          </div>
        </div>
      </div>
      
      <div class="alert ${isUpgrade ? "alert-info" : "alert-warning"}">
        ${
          isUpgrade
            ? `<p><strong>Upgrade-Details:</strong></p>
           <ul>
             <li>Sofortiger Zugriff auf ${planNames[newPlan]}-Inhalte</li>
             <li>Preisdifferenz: +€${priceDiff}/Monat</li>
             <li>Nächste Abbuchung: €${planPrices[newPlan]}</li>
           </ul>`
            : `<p><strong>Downgrade-Details:</strong></p>
           <ul>
             <li>Änderung erfolgt zum Ende der aktuellen Abrechnungsperiode</li>
             <li>Du behältst Zugriff auf ${
               planNames[currentPlan]
             }-Inhalte bis: ${new Date(
                userSubscription.end_date
              ).toLocaleDateString("de-DE")}</li>
             <li>Ab dann: €${planPrices[newPlan]}/Monat</li>
             <li>Ersparnis: -€${priceDiff}/Monat</li>
           </ul>`
        }
      </div>
      
      <div class="modal-actions">
        <button type="button" class="btn-secondary cancel-change">Abbrechen</button>
        <button type="button" class="btn-primary confirm-change" data-new-plan="${newPlan}">
          ${isUpgrade ? "Jetzt upgraden" : "Downgrade bestätigen"}
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector(".close").addEventListener("click", () => {
    modal.remove();
  });

  modal.querySelector(".cancel-change").addEventListener("click", () => {
    modal.remove();
  });

  modal
    .querySelector(".confirm-change")
    .addEventListener("click", async (e) => {
      const newPlan = e.target.getAttribute("data-new-plan");
      await handlePlanChange(newPlan, isUpgrade);
      modal.remove();
    });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

async function handlePlanChange(newPlan, isUpgrade) {
  debugLog(`${isUpgrade ? "Upgrade" : "Downgrade"} zu Plan:`, newPlan);

  const confirmBtn = document.querySelector(".confirm-change");
  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.textContent = "Wird verarbeitet...";
  }

  try {
    if (isUpgrade) {
      await processUpgrade(newPlan);
    } else {
      await processDowngrade(newPlan);
    }
  } catch (error) {
    console.error("Plan change error:", error);
    showAlert(
      "Fehler beim Ändern des Plans. Bitte versuche es erneut.",
      "error"
    );
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.textContent = isUpgrade
        ? "Jetzt upgraden"
        : "Downgrade bestätigen";
    }
  }
}

async function processUpgrade(newPlan) {
  debugLog("Processing upgrade to:", newPlan);

  if (!stripe || STRIPE_PUBLISHABLE_KEY === "DEIN_STRIPE_PUBLISHABLE_KEY") {
    showAlert("Upgrade wird verarbeitet... (Demo-Modus)", "success");
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const { data, error } = await supabase
      .from("subscriptions")
      .update({
        plan: newPlan,
      })
      .eq("id", userSubscription.id)
      .select()
      .single();

    if (error) {
      console.error("Upgrade error:", error);
      showAlert("Fehler beim Upgrade", "error");
      return;
    }

    userSubscription = data;
    updateUIForLoggedInUser();
    showAlert(
      `Upgrade zu ${planNames[newPlan]} erfolgreich! (Demo)`,
      "success"
    );
  } else {
    showAlert("Weiterleitung zur Zahlungsseite...", "info");
    const { error: stripeError } = await stripe.redirectToCheckout({
      lineItems: [
        {
          price: STRIPE_PRICES[newPlan],
          quantity: 1,
        },
      ],
      mode: "subscription",
      successUrl: `${window.location.origin}/success.html?session_id={CHECKOUT_SESSION_ID}&upgrade=true`,
      cancelUrl: `${window.location.origin}/?cancelled=true`,
      customerEmail: currentUser.email,
      clientReferenceId: currentUser.id,
    });

    if (stripeError) {
      console.error("Stripe error:", stripeError);
      showAlert("Fehler beim Upgrade: " + stripeError.message, "error");
    }
  }
}

async function processDowngrade(newPlan) {
  debugLog("Processing downgrade to:", newPlan);

  showAlert("Downgrade wird verarbeitet...", "info");
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const { data, error } = await supabase
    .from("subscriptions")
    .update({
      pending_plan: newPlan,
      pending_change_date: userSubscription.end_date,
    })
    .eq("id", userSubscription.id)
    .select()
    .single();

  if (error) {
    console.error("Downgrade error:", error);
    showAlert("Fehler beim Downgrade", "error");
    return;
  }

  userSubscription = data;
  updateUIForLoggedInUser();

  const endDate = new Date(userSubscription.end_date).toLocaleDateString(
    "de-DE"
  );
  showAlert(
    `Downgrade zu ${planNames[newPlan]} vorgemerkt! Wechsel erfolgt am ${endDate}.`,
    "success"
  );
}

async function cancelPendingPlanChange() {
  if (!userSubscription.pending_plan) {
    showAlert("Keine ausstehende Plan-Änderung vorhanden", "info");
    return;
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .update({
      pending_plan: null,
      pending_change_date: null,
    })
    .eq("id", userSubscription.id)
    .select()
    .single();

  if (error) {
    console.error("Cancel pending change error:", error);
    showAlert("Fehler beim Stornieren", "error");
    return;
  }

  userSubscription = data;
  updateUIForLoggedInUser();
  showAlert("Geplante Plan-Änderung wurde storniert", "success");
}

// ============================================
// >>> GLIEDERUNGSPUNKT 11: UI-UPDATES
// ============================================
function updateUIForLoggedInUser() {
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  if (loginBtn) loginBtn.style.display = "none";
  if (logoutBtn) logoutBtn.style.display = "block";
  if (userSubscription) {
    const pricingSection = document.getElementById("pricing");
    if (pricingSection) {
      pricingSection.style.display = "none";
    }
    const membersArea = document.getElementById("membersArea");
    if (membersArea) {
      membersArea.style.display = "block";
    }
    displayUserInfo();
    updatePricingButtons();
    loadContent();
  } else {
    const pricingSection = document.getElementById("pricing");
    if (pricingSection) {
      pricingSection.style.display = "block";
    }
    const membersArea = document.getElementById("membersArea");
    if (membersArea) {
      membersArea.style.display = "none";
    }
    updatePricingButtons();
  }
}

function updateUIForLoggedOutUser() {
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const membersArea = document.getElementById("membersArea");
  const pricingSection = document.getElementById("pricing");
  if (loginBtn) loginBtn.style.display = "block";
  if (logoutBtn) logoutBtn.style.display = "none";
  if (membersArea) membersArea.style.display = "none";
  if (pricingSection) pricingSection.style.display = "block";
}

function updatePricingButtons() {
  document.querySelectorAll(".subscribe-btn").forEach((btn) => {
    const plan = btn.getAttribute("data-plan");

    if (!currentUser) {
      btn.textContent = "Jetzt starten";
      btn.className = "subscribe-btn btn-primary";
      btn.disabled = false;
      return;
    }

    if (!userSubscription) {
      btn.textContent = "Wählen";
      btn.className = "subscribe-btn btn-primary";
      btn.disabled = false;
      return;
    }

    const currentPlan = userSubscription.plan;
    const currentLevel = planHierarchy[currentPlan];
    const planLevel = planHierarchy[plan];

    if (currentPlan === plan) {
      btn.textContent = "Aktueller Plan";
      btn.className = "subscribe-btn btn-secondary";
      btn.disabled = true;
    } else if (planLevel > currentLevel) {
      btn.textContent = "Upgraden";
      btn.className = "subscribe-btn btn-success";
      btn.disabled = false;
    } else {
      btn.textContent = "Downgrade";
      btn.className = "subscribe-btn btn-warning";
      btn.disabled = false;
    }
  });
}

function displayUserInfo() {
  const userName = currentUser.user_metadata.full_name || currentUser.email;
  const userInfoElement = document.getElementById("userInfo");

  if (userInfoElement) {
    let pendingChangeHtml = "";
    if (userSubscription.pending_plan) {
      const pendingDate = new Date(
        userSubscription.pending_change_date
      ).toLocaleDateString("de-DE");
      pendingChangeHtml = `
        <div class="alert alert-warning" style="margin-top: 15px;">
          <p><strong>Geplante Änderung:</strong></p>
          <p>Wechsel zu ${
            planNames[userSubscription.pending_plan]
          }-Plan am ${pendingDate}</p>
          <button onclick="cancelPendingPlanChange()" class="btn-secondary" style="margin-top: 10px;">
            Änderung stornieren
          </button>
        </div>
      `;
    }

    let accessWarning = "";
    if (
      userSubscription.pending_plan &&
      planHierarchy[userSubscription.pending_plan] <
        planHierarchy[userSubscription.plan]
    ) {
      const endDate = new Date(
        userSubscription.pending_change_date
      ).toLocaleDateString("de-DE");
      accessWarning = `
        <div class="alert alert-warning" style="margin-top: 10px; font-size: 0.9em;">
          Premium-Zugriff endet am <strong>${endDate}</strong>
        </div>
      `;
    }

    userInfoElement.innerHTML = `
      <h3>Willkommen, ${userName}!</h3>
      <p><strong>Aktueller Plan:</strong> ${
        planNames[userSubscription.plan]
      }</p>
      <p><strong>Status:</strong> <span style="color: var(--success);">Aktiv</span></p>
      <p><strong>Gültig bis:</strong> ${new Date(
        userSubscription.end_date
      ).toLocaleDateString("de-DE")}</p>
      ${pendingChangeHtml}
      ${accessWarning}
      <div style="margin-top: 20px;">
        <button onclick="showManagePlanSection()" class="btn btn-primary">
          Plan verwalten
        </button>
      </div>
    `;
  }
}

function showManagePlanSection() {
  const currentPlan = userSubscription.plan;
  const currentLevel = planHierarchy[currentPlan];

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.id = "managePlanModal";
  modal.style.display = "block";

  const plansHtml = Object.keys(planHierarchy)
    .map((plan) => {
      const level = planHierarchy[plan];
      const isCurrent = plan === currentPlan;
      const isUpgrade = level > currentLevel;

      let buttonHtml = "";
      if (isCurrent) {
        buttonHtml =
          '<button class="btn btn-secondary" disabled>Aktueller Plan</button>';
      } else if (isUpgrade) {
        buttonHtml = `<button class="btn btn-success" onclick="showChangePlanModal('${plan}'); document.getElementById('managePlanModal').remove();">Upgraden</button>`;
      } else {
        buttonHtml = `<button class="btn btn-warning" onclick="showChangePlanModal('${plan}'); document.getElementById('managePlanModal').remove();">Downgrade</button>`;
      }

      return `
      <div class="plan-option ${isCurrent ? "current-plan-highlight" : ""}">
        <h4>${planNames[plan]}</h4>
        <p class="plan-price">€${planPrices[plan]}/Monat</p>
        ${buttonHtml}
      </div>
    `;
    })
    .join("");

  modal.innerHTML = `
    <div class="modal-content">
      <span class="close">×</span>
      <h2>Plan verwalten</h2>
      <p style="margin-bottom: 20px;">Wähle einen neuen Plan oder behalte deinen aktuellen Plan.</p>
      <div class="plans-grid">
        ${plansHtml}
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector(".close").addEventListener("click", () => {
    modal.remove();
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

window.cancelPendingPlanChange = cancelPendingPlanChange;
window.showManagePlanSection = showManagePlanSection;
window.showChangePlanModal = showChangePlanModal;

// ============================================
// >>> GLIEDERUNGSPUNKT 12: CONTENT MANAGEMENT
// ============================================
function loadContent() {
  loadVideos();
  loadDocuments();
  loadImages();
}

function loadVideos() {
  const videoList = document.getElementById("videoList");
  if (!videoList) return;
  videoList.innerHTML = "";
  demoContent.videos.forEach((video) => {
    const hasAccess = hasActiveAccess(video.requiredPlan);
    const item = createContentItem(video, "video", hasAccess);
    videoList.appendChild(item);
  });
}

function loadDocuments() {
  const documentList = document.getElementById("documentList");
  if (!documentList) return;
  documentList.innerHTML = "";
  demoContent.documents.forEach((doc) => {
    const hasAccess = hasActiveAccess(doc.requiredPlan);
    const item = createContentItem(doc, "document", hasAccess);
    documentList.appendChild(item);
  });
}

function loadImages() {
  const imageList = document.getElementById("imageList");
  if (!imageList) return;
  imageList.innerHTML = "";
  demoContent.images.forEach((image) => {
    const hasAccess = hasActiveAccess(image.requiredPlan);
    const item = createContentItem(image, "image", hasAccess);
    imageList.appendChild(item);
  });
}

function checkAccess(requiredPlan) {
  if (!userSubscription) return false;
  return planHierarchy[userSubscription.plan] >= planHierarchy[requiredPlan];
}

function hasActiveAccess(requiredPlan) {
  if (!userSubscription) return false;

  const currentLevel = planHierarchy[userSubscription.plan];
  const requiredLevel = planHierarchy[requiredPlan];

  if (!userSubscription.pending_plan) {
    return currentLevel >= requiredLevel;
  }

  const pendingLevel = planHierarchy[userSubscription.pending_plan];
  const changeDate = new Date(userSubscription.pending_change_date);
  const now = new Date();

  if (now < changeDate) {
    return currentLevel >= requiredLevel;
  }

  return pendingLevel >= requiredLevel;
}

function createContentItem(content, type, hasAccess) {
  const div = document.createElement("div");
  div.className = "content-item";
  const planBadges = {
    basic: '<span class="access-badge basic">Basis</span>',
    premium: '<span class="access-badge premium">Premium</span>',
    elite: '<span class="access-badge elite">Elite</span>',
  };
  let mediaElement = `<img src="${content.thumbnail}" alt="${content.title}" ${
    !hasAccess ? 'class="locked"' : ""
  }>`;
  let viewerUrl = "";
  if (hasAccess) {
    viewerUrl = `viewer.html?url=${encodeURIComponent(
      content.url
    )}&title=${encodeURIComponent(
      content.title
    )}&description=${encodeURIComponent(
      content.description
    )}&type=${type}&plan=${content.requiredPlan}`;
  }
  div.innerHTML = `
    ${mediaElement}
    <div class="content-info">
      <h4>${content.title} ${!hasAccess ? "🔒" : ""}</h4>
      <p>${content.description}</p>
      ${planBadges[content.requiredPlan]}
      ${
        hasAccess
          ? `<br><a href="${viewerUrl}" class="btn btn-primary" style="display: inline-block; margin-top: 10px; padding: 0.5rem 1rem; text-decoration: none;">Ansehen</a>`
          : '<p style="color: var(--danger); margin-top: 10px;">Upgrade erforderlich</p>'
      }
    </div>
  `;
  return div;
}

function switchTab(tabName) {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
  if (activeBtn) {
    activeBtn.classList.add("active");
  }
  document.querySelectorAll(".tab-content").forEach((content) => {
    content.classList.remove("active");
  });
  const activeContent = document.getElementById(tabName);
  if (activeContent) {
    activeContent.classList.add("active");
  }
}

// ============================================
// >>> GLIEDERUNGSPUNKT 13: UTILITY FUNCTIONS
// ============================================
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = "block";
  }
}

function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = "none";
  }
}

function showAlert(message, type) {
  const alertDiv = document.createElement("div");
  alertDiv.className = `alert alert-${type}`;
  alertDiv.textContent = message;
  const container = document.querySelector(".container");
  if (container) {
    container.insertBefore(alertDiv, container.firstChild);
    setTimeout(() => {
      alertDiv.remove();
    }, 5000);
  }
}
