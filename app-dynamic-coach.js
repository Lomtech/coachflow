// ============================================
// Dynamic Coach Landing Page Extension
// ============================================
// This script extends app.js to support coach-specific landing pages

let currentCoachData = null;
let coachPackages = [];

// ============================================
// COACH DETECTION & LOADING
// ============================================

async function initDynamicCoach() {
    debugLog('[COACH] Initializing dynamic coach detection...');
    
    // Get coach slug from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const coachSlug = urlParams.get('coach');
    
    if (!coachSlug) {
        debugLog('[COACH] No coach parameter found, using default content');
        return false;
    }
    
    debugLog('[COACH] Loading coach:', coachSlug);
    
    try {
        // Load coach data
        const { data: coach, error: coachError } = await supabase
            .from('coaches')
            .select('*')
            .eq('slug', coachSlug)
            .eq('is_active', true)
            .single();
        
        if (coachError || !coach) {
            debugLog('[COACH] Coach not found:', coachError);
            showAlert('Coach nicht gefunden');
            return false;
        }
        
        currentCoachData = coach;
        debugLog('[COACH] Coach loaded:', coach);
        
        // Load coach's packages
        const { data: packages, error: packagesError } = await supabase
            .from('packages')
            .select('*')
            .eq('coach_id', coach.id)
            .eq('is_active', true)
            .order('sort_order', { ascending: true });
        
        if (packagesError) {
            debugLog('[COACH] Error loading packages:', packagesError);
            return false;
        }
        
        coachPackages = packages || [];
        debugLog('[COACH] Packages loaded:', packages);
        
        // Update the page with coach's branding
        updatePageBranding();
        
        // Replace pricing section with coach's packages
        updatePricingSection();
        
        return true;
        
    } catch (error) {
        debugLog('[COACH] Error in initDynamicCoach:', error);
        return false;
    }
}

// ============================================
// PAGE UPDATES
// ============================================

function updatePageBranding() {
    if (!currentCoachData) return;
    
    debugLog('[COACH] Updating page branding...');
    
    // Update logo/title
    const logoElement = document.querySelector('.logo');
    if (logoElement) {
        logoElement.textContent = currentCoachData.business_name || currentCoachData.name;
    }
    
    // Update page title
    document.title = `${currentCoachData.business_name || currentCoachData.name} - Mitgliederbereich`;
    
    // Update hero section
    const heroTitle = document.querySelector('.hero h1');
    const heroDescription = document.querySelector('.hero p');
    
    if (heroTitle) {
        heroTitle.textContent = `Willkommen bei ${currentCoachData.business_name || currentCoachData.name}`;
    }
    
    if (heroDescription && currentCoachData.description) {
        heroDescription.textContent = currentCoachData.description;
    }
}

function updatePricingSection() {
    if (!coachPackages || coachPackages.length === 0) {
        debugLog('[COACH] No packages to display');
        return;
    }
    
    debugLog('[COACH] Updating pricing section with', coachPackages.length, 'packages');
    
    const pricingCardsContainer = document.querySelector('.pricing-cards');
    if (!pricingCardsContainer) {
        debugLog('[COACH] Pricing cards container not found');
        return;
    }
    
    // Clear existing cards
    pricingCardsContainer.innerHTML = '';
    
    // Create cards for each package
    coachPackages.forEach((pkg, index) => {
        const card = createPackagePricingCard(pkg, index === 1); // Mark middle one as featured
        pricingCardsContainer.appendChild(card);
    });
}

function createPackagePricingCard(pkg, isFeatured = false) {
    const card = document.createElement('div');
    card.className = 'pricing-card' + (isFeatured ? ' featured' : '');
    
    const features = pkg.features || [];
    const intervalText = pkg.billing_interval === 'year' ? 'Jahr' : 'Monat';
    
    card.innerHTML = `
        ${isFeatured ? '<div class="featured-badge">⭐ BELIEBT</div>' : ''}
        <h3>${pkg.name}</h3>
        <div class="price">€${pkg.price}<span>/${intervalText}</span></div>
        <ul class="features">
            ${features.map(feature => `<li>${feature}</li>`).join('')}
        </ul>
        <button class="subscribe-btn" data-package-id="${pkg.id}" data-package-name="${pkg.name}" data-package-price="${pkg.price}">
            ${pkg.name} wählen
        </button>
    `;
    
    // Add click event to subscribe button
    const button = card.querySelector('.subscribe-btn');
    button.addEventListener('click', () => handleCoachPackageSubscribe(pkg));
    
    return card;
}

