// ============================================
// Coach Dashboard Main Script
// ============================================

const DEBUG = true;
function debugLog(...args) {
    if (DEBUG) console.log('[DASHBOARD]', ...args);
}

let currentCoach = null;
let currentSession = null;

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    debugLog('Dashboard initializing...');

    // Check session and load coach data
    const sessionData = await window.checkCoachSession();
    if (!sessionData) {
        debugLog('No valid session, redirecting...');
        return;
    }

    currentSession = sessionData.session;
    currentCoach = sessionData.coach;

    debugLog('Coach loaded:', currentCoach);

    // Initialize UI
    initializeUI();
    initializeEventListeners();
    
    // Load initial data
    await loadDashboardData();
});

// ============================================
// UI INITIALIZATION
// ============================================

function initializeUI() {
    // Set coach name in navigation
    document.getElementById('coachName').textContent = currentCoach.name;
    document.getElementById('welcomeName').textContent = currentCoach.name;

    // Set landing page URL
    const landingPageUrl = `${window.location.origin}/?coach=${currentCoach.slug}`;
    const landingLink = document.getElementById('landingPageUrl');
    if (landingLink) {
        landingLink.href = landingPageUrl;
        landingLink.textContent = landingPageUrl;
    }
}

function initializeEventListeners() {
    // Logout button
    document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);

    // Tab navigation
    document.querySelectorAll('.dashboard-menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tab = e.currentTarget.dataset.tab;
            switchTab(tab);
        });
    });

    // Package management
    document.getElementById('createPackageBtn')?.addEventListener('click', () => openPackageModal());
    document.getElementById('packageForm')?.addEventListener('submit', handlePackageSubmit);

    // Content management
    document.getElementById('uploadContentBtn')?.addEventListener('click', () => openContentModal());
    document.getElementById('contentForm')?.addEventListener('submit', handleContentSubmit);
    document.getElementById('contentType')?.addEventListener('change', handleContentTypeChange);

    // Settings
    document.getElementById('profileForm')?.addEventListener('submit', handleProfileUpdate);

    // Modal close buttons
    document.querySelectorAll('.modal .close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            closeModal(modal.id);
        });
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });
}

// ============================================
// DATA LOADING
// ============================================

async function loadDashboardData() {
    debugLog('Loading dashboard data...');
    await Promise.all([
        loadStats(),
        loadPackageStats(),
        loadSettings()
    ]);
}

async function loadStats() {
    try {
        const { data, error } = await window.supabaseCoach
            .from('coach_dashboard_stats')
            .select('*')
            .eq('coach_id', currentCoach.id)
            .single();

        if (error) throw error;

        debugLog('Stats loaded:', data);

        // Update stat cards
        document.getElementById('totalMembers').textContent = data.total_members || 0;
        document.getElementById('activeMembers').textContent = data.active_members || 0;
        document.getElementById('totalPackages').textContent = data.total_packages || 0;
        document.getElementById('monthlyRevenue').textContent = `€${(data.monthly_revenue || 0).toFixed(2)}`;

    } catch (error) {
        debugLog('Error loading stats:', error);
        // Show zeros if no data yet
        document.getElementById('totalMembers').textContent = '0';
        document.getElementById('activeMembers').textContent = '0';
        document.getElementById('totalPackages').textContent = '0';
        document.getElementById('monthlyRevenue').textContent = '€0.00';
    }
}

async function loadPackageStats() {
    try {
        const { data, error } = await window.supabaseCoach
            .from('package_stats')
            .select('*')
            .eq('coach_id', currentCoach.id);

        if (error) throw error;

        debugLog('Package stats loaded:', data);

        const container = document.getElementById('packageStatsContainer');
        
        if (!data || data.length === 0) {
            container.innerHTML = '<p class="empty-state">Noch keine Pakete erstellt. <a href="#" onclick="switchTab(\'packages\')">Erstes Paket erstellen</a></p>';
            return;
        }

        container.innerHTML = `
            <table class="package-stats-table">
                <thead>
                    <tr>
                        <th>Paket</th>
                        <th>Preis</th>
                        <th>Abonnenten</th>
                        <th>Content</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(pkg => `
                        <tr>
                            <td>${pkg.package_name}</td>
                            <td>€${pkg.price}</td>
                            <td>${pkg.active_subscriptions} / ${pkg.total_subscriptions}</td>
                            <td>${pkg.content_count}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

    } catch (error) {
        debugLog('Error loading package stats:', error);
        document.getElementById('packageStatsContainer').innerHTML = '<p class="empty-state">Fehler beim Laden der Statistiken.</p>';
    }
}

