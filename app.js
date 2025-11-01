// ============================================
// KONFIGURATION
// ============================================

// Supabase Konfiguration
const SUPABASE_URL = "DEINE_SUPABASE_URL"; // Ersetze mit deiner URL
const SUPABASE_ANON_KEY = "DEIN_SUPABASE_ANON_KEY"; // Ersetze mit deinem Key

// Stripe Konfiguration (für Demo)
const STRIPE_PUBLISHABLE_KEY = "DEIN_STRIPE_KEY"; // Optional

// Supabase Client initialisieren
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// GLOBALE VARIABLEN
// ============================================
let currentUser = null;
let currentSubscription = null;

// ============================================
// COOKIE CONSENT
// ============================================
function initCookieConsent() {
  const consent = localStorage.getItem("cookieConsent");
  if (!consent) {
    document.getElementById("cookie-consent").style.display = "block";
  }

  document.getElementById("accept-cookies").addEventListener("click", () => {
    localStorage.setItem("cookieConsent", "accepted");
    document.getElementById("cookie-consent").style.display = "none";
    showNotification("✅ Cookies akzeptiert", "success");
  });

  document.getElementById("decline-cookies").addEventListener("click", () => {
    localStorage.setItem("cookieConsent", "declined");
    document.getElementById("cookie-consent").style.display = "none";
    showNotification("❌ Cookies abgelehnt", "warning");
  });
}

// ============================================
// AUTHENTIFIZIERUNG
// ============================================

// Auth Modal öffnen/schließen
function initAuthModal() {
  const modal = document.getElementById("auth-modal");
  const authBtn = document.getElementById("auth-btn");
  const closeBtn = document.querySelector(".close");

  authBtn.addEventListener("click", () => {
    modal.style.display = "flex";
  });

  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });

  // Auth Tabs
  const authTabs = document.querySelectorAll(".auth-tab");
  authTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      authTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      const authType = tab.dataset.auth;
      const modalTitle = document.getElementById("modal-title");
      const submitBtn = document.getElementById("auth-submit-btn");

      if (authType === "login") {
        modalTitle.textContent = "Login";
        submitBtn.textContent = "Login";
      } else {
        modalTitle.textContent = "Registrieren";
        submitBtn.textContent = "Registrieren";
      }
    });
  });

  // Auth Form Submit
  const authForm = document.getElementById("auth-form");
  authForm.addEventListener("submit", handleAuth);
}

// Auth Handler
async function handleAuth(e) {
  e.preventDefault();

  const email = document.getElementById("auth-email").value;
  const password = document.getElementById("auth-password").value;
  const activeTab = document.querySelector(".auth-tab.active").dataset.auth;

  try {
    if (activeTab === "login") {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      showNotification("✅ Login erfolgreich!", "success");
      document.getElementById("auth-modal").style.display = "none";
      await loadUserData();
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      showNotification(
        "✅ Registrierung erfolgreich! Bitte bestätige deine Email.",
        "success"
      );
      document.getElementById("auth-modal").style.display = "none";
    }

    document.getElementById("auth-form").reset();
  } catch (error) {
    console.error("Auth error:", error);
    showNotification("❌ " + error.message, "error");
  }
}

// Logout
function initLogout() {
  const logoutBtn = document.getElementById("logout-btn");
  logoutBtn.addEventListener("click", async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      currentUser = null;
      currentSubscription = null;

      showNotification("✅ Erfolgreich ausgeloggt", "success");
      updateUIForAuth(false);
    } catch (error) {
      console.error("Logout error:", error);
      showNotification("❌ Logout fehlgeschlagen", "error");
    }
  });
}

// User Daten laden
async function loadUserData() {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) throw error;

    if (user) {
      currentUser = user;

      // Subscription laden
      const { data: subscription, error: subError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();

      if (!subError && subscription) {
        currentSubscription = subscription;
      }

      updateUIForAuth(true);
      updateMembersArea();
    }
  } catch (error) {
    console.error("Error loading user data:", error);
  }
}

// UI für Auth Status aktualisieren
function updateUIForAuth(isAuthenticated) {
  const authBtn = document.getElementById("auth-btn");
  const membersArea = document.getElementById("members-area");
  const pricingSection = document.getElementById("pricing");

  if (isAuthenticated) {
    authBtn.textContent = "Members Area";
    authBtn.onclick = () => {
      document.getElementById("home").style.display = "none";
      document.getElementById("features").style.display = "none";
      pricingSection.style.display = "none";
      membersArea.style.display = "block";
      window.scrollTo(0, 0);
    };
  } else {
    authBtn.textContent = "Login";
    authBtn.onclick = () => {
      document.getElementById("auth-modal").style.display = "flex";
    };
    membersArea.style.display = "none";
    document.getElementById("home").style.display = "block";
    document.getElementById("features").style.display = "block";
    pricingSection.style.display = "block";
  }
}

