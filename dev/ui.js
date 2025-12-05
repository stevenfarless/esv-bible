// ui.js
// Responsibility: DOM caching, event wiring, theme, modals, toast.

export function cacheElements(app) {
    // Header
    app.searchToggleBtn = document.getElementById('searchToggleBtn');
    app.settingsBtn = document.getElementById('settingsBtn');

    // Search
    app.searchContainer = document.getElementById('searchContainer');
    app.searchInput = document.getElementById('searchInput');
    app.closeSearchBtn = document.getElementById('closeSearchBtn');
    app.searchResults = document.getElementById('searchResults');

    // Navigation
    app.prevChapterBtn = document.getElementById('prevChapterBtn');
    app.nextChapterBtn = document.getElementById('nextChapterBtn');
    app.bookSelector = document.getElementById('bookSelector');
    app.chapterSelector = document.getElementById('chapterSelector');
    app.verseSelector = document.getElementById('verseSelector');
    app.currentBookSpan = document.getElementById('currentBook');
    app.currentChapterSpan = document.getElementById('currentChapter');
    app.currentVerseSpan = document.getElementById('currentVerse');

    // Content
    app.passageTitle = document.getElementById('passageTitle');
    app.passageText = document.getElementById('passageText');
    app.copyright = document.getElementById('copyright');
    app.copyBtn = document.getElementById('copyBtn');

    // Modals
    app.bookModal = document.getElementById('bookModal');
    app.closeBookModal = document.getElementById('closeBookModal');
    app.oldTestamentBooks = document.getElementById('oldTestamentBooks');
    app.newTestamentBooks = document.getElementById('newTestamentBooks');

    app.chapterModal = document.getElementById('chapterModal');
    app.closeChapterModal = document.getElementById('closeChapterModal');
    app.chapterModalBook = document.getElementById('chapterModalBook');
    app.chapterGrid = document.getElementById('chapterGrid');

    app.verseModal = document.getElementById('verseModal');
    app.closeVerseModal = document.getElementById('closeVerseModal');
    app.verseModalBook = document.getElementById('verseModalBook');
    app.verseGrid = document.getElementById('verseGrid');

    app.settingsModal = document.getElementById('settingsModal');
    app.closeSettingsModal = document.getElementById('closeSettingsModal');
    app.apiKeyInput = document.getElementById('apiKeyInput');
    app.saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
    app.verseNumbersToggle = document.getElementById('verseNumbersToggle');
    app.headingsToggle = document.getElementById('headingsToggle');
    app.footnotesToggle = document.getElementById('footnotesToggle');
    app.verseByVerseToggle = document.getElementById('verseByVerseToggle');
    app.fontSizeSlider = document.getElementById('fontSizeSlider');
    app.fontSizeValue = document.getElementById('fontSizeValue');

    // Theme & Auth
    app.themeToggleBtn = document.getElementById('themeToggleBtn');
    app.themeIcon = document.getElementById('themeIcon');
    app.userBtn = document.getElementById('userBtn');

    // Auth modals
    app.loginModal = document.getElementById('loginModal');
    app.signupModal = document.getElementById('signupModal');
    app.userMenuModal = document.getElementById('userMenuModal');
    app.closeLoginModal = document.getElementById('closeLoginModal');
    app.closeSignupModal = document.getElementById('closeSignupModal');
    app.closeUserMenuModal = document.getElementById('closeUserMenuModal');

    // Toast
    app.toast = document.getElementById('toast');
}

export function attachEventListeners(app) {
    // header, search, navigation, modals, settings, theme, auth, keyboard, etc.
    // This is essentially your current attachEventListeners method,
    // moved here and turned into a function receiving `app`.
}

// Load theme from localStorage
export function loadTheme(app) {
    const savedTheme = localStorage.getItem('colorTheme') || 'dracula';
    const savedMode = localStorage.getItem('themeMode') || 'dark';

    // Apply theme class
    document.body.classList.remove('steel-theme');
    if (savedTheme === 'steel') {
        document.body.classList.add('steel-theme');
    }

    // Apply light/dark mode
    if (savedMode === 'light') {
        document.body.classList.add('light-mode');
    } else {
        document.body.classList.remove('light-mode');
    }

    updateThemeIcon(app);
}

// Toggle between light and dark mode (keeps current theme)
export function toggleTheme(app) {
    const isLightMode = document.body.classList.toggle('light-mode');
    localStorage.setItem('themeMode', isLightMode ? 'light' : 'dark');
    updateThemeIcon(app);
}

// Update theme icon based on current mode
export function updateThemeIcon(app) {
    const isLightMode = document.body.classList.contains('light-mode');
    app.themeToggleBtn.innerHTML = isLightMode
        ? '<svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278z"/></svg>'
        : '<svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm0 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0zm-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708z"/></svg>';
}

// Change color theme (dracula, steel, or onyx)
export function changeColorTheme(app, theme) {
    // Remove all theme classes
    document.body.classList.remove('steel-theme', 'onyx-theme');

    // Add new theme class if not dracula (dracula is default)
    if (theme === 'steel') {
        document.body.classList.add('steel-theme');
    } else if (theme === 'onyx') {
        document.body.classList.add('onyx-theme');
    }

    // Save preference
    localStorage.setItem('colorTheme', theme);
}