// ============================================
// SUBSCRIPTION HANDLING
// ============================================

async function handleCoachPackageSubscribe(pkg) {
    debugLog('[COACH] Subscribe clicked for package:', pkg);
    
    // Check if user is logged in
    if (!currentUser) {
        // Show register modal
        openModal('registerModal');
        
        // Store selected package for after registration
        sessionStorage.setItem('pendingPackage', JSON.stringify({
            coachId: currentCoachData.id,
            packageId: pkg.id,
            packageName: pkg.name,
            price: pkg.price,
            interval: pkg.billing_interval
        }));
        
        return;
    }
    
    // User is logged in, show payment modal
    showCoachPaymentModal(pkg);
}

function showCoachPaymentModal(pkg) {
    const modal = document.getElementById('paymentModal');
    const paymentInfo = document.getElementById('paymentInfo');
    
    const intervalText = pkg.billing_interval === 'year' ? 'Jahr' : 'Monat';
    
    paymentInfo.innerHTML = `
        <div style="text-align: center;">
            <h3>${pkg.name}</h3>
            <div style="font-size: 2rem; font-weight: bold; color: #667eea; margin: 1rem 0;">
                €${pkg.price} / ${intervalText}
            </div>
            <div style="color: #666; margin-bottom: 1rem;">
                Coach: ${currentCoachData.business_name || currentCoachData.name}
            </div>
        </div>
    `;
    
    // Update form submit handler
    const form = document.getElementById('paymentForm');
    form.onsubmit = (e) => {
        e.preventDefault();
        processCoachPayment(pkg);
    };
    
    modal.style.display = 'block';
}

async function processCoachPayment(pkg) {
    try {
        debugLog('[COACH] Processing payment for package:', pkg);
        
        // Check if coach has Stripe Connect configured
        if (!currentCoachData.stripe_onboarding_complete || !currentCoachData.stripe_account_id) {
            throw new Error('Coach hat Stripe noch nicht konfiguriert. Bitte kontaktiere den Coach.');
        }
        
        // Create Stripe Checkout Session for this coach's package
        // TODO: This requires a backend function to create the checkout session
        // For now, show a message
        showAlert('Stripe Connect Integration wird implementiert. Der Coach wird benachrichtigt.');
        
        // Store subscription intent in database
        const { error } = await supabase
            .from('subscriptions')
            .insert({
                user_id: currentUser.id,
                coach_id: currentCoachData.id,
                package_id: pkg.id,
                status: 'pending'
            });
        
        if (error) throw error;
        
        debugLog('[COACH] Subscription intent created');
        
    } catch (error) {
        debugLog('[COACH] Payment error:', error);
        showAlert(error.message || 'Fehler beim Starten der Zahlung');
    }
}

// ============================================
// CONTENT LOADING FOR COACH PACKAGES
// ============================================

async function loadCoachContent() {
    if (!currentUser || !userSubscription) {
        debugLog('[COACH] No user or subscription, cannot load content');
        return;
    }
    
    debugLog('[COACH] Loading content for subscription:', userSubscription);
    
    try {
        // Load content for the subscribed package
        const { data: content, error } = await supabase
            .from('content')
            .select('*')
            .eq('package_id', userSubscription.package_id)
            .eq('is_published', true)
            .order('sort_order', { ascending: true });
        
        if (error) throw error;
        
        debugLog('[COACH] Content loaded:', content);
        
        // Group content by type
        const videos = content.filter(c => c.type === 'video');
        const documents = content.filter(c => c.type === 'document');
        const images = content.filter(c => c.type === 'image');
        const texts = content.filter(c => c.type === 'text');
        
        // Display content
        displayCoachVideos(videos);
        displayCoachDocuments(documents);
        displayCoachImages(images);
        
    } catch (error) {
        debugLog('[COACH] Error loading content:', error);
    }
}