// Members Area aktualisieren
async function updateMembersArea() {
  if (!currentUser) return;

  // User Name anzeigen
  const userName = currentUser.email.split("@")[0];
  document.getElementById("user-name").textContent = userName;

  // Plan Badge aktualisieren
  const planBadge = document.getElementById("current-plan-badge");
  const dashboardPlan = document.getElementById("dashboard-plan");
  const subPlanName = document.getElementById("sub-plan-name");
  const subPlanPrice = document.getElementById("sub-plan-price");

  if (currentSubscription) {
    const plan = currentSubscription.plan;
    const planNames = {
      basic: "📦 Basic",
      pro: "⭐ Pro",
      elite: "👑 Elite",
    };
    const planPrices = {
      basic: "9,99€/Monat",
      pro: "19,99€/Monat",
      elite: "49,99€/Monat",
    };

    planBadge.textContent = planNames[plan] || "Basic";
    planBadge.className = "plan-badge " + plan;

    dashboardPlan.textContent = planNames[plan] || "Basic";
    subPlanName.textContent = planNames[plan] || "Basic";
    subPlanPrice.textContent = planPrices[plan] || "9,99€/Monat";
  } else {
    planBadge.textContent = "📦 Kein Abo";
    planBadge.className = "plan-badge";
    dashboardPlan.textContent = "Kein aktives Abo";
    subPlanName.textContent = "Kein Abo";
    subPlanPrice.textContent = "-";
  }

  // Mitglied seit
  const memberSince = new Date(currentUser.created_at).toLocaleDateString(
    "de-DE"
  );
  document.getElementById("member-since").textContent = memberSince;

  // Content Count laden
  await updateContentCount();
}

// Content Count aktualisieren
async function updateContentCount() {
  try {
    const { count, error } = await supabase
      .from("user_uploads")
      .select("*", { count: "exact", head: true });

    if (error) throw error;

    document.getElementById("content-count").textContent = count || 0;
  } catch (error) {
    console.error("Error loading content count:", error);
    document.getElementById("content-count").textContent = "-";
  }
}

// ============================================
// SUBSCRIPTION MANAGEMENT
// ============================================

// Subscribe Buttons
function initSubscribeButtons() {
  const subscribeBtns = document.querySelectorAll(".subscribe-btn");
  subscribeBtns.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const plan = btn.dataset.plan;
      const price = btn.dataset.price;

      if (!currentUser) {
        showNotification("⚠️ Bitte melde dich zuerst an", "warning");
        document.getElementById("auth-modal").style.display = "flex";
        return;
      }

      await handleSubscription(plan, price);
    });
  });
}

// Subscription Handler
async function handleSubscription(plan, price) {
  try {
    // Prüfen ob bereits ein Abo existiert
    const { data: existingSub, error: checkError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", currentUser.id)
      .eq("status", "active")
      .single();

    if (existingSub) {
      showNotification(
        "⚠️ Du hast bereits ein aktives Abo. Bitte verwalte es im Members Area.",
        "warning"
      );
      return;
    }

    // Demo Payment (in Produktion: Stripe Integration)
    const confirmed = confirm(
      `Möchtest du das ${plan.toUpperCase()} Paket für ${price}€/Monat abonnieren?`
    );

    if (!confirmed) return;

    // Subscription in DB erstellen
    const { data, error } = await supabase
      .from("subscriptions")
      .insert({
        user_id: currentUser.id,
        plan: plan,
        status: "active",
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    currentSubscription = data;

    showNotification("✅ Abonnement erfolgreich abgeschlossen!", "success");

    // Zur Members Area wechseln
    document.getElementById("pricing").style.display = "none";
    document.getElementById("members-area").style.display = "block";
    await updateMembersArea();
  } catch (error) {
    console.error("Subscription error:", error);
    showNotification("❌ Fehler beim Abonnieren: " + error.message, "error");
  }
}

// Plan Change Buttons
function initPlanChangeButtons() {
  const changePlanBtns = document.querySelectorAll(".change-plan-btn");
  changePlanBtns.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const newPlan = btn.dataset.plan;
      await handlePlanChange(newPlan);
    });
  });
}

// Plan Change Handler
async function handlePlanChange(newPlan) {
  if (!currentSubscription) {
    showNotification("⚠️ Du hast kein aktives Abo", "warning");
    return;
  }

  const currentPlan = currentSubscription.plan;

  if (currentPlan === newPlan) {
    showNotification("⚠️ Du hast bereits diesen Plan", "warning");
    return;
  }

  const planPrices = {
    basic: "9,99€",
    pro: "19,99€",
    elite: "49,99€",
  };

  const confirmed = confirm(
    `Möchtest du zu ${newPlan.toUpperCase()} (${
      planPrices[newPlan]
    }/Monat) wechseln?`
  );

  if (!confirmed) return;

  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .update({ plan: newPlan })
      .eq("id", currentSubscription.id)
      .select()
      .single();

    if (error) throw error;

    currentSubscription = data;

    showNotification("✅ Plan erfolgreich geändert!", "success");
    await updateMembersArea();
  } catch (error) {
    console.error("Plan change error:", error);
    showNotification("❌ Fehler beim Planwechsel: " + error.message, "error");
  }
}

