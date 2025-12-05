// ====================
// ESV Bible Reader App
// ====================

import { BibleApi } from './bible-api.js';
import { initializeState, navigateChapter as navChapter, scrollToVerse as scrollVerse, applyVerseGlow as glowVerse } from './reading-state.js';
import { loadUserData as loadUserDataFromFirebase } from './firebase-config.js';
import { cacheElements, loadTheme, toggleTheme, updateThemeIcon, changeColorTheme } from './ui.js';

class BibleApp {
	constructor() {
		// Configuration
		this.API_BASE_URL = 'https://api.esv.org/v3';
		this.API_KEY = '';

		// Firebase references
		this.auth = window.firebaseAuth;
		this.database = window.firebaseDatabase;
		this.currentUser = null;

		// Bible structure data
		this.bibleBooks = this.initializeBibleStructure();

		// Book abbreviations for UI
		this.bookAbbreviations = {
			'Genesis': 'Gen', 'Exodus': 'Exod', 'Leviticus': 'Lev', 'Numbers': 'Num',
			'Deuteronomy': 'Deut', 'Joshua': 'Josh', 'Judges': 'Judg', 'Ruth': 'Ruth',
			'1 Samuel': '1Sam', '2 Samuel': '2Sam', '1 Kings': '1Kgs', '2 Kings': '2Kgs',
			'1 Chronicles': '1Chr', '2 Chronicles': '2Chr', 'Ezra': 'Ezra', 'Nehemiah': 'Neh',
			'Esther': 'Esth', 'Job': 'Job', 'Psalms': 'Ps', 'Proverbs': 'Prov',
			'Ecclesiastes': 'Eccl', 'Song of Solomon': 'Song', 'Isaiah': 'Isa', 'Jeremiah': 'Jer',
			'Lamentations': 'Lam', 'Ezekiel': 'Ezek', 'Daniel': 'Dan', 'Hosea': 'Hos',
			'Joel': 'Joel', 'Amos': 'Amos', 'Obadiah': 'Obad', 'Jonah': 'Jonah',
			'Micah': 'Mic', 'Nahum': 'Nah', 'Habakkuk': 'Hab', 'Zephaniah': 'Zeph',
			'Haggai': 'Hag', 'Zechariah': 'Zech', 'Malachi': 'Mal', 'Matthew': 'Matt',
			'Mark': 'Mark', 'Luke': 'Luke', 'John': 'John', 'Acts': 'Acts', 'Romans': 'Rom',
			'1 Corinthians': '1Cor', '2 Corinthians': '2Cor', 'Galatians': 'Gal', 'Ephesians': 'Eph',
			'Philippians': 'Phil', 'Colossians': 'Col', '1 Thessalonians': '1Thes', '2 Thessalonians': '2Thes',
			'1 Timothy': '1Tim', '2 Timothy': '2Tim', 'Titus': 'Titus', 'Philemon': 'Phlm',
			'Hebrews': 'Heb', 'James': 'Jas', '1 Peter': '1Pet', '2 Peter': '2Pet',
			'1 John': '1John', '2 John': '2John', '3 John': '3John', 'Jude': 'Jude',
			'Revelation': 'Rev',
		};

		// State management (use helper now)
		this.state = initializeState();

		// Cache for search debouncing
		this.searchTimeout = null;

		// Scroll tracking
		this.scrollTimeout = null;

		// Reading position tracking
		this.lastScrollPosition = 0;

		// stores untouched HTML for current chapter
		this.originalPassageHtml = null;

		// ESV API client
		this.bibleApi = new BibleApi(
			this.API_BASE_URL,
			() => this.API_KEY,
			() => this.state
		);

		// Initialize app
		this.init();
	}

	// ================================
	// Initialization
	// ================================

	init() {
		cacheElements(this);
		loadTheme(this);

		// Set theme selector value AND apply the theme class
		const themeSelector = document.getElementById('themeSelector');
		const lightModeToggle = document.getElementById('lightModeToggle');

		if (themeSelector) {
			const savedTheme = localStorage.getItem('colorTheme') || 'dracula';
			themeSelector.value = savedTheme;
			// Apply the saved theme immediately
			changeColorTheme(this, savedTheme);
		}

		if (lightModeToggle) {
			lightModeToggle.checked = document.body.classList.contains('light-mode');
		}

		this.attachEventListeners();

		// Wait for Firebase auth state
		this.auth.onAuthStateChanged(async (user) => {
			if (user) {
				this.currentUser = user;
				await this.loadUserData();
				this.applySettings();
				await this.loadSavedReadingPosition();
			} else {
				this.currentUser = null;
				this.loadLocalSettings();
				this.applySettings();
				this.loadPassage(this.state.currentBook, this.state.currentChapter);
				this.checkApiKey();
			}
		});
	}

	attachEventListeners() {
		console.log('🔧 Attaching event listeners...');

		// Header
		console.log('🔍 Help elements:', { helpBtn: this.helpBtn, helpModal: this.helpModal });

		this.searchToggleBtn.addEventListener('click', () => this.toggleSearch());

		// SINGLE HELP BUTTON LISTENER
		if (this.helpBtn && this.helpModal) {
			this.helpBtn.addEventListener('click', () => {
				console.log('🔔 HELP BUTTON CLICKED!');
				this.openModal(this.helpModal);
			});
		} else {
			console.error('❌ HELP ELEMENTS MISSING!', { helpBtn: this.helpBtn, helpModal: this.helpModal });
		}

		this.settingsBtn.addEventListener('click', () => this.openModal(this.settingsModal));
		this.themeToggleBtn.addEventListener('click', () => toggleTheme(this))
		this.userBtn.addEventListener('click', () => this.handleUserButtonClick())

		// Navigation
		this.prevChapterBtn.addEventListener('click', () => this.navigateChapter(-1));
		this.nextChapterBtn.addEventListener('click', () => this.navigateChapter(1));
		this.bookSelector.addEventListener('click', () => this.openModal(this.bookModal));
		this.chapterSelector.addEventListener('click', () => this.openModal(this.chapterModal));
		this.verseSelector.addEventListener('click', () => this.openModal(this.verseModal));

		// Search
		this.closeSearchBtn.addEventListener('click', () => this.closeSearch());
		this.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
		this.searchInput.addEventListener('keydown', (e) => {
			if (e.key === 'Escape') this.closeSearch();
		});

		// Modals backdrop click
		[this.bookModal, this.chapterModal, this.verseModal, this.settingsModal,
		this.helpModal, this.loginModal, this.signupModal, this.userMenuModal].forEach(modal => {
			if (modal) {
				modal.addEventListener('click', (e) => {
					if (e.target === modal) this.closeModal(modal);
				});
			}
		});

		// Modal close buttons
		if (this.closeBookModal) this.closeBookModal.addEventListener('click', () => this.closeModal(this.bookModal));
		if (this.closeChapterModal) this.closeChapterModal.addEventListener('click', () => this.closeModal(this.chapterModal));
		if (this.closeVerseModal) this.closeVerseModal.addEventListener('click', () => this.closeModal(this.verseModal));
		if (this.closeSettingsModal) this.closeSettingsModal.addEventListener('click', () => this.closeModal(this.settingsModal));
		if (this.closeHelpModal) this.closeHelpModal.addEventListener('click', () => this.closeModal(this.helpModal));
		if (this.closeLoginModal) this.closeLoginModal.addEventListener('click', () => this.closeModal(this.loginModal));
		if (this.closeSignupModal) this.closeSignupModal.addEventListener('click', () => this.closeModal(this.signupModal));
		if (this.closeUserMenuModal) this.closeUserMenuModal.addEventListener('click', () => this.closeModal(this.userMenuModal));

		// Settings
		if (this.saveApiKeyBtn) this.saveApiKeyBtn.addEventListener('click', () => this.saveApiKey());
		if (this.verseNumbersToggle) this.verseNumbersToggle.addEventListener('change', (e) => this.toggleVerseNumbers(e.target.checked));
		if (this.headingsToggle) this.headingsToggle.addEventListener('change', (e) => this.toggleHeadings(e.target.checked));
		if (this.footnotesToggle) this.footnotesToggle.addEventListener('change', (e) => this.toggleFootnotes(e.target.checked));
		if (this.verseByVerseToggle) this.verseByVerseToggle.addEventListener('change', (e) => this.toggleVerseByVerse(e.target.checked));
		if (this.fontSizeSlider) this.fontSizeSlider.addEventListener('input', (e) => this.updateFontSize(e.target.value));

		// Search results
		this.searchResults.addEventListener('click', (e) => {
			if (e.target.closest('.search-result-item')) {
				const reference = e.target.closest('.search-result-item').dataset.reference;
				this.handleSearchResult(reference);
			}
		});

		// Keyboard shortcuts
		document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

		console.log('✅ All event listeners attached');
	}

	// ================================
	// Bible Structure
	// ================================

	initializeBibleStructure() {
		return {
			'Old Testament': {
				'Genesis': 50, 'Exodus': 40, 'Leviticus': 27, 'Numbers': 36, 'Deuteronomy': 34,
				'Joshua': 24, 'Judges': 21, 'Ruth': 4, '1 Samuel': 31, '2 Samuel': 24,
				'1 Kings': 22, '2 Kings': 25, '1 Chronicles': 29, '2 Chronicles': 36, 'Ezra': 10,
				'Nehemiah': 13, 'Esther': 10, 'Job': 42, 'Psalms': 150, 'Proverbs': 31,
				'Ecclesiastes': 12, 'Song of Solomon': 8, 'Isaiah': 66, 'Jeremiah': 52, 'Lamentations': 5,
				'Ezekiel': 48, 'Daniel': 12, 'Hosea': 14, 'Joel': 3, 'Amos': 9,
				'Obadiah': 1, 'Jonah': 4, 'Micah': 7, 'Nahum': 3, 'Habakkuk': 3,
				'Zephaniah': 3, 'Haggai': 2, 'Zechariah': 14, 'Malachi': 4
			},
			'New Testament': {
				'Matthew': 28, 'Mark': 16, 'Luke': 24, 'John': 21, 'Acts': 28,
				'Romans': 16, '1 Corinthians': 16, '2 Corinthians': 13, 'Galatians': 6, 'Ephesians': 6,
				'Philippians': 4, 'Colossians': 4, '1 Thessalonians': 5, '2 Thessalonians': 3, '1 Timothy': 6,
				'2 Timothy': 4, 'Titus': 3, 'Philemon': 1, 'Hebrews': 13, 'James': 5,
				'1 Peter': 5, '2 Peter': 3, '1 John': 5, '2 John': 1, '3 John': 1,
				'Jude': 1, 'Revelation': 22
			}
		};
	}

	getAllBooks() {
		return [
			...Object.keys(this.bibleBooks['Old Testament']),
			...Object.keys(this.bibleBooks['New Testament'])
		];
	}

	getChapterCount(book) {
		for (const testament in this.bibleBooks) {
			if (this.bibleBooks[testament][book]) {
				return this.bibleBooks[testament][book];
			}
		}
		return 0;
	}

	getTestament(book) {
		if (this.bibleBooks['Old Testament'][book]) return 'Old Testament';
		if (this.bibleBooks['New Testament'][book]) return 'New Testament';
		return null;
	}

	// ================================
	// Passage Loading
	// ================================

	async loadPassage(book, chapter, restoreScroll = false) {
		if (!restoreScroll) {
			this.saveReadingPosition();
		}

		this.state.currentBook = book;
		this.state.currentChapter = chapter;

		this.updateNavigationState();

		const reference = `${book} ${chapter}`;
		this.passageText.innerHTML = '<p class="loading">Loading passage...</p>';

		const data = await this.bibleApi.fetchPassage(reference);

		if (!data) return;

		this.passageTitle.textContent = reference;
		this.passageText.innerHTML = data.passages[0];

		// cache original HTML for highlight logic
		this.originalPassageHtml = this.passageText.innerHTML;

		this.copyright.textContent = 'Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), copyright © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved.';

		// Reset verse selector
		this.currentVerseSpan.textContent = '1';

		if (restoreScroll) {
			window.scrollTo(0, this.lastScrollPosition || 0);
		} else {
			window.scrollTo(0, 0);
		}

		// Save reading position after loading
		this.saveReadingPosition();
	}

	// ================================
	// Navigation
	// ================================

	navigateChapter(direction) {
		navChapter(this, direction);
	}

	updateNavigationState() {
		const book = this.state.currentBook;
		const abbr = this.bookAbbreviations[book] || book;
		this.currentBookSpan.textContent = abbr;
		this.currentChapterSpan.textContent = this.state.currentChapter;

		// Update button states
		const books = this.getAllBooks();
		const currentBookIndex = books.indexOf(book);
		const isFirstChapter = this.state.currentChapter === 1;
		const isLastChapter = this.state.currentChapter === this.getChapterCount(book);

		this.prevChapterBtn.disabled = currentBookIndex === 0 && isFirstChapter;
		this.nextChapterBtn.disabled = currentBookIndex === books.length - 1 && isLastChapter;
	}

	// ================================
	// Search
	// ================================

	toggleSearch() {
		this.searchContainer.classList.toggle('active');
		if (this.searchContainer.classList.contains('active')) {
			this.searchInput.focus();
		} else {
			this.searchInput.value = '';
			this.searchResults.innerHTML = '';
		}
	}

	closeSearch() {
		this.searchContainer.classList.remove('active');
		this.searchInput.value = '';
		this.searchResults.innerHTML = '';
	}

	handleSearch(query) {
		clearTimeout(this.searchTimeout);

		if (!query.trim()) {
			this.searchResults.innerHTML = '';
			return;
		}

		this.searchTimeout = setTimeout(async () => {
			// Check if it's a passage reference first
			if (this.isPassageReference(query)) {
				await this.handlePassageReference(query);
			} else {
				// Perform keyword search
				await this.performKeywordSearch(query);
			}
		}, 300);
	}

	isPassageReference(query) {
		// Simple check for passage reference patterns
		const patterns = [
			/^[1-3]?\s*[a-z]+\s+\d+/i, // Book Chapter
			/^[1-3]?\s*[a-z]+\s+\d+:\d+/i // Book Chapter:Verse
		];
		return patterns.some(pattern => pattern.test(query.trim()));
	}

	async handlePassageReference(reference) {
		const data = await this.bibleApi.fetchPassage(reference);

		if (data && data.passages && data.passages.length > 0) {
			// Display as single result
			this.searchResults.innerHTML = `
                <div class="search-result-item" data-reference="${data.canonical}">
                    <div class="search-result-reference">${data.canonical}</div>
                    <div class="search-result-content">${this.stripHTML(data.passages[0].substring(0, 200))}...</div>
                </div>
            `;

			this.searchResults.querySelector('.search-result-item').addEventListener('click', () => {
				this.loadPassageFromReference(data.canonical);
				this.closeSearch();
			});
		} else {
			this.searchResults.innerHTML = '<div class="search-no-results">No passage found</div>';
		}
	}

	async performKeywordSearch(query) {
		this.searchResults.innerHTML = '<div class="loading" style="min-height: 100px">Searching...</div>';

		const data = await this.bibleApi.searchPassages(query);

		if (data && data.results && data.results.length > 0) {
			this.displaySearchResults(data.results, query);
		} else {
			this.searchResults.innerHTML = '<div class="search-no-results">No results found</div>';
		}
	}

	displaySearchResults(results, query) {
		const html = results.map(result => `
            <div class="search-result-item" data-reference="${result.reference}">
                <div class="search-result-reference">${result.reference}</div>
                <div class="search-result-content">${this.highlightSearchTerm(result.content, query)}</div>
            </div>
        `).join('');

		this.searchResults.innerHTML = html;

		// Add click handlers
		this.searchResults.querySelectorAll('.search-result-item').forEach(item => {
			item.addEventListener('click', () => {
				const reference = item.dataset.reference;
				this.loadPassageFromReference(reference);
				this.closeSearch();
			});
		});
	}

	loadPassageFromReference(reference) {
		// Parse reference to extract book and chapter
		const match = reference.match(/([1-3]?[A-Za-z\s]+)\s+(\d+)/);
		if (match) {
			const book = match[1].trim();
			const chapter = parseInt(match[2]);
			this.loadPassage(book, chapter);
		}
	}

	highlightSearchTerm(text, term) {
		const regex = new RegExp(term, 'gi');
		return text.replace(regex, '<strong>$&</strong>');
	}

	stripHTML(html) {
		const tmp = document.createElement('div');
		tmp.innerHTML = html;
		return tmp.textContent || tmp.innerText || '';
	}

	// ================================
	// Modals
	// ================================

	openModal(modal) {
		console.log('🚀 openModal:', modal?.id);
		if (!modal) {
			console.error('❌ Modal is null!');
			return;
		}
		modal.classList.add('active');
		document.body.style.overflow = 'hidden';
		console.log('✅ Modal opened:', modal.classList.value);
	}

	closeModal(modal) {
		// Add closing animation for settings
		if (modal === this.settingsModal) {
			const content = modal.querySelector('.modal-content');
			content.style.animation = 'slideDownToBottom 250ms ease';
			setTimeout(() => {
				modal.classList.remove('active');
				document.body.style.overflow = '';
				content.style.animation = ''; // Reset animation
			}, 250);
		} else {
			modal.classList.remove('active');
			document.body.style.overflow = '';
		}
	}

	openBookModal() {
		this.populateBookModal();
		this.openModal(this.bookModal);
	}

	populateBookModal() {
		const createBookButton = (book) => {
			const btn = document.createElement('button');
			btn.className = 'book-item';
			btn.textContent = this.bookAbbreviations[book] || book; // use shared map
			btn.addEventListener('click', () => {
				this.state.selectedVerse = null; // Clear verse selection
				this.loadPassage(book, 1);
				this.closeModal(this.bookModal);
			});
			return btn;
		};

		this.oldTestamentBooks.innerHTML = '';
		Object.keys(this.bibleBooks['Old Testament']).forEach(book => {
			this.oldTestamentBooks.appendChild(createBookButton(book));
		});

		this.newTestamentBooks.innerHTML = '';
		Object.keys(this.bibleBooks['New Testament']).forEach(book => {
			this.newTestamentBooks.appendChild(createBookButton(book));
		});
	}

	openChapterModal() {
		this.populateChapterModal();
		this.openModal(this.chapterModal);
	}

	populateChapterModal() {
		this.chapterModalBook.textContent = this.state.currentBook;
		this.chapterGrid.innerHTML = '';

		const chapterCount = this.getChapterCount(this.state.currentBook);

		for (let i = 1; i <= chapterCount; i++) {
			const btn = document.createElement('button');
			btn.className = 'chapter-item';
			btn.textContent = i;
			btn.addEventListener('click', () => {
				this.state.selectedVerse = null; // Clear verse selection
				this.loadPassage(this.state.currentBook, i);
				this.closeModal(this.chapterModal);
			});
			this.chapterGrid.appendChild(btn);
		}
	}

	openVerseModal() {
		this.populateVerseModal();
		this.openModal(this.verseModal);
	}

	populateVerseModal() {
		this.verseModalBook.textContent = `${this.state.currentBook} ${this.state.currentChapter}`;
		this.verseGrid.innerHTML = '';

		// Estimate verses (we'll get actual count from loaded passage)
		const verseCount = this.getCurrentVerseCount();

		for (let i = 1; i <= verseCount; i++) {
			const btn = document.createElement('button');
			btn.className = 'chapter-item';
			btn.textContent = i;
			btn.addEventListener('click', () => {
				this.scrollToVerse(i);
				this.closeModal(this.verseModal);
			});
			this.verseGrid.appendChild(btn);
		}
	}

	getCurrentVerseCount() {
		// Count verse numbers in current passage
		const verseNums = this.passageText.querySelectorAll('.verse-num');
		return verseNums.length || 50; // Default to 50 if none found
	}

	scrollToVerse(verseNumber) {
		scrollVerse(this, verseNumber);
	}

	navigateToNextVerse() {
		const currentVerse = this.state.selectedVerse || 1;
		const maxVerse = this.getCurrentVerseCount();

		if (currentVerse < maxVerse) {
			// Go to next verse in current chapter
			this.scrollToVerse(currentVerse + 1);
		} else {
			// At last verse, go to next chapter
			this.navigateChapter(1);
		}
	}

	navigateToPreviousVerse() {
		const currentVerse = this.state.selectedVerse || 1;

		if (currentVerse > 1) {
			// Go to previous verse in current chapter
			this.scrollToVerse(currentVerse - 1);
		} else {
			// At first verse, go to previous chapter (and its last verse)
			const books = this.getAllBooks();
			const currentBookIndex = books.indexOf(this.state.currentBook);
			const isFirstChapter = this.state.currentChapter === 1;

			if (currentBookIndex === 0 && isFirstChapter) {
				// Already at Genesis 1:1, can't go back further
				return;
			}

			// Navigate to previous chapter
			let newChapter = this.state.currentChapter - 1;
			let newBook = this.state.currentBook;

			if (newChapter < 1) {
				// Go to previous book's last chapter
				newBook = books[currentBookIndex - 1];
				newChapter = this.getChapterCount(newBook);
			}

			this.state.selectedVerse = null;
			this.loadPassage(newBook, newChapter);
		}
	}


	applyVerseGlow() {
		glowVerse(this);
	}

	// ================================
	// Settings
	// ================================

	checkApiKey() {
		if (!this.API_KEY) {
			setTimeout(() => {
				this.showToast('Welcome! Please sign in to start reading.');
				// Open login modal instead of signup
				this.openModal(this.loginModal);
			}, 500);
		}
	}

	async saveApiKey() {
		const apiKey = this.apiKeyInput.value.trim();

		if (!apiKey) {
			this.showToast('Please enter a valid API key');
			return;
		}

		this.API_KEY = apiKey;

		// Save to Firebase if logged in
		if (this.currentUser) {
			try {
				const encrypted = window.encryptionHelper.encrypt(apiKey);
				await this.database.ref(`users/${this.currentUser.uid}/apiKey`).set(encrypted);
				this.showToast('API key saved successfully!');
			} catch (error) {
				console.error('Error saving API key:', error);
				this.showToast('Failed to save API key');
				return;
			}
		} else {
			// Save locally if not logged in
			localStorage.setItem('esvApiKey', apiKey);
			this.showToast('API key saved locally!');
		}

		this.closeModal(this.settingsModal);
		this.loadPassage(this.state.currentBook, this.state.currentChapter);
	}

	loadLocalSettings() {
		// Load from localStorage for non-logged-in users ONLY
		this.API_KEY = localStorage.getItem('esvApiKey') || '';
		this.state.fontSize = parseInt(localStorage.getItem('fontSize')) || 18;
		this.state.showVerseNumbers = localStorage.getItem('showVerseNumbers') !== 'false';
		this.state.showHeadings = localStorage.getItem('showHeadings') !== 'false';
		this.state.showFootnotes = localStorage.getItem('showFootnotes') === 'true';
		this.state.verseByVerse = localStorage.getItem('verseByVerse') === 'true';

		// Load theme settings from localStorage (fallback only)
		const colorTheme = localStorage.getItem('colorTheme') || 'dracula';
		const lightMode = localStorage.getItem('lightMode') === 'true';

		changeColorTheme(this, colorTheme);
		if (lightMode) {
			document.body.classList.add('light-mode');
		}
		updateThemeIcon(lightMode);
	}


	applySettings() {
		this.apiKeyInput.value = this.API_KEY;
		this.verseNumbersToggle.checked = this.state.showVerseNumbers;
		this.headingsToggle.checked = this.state.showHeadings;
		this.footnotesToggle.checked = this.state.showFootnotes;
		this.verseByVerseToggle.checked = this.state.verseByVerse;
		this.fontSizeSlider.value = this.state.fontSize;
		this.fontSizeValue.textContent = `${this.state.fontSize}px`;
		this.passageText.style.fontSize = `${this.state.fontSize}px`;

		// Apply verse-by-verse class 
		if (this.state.verseByVerse) {
			this.passageText.classList.add('verse-by-verse');
		} else {
			this.passageText.classList.remove('verse-by-verse');
		}

		// Toggle verse number visibility with CSS
		if (this.state.showVerseNumbers) {
			document.body.classList.remove('hide-verse-numbers');
		} else {
			document.body.classList.add('hide-verse-numbers');
		}
	}

	async toggleSetting(setting) {
		// Map setting names to their toggle element names
		const toggleMap = {
			'showVerseNumbers': 'verseNumbersToggle',
			'showHeadings': 'headingsToggle',
			'showFootnotes': 'footnotesToggle'
		};

		const toggleElement = this[toggleMap[setting]];

		if (!toggleElement) {
			console.error(`Toggle not found for setting: ${setting}`);
			return;
		}

		this.state[setting] = toggleElement.checked;

		// Save to Firebase or localStorage
		if (this.currentUser) {
			await this.database.ref(`users/${this.currentUser.uid}/settings/${setting}`).set(toggleElement.checked);
		} else {
			localStorage.setItem(setting, toggleElement.checked);
		}

		// Special handling for verse numbers - use CSS toggle instead of reload
		if (setting === 'showVerseNumbers') {
			this.applySettings();  // Just toggle CSS class
		} else {
			// Save current scroll position BEFORE reloading
			this.lastScrollPosition = window.pageYOffset || document.documentElement.scrollTop;

			// Reload passage for headings/footnotes
			await this.loadPassage(this.state.currentBook, this.state.currentChapter, true);
		}
	}


	async toggleVerseByVerse() {
		this.state.verseByVerse = this.verseByVerseToggle.checked;

		// Save to Firebase or localStorage
		if (this.currentUser) {
			await this.database.ref(`users/${this.currentUser.uid}/settings/verseByVerse`).set(this.state.verseByVerse);
		} else {
			localStorage.setItem('verseByVerse', this.state.verseByVerse);
		}

		// Apply the class
		if (this.state.verseByVerse) {
			this.passageText.classList.add('verse-by-verse');
		} else {
			this.passageText.classList.remove('verse-by-verse');
		}
	}

	async updateFontSize(size) {
		this.state.fontSize = parseInt(size);
		this.fontSizeValue.textContent = `${size}px`;
		this.passageText.style.fontSize = `${size}px`;

		// Save to Firebase or localStorage
		if (this.currentUser) {
			await this.database.ref(`users/${this.currentUser.uid}/settings/fontSize`).set(parseInt(size));
		} else {
			localStorage.setItem('fontSize', size);
		}
	}

	// ================================
	// Utilities
	// ================================

	copyPassage() {
		const textContent = this.stripHTML(this.passageText.innerHTML);
		const reference = this.passageTitle.textContent;
		const fullText = `${reference}\n\n${textContent}\n\n${this.copyright.textContent}`;

		navigator.clipboard.writeText(fullText)
			.then(() => {
				this.showToast('Passage copied to clipboard!');
			})
			.catch(err => {
				console.error('Failed to copy:', err);
				this.showToast('Failed to copy passage');
			});
	}

	showError(message) {
		this.passageText.innerHTML = `<div class="error">${message}</div>`;
	}

	showToast(message) {
		this.toast.textContent = message;
		this.toast.classList.add('show');
		setTimeout(() => {
			this.toast.classList.remove('show');
		}, 3000);
	}

	handleKeyboardShortcuts(e) {
		// Ctrl/Cmd + K to open search
		if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
			e.preventDefault();
			this.toggleSearch();
		}

		// Escape to close modals
		if (e.key === 'Escape') {
			if (this.bookModal.classList.contains('active')) this.closeModal(this.bookModal);
			if (this.chapterModal.classList.contains('active')) this.closeModal(this.chapterModal);
			if (this.helpModal.classList.contains('active')) this.closeModal(this.helpModal);
			if (this.settingsModal.classList.contains('active')) this.closeModal(this.settingsModal);
			if (this.loginModal.classList.contains('active')) this.closeModal(this.loginModal);
			if (this.signupModal.classList.contains('active')) this.closeModal(this.signupModal);
			if (this.userMenuModal.classList.contains('active')) this.closeModal(this.userMenuModal);
			if (this.searchContainer.classList.contains('active')) this.closeSearch();
			if (this.verseModal.classList.contains('active')) this.closeModal(this.verseModal);
		}

		// Navigation shortcuts (only when no modal is open and search is closed)
		if (!document.querySelector('.modal.active') && !this.searchContainer.classList.contains('active')) {
			// Chapter navigation: Arrow Left/Right or H/L
			if (e.key === 'ArrowLeft' || e.key === 'h') {
				e.preventDefault();
				this.navigateChapter(-1);
			} else if (e.key === 'ArrowRight' || e.key === 'l') {
				e.preventDefault();
				this.navigateChapter(1);
			}

			// Verse navigation: Arrow Up/Down or K/J
			else if (e.key === 'ArrowUp' || e.key === 'k') {
				e.preventDefault();
				this.navigateToPreviousVerse();
			} else if (e.key === 'ArrowDown' || e.key === 'j') {
				e.preventDefault();
				this.navigateToNextVerse();
			}
		}
	}


	// ================================
	// Firebase Authentication
	// ================================

	handleUserButtonClick() {
		if (this.currentUser) {
			// Show user menu
			document.getElementById('userEmail').textContent = this.currentUser.email;
			const theme = document.body.classList.contains('light-mode') ? 'Alucard (Light)' : 'Dracula (Dark)';
			document.getElementById('userTheme').textContent = theme;
			this.openModal(this.userMenuModal);
		} else {
			// Show login modal
			this.openModal(this.loginModal);
		}
	}

	async handleLogin() {
		const email = document.getElementById('loginEmail').value;
		const password = document.getElementById('loginPassword').value;

		if (!email || !password) {
			this.showToast('Please enter valid credentials');
			return;
		}

		try {
			await this.auth.signInWithEmailAndPassword(email, password);
			this.showToast('Signed in successfully!');
			this.closeModal(this.loginModal);

			// Clear form
			document.getElementById('loginEmail').value = '';
			document.getElementById('loginPassword').value = '';
		} catch (error) {
			console.error('Login error:', error);
			if (error.code === 'auth/user-not-found') {
				if (confirm('Invalid login. No account found with this email. Would you like to sign up instead?')) {
					this.closeModal(this.loginModal);
					this.openModal(this.signupModal);
					document.getElementById('signupEmail').value = email;
				}
			} else if (error.code === 'auth/wrong-password') {
				this.showToast('Incorrect password');
			} else {
				this.showToast(`Login failed: ${error.message}`);
			}
		}
	}

	async handleSignup() {
		const email = document.getElementById('signupEmail').value;
		const password = document.getElementById('signupPassword').value;
		const apiKey = document.getElementById('signupApiKey').value;

		if (!email || !password || !apiKey) {
			this.showToast('Please fill in all fields');
			return;
		}

		if (password.length < 6) {
			this.showToast('Password must be at least 6 characters');
			return;
		}

		try {
			// Create Firebase user
			const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
			const user = userCredential.user;

			// Save API key (encrypted) and initial settings to database
			const encrypted = window.encryptionHelper.encrypt(apiKey);
			await this.database.ref(`users/${user.uid}`).set({
				apiKey: encrypted,
				settings: {
					fontSize: 18,
					showVerseNumbers: true,
					showHeadings: true,
					showFootnotes: false,
					verseByVerse: false,
				},
				createdAt: Date.now()
			});

			this.showToast('Account created successfully!');
			this.closeModal(this.signupModal);

			// Clear form
			document.getElementById('signupEmail').value = '';
			document.getElementById('signupPassword').value = '';
			document.getElementById('signupApiKey').value = '';
		} catch (error) {
			console.error('Signup error:', error);
			if (error.code === 'auth/email-already-in-use') {
				this.showToast('Account already exists. Please sign in.');
			} else {
				this.showToast(`Signup failed: ${error.message}`);
			}
		}
	}

	async handleLogout() {
		try {
			await this.auth.signOut();
			this.showToast('Signed out successfully!');
			this.closeModal(this.userMenuModal);
		} catch (error) {
			console.error('Logout error:', error);
			this.showToast('Logout failed');
		}
	}

	// ================================
	// Firebase Data Management
	// ================================

	async loadUserData() {
		if (!this.currentUser) return;

		const data = await loadUserDataFromFirebase(this.currentUser.uid);
		if (!data) return;

		this.API_KEY = data.apiKey;
		const s = data.settings;
		this.state.fontSize = s.fontSize;
		this.state.showVerseNumbers = s.showVerseNumbers;
		this.state.showHeadings = s.showHeadings;
		this.state.showFootnotes = s.showFootnotes;
		this.state.verseByVerse = s.verseByVerse;
	}

	// ================================
	// Reading Position Persistence
	// ================================

	async saveReadingPosition() {
		if (!this.currentUser) return;

		const position = {
			book: this.state.currentBook,
			chapter: this.state.currentChapter,
			scrollPosition: window.pageYOffset || document.documentElement.scrollTop,
			lastUpdated: Date.now()
		};

		try {
			await this.database.ref(`users/${this.currentUser.uid}/readingPosition`).set(position);
		} catch (error) {
			console.error('Error saving reading position:', error);
		}
	}

	getSavedScrollPosition() {
		// This will be loaded from Firebase in loadSavedReadingPosition
		return this.lastScrollPosition;
	}

	async loadSavedReadingPosition() {
		if (!this.currentUser) return;

		try {
			const snapshot = await this.database.ref(`users/${this.currentUser.uid}/readingPosition`).once('value');
			const position = snapshot.val();

			if (position && position.book && position.chapter) {
				this.lastScrollPosition = position.scrollPosition || 0;
				await this.loadPassage(position.book, position.chapter, true);
			} else {
				await this.loadPassage(this.state.currentBook, this.state.currentChapter);
			}
		} catch (error) {
			console.error('Error loading reading position:', error);
			await this.loadPassage(this.state.currentBook, this.state.currentChapter);
		}
	}
}

// ================================
// Initialize App
// ================================

document.addEventListener('DOMContentLoaded', () => {
	const app = new BibleApp();
});