async function loadPackages() {
    try {
        const { data, error } = await window.supabaseCoach
            .from('packages')
            .select('*')
            .eq('coach_id', currentCoach.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        debugLog('Packages loaded:', data);

        const container = document.getElementById('packagesContainer');
        
        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📦</div>
                    <h3>Noch keine Pakete</h3>
                    <p>Erstelle dein erstes Membership-Paket</p>
                    <button class="btn btn-primary" onclick="openPackageModal()">+ Erstes Paket erstellen</button>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="packages-grid">
                ${data.map(pkg => createPackageCard(pkg)).join('')}
            </div>
        `;

    } catch (error) {
        debugLog('Error loading packages:', error);
        showAlert('Fehler beim Laden der Pakete');
    }
}

function createPackageCard(pkg) {
    const features = pkg.features || [];
    return `
        <div class="package-card">
            <h3>${pkg.name}</h3>
            <div class="price">€${pkg.price} / ${pkg.billing_interval === 'year' ? 'Jahr' : 'Monat'}</div>
            <div class="description">${pkg.description || ''}</div>
            ${features.length > 0 ? `
                <ul class="features">
                    ${features.map(f => `<li>✓ ${f}</li>`).join('')}
                </ul>
            ` : ''}
            <div class="package-stats">
                <span>Status: ${pkg.is_active ? '✅ Aktiv' : '❌ Inaktiv'}</span>
            </div>
            <div class="actions">
                <button class="btn btn-secondary" onclick="editPackage('${pkg.id}')">Bearbeiten</button>
                <button class="btn btn-danger" onclick="deletePackage('${pkg.id}')">Löschen</button>
            </div>
        </div>
    `;
}

async function loadContent() {
    try {
        const { data, error } = await window.supabaseCoach
            .from('content')
            .select('*, packages(name)')
            .eq('coach_id', currentCoach.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        debugLog('Content loaded:', data);

        const container = document.getElementById('contentContainer');
        
        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📁</div>
                    <h3>Noch kein Content</h3>
                    <p>Lade deinen ersten Content hoch</p>
                    <button class="btn btn-primary" onclick="openContentModal()">+ Content hochladen</button>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="content-grid">
                ${data.map(content => createContentCard(content)).join('')}
            </div>
        `;

    } catch (error) {
        debugLog('Error loading content:', error);
        showAlert('Fehler beim Laden des Contents');
    }
}

function createContentCard(content) {
    const typeIcons = {
        image: '🖼️',
        document: '📄',
        video: '🎥',
        text: '📝'
    };

    const icon = typeIcons[content.type] || '📁';
    const packageName = content.packages?.name || 'Unbekannt';

    return `
        <div class="content-card">
            <div class="thumbnail">
                ${content.type === 'image' && content.file_url ? 
                    `<img src="${content.file_url}" alt="${content.title}">` :
                    icon
                }
            </div>
            <div class="content-info">
                <h4>${content.title}</h4>
                <div class="content-meta">
                    <div>Typ: ${content.type}</div>
                    <div>Paket: ${packageName}</div>
                </div>
                <div class="actions">
                    <button class="btn btn-secondary" onclick="viewContent('${content.id}')">Ansehen</button>
                    <button class="btn btn-danger" onclick="deleteContent('${content.id}')">Löschen</button>
                </div>
            </div>
        </div>
    `;
}

async function loadMembers() {
    try {
        const { data, error } = await window.supabaseCoach
            .from('subscriptions')
            .select(`
                *,
                profiles(name, email),
                packages(name, price)
            `)
            .eq('coach_id', currentCoach.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        debugLog('Members loaded:', data);

        const container = document.getElementById('membersContainer');
        
        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">👥</div>
                    <h3>Noch keine Mitglieder</h3>
                    <p>Sobald sich jemand für deine Pakete anmeldet, erscheinen sie hier.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="members-table">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>E-Mail</th>
                            <th>Paket</th>
                            <th>Status</th>
                            <th>Seit</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(member => `
                            <tr>
                                <td>${member.profiles?.name || 'N/A'}</td>
                                <td>${member.profiles?.email || 'N/A'}</td>
                                <td>${member.packages?.name || 'N/A'}</td>
                                <td><span class="status-badge ${member.status}">${member.status}</span></td>
                                <td>${new Date(member.created_at).toLocaleDateString('de-DE')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

    } catch (error) {
        debugLog('Error loading members:', error);
        showAlert('Fehler beim Laden der Mitglieder');
    }
}

async function loadSettings() {
    // Load profile data
    document.getElementById('profileName').value = currentCoach.name || '';
    document.getElementById('profileBusinessName').value = currentCoach.business_name || '';
    document.getElementById('profileDescription').value = currentCoach.description || '';
    document.getElementById('profileSlug').value = currentCoach.slug || '';

    // Load Stripe status
    const stripeStatus = document.getElementById('stripeStatus');
    if (currentCoach.stripe_onboarding_complete) {
        stripeStatus.textContent = '✅ Verbunden';
        stripeStatus.style.color = 'green';
    } else {
        stripeStatus.textContent = '❌ Nicht verbunden';
        stripeStatus.style.color = 'red';
    }
}

// ============================================
// TAB SWITCHING
// ============================================

function switchTab(tabName) {
    debugLog('Switching to tab:', tabName);

    // Update menu items
    document.querySelectorAll('.dashboard-menu-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.tab === tabName) {
            item.classList.add('active');
        }
    });

    // Update sections
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(tabName);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Load data for the tab
    switch(tabName) {
        case 'packages':
            loadPackages();
            break;
        case 'content':
            loadContent();
            loadPackagesForSelect();
            break;
        case 'members':
            loadMembers();
            break;
        case 'settings':
            loadSettings();
            break;
    }
}

window.switchTab = switchTab; // Make it globally available

// ============================================
// PACKAGE MANAGEMENT
// ============================================

function openPackageModal(packageId = null) {
    const modal = document.getElementById('packageModal');
    const title = document.getElementById('packageModalTitle');
    const form = document.getElementById('packageForm');
    
    form.reset();
    
    if (packageId) {
        title.textContent = 'Paket bearbeiten';
        // Load package data
        loadPackageForEdit(packageId);
    } else {
        title.textContent = 'Neues Paket erstellen';
    }
    
    modal.style.display = 'block';
}

window.openPackageModal = openPackageModal;

async function loadPackageForEdit(packageId) {
    try {
        const { data, error } = await window.supabaseCoach
            .from('packages')
            .select('*')
            .eq('id', packageId)
            .single();

        if (error) throw error;

        document.getElementById('packageId').value = data.id;
        document.getElementById('packageName').value = data.name;
        document.getElementById('packageDescription').value = data.description || '';
        document.getElementById('packagePrice').value = data.price;
        document.getElementById('packageInterval').value = data.billing_interval;
        
        if (data.features && data.features.length > 0) {
            document.getElementById('packageFeatures').value = data.features.join('\n');
        }

    } catch (error) {
        debugLog('Error loading package for edit:', error);
        showAlert('Fehler beim Laden des Pakets');
    }
}

async function handlePackageSubmit(e) {
    e.preventDefault();

    const packageId = document.getElementById('packageId').value;
    const name = document.getElementById('packageName').value;
    const description = document.getElementById('packageDescription').value;
    const price = parseFloat(document.getElementById('packagePrice').value);
    const interval = document.getElementById('packageInterval').value;
    const featuresText = document.getElementById('packageFeatures').value;
    
    const features = featuresText
        .split('\n')
        .map(f => f.trim())
        .filter(f => f.length > 0);

    const packageData = {
        coach_id: currentCoach.id,
        name,
        description,
        price,
        billing_interval: interval,
        features
    };

    try {
        let result;
        if (packageId) {
            // Update existing
            result = await window.supabaseCoach
                .from('packages')
                .update(packageData)
                .eq('id', packageId);
        } else {
            // Create new
            result = await window.supabaseCoach
                .from('packages')
                .insert(packageData);
        }

        if (result.error) throw result.error;

        debugLog('Package saved successfully');
        showAlert('Paket erfolgreich gespeichert!', 'success');
        closeModal('packageModal');
        loadPackages();
        loadStats();
        loadPackageStats();

    } catch (error) {
        debugLog('Error saving package:', error);
        showAlert('Fehler beim Speichern des Pakets');
    }
}

async function editPackage(packageId) {
    openPackageModal(packageId);
}

window.editPackage = editPackage;

async function deletePackage(packageId) {
    if (!confirm('Möchtest du dieses Paket wirklich löschen?')) {
        return;
    }

    try {
        const { error } = await window.supabaseCoach
            .from('packages')
            .delete()
            .eq('id', packageId);

        if (error) throw error;

        debugLog('Package deleted');
        showAlert('Paket gelöscht', 'success');
        loadPackages();
        loadStats();
        loadPackageStats();

    } catch (error) {
        debugLog('Error deleting package:', error);
        showAlert('Fehler beim Löschen des Pakets');
    }
}

window.deletePackage = deletePackage;

// ============================================
// CONTENT MANAGEMENT
// ============================================

async function loadPackagesForSelect() {
    try {
        const { data, error } = await window.supabaseCoach
            .from('packages')
            .select('id, name')
            .eq('coach_id', currentCoach.id)
            .eq('is_active', true);

        if (error) throw error;

        const selects = [
            document.getElementById('contentPackage'),
            document.getElementById('filterPackage')
        ];

        selects.forEach(select => {
            if (!select) return;
            
            const currentValue = select.value;
            const options = select.id === 'filterPackage' 
                ? '<option value="">Alle Pakete</option>' 
                : '<option value="">Bitte wählen...</option>';
            
            select.innerHTML = options + data.map(pkg => 
                `<option value="${pkg.id}">${pkg.name}</option>`
            ).join('');
            
            if (currentValue) {
                select.value = currentValue;
            }
        });

    } catch (error) {
        debugLog('Error loading packages for select:', error);
    }
}

function openContentModal() {
    const modal = document.getElementById('contentModal');
    const form = document.getElementById('contentForm');
    
    form.reset();
    loadPackagesForSelect();
    
    modal.style.display = 'block';
}

window.openContentModal = openContentModal;

function handleContentTypeChange() {
    const type = document.getElementById('contentType').value;
    const fileGroup = document.getElementById('fileUploadGroup');
    const textGroup = document.getElementById('textContentGroup');
    const fileInput = document.getElementById('contentFile');

    if (type === 'text') {
        fileGroup.style.display = 'none';
        textGroup.style.display = 'block';
        fileInput.removeAttribute('required');
    } else {
        fileGroup.style.display = 'block';
        textGroup.style.display = 'none';
        fileInput.setAttribute('required', 'required');

        // Update file input accept attribute
        if (type === 'image') {
            fileInput.accept = 'image/*';
        } else if (type === 'document') {
            fileInput.accept = '.pdf,.doc,.docx,.txt';
        }
    }
}

async function handleContentSubmit(e) {
    e.preventDefault();

    const packageId = document.getElementById('contentPackage').value;
    const type = document.getElementById('contentType').value;
    const title = document.getElementById('contentTitle').value;
    const description = document.getElementById('contentDescription').value;
    const fileInput = document.getElementById('contentFile');
    const textContent = document.getElementById('contentText').value;

    if (!packageId || !type || !title) {
        showAlert('Bitte fülle alle Pflichtfelder aus');
        return;
    }

    try {
        let fileUrl = null;

        // Upload file if type is not text
        if (type !== 'text' && fileInput.files.length > 0) {
            const file = fileInput.files[0];
            
            // Check file size (10 MB limit)
            if (file.size > 10 * 1024 * 1024) {
                showAlert('Datei ist zu groß. Maximal 10 MB erlaubt.');
                return;
            }

            fileUrl = await uploadFile(file, type);
            if (!fileUrl) {
                throw new Error('Datei-Upload fehlgeschlagen');
            }
        }

        // Create content entry
        const contentData = {
            coach_id: currentCoach.id,
            package_id: packageId,
            type,
            title,
            description,
            file_url: fileUrl,
            text_content: type === 'text' ? textContent : null,
            file_size: fileInput.files[0]?.size || null,
            mime_type: fileInput.files[0]?.type || null
        };

        const { error } = await window.supabaseCoach
            .from('content')
            .insert(contentData);

        if (error) throw error;

        debugLog('Content created successfully');
        showAlert('Content erfolgreich hochgeladen!', 'success');
        closeModal('contentModal');
        loadContent();
        loadStats();

    } catch (error) {
        debugLog('Error creating content:', error);
        showAlert('Fehler beim Hochladen des Contents');
    }
}

async function uploadFile(file, type) {
    try {
        debugLog('Uploading file:', file.name);

        // Show progress
        document.getElementById('uploadProgress').style.display = 'block';
        document.getElementById('uploadBtn').disabled = true;

        // Create file path: coach_id/type/filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${currentCoach.id}/${type}/${fileName}`;

        // Upload to Supabase Storage
        const { data, error } = await window.supabaseCoach.storage
            .from('content-files')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        debugLog('File uploaded:', data);

        // Get public URL
        const { data: urlData } = window.supabaseCoach.storage
            .from('content-files')
            .getPublicUrl(filePath);

        document.getElementById('uploadProgress').style.display = 'none';
        document.getElementById('uploadBtn').disabled = false;

        return urlData.publicUrl;

    } catch (error) {
        debugLog('Error uploading file:', error);
        document.getElementById('uploadProgress').style.display = 'none';
        document.getElementById('uploadBtn').disabled = false;
        return null;
    }
}

async function viewContent(contentId) {
    // TODO: Implement content viewer
    showAlert('Content-Viewer wird implementiert...');
}

window.viewContent = viewContent;

async function deleteContent(contentId) {
    if (!confirm('Möchtest du diesen Content wirklich löschen?')) {
        return;
    }

    try {
        // Get content to delete file from storage
        const { data: content } = await window.supabaseCoach
            .from('content')
            .select('file_url, type')
            .eq('id', contentId)
            .single();

        // Delete from database
        const { error } = await window.supabaseCoach
            .from('content')
            .delete()
            .eq('id', contentId);

        if (error) throw error;

        // Delete file from storage if exists
        if (content && content.file_url) {
            // Extract path from URL
            const urlParts = content.file_url.split('/content-files/');
            if (urlParts.length > 1) {
                const filePath = urlParts[1];
                await window.supabaseCoach.storage
                    .from('content-files')
                    .remove([filePath]);
            }
        }

        debugLog('Content deleted');
        showAlert('Content gelöscht', 'success');
        loadContent();
        loadStats();

    } catch (error) {
        debugLog('Error deleting content:', error);
        showAlert('Fehler beim Löschen des Contents');
    }
}

window.deleteContent = deleteContent;

// ============================================
// SETTINGS
// ============================================

async function handleProfileUpdate(e) {
    e.preventDefault();

    const name = document.getElementById('profileName').value;
    const businessName = document.getElementById('profileBusinessName').value;
    const description = document.getElementById('profileDescription').value;

    try {
        const { error } = await window.supabaseCoach
            .from('coaches')
            .update({
                name,
                business_name: businessName,
                description
            })
            .eq('id', currentCoach.id);

        if (error) throw error;

        currentCoach.name = name;
        currentCoach.business_name = businessName;
        currentCoach.description = description;

        debugLog('Profile updated');
        showAlert('Profil aktualisiert!', 'success');
        initializeUI();

    } catch (error) {
        debugLog('Error updating profile:', error);
        showAlert('Fehler beim Aktualisieren des Profils');
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

window.closeModal = closeModal;

function showAlert(message, type = 'error') {
    alert(message); // TODO: Replace with better notification system
}

function viewLandingPage() {
    window.open(`/?coach=${currentCoach.slug}`, '_blank');
}

window.viewLandingPage = viewLandingPage;

async function handleLogout() {
    try {
        await window.supabaseCoach.auth.signOut();
        window.location.href = 'coach-login.html';
    } catch (error) {
        debugLog('Logout error:', error);
    }
}