// Cancel Subscription
function initCancelSubscription() {
  const cancelBtn = document.getElementById("cancel-subscription-btn");
  cancelBtn.addEventListener("click", async () => {
    if (!currentSubscription) {
      showNotification("⚠️ Du hast kein aktives Abo", "warning");
      return;
    }

    const confirmed = confirm("Möchtest du dein Abonnement wirklich kündigen?");

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("subscriptions")
        .update({ status: "cancelled" })
        .eq("id", currentSubscription.id);

      if (error) throw error;

      currentSubscription = null;

      showNotification("✅ Abonnement gekündigt", "success");
      await updateMembersArea();
    } catch (error) {
      console.error("Cancel error:", error);
      showNotification("❌ Fehler beim Kündigen: " + error.message, "error");
    }
  });
}

// ============================================
// FILE UPLOAD
// ============================================

// Upload Form Handler
async function handleFileUpload(e) {
  e.preventDefault();

  const fileType = document.getElementById("upload-type").value;
  const requiredPlan = document.getElementById("upload-plan").value;
  const title = document.getElementById("upload-title").value;
  const description = document.getElementById("upload-description").value;
  const fileInput = document.getElementById("upload-file");
  const file = fileInput.files[0];

  if (!file) {
    showNotification("⚠️ Bitte wähle eine Datei aus", "error");
    return;
  }

  // Dateigrößen-Validierung
  const maxSize = fileType === "video" ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
  if (file.size > maxSize) {
    showNotification(
      `❌ Datei zu groß! Maximum: ${fileType === "video" ? "100MB" : "10MB"}`,
      "error"
    );
    return;
  }

  try {
    showUploadProgress(true);

    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error("Nicht eingeloggt");

    const userId = user.data.user.id;
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `${userId}/${timestamp}_${sanitizedFileName}`;
    const bucketName = `user-${fileType}s`;

    // Upload zu Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Metadaten in Datenbank speichern
    const { error: dbError } = await supabase.from("user_uploads").insert({
      user_id: userId,
      file_type: fileType,
      required_plan: requiredPlan,
      title: title,
      description: description,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type,
    });

    if (dbError) throw dbError;

    showNotification("✅ Upload erfolgreich!", "success");
    document.getElementById("upload-form").reset();

    // Liste neu laden
    await loadUserUploads();
    await updateContentCount();
  } catch (error) {
    console.error("Upload error:", error);
    showNotification("❌ Upload fehlgeschlagen: " + error.message, "error");
  } finally {
    showUploadProgress(false);
  }
}

