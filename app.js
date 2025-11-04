// ============================================
// MULTI-TENANT SAAS - JAVASCRIPT (KORRIGIERT)
// CoachPlatform - Für Coaches & Kunden
// ============================================

// >>> KONFIGURATION
const SUPABASE_URL = "DEIN_SUPABASE_URL";
const SUPABASE_ANON_KEY = "DEIN_SUPABASE_ANON_KEY";
const STRIPE_PUBLISHABLE_KEY = "DEIN_STRIPE_PUBLISHABLE_KEY";

const STRIPE_PRICES = {
  coach: {
    basic: "price_COACH_BASIC_ID",
    premium: "price_COACH_PREMIUM_ID",
    elite: "price_COACH_ELITE_ID",
  },
  customer: {
    basic: "price_CUSTOMER_BASIC_ID",
    premium: "price_CUSTOMER_PREMIUM_ID",
    elite: "price_CUSTOMER_ELITE_ID",
  },
};

let stripe = null;
const DEBUG = true;

function debugLog(...args) {
  if (DEBUG) console.log("[DEBUG]", ...args);
}

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// >>> GLOBALE VARIABLEN
let currentUser = null;
let currentProfile = null;
let currentSubscription = null;
let selectedCoachId = null;

// >>> COOKIE CONSENT
const CookieConsent = {
  CONSENT_COOKIE: "coachplatform_cookie_consent",
  hasConsent() {
    return localStorage.getItem(this.CONSENT_COOKIE) !== null;
  },
  setConsent(analytics = false, marketing = false) {
    const consent = {
      essential: true,
      analytics,
      marketing,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(this.CONSENT_COOKIE, JSON.stringify(consent));
  },
  showBanner() {
    const banner = document.getElementById("cookieConsent");
    if (banner) {
      banner.style.display = "block";
      setTimeout(() => banner.classList.add("show"), 100);
    }
  },
  hideBanner() {
    const banner = document.getElementById("cookieConsent");
    if (banner) {
      banner.classList.remove("show");
      setTimeout(() => (banner.style.display = "none"), 300);
    }
  },
  init() {
    if (!this.hasConsent()) this.showBanner();
  },
};

// ============================================
// >>> INITIALISIERUNG
// ============================================
document.addEventListener("DOMContentLoaded", async () => {
  CookieConsent.init();

  if (
    STRIPE_PUBLISHABLE_KEY !== "DEIN_STRIPE_PUBLISHABLE_KEY" &&
    typeof Stripe !== "undefined"
  ) {
    try {
      stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
      debugLog("Stripe initialisiert");
    } catch (error) {
      console.error("Stripe Fehler:", error);
    }
  }

  await checkUserSession();
  initializeEventListeners();
});

// ============================================
// >>> AUTHENTIFIZIERUNG & SESSION
// ============================================
async function checkUserSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    currentUser = session.user;
    await loadUserProfile();
    await loadUserSubscription();
    updateUIBasedOnUserType();
  } else {
    showLandingPage();
  }
}

async function loadUserProfile() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", currentUser.id)
    .single();

  if (data) {
    currentProfile = data;
    debugLog("Profile geladen:", currentProfile);
  } else {
    console.error("Profil-Fehler:", error);
  }
}

async function loadUserSubscription() {
  if (!currentProfile) {
    debugLog("Kein Profile vorhanden, überspringe Subscription-Load");
    return;
  }

  if (currentProfile.user_type === "coach") {
    const { data } = await supabase
      .from("coach_subscriptions")
      .select("*")
      .eq("coach_id", currentUser.id)
      .eq("status", "active")
      .single();
    currentSubscription = data;
  } else {
    const { data } = await supabase
      .from("customer_subscriptions")
      .select("*")
      .eq("customer_id", currentUser.id)
      .eq("status", "active")
      .single();
    currentSubscription = data;
  }
  debugLog("Subscription geladen:", currentSubscription);
}

