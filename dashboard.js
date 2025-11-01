// CoachFlow Coach Dashboard

const SUPABASE_URL = "https://ftohghotvfgkoeclmwfv.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0b2hnaG90dmZna29lY2xtd2Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NzEwNDAsImV4cCI6MjA3NzM0NzA0MH0.UY_RP8g55jzb_9FCCqCO6FtwHWqG4LNGvWRTaA5nqhk";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentCoach = null;
let currentTier = null;

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
  await checkAuth();
  setupEventListeners();
  await loadDashboardData();
});

// Authentication
async function checkAuth() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    window.location.href = "login.html";
    return;
  }

  currentCoach = session.user;

  // Load coach data from database
  const { data: coachData } = await supabase
    .from("coaches")
    .select("*")
    .eq("id", currentCoach.id)
    .single();

  if (coachData) {
    currentCoach = { ...currentCoach, ...coachData };
  }

  updateCoachInfo();
}

function updateCoachInfo() {
  document.getElementById("coachName").textContent =
    currentCoach.name || currentCoach.email;
  document.getElementById("coachPlan").textContent = getPlanName(
    currentCoach.plan
  );
}

function getPlanName(plan) {
  const plans = {
    basic: "Basic (49€/Monat)",
    premium: "Premium (199€/Monat)",
    elite: "Elite (399€/Monat)",
  };
  return plans[plan] || "Unbekannt";
}

// Event Listeners
function setupEventListeners() {
  document.getElementById("logoutBtn").addEventListener("click", logout);
  document
    .getElementById("connectStripeBtn")
    .addEventListener("click", connectStripe);
  document.getElementById("tierForm").addEventListener("submit", saveTier);
  document
    .getElementById("uploadForm")
    .addEventListener("submit", uploadContent);
  document
    .getElementById("copyLinkBtn")
    .addEventListener("click", copyMembershipLink);
}

async function logout() {
  await supabase.auth.signOut();
  window.location.href = "index.html";
}

// Stripe Connect
async function connectStripe() {
  const btn = document.getElementById("connectStripeBtn");
  btn.disabled = true;
  btn.textContent = "Wird geladen...";

  try {
    const response = await fetch("/.netlify/functions/create-connect-account", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        coachId: currentCoach.id,
        email: currentCoach.email,
      }),
    });

    if (!response.ok) {
      throw new Error("Fehler beim Erstellen des Connect-Accounts");
    }

    const { accountLinkUrl } = await response.json();
    window.location.href = accountLinkUrl;
  } catch (error) {
    console.error("Stripe Connect error:", error);
    alert("Fehler: " + error.message);
    btn.disabled = false;
    btn.textContent = "Girokonto verbinden";
  }
}

async function checkStripeConnectStatus() {
  if (currentCoach.stripe_account_onboarded) {
    const statusDiv = document.getElementById("stripeConnectStatus");
    statusDiv.innerHTML = `
      <p style="color: green;">✅ Girokonto verbunden</p>
      <p>Zahlungen werden direkt auf dein Girokonto überwiesen.</p>
    `;
  }
}

// Tier Configuration
async function saveTier(e) {
  e.preventDefault();

  const name = document.getElementById("tierName").value;
  const price = document.getElementById("tierPrice").value;
  const description = document.getElementById("tierDescription").value;

  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = "Wird gespeichert...";

  try {
    // Create Stripe Price
    const response = await fetch("/.netlify/functions/create-tier-price", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        coachId: currentCoach.id,
        name,
        price: parseInt(price),
        description,
      }),
    });

    if (!response.ok) {
      throw new Error("Fehler beim Erstellen des Tiers");
    }

    const { tier } = await response.json();
    currentTier = tier;

    // Update UI
    displayCurrentTier();
    alert("Tier erfolgreich gespeichert!");

    // Reset form
    e.target.reset();
  } catch (error) {
    console.error("Save tier error:", error);
    alert("Fehler: " + error.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "Tier speichern";
  }
}

async function loadCurrentTier() {
  const { data } = await supabase
    .from("tiers")
    .select("*")
    .eq("coach_id", currentCoach.id)
    .single();

  if (data) {
    currentTier = data;
    displayCurrentTier();
  }
}