// Uploads laden und anzeigen
async function loadUserUploads(filterType = "all") {
  const uploadsList = document.getElementById("uploads-list");

  try {
    uploadsList.innerHTML = '<p class="loading">Lade Inhalte...</p>';

    let query = supabase
      .from("user_uploads")
      .select("*")
      .order("created_at", { ascending: false });

    if (filterType !== "all") {
      query = query.eq("file_type", filterType);
    }

    const { data: uploads, error } = await query;

    if (error) throw error;

    if (!uploads || uploads.length === 0) {
      uploadsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <p>Noch keine Inhalte verfügbar</p>
                </div>
            `;
      return;
    }

    // Uploads anzeigen
    uploadsList.innerHTML = uploads
      .map(
        (upload) => `
            <div class="upload-card" data-type="${upload.file_type}">
                <div class="upload-card-header">
                    <span class="upload-type-badge ${upload.file_type}">
                        ${
                          upload.file_type === "video"
                            ? "🎥"
                            : upload.file_type === "image"
                            ? "🖼️"
                            : "📄"
                        }
                        ${upload.file_type}
                    </span>
                    <span class="upload-plan-badge ${upload.required_plan}">
                        ${
                          upload.required_plan === "elite"
                            ? "👑"
                            : upload.required_plan === "pro"
                            ? "⭐"
                            : "📦"
                        }
                        ${upload.required_plan}
                    </span>
                </div>
                
                <h4>${upload.title}</h4>
                <p>${upload.description || "Keine Beschreibung"}</p>
                
                <div class="upload-card-footer">
                    <span class="upload-date">${new Date(
                      upload.created_at
                    ).toLocaleDateString("de-DE")}</span>
                    <div class="upload-actions">
                        <button class="btn-icon-only" onclick="downloadFile('${
                          upload.file_path
                        }', '${upload.file_type}', '${
          upload.title
        }')" title="Herunterladen">
                            ⬇️
                        </button>
                        <button class="btn-icon-only" onclick="viewFile('${
                          upload.file_path
                        }', '${upload.file_type}')" title="Ansehen">
                            👁️
                        </button>
                    </div>
                </div>
            </div>
        `
      )
      .join("");
  } catch (error) {
    console.error("Error loading uploads:", error);
    uploadsList.innerHTML = `
            <div class="empty-state">
                <p style="color: #f44336;">❌ Fehler beim Laden: ${error.message}</p>
            </div>
        `;
  }
}

// Datei herunterladen
async function downloadFile(filePath, fileType, title) {
  try {
    const bucketName = `user-${fileType}s`;
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(filePath);

    if (error) throw error;

    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = title;
    a.click();
    URL.revokeObjectURL(url);

    showNotification("✅ Download gestartet", "success");
  } catch (error) {
    console.error("Download error:", error);
    showNotification("❌ Download fehlgeschlagen", "error");
  }
}

// Datei ansehen
async function viewFile(filePath, fileType) {
  try {
    const bucketName = `user-${fileType}s`;
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, 3600); // 1 Stunde gültig

    if (error) throw error;

    window.open(data.signedUrl, "_blank");
  } catch (error) {
    console.error("View error:", error);
    showNotification("❌ Ansicht fehlgeschlagen", "error");
  }
}

// Upload-Progress anzeigen
function showUploadProgress(show) {
  const progressDiv = document.getElementById("upload-progress");
  if (show) {
    progressDiv.style.display = "block";
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      document.getElementById("progress-fill").style.width = progress + "%";
      document.getElementById("progress-text").textContent = progress + "%";
      if (progress >= 100) clearInterval(interval);
    }, 200);
  } else {
    progressDiv.style.display = "none";
    document.getElementById("progress-fill").style.width = "0%";
    document.getElementById("progress-text").textContent = "0%";
  }
}

// ============================================
// TABS NAVIGATION
// ============================================
function initTabs() {
  const tabBtns = document.querySelectorAll(".tab-btn");
  const contentSections = document.querySelectorAll(".content-section");

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      // Remove active class from all tabs
      tabBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // Hide all content sections
      contentSections.forEach((section) => {
        section.style.display = "none";
      });

      // Show selected section
      const tabName = btn.dataset.tab;
      const section = document.getElementById(`${tabName}-section`);
      if (section) {
        section.style.display = "block";

        // Wenn Upload-Tab geöffnet wird, Inhalte laden
        if (tabName === "upload") {
          loadUserUploads();
        }
      }
    });
  });
}

// ============================================
// FILTER TABS
// ============================================
function initFilterTabs() {
  const filterTabs = document.querySelectorAll(".filter-tab");
  filterTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      filterTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      const filter = tab.dataset.filter;
      loadUserUploads(filter);
    });
  });
}

// ============================================
// NAVIGATION
// ============================================
function initNavigation() {
  const navLinks = document.querySelectorAll(".nav-link");

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();

      navLinks.forEach((l) => l.classList.remove("active"));
      link.classList.add("active");

      const target = link.getAttribute("href").substring(1);
      scrollToSection(target);
    });
  });
}

function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({ behavior: "smooth" });
  }
}

// ============================================
// NOTIFICATION
// ============================================
function showNotification(message, type = "success") {
  const notification = document.getElementById("notification");
  notification.textContent = message;
  notification.className = `notification ${type}`;
  notification.style.display = "block";

  setTimeout(() => {
    notification.style.display = "none";
  }, 4000);
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener("DOMContentLoaded", async () => {
  // Cookie Consent initialisieren
  initCookieConsent();

  // Auth initialisieren
  initAuthModal();
  initLogout();

  // Navigation initialisieren
  initNavigation();

  // Tabs initialisieren
  initTabs();

  // Filter Tabs initialisieren
  initFilterTabs();

  // Subscribe Buttons initialisieren
  initSubscribeButtons();

  // Plan Change Buttons initialisieren
  initPlanChangeButtons();

  // Cancel Subscription initialisieren
  initCancelSubscription();

  // Upload Form initialisieren
  const uploadForm = document.getElementById("upload-form");
  if (uploadForm) {
    uploadForm.addEventListener("submit", handleFileUpload);
  }

  // Auth State Listener
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN") {
      loadUserData();
    } else if (event === "SIGNED_OUT") {
      updateUIForAuth(false);
    }
  });

  // Initial User laden
  await loadUserData();
});

// ============================================
// GLOBALE FUNKTIONEN (für onclick in HTML)
// ============================================
window.downloadFile = downloadFile;
window.viewFile = viewFile;
window.scrollToSection = scrollToSection;
