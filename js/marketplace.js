// ============================================
// MARKETPLACE LOGIC — Role-Based (Buyer / Farmer)
// ============================================

let marketplaceState = {
    role: null,          // 'buyer' | 'farmer'
    activeTab: 'buyer',
    category: 'all',
    query: '',
    products: [...MARKETPLACE_PRODUCTS],
    myListings: []       // listings added by this farmer in current session
};

// Ensure marketplace is only initialized once per session
function checkMarketplaceInit() {
    console.log('Marketplace module initialized with ' + marketplaceState.products.length + ' items.');
}

// ─── Role Picker ────────────────────────────────────────────────────────────

function openMarketplace() {
    // Show role picker first; called from navigation instead of showSection directly
    const overlay = document.getElementById('rolePickerOverlay');
    if (overlay) {
        overlay.style.display = 'flex';
        // Prevent body scroll while picker is open
        document.body.style.overflow = 'hidden';
    }
}

function selectMarketplaceRole(role) {
    marketplaceState.role = role;
    // Hide role picker
    const overlay = document.getElementById('rolePickerOverlay');
    if (overlay) overlay.style.display = 'none';
    document.body.style.overflow = '';

    // Update role badge
    const badge = document.getElementById('mkRoleLabel');
    if (badge) badge.textContent = role === 'farmer' ? 'Farmer' : 'Buyer';

    // Switch to the appropriate default tab
    if (role === 'farmer') {
        switchMkTab('farmer');
    } else {
        switchMkTab('buyer');
    }

    // Initialise marketplace content
    initMarketplace();
}