function displayCurrentTier() {
  if (!currentTier) return;

  document.getElementById("currentTier").style.display = "block";
  document.getElementById("currentTierName").textContent = currentTier.name;
  document.getElementById("currentTierPrice").textContent = currentTier.price;
  document.getElementById("currentTierDescription").textContent =
    currentTier.description;

  // Hide form
  document.getElementById("tierForm").style.display = "none";
}

// Content Upload
async function uploadContent(e) {
  e.preventDefault();

  const title = document.getElementById("contentTitle").value;
  const file = document.getElementById("contentFile").files[0];

  if (!file) {
    alert("Bitte wähle eine Datei aus");
    return;
  }

  if (file.size > 500 * 1024 * 1024) {
    alert("Datei ist zu groß (Max. 500MB)");
    return;
  }

  // Show progress
  document.getElementById("uploadProgress").style.display = "block";
  const progressFill = document.getElementById("progressFill");
  const progressText = document.getElementById("progressText");

  try {
    // Upload to Supabase Storage
    const fileExt = file.name.split(".").pop();
    const fileName = `${currentCoach.id}/${Date.now()}.${fileExt}`;
    const bucket = file.type.startsWith("video/")
      ? "videos"
      : file.type.startsWith("image/")
      ? "images"
      : "documents";

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        onUploadProgress: (progress) => {
          const percent = Math.round((progress.loaded / progress.total) * 100);
          progressFill.style.width = percent + "%";
          progressText.textContent = percent + "%";
        },
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(fileName);

    // Save metadata to database
    const { error: dbError } = await supabase.from("content").insert({
      coach_id: currentCoach.id,
      tier_id: currentTier?.id,
      title,
      file_url: publicUrl,
      file_type: file.type,
    });

    if (dbError) throw dbError;

    alert("Upload erfolgreich!");

    // Reset form
    e.target.reset();
    document.getElementById("uploadProgress").style.display = "none";
    progressFill.style.width = "0%";
    progressText.textContent = "0%";

    // Reload content list
    await loadContent();
  } catch (error) {
    console.error("Upload error:", error);
    alert("Fehler beim Hochladen: " + error.message);
  }
}

async function loadContent() {
  const { data, count } = await supabase
    .from("content")
    .select("*", { count: "exact" })
    .eq("coach_id", currentCoach.id)
    .order("created_at", { ascending: false });

  document.getElementById("contentCount").textContent = count || 0;

  const contentList = document.getElementById("contentList");
  contentList.innerHTML = "";

  if (!data || data.length === 0) {
    contentList.innerHTML = "<p>Noch keine Inhalte hochgeladen</p>";
    return;
  }

  data.forEach((item) => {
    const card = document.createElement("div");
    card.className = "content-card";

    const type = item.file_type.startsWith("video/")
      ? "🎥"
      : item.file_type.startsWith("image/")
      ? "🖼️"
      : "📄";

    card.innerHTML = `
      <div class="content-icon">${type}</div>
      <h4>${item.title}</h4>
      <button onclick="deleteContent('${item.id}')" class="btn btn-danger btn-sm">Löschen</button>
    `;

    contentList.appendChild(card);
  });
}

window.deleteContent = async function (contentId) {
  if (!confirm("Möchtest du diesen Inhalt wirklich löschen?")) return;

  const { error } = await supabase.from("content").delete().eq("id", contentId);

  if (error) {
    alert("Fehler beim Löschen");
    return;
  }

  alert("Inhalt gelöscht");
  await loadContent();
};

// Membership Link
function updateMembershipLink() {
  const baseUrl = window.location.origin;
  const link = `${baseUrl}/member-portal.html?coach=${currentCoach.id}`;
  document.getElementById("membershipLink").value = link;
}

function copyMembershipLink() {
  const input = document.getElementById("membershipLink");
  input.select();
  document.execCommand("copy");

  const btn = document.getElementById("copyLinkBtn");
  btn.textContent = "✓ Kopiert!";
  setTimeout(() => {
    btn.textContent = "Kopieren";
  }, 2000);
}

// Load Dashboard Data
async function loadDashboardData() {
  await checkStripeConnectStatus();
  await loadCurrentTier();
  await loadContent();
  await loadMemberCount();
  updateMembershipLink();
}

async function loadMemberCount() {
  const { count } = await supabase
    .from("customers")
    .select("*", { count: "exact", head: true })
    .eq("coach_id", currentCoach.id)
    .eq("subscription_status", "active");

  document.getElementById("memberCount").textContent = count || 0;
}
