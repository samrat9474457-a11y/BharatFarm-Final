// ============================================
// NAVIGATION FUNCTIONS
// ============================================

// Navigation history stack for step-by-step back navigation
const navigationHistory = [];
let currentSection = 'dashboard';

function showSection(sectionId, button) {
    // Push current section to history before navigating (avoid duplicates)
    if (currentSection && currentSection !== sectionId) {
        navigationHistory.push(currentSection);
    }
    currentSection = sectionId;

    document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    // Update desktop nav buttons
    document.querySelectorAll('nav button').forEach(btn => {
        const btnSection = btn.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
        if (btnSection === sectionId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Update mobile bottom nav buttons
    document.querySelectorAll('.mobile-bottom-nav button').forEach(btn => {
        const btnSection = btn.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
        if (btnSection === sectionId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    const nav = document.getElementById('mainNav');
    if (nav) nav.classList.remove('mobile-open');

    // Handle global back button visibility (show on mobile when NOT on dashboard)
    const backBtn = document.getElementById('globalBackBtn');
    if (backBtn) {
        if (sectionId === 'dashboard') {
            backBtn.style.display = 'none';
        } else {
            // Check if on mobile view
            if (window.innerWidth <= 768) {
                backBtn.style.display = 'flex';
            } else {
                backBtn.style.display = 'none';
            }
        }
    }

    // Initialize marketplace if selected — show role picker first
    if (sectionId === 'marketplace' && typeof openMarketplace === 'function') {
        openMarketplace();
    }
}

/**
 * Go back to the previous section (step-by-step navigation)
 * Falls back to dashboard if no history exists
 */
function goBack() {
    if (navigationHistory.length > 0) {
        const previousSection = navigationHistory.pop();
        // Navigate without pushing to history (to avoid loops)
        currentSection = previousSection;

        document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
        document.getElementById(previousSection).classList.add('active');

        // Handle global back button visibility
        const backBtn = document.getElementById('globalBackBtn');
        if (backBtn) {
            if (previousSection === 'dashboard') {
                backBtn.style.display = 'none';
            } else if (window.innerWidth <= 768) {
                backBtn.style.display = 'flex';
            } else {
                backBtn.style.display = 'none';
            }
        }
    } else {
        // No history — go to dashboard
        showSection('dashboard');
    }
}

function toggleMobileMenu() {
    const nav = document.getElementById('mainNav');
    if (nav) nav.classList.toggle('mobile-open');
}

function showAboutPage() {
    document.getElementById('aboutPage').style.display = 'block';
    document.getElementById('appContainer').style.display = 'none';
    document.getElementById('authPage').style.display = 'none';
}

function hideAboutPage() {
    document.getElementById('aboutPage').style.display = 'none';
    const currentUser = localStorage.getItem('bharatfarm_current_user');
    if (currentUser) {
        document.getElementById('appContainer').style.display = 'block';
    } else {
        document.getElementById('authPage').style.display = 'flex';
    }
}