function switchRole() {
    const overlay = document.getElementById('rolePickerOverlay');
    if (overlay) {
        overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

// ─── Tab Switching ───────────────────────────────────────────────────────────

function switchMkTab(tab) {
    marketplaceState.activeTab = tab;

    // Toggle tab buttons
    document.getElementById('tabBuyer')?.classList.toggle('active', tab === 'buyer');
    document.getElementById('tabFarmer')?.classList.toggle('active', tab === 'farmer');

    // Toggle tab content
    const buyerContent  = document.getElementById('buyerTab');
    const farmerContent = document.getElementById('farmerTab');
    if (buyerContent)  buyerContent.classList.toggle('active', tab === 'buyer');
    if (farmerContent) farmerContent.classList.toggle('active', tab === 'farmer');
}

// ─── Init ────────────────────────────────────────────────────────────────────

function initMarketplace() {
    renderMarketplaceCategories();
    renderMarketplaceProducts();
    renderFarmerListings();
}

// ─── Render Categories ───────────────────────────────────────────────────────

function renderMarketplaceCategories() {
    const container = document.getElementById('marketplaceCategories');
    if (!container) return;
    container.innerHTML = MARKETPLACE_CATEGORIES.map(cat => `
        <div class="category-chip ${marketplaceState.category === cat.id ? 'active' : ''}"
             onclick="filterMarketplace('${cat.id}')">
            <i class="fas ${cat.icon}"></i>
            <span>${cat.name}</span>
        </div>
    `).join('');
}

// ─── Render Buyer Product Grid ───────────────────────────────────────────────

function renderMarketplaceProducts() {
    const grid = document.getElementById('marketplaceGrid');
    if (!grid) return;

    const filtered = marketplaceState.products.filter(p => {
        const cat = marketplaceState.category === 'all' || p.category === marketplaceState.category;
        const q   = marketplaceState.query.toLowerCase();
        const search = !q ||
            p.name.toLowerCase().includes(q) ||
            (p.farmerName && p.farmerName.toLowerCase().includes(q)) ||
            (p.location && p.location.toLowerCase().includes(q));
        return cat && search;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="marketplace-empty-state">
                <i class="fas fa-box-open"></i>
                <h3>No listings found</h3>
                <p>Try a different category or search term</p>
            </div>`;
        return;
    }

    grid.innerHTML = filtered.map(p => `
        <div class="premium-card">
            ${p.verified ? '<div class="verified-seal" title="Govt Verified"><i class="fas fa-shield-alt"></i></div>' : ''}
            <div class="premium-card-img-wrapper">
                <img src="${p.image || ''}"
                     class="premium-card-img"
                     alt="${p.name}"
                     loading="lazy"
                     onerror="this.style.display='none';this.parentNode.style.background='linear-gradient(135deg,#e8f5e9,#c8e6c9,#a5d6a7)';this.parentNode.innerHTML+='<div style=\\'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:2.5rem;\\'>🌿</div>'">
                <div class="premium-card-category">${MARKETPLACE_CATEGORIES.find(c => c.id === p.category)?.name || p.category}</div>
            </div>
            <div class="premium-card-body">
                <div class="premium-card-title">${p.name}</div>
                <div class="premium-card-info">
                    <div class="info-badge"><i class="fas fa-user-tie"></i> ${p.farmerName || 'Registered Farmer'}</div>
                    <div class="info-badge"><i class="fas fa-map-marker-alt"></i> ${p.location}</div>
                    <div class="info-badge"><i class="fas fa-cubes"></i> ${p.quantity}</div>
                </div>
                <div class="premium-card-footer">
                    <div class="premium-card-price">&#8377;${p.price.toLocaleString('en-IN')}<span>/${p.unit}</span></div>
                    <div class="premium-action-btns">
                        <button class="p-btn p-btn-cart" onclick="addToCart('${p.id}')" title="Add to Cart">
                            <i class="fas fa-cart-plus"></i>
                        </button>
                        <a href="https://wa.me/${p.whatsapp || p.contact.replace(/\D/g, '')}"
                           target="_blank" class="p-btn p-btn-wa" title="WhatsApp">
                            <i class="fab fa-whatsapp"></i>
                        </a>
                        <a href="tel:${p.contact}" class="p-btn p-btn-call" title="Call">
                            <i class="fas fa-phone"></i>
                        </a>
                    </div>
                </div>
            </div>
        </div>`).join('');
}

// ─── Render Farmer's Own Listings ────────────────────────────────────────────

function renderFarmerListings() {
    const container = document.getElementById('farmerActiveListings');
    if (!container) return;

    if (marketplaceState.myListings.length === 0) {
        container.innerHTML = `
            <div class="farmer-no-listing">
                <i class="fas fa-seedling"></i>
                <p>Your published listings will appear here</p>
            </div>`;
        return;
    }

    container.innerHTML = marketplaceState.myListings.map(p => `
        <div class="farmer-listing-row">
            <div class="flr-name">${p.name}</div>
            <div class="flr-meta">
                <span><i class="fas fa-tag"></i> &#8377;${p.price.toLocaleString('en-IN')}/${p.unit}</span>
                <span><i class="fas fa-cubes"></i> ${p.quantity}</span>
                <span><i class="fas fa-map-marker-alt"></i> ${p.location}</span>
            </div>
            <span class="flr-live"><i class="fas fa-circle"></i> Live</span>
        </div>`).join('');
}

// ─── Filter & Search ─────────────────────────────────────────────────────────

function filterMarketplace(category) {
    marketplaceState.category = category;
    marketplaceState.query = '';
    const input = document.getElementById('marketplaceSearch');
    if (input) input.value = '';
    renderMarketplaceCategories();
    renderMarketplaceProducts();
}

function searchMarketplace(query) {
    marketplaceState.query = query.trim();
    renderMarketplaceProducts();
}

// ─── Sell Submit ─────────────────────────────────────────────────────────────

function handleSellSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const fd   = new FormData(form);

    const phone = fd.get('contact').replace(/\D/g, '');
    const newProduct = {
        id: 'my' + Date.now(),
        name:       fd.get('name'),
        category:   fd.get('category'),
        price:      parseFloat(fd.get('price')),
        unit:       fd.get('unit'),
        quantity:   fd.get('quantity'),
        location:   fd.get('location'),
        farmerName: 'You',
        contact:    '+91 ' + fd.get('contact'),
        whatsapp:   '91' + phone,
        image:      'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&q=75',
        verified:   false,
        createdAt:  new Date().toISOString().split('T')[0]
    };

    // Add to both master list and farmer's own list
    marketplaceState.products.unshift(newProduct);
    marketplaceState.myListings.unshift(newProduct);

    renderMarketplaceProducts();
    renderFarmerListings();
    form.reset();

    // Toast
    const toast = document.createElement('div');
    toast.className = 'mk-toast';
    toast.innerHTML = '<i class="fas fa-check-circle"></i> Listing published successfully!';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

// ─── Legacy stubs (kept for compatibility) ───────────────────────────────────
function openSellModal()  { switchMkTab('farmer'); }
function closeSellModal() {}
