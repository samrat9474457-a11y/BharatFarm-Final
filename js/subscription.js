// ============================================
// SUBSCRIPTION FEATURE
// ============================================

function openSubscription() {
    const modal = document.getElementById('subscriptionModal');
    if (modal) {
        modal.style.display = 'flex';
        // Add class to body to prevent scrolling
        document.body.style.overflow = 'hidden';
    }
}

function closeSubscription() {
    const modal = document.getElementById('subscriptionModal');
    if (modal) {
        modal.style.display = 'none';
        // Restore scrolling
        document.body.style.overflow = '';
    }
}

function showPaymentModal() {
    document.getElementById('premiumCard').style.display = 'none';
    document.getElementById('paymentCard').style.display = 'block';

    // Reset to Selection State
    document.getElementById('paymentSelectionState').style.display = 'block';
    document.getElementById('paymentLoadingState').style.display = 'none';
    document.getElementById('paymentSuccessState').style.display = 'none';
    document.getElementById('paymentStatusMsg').innerText = '';
}

function hidePaymentModal() {
    document.getElementById('paymentCard').style.display = 'none';
    document.getElementById('premiumCard').style.display = 'block';
}

function showNotAvailable(methodName) {
    const statusMsg = document.getElementById('paymentStatusMsg');
    statusMsg.innerText = `${methodName} is currently unavailable in this prototype. Please use UPI.`;

    // Clear the message after 3 seconds
    setTimeout(() => {
        if (statusMsg.innerText.includes('unavailable')) {
            statusMsg.innerText = '';
        }
    }, 3000);
}

function startUPIPayment() {
    // Hide Selection, Show Loading
    document.getElementById('paymentSelectionState').style.display = 'none';
    document.getElementById('paymentLoadingState').style.display = 'block';

    // Simulate 3 second payment process
    setTimeout(() => {
        completePayment();
    }, 3000);
}

function completePayment() {
    // Hide Loading, Show Success
    document.getElementById('paymentLoadingState').style.display = 'none';
    document.getElementById('paymentSuccessState').style.display = 'block';

    // 1. Update localStorage status
    let currentUser = { name: 'UnknownUser' };
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        try {
            currentUser = JSON.parse(storedUser);
            currentUser.status = 'Premium';
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        } catch (e) {
            console.error("Error parsing user from localStorage", e);
        }
    }

    // 2. Set global premium flag
    localStorage.setItem('isPremium', 'true');

    // 3. Immediately unlock features in the UI
    unlockPremiumFeaturesUI();
}

function unlockPremiumFeaturesUI() {
    // Find all roadmap links and scanner buttons that might be locked
    const disabledItems = document.querySelectorAll('.disabled, .disabled-btn, [style*="pointer-events: none"]');

    disabledItems.forEach(item => {
        item.classList.remove('disabled');
        item.classList.remove('disabled-btn');

        // Remove inline styles that block clicking
        if (item.style.pointerEvents === 'none') {
            item.style.pointerEvents = 'auto';
        }
        if (item.style.opacity) {
            item.style.opacity = '1';
        }

        // Update lock icons to unlock if present
        const lockIcon = item.querySelector('.fa-lock');
        if (lockIcon) {
            lockIcon.classList.remove('fa-lock');
            lockIcon.classList.add('fa-unlock');
            lockIcon.style.color = 'var(--success)';
        }
    });

    console.log("Premium features unlocked in UI.");
}

// Close modal when clicking outside
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('subscriptionModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeSubscription();
            }
        });
    }
});