// ============================================
// >>> DEMO SUBSCRIPTION CREATOR
// ============================================
async function createDemoSubscription(userId, userType, plan = "premium") {
  debugLog("Erstelle Demo-Subscription für:", userId, userType, plan);

  try {
    const table =
      userType === "coach" ? "coach_subscriptions" : "customer_subscriptions";
    const idField = userType === "coach" ? "coach_id" : "customer_id";

    const subscriptionData = {
      [idField]: userId,
      plan: plan,
      status: "active",
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    if (userType === "customer" && selectedCoachId) {
      subscriptionData.coach_id = selectedCoachId;
    }

    const { data, error } = await supabase
      .from(table)
      .insert([subscriptionData])
      .select()
      .single();

    if (error) {
      console.error("Subscription Error:", error);
      throw error;
    }

    debugLog("Demo-Subscription erstellt:", data);
    return data;
  } catch (error) {
    console.error("createDemoSubscription failed:", error);
    throw error;
  }
}

// ============================================
// >>> UI SWITCHING
// ============================================
function showLandingPage() {
  document.getElementById("landingPage").style.display = "block";
  document.getElementById("coachDashboard").style.display = "none";
  document.getElementById("customerView").style.display = "none";
  document.getElementById("loginBtn").style.display = "block";
  document.getElementById("logoutBtn").style.display = "none";
}

function updateUIBasedOnUserType() {
  document.getElementById("loginBtn").style.display = "none";
  document.getElementById("logoutBtn").style.display = "block";

  if (currentProfile.user_type === "coach") {
    if (currentSubscription) {
      showCoachDashboard();
    } else {
      showLandingPage();
      showAlert("Bitte wähle einen Coach-Plan, um zu starten", "info");
    }
  } else {
    if (currentSubscription) {
      showCustomerView();
    } else {
      showLandingPage();
      showAlert("Bitte wähle einen Plan bei deinem Coach", "info");
    }
  }
}

async function showCoachDashboard() {
  document.getElementById("landingPage").style.display = "none";
  document.getElementById("coachDashboard").style.display = "block";
  document.getElementById("customerView").style.display = "none";

  await loadCoachInfo();
  await loadCoachStatistics();
  await loadCoachContent();
}

async function showCustomerView() {
  document.getElementById("landingPage").style.display = "none";
  document.getElementById("coachDashboard").style.display = "none";
  document.getElementById("customerView").style.display = "block";

  await loadCustomerInfo();
  await loadCustomerContent();
}

// ============================================
// >>> COACH DASHBOARD FUNKTIONEN
// ============================================
async function loadCoachInfo() {
  const coachInfoDiv = document.getElementById("coachInfo");
  if (!coachInfoDiv) return;

  const planNames = { basic: "Basic", premium: "Premium", elite: "Elite" };

  coachInfoDiv.innerHTML = `
    <h3>Willkommen, ${currentProfile.full_name || currentProfile.email}!</h3>
    <p><strong>Coach-Plan:</strong> ${planNames[currentSubscription.plan]}</p>
    <p><strong>Username:</strong> ${
      currentProfile.coach_username || "Noch nicht gesetzt"
    }</p>
    <p><strong>Status:</strong> <span style="color: #10b981;">Aktiv</span></p>
  `;
}

async function loadCoachStatistics() {
  const { data, error } = await supabase.rpc("get_coach_statistics", {
    p_coach_id: currentUser.id,
  });

  if (data) {
    const totalCustomers = document.getElementById("totalCustomers");
    const totalContent = document.getElementById("totalContent");
    const totalViews = document.getElementById("totalViews");
    const monthlyRevenue = document.getElementById("monthlyRevenue");

    if (totalCustomers) totalCustomers.textContent = data.total_customers || 0;
    if (totalContent) totalContent.textContent = data.total_content || 0;
    if (totalViews) totalViews.textContent = data.total_views || 0;

    const revenue = calculateMonthlyRevenue(data.customers_by_plan || {});
    if (monthlyRevenue) monthlyRevenue.textContent = `€${revenue}`;

    displayCustomersByPlan(data.customers_by_plan || {});
  } else if (error) {
    console.error("Statistics Error:", error);
  }
}

function calculateMonthlyRevenue(customersByPlan) {
  const prices = { basic: 29, premium: 59, elite: 99 };
  let total = 0;
  for (const [plan, count] of Object.entries(customersByPlan)) {
    total += (prices[plan] || 0) * (count || 0);
  }
  return total;
}

function displayCustomersByPlan(customersByPlan) {
  const container = document.getElementById("customersByPlan");
  if (!container) return;

  const planNames = { basic: "Basic", premium: "Premium", elite: "Elite" };
  const planColors = { basic: "#667eea", premium: "#f093fb", elite: "#ffd89b" };

  let html = '<div style="display: flex; gap: 1rem; flex-wrap: wrap;">';
  for (const [plan, count] of Object.entries(customersByPlan)) {
    html += `
      <div style="padding: 1rem; background: ${planColors[plan]}20; border-radius: 12px; border: 2px solid ${planColors[plan]};">
        <h4>${planNames[plan]}</h4>
        <p style="font-size: 2rem; font-weight: 700; margin: 0;">${count}</p>
      </div>
    `;
  }
  html += "</div>";
  container.innerHTML = html;
}

async function loadCoachContent() {
  const { data, error } = await supabase
    .from("content")
    .select("*")
    .eq("coach_id", currentUser.id)
    .order("created_at", { ascending: false });

  if (data) {
    displayCoachContent(data);
  } else if (error) {
    console.error("Content Load Error:", error);
  }
}

function displayCoachContent(contentList) {
  const container = document.getElementById("coachContentList");
  if (!container) return;

  const planBadges = {
    basic: '<span class="access-badge basic">Basic</span>',
    premium: '<span class="access-badge premium">Premium</span>',
    elite: '<span class="access-badge elite">Elite</span>',
  };

  if (contentList.length === 0) {
    container.innerHTML =
      '<p style="text-align: center; color: #999;">Noch kein Content hochgeladen</p>';
    return;
  }

  container.innerHTML = contentList
    .map(
      (item) => `
    <div class="content-item">
      <img src="${
        item.thumbnail_url || getDefaultThumbnail(item.content_type)
      }" alt="${item.title}">
      <div class="content-info">
        <h4>${item.title}</h4>
        <p>${item.description || ""}</p>
        ${planBadges[item.required_plan]}
        <p style="margin-top: 1rem; color: #999; font-size: 0.9em;">
          👁️ ${item.views_count || 0} Views
        </p>
        <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
          <button class="btn btn-secondary" onclick="editContent('${
            item.id
          }')">Bearbeiten</button>
          <button class="btn btn-warning" onclick="deleteContent('${
            item.id
          }')">Löschen</button>
        </div>
      </div>
    </div>
  `
    )
    .join("");
}

function getDefaultThumbnail(type) {
  const thumbnails = {
    video: "https://via.placeholder.com/300x200/667eea/ffffff?text=Video",
    document: "https://via.placeholder.com/300x200/f093fb/ffffff?text=Document",
    image: "https://via.placeholder.com/300x200/ffd89b/ffffff?text=Image",
  };
  return thumbnails[type] || thumbnails.document;
}

// ============================================
// >>> FILE UPLOAD HANDLING
// ============================================
function initializeFileUpload() {
  const fileUploadArea = document.getElementById("fileUploadArea");
  const fileInput = document.getElementById("fileInput");

  if (!fileUploadArea || !fileInput) return;

  fileUploadArea.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", handleFileSelect);

  fileUploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    fileUploadArea.style.borderColor = "#0071e3";
  });

  fileUploadArea.addEventListener("dragleave", () => {
    fileUploadArea.style.borderColor = "#ddd";
  });

  fileUploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    fileUploadArea.style.borderColor = "#ddd";
    if (e.dataTransfer.files.length) {
      fileInput.files = e.dataTransfer.files;
      handleFileSelect();
    }
  });
}

