// ============================================
// MAIN APPLICATION INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    loadSavedTheme();

    const savedUser = localStorage.getItem('bharatfarm_current_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showApp();
        // Use default configured location or fetch weather
        fetchWeather();
    }

    // Initialize drag and drop for scanner
    initScannerDragDrop();

    // Load AI model for leaf scanner
    if (typeof loadModel === 'function') loadModel();

    // Initialize land size listener
    initLandSizeListener();
});
