const SUPABASE_URL = '__SUPABASE_URL__';
const SUPABASE_ANON_KEY = '__SUPABASE_ANON_KEY__';
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentCoach = null;
let editingPackageId = null;

(async function init() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) { window.location.href = 'login.html'; return; }
  
  const { data: coach } = await supabaseClient.from('coaches').select('*').eq('user_id', session.user.id).single();
  if (!coach) { window.location.href = 'coach-register.html'; return; }
  
  currentCoach = coach;
  await loadPackages();
})();

async function loadPackages() {
  const grid = document.getElementById('packagesGrid');
  
  const { data: packages, error } = await supabaseClient
    .from('packages')
    .select('*')
    .eq('coach_id', currentCoach.id)
    .order('created_at', { ascending: false });
  
  if (error) { console.error(error); return; }
  
  if (!packages || packages.length === 0) {
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #6b7280;">Noch keine Pakete erstellt. Erstelle dein erstes Paket!</div>';
    return;
  }
  
  grid.innerHTML = packages.map(pkg => `
    <div class="package-card">
      <h3>${pkg.name}</h3>
      <span class="status ${pkg.is_published ? 'published' : 'draft'}">${pkg.is_published ? 'Veröffentlicht' : 'Entwurf'}</span>
      <div class="price">€${pkg.price_amount}/${pkg.billing_interval === 'month' ? 'Monat' : pkg.billing_interval === 'year' ? 'Jahr' : 'einmalig'}</div>
      <p>${pkg.short_description || pkg.description || ''}</p>
      <div class="package-actions">
        <button onclick="editPackage('${pkg.id}')">Bearbeiten</button>
        <button onclick="togglePublish('${pkg.id}', ${!pkg.is_published})">${pkg.is_published ? 'Verstecken' : 'Veröffentlichen'}</button>
        <button onclick="deletePackage('${pkg.id}')">Löschen</button>
      </div>
    </div>
  `).join('');
}

function openCreatePackageModal() {
  editingPackageId = null;
  document.getElementById('modalTitle').textContent = 'Neues Paket erstellen';
  document.getElementById('packageForm').reset();
  document.getElementById('packageModal').classList.add('active');
}

function closePackageModal() {
  document.getElementById('packageModal').classList.remove('active');
}

document.getElementById('packageForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const packageData = {
    coach_id: currentCoach.id,
    name: document.getElementById('packageName').value,
    short_description: document.getElementById('packageShortDesc').value,
    description: document.getElementById('packageDesc').value,
    price_amount: parseFloat(document.getElementById('packagePrice').value),
    billing_interval: document.getElementById('packageInterval').value,
    is_published: false
  };
  
  if (editingPackageId) {
    await supabaseClient.from('packages').update(packageData).eq('id', editingPackageId);
  } else {
    await supabaseClient.from('packages').insert(packageData);
  }
  
  closePackageModal();
  await loadPackages();
});

async function editPackage(id) {
  const { data: pkg } = await supabaseClient.from('packages').select('*').eq('id', id).single();
  if (!pkg) return;
  
  editingPackageId = id;
  document.getElementById('modalTitle').textContent = 'Paket bearbeiten';
  document.getElementById('packageName').value = pkg.name;
  document.getElementById('packageShortDesc').value = pkg.short_description || '';
  document.getElementById('packageDesc').value = pkg.description || '';
  document.getElementById('packagePrice').value = pkg.price_amount;
  document.getElementById('packageInterval').value = pkg.billing_interval;
  document.getElementById('packageModal').classList.add('active');
}

async function togglePublish(id, published) {
  await supabaseClient.from('packages').update({ is_published: published }).eq('id', id);
  await loadPackages();
}

async function deletePackage(id) {
  if (confirm('Möchtest du dieses Paket wirklich löschen?')) {
    await supabaseClient.from('packages').delete().eq('id', id);
    await loadPackages();
  }
}