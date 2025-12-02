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

export function loadTheme(app) {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
    }
    updateThemeIcon(app);
}

export function toggleTheme(app) {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    const theme = isLight ? 'light' : 'dark';

    localStorage.setItem('theme', theme);
    updateThemeIcon(app);

    app.showToast(
        isLight ? 'Switched to Alucard (Light) theme' : 'Switched to Dracula (Dark) theme'
    );
}

export function updateThemeIcon(app) {
    const isLight = document.body.classList.contains('light-mode');

    if (isLight) {
        app.themeIcon.innerHTML = `
            ircle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        `;
    } else {
        app.themeIcon.innerHTML = `
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        `;
    }
}