function displayCoachVideos(videos) {
    const container = document.getElementById('videoList');
    if (!container) return;
    
    if (videos.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">Noch keine Videos verfügbar</p>';
        return;
    }
    
    container.innerHTML = videos.map(video => `
        <div class="content-item">
            <div class="content-thumbnail" style="background-image: url('${video.thumbnail_url || ''}')">
                ${!video.thumbnail_url ? '🎥' : ''}
            </div>
            <div class="content-details">
                <h3>${video.title}</h3>
                <p>${video.description || ''}</p>
                <button class="btn btn-primary" onclick="playCoachVideo('${video.file_url}', '${video.title}')">
                    Abspielen
                </button>
            </div>
        </div>
    `).join('');
}

function displayCoachDocuments(documents) {
    const container = document.getElementById('documentList');
    if (!container) return;
    
    if (documents.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">Noch keine Dokumente verfügbar</p>';
        return;
    }
    
    container.innerHTML = documents.map(doc => `
        <div class="content-item">
            <div class="content-thumbnail">📄</div>
            <div class="content-details">
                <h3>${doc.title}</h3>
                <p>${doc.description || ''}</p>
                <a href="${doc.file_url}" target="_blank" class="btn btn-primary" download>
                    Herunterladen
                </a>
            </div>
        </div>
    `).join('');
}

function displayCoachImages(images) {
    const container = document.getElementById('imageList');
    if (!container) return;
    
    if (images.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">Noch keine Bilder verfügbar</p>';
        return;
    }
    
    container.innerHTML = images.map(img => `
        <div class="content-item">
            <div class="content-thumbnail" style="background-image: url('${img.file_url}')">
                ${!img.file_url ? '🖼️' : ''}
            </div>
            <div class="content-details">
                <h3>${img.title}</h3>
                <p>${img.description || ''}</p>
                <a href="${img.file_url}" target="_blank" class="btn btn-primary">
                    Ansehen
                </a>
            </div>
        </div>
    `).join('');
}

function playCoachVideo(url, title) {
    // Use existing video player or create a simple one
    window.open(url, '_blank');
}

window.playCoachVideo = playCoachVideo;

// ============================================
// CHECK PENDING PACKAGE AFTER LOGIN
// ============================================

async function checkPendingPackage() {
    const pendingPackageData = sessionStorage.getItem('pendingPackage');
    if (pendingPackageData && currentUser) {
        const pendingPackage = JSON.parse(pendingPackageData);
        debugLog('[COACH] Found pending package after login:', pendingPackage);
        
        // Clear from storage
        sessionStorage.removeItem('pendingPackage');
        
        // Find the package
        const pkg = coachPackages.find(p => p.id === pendingPackage.packageId);
        if (pkg) {
            showCoachPaymentModal(pkg);
        }
    }
}

// ============================================
// OVERRIDE CONTENT LOADING
// ============================================

// Store original loadContent function
const originalLoadContent = window.loadContent || (() => {});

// Override with coach-aware version
window.loadContent = async function() {
    if (currentCoachData && userSubscription) {
        await loadCoachContent();
    } else {
        // Fall back to original content loading
        await originalLoadContent();
    }
};

// ============================================
// INITIALIZATION HOOK
// ============================================

// Wait for DOM and initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        await initDynamicCoach();
        // Check for pending package after user is loaded
        if (window.currentUser) {
            await checkPendingPackage();
        }
    });
} else {
    (async () => {
        await initDynamicCoach();
        if (window.currentUser) {
            await checkPendingPackage();
        }
    })();
}

// Export functions for external use
window.currentCoachData = () => currentCoachData;
window.coachPackages = () => coachPackages;