function handleFileSelect() {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];

  if (file) {
    const placeholder = document.querySelector(".upload-placeholder");
    if (placeholder) {
      placeholder.innerHTML = `
        <p>✅ ${file.name}</p>
        <p style="font-size: 0.9em; color: #999;">${(
          file.size /
          1024 /
          1024
        ).toFixed(2)} MB</p>
      `;
    }
  }
}

async function handleContentUpload(e) {
  e.preventDefault();

  const type = document.getElementById("uploadType").value;
  const title = document.getElementById("uploadTitle").value;
  const description = document.getElementById("uploadDescription").value;
  const plan = document.getElementById("uploadPlan").value;
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];

  if (!file) {
    showAlert("Bitte wähle eine Datei aus", "error");
    return;
  }

  const { data: canUpload } = await supabase.rpc("check_coach_upload_limit", {
    p_coach_id: currentUser.id,
    p_content_type: type,
  });

  if (!canUpload) {
    showAlert("Upload-Limit erreicht! Bitte upgrade deinen Plan.", "error");
    return;
  }

  const progressDiv = document.querySelector(".upload-progress");
  const placeholder = document.querySelector(".upload-placeholder");

  if (progressDiv) progressDiv.style.display = "block";
  if (placeholder) placeholder.style.display = "none";

  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${currentUser.id}/${Date.now()}.${fileExt}`;
    const bucket = "coach-content";

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    const { data: contentData, error: contentError } = await supabase
      .from("content")
      .insert([
        {
          coach_id: currentUser.id,
          title,
          description,
          content_type: type,
          file_url: urlData.publicUrl,
          file_size: file.size,
          file_extension: fileExt,
          required_plan: plan,
          is_published: true,
        },
      ])
      .select()
      .single();

    if (contentError) throw contentError;

    showAlert("Content erfolgreich hochgeladen!", "success");

    document.getElementById("uploadForm").reset();
    if (progressDiv) progressDiv.style.display = "none";
    if (placeholder) {
      placeholder.style.display = "block";
      placeholder.innerHTML = `
        <p>📁 Klicke oder ziehe eine Datei hierher</p>
        <p style="font-size: 0.9em; color: #999;">Max. 500 MB</p>
      `;
    }

    await loadCoachContent();
  } catch (error) {
    console.error("Upload-Fehler:", error);
    showAlert("Upload fehlgeschlagen: " + error.message, "error");
    if (progressDiv) progressDiv.style.display = "none";
    if (placeholder) placeholder.style.display = "block";
  }
}

// ============================================
// >>> CUSTOMER VIEW FUNKTIONEN
// ============================================
async function loadCustomerInfo() {
  const customerInfoDiv = document.getElementById("customerInfo");
  if (!customerInfoDiv) return;

  const planNames = { basic: "Basic", premium: "Premium", elite: "Elite" };

  const { data: coachData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", currentSubscription.coach_id)
    .single();

  customerInfoDiv.innerHTML = `
    <h3>Willkommen, ${currentProfile.full_name || currentProfile.email}!</h3>
    <p><strong>Dein Coach:</strong> ${coachData?.full_name || "Coach"}</p>
    <p><strong>Dein Plan:</strong> ${planNames[currentSubscription.plan]}</p>
    <p><strong>Status:</strong> <span style="color: #10b981;">Aktiv</span></p>
    <p><strong>Gültig bis:</strong> ${new Date(
      currentSubscription.end_date
    ).toLocaleDateString("de-DE")}</p>
  `;
}

async function loadCustomerContent() {
  const { data, error } = await supabase
    .from("content")
    .select("*")
    .eq("coach_id", currentSubscription.coach_id)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (data) {
    const videos = data.filter((c) => c.content_type === "video");
    const documents = data.filter((c) => c.content_type === "document");
    const images = data.filter((c) => c.content_type === "image");

    displayCustomerContent("customerVideoList", videos);
    displayCustomerContent("customerDocumentList", documents);
    displayCustomerContent("customerImageList", images);
  }
}

function displayCustomerContent(containerId, contentList) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const planHierarchy = { basic: 1, premium: 2, elite: 3 };
  const userLevel = planHierarchy[currentSubscription.plan];

  if (contentList.length === 0) {
    container.innerHTML =
      '<p style="text-align: center; color: #999;">Kein Content verfügbar</p>';
    return;
  }

  container.innerHTML = contentList
    .map((item) => {
      const requiredLevel = planHierarchy[item.required_plan];
      const hasAccess = userLevel >= requiredLevel;

      return `
      <div class="content-item">
        <img src="${
          item.thumbnail_url || getDefaultThumbnail(item.content_type)
        }" 
             alt="${item.title}" 
             class="${!hasAccess ? "locked" : ""}">
        <div class="content-info">
          <h4>${item.title} ${!hasAccess ? "🔒" : ""}</h4>
          <p>${item.description || ""}</p>
          ${
            hasAccess
              ? `<a href="${item.file_url}" target="_blank" class="btn btn-primary" style="display: inline-block; margin-top: 10px;">Ansehen</a>`
              : '<p style="color: #ef4444; margin-top: 10px;">Upgrade erforderlich</p>'
          }
        </div>
      </div>
    `;
    })
    .join("");
}

// ============================================
// >>> REGISTRATION & LOGIN
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

  if (error) {
    console.error("Login error:", error);
    showAlert("Anmeldung fehlgeschlagen: " + error.message, "error");
    return;
  }

  debugLog("Login erfolgreich!");
  currentUser = data.user;
  await loadUserProfile();
  await loadUserSubscription();

  if (!currentSubscription && currentProfile) {
    debugLog("Keine Subscription gefunden, erstelle Demo-Subscription...");
    try {
      const subscription = await createDemoSubscription(
        currentUser.id,
        currentProfile.user_type,
        "premium"
      );
      currentSubscription = subscription;
      showAlert("Demo-Subscription aktiviert!", "info");
    } catch (error) {
      console.error("Demo-Subscription Error:", error);
    }
  }

  updateUIBasedOnUserType();
  hideModal("loginModal");
  showAlert("Erfolgreich angemeldet!", "success");
}

async function handleRegister(e) {
  e.preventDefault();

  const userType = document.getElementById("registerUserType").value;
  const name = document.getElementById("registerName").value;
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;
  const acceptPrivacy = document.getElementById("acceptPrivacy").checked;

  if (!acceptPrivacy) {
    showAlert("Bitte akzeptiere die Datenschutzerklärung", "error");
    return;
  }

  if (!userType) {
    showAlert("Bitte wähle zuerst einen User-Typ (Coach oder Kunde)", "error");
    return;
  }

  const metadata = {
    full_name: name,
    user_type: userType,
    privacy_accepted: true,
    privacy_accepted_at: new Date().toISOString(),
  };

  if (userType === "coach") {
    const username = document.getElementById("registerUsername").value;
    if (username) {
      metadata.coach_username = username
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "");
    }
  } else {
    if (selectedCoachId) {
      metadata.coach_id = selectedCoachId;
    }
  }

  debugLog("Registrierung startet:", { email, userType, metadata });

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });

    if (error) {
      console.error("Signup Error:", error);
      showAlert("Registrierung fehlgeschlagen: " + error.message, "error");
      return;
    }

    debugLog("Signup erfolgreich:", data);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    hideModal("registerModal");

    if (data.session) {
      currentUser = data.user;
      await loadUserProfile();

      debugLog("Profile geladen, erstelle Demo-Subscription...");

      try {
        const subscription = await createDemoSubscription(
          currentUser.id,
          userType,
          "premium"
        );

        currentSubscription = subscription;

        showAlert(
          `Registrierung erfolgreich! Demo-${
            userType === "coach" ? "Coach" : "Kunden"
          }-Account mit Premium-Plan erstellt.`,
          "success"
        );

        await new Promise((resolve) => setTimeout(resolve, 500));
        updateUIBasedOnUserType();
      } catch (subError) {
        console.error("Demo-Subscription Error:", subError);
        showAlert(
          "Account erstellt, aber Subscription fehlgeschlagen. Bitte neu anmelden.",
          "warning"
        );
      }
    } else {
      showAlert(
        "Registrierung erfolgreich! Bitte bestätige deine E-Mail.",
        "success"
      );
    }
  } catch (err) {
    console.error("Unexpected error:", err);
    showAlert("Ein unerwarteter Fehler ist aufgetreten.", "error");
  }
}

async function logout() {
  await supabase.auth.signOut();
  currentUser = null;
  currentProfile = null;
  currentSubscription = null;
  showLandingPage();
  showAlert("Erfolgreich abgemeldet", "success");
}

// ============================================
// >>> EVENT LISTENERS
// ============================================
function initializeEventListeners() {
  document
    .getElementById("loginBtn")
    ?.addEventListener("click", () => showModal("loginModal"));
  document.getElementById("logoutBtn")?.addEventListener("click", logout);

  document.getElementById("loginForm")?.addEventListener("submit", handleLogin);
  document
    .getElementById("registerForm")
    ?.addEventListener("submit", handleRegister);
  document
    .getElementById("uploadForm")
    ?.addEventListener("submit", handleContentUpload);

  document.querySelectorAll(".user-type-btn").forEach((btn) => {
    btn.addEventListener("click", () => selectUserType(btn.dataset.type));
  });

  document
    .getElementById("backToUserTypeSelection")
    ?.addEventListener("click", (e) => {
      e.preventDefault();
      document.getElementById("userTypeSelection").style.display = "flex";
      document.getElementById("registerForm").style.display = "none";
    });

  document.querySelectorAll(".close").forEach((closeBtn) => {
    closeBtn.addEventListener("click", function () {
      this.closest(".modal").style.display = "none";
    });
  });

  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) e.target.style.display = "none";
  });

  document.getElementById("showRegister")?.addEventListener("click", (e) => {
    e.preventDefault();
    hideModal("loginModal");
    showModal("registerModal");
  });

  document.getElementById("showLogin")?.addEventListener("click", (e) => {
    e.preventDefault();
    hideModal("registerModal");
    showModal("loginModal");
  });

  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabName = btn.getAttribute("data-tab");
      switchTab(tabName);
    });
  });

  document.getElementById("acceptAll")?.addEventListener("click", () => {
    CookieConsent.setConsent(true, true);
    CookieConsent.hideBanner();
    showAlert("Alle Cookies akzeptiert", "success");
  });

  document.getElementById("acceptEssential")?.addEventListener("click", () => {
    CookieConsent.setConsent(false, false);
    CookieConsent.hideBanner();
    showAlert("Nur notwendige Cookies akzeptiert", "success");
  });

  document
    .getElementById("openCookieSettings")
    ?.addEventListener("click", (e) => {
      e.preventDefault();
      CookieConsent.showBanner();
    });

  document.querySelectorAll(".subscribe-btn").forEach((btn) => {
    btn.addEventListener("click", handleSubscriptionClick);
  });

  initializeFileUpload();

  document.getElementById("startCoachBtn")?.addEventListener("click", () => {
    showModal("registerModal");
    selectUserType("coach");
  });

  document.getElementById("findCoachBtn")?.addEventListener("click", () => {
    showModal("registerModal");
    selectUserType("customer");
  });
}

function selectUserType(type) {
  document.getElementById("registerUserType").value = type;
  document.getElementById("userTypeSelection").style.display = "none";
  document.getElementById("registerForm").style.display = "block";

  if (type === "coach") {
    document.getElementById("usernameGroup").style.display = "block";
    document.getElementById("coachSelectionGroup").style.display = "none";
  } else {
    document.getElementById("usernameGroup").style.display = "none";
    document.getElementById("coachSelectionGroup").style.display = "block";
    initCoachSearch();
  }
}

async function initCoachSearch() {
  const searchInput = document.getElementById("coachSearchInput");
  const resultsDiv = document.getElementById("coachSearchResults");

  if (!searchInput || !resultsDiv) return;

  searchInput.addEventListener("input", async (e) => {
    const query = e.target.value.toLowerCase();

    if (query.length < 2) {
      resultsDiv.innerHTML = "";
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, coach_username")
      .eq("user_type", "coach")
      .or(`full_name.ilike.%${query}%,coach_username.ilike.%${query}%`)
      .limit(5);

    if (data && data.length > 0) {
      resultsDiv.innerHTML = data
        .map(
          (coach) => `
        <div class="coach-search-result" onclick="window.selectCoach('${coach.id}', '${coach.full_name}')" style="padding: 10px; border-bottom: 1px solid #eee; cursor: pointer;">
          <strong>${coach.full_name}</strong>
          <br>
          <small>@${coach.coach_username || "kein-username"}</small>
        </div>
      `
        )
        .join("");
    } else {
      resultsDiv.innerHTML =
        '<p style="padding: 10px; color: #999;">Keine Coaches gefunden</p>';
    }
  });
}

function selectCoach(coachId, coachName) {
  selectedCoachId = coachId;
  document.getElementById("coachSearchInput").value = coachName;
  document.getElementById("coachSearchResults").innerHTML = "";
}

function handleSubscriptionClick(e) {
  const plan = e.target.getAttribute("data-plan");
  const userType =
    e.target.getAttribute("data-user-type") || currentProfile?.user_type;

  if (!currentUser) {
    showAlert("Bitte melde dich zuerst an", "error");
    showModal("loginModal");
    return;
  }

  if (currentSubscription) {
    showAlert("Du hast bereits ein Abo", "info");
    return;
  }

  showPaymentModal(plan, userType);
}

function showPaymentModal(plan, userType) {
  const prices = { basic: 29, premium: 59, elite: 99 };
  const planNames = { basic: "Basic", premium: "Premium", elite: "Elite" };

  const paymentInfo = document.getElementById("paymentInfo");
  if (paymentInfo) {
    paymentInfo.innerHTML = `
      <div class="alert alert-success">
        <strong>${planNames[plan]}-Plan</strong><br>
        €${prices[plan]} / Monat
      </div>
    `;
  }

  const paymentForm = document.getElementById("paymentForm");
  if (paymentForm) {
    paymentForm.setAttribute("data-plan", plan);
    paymentForm.setAttribute("data-user-type", userType);
  }

  showModal("paymentModal");
}

// ============================================
// >>> UTILITY FUNCTIONS
// ============================================
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.style.display = "block";
}

function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.style.display = "none";
}

function showAlert(message, type) {
  const alertDiv = document.createElement("div");
  alertDiv.className = `alert alert-${type}`;
  alertDiv.textContent = message;
  const container = document.querySelector(".container");
  if (container) {
    container.insertBefore(alertDiv, container.firstChild);
    setTimeout(() => alertDiv.remove(), 5000);
  }
}

function switchTab(tabName) {
  document
    .querySelectorAll(".tab-btn")
    .forEach((btn) => btn.classList.remove("active"));
  const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
  if (activeBtn) activeBtn.classList.add("active");

  document
    .querySelectorAll(".tab-content")
    .forEach((content) => content.classList.remove("active"));
  const activeContent = document.getElementById(tabName);
  if (activeContent) activeContent.classList.add("active");
}

// Global Functions
window.editContent = async (contentId) => {
  showAlert("Edit-Funktion kommt noch", "info");
};

window.deleteContent = async (contentId) => {
  if (!confirm("Content wirklich löschen?")) return;

  const { error } = await supabase.from("content").delete().eq("id", contentId);

  if (error) {
    showAlert("Löschen fehlgeschlagen", "error");
  } else {
    showAlert("Content gelöscht", "success");
    await loadCoachContent();
  }
};

window.selectCoach = selectCoach;