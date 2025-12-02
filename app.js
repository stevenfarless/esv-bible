// ================================
// ESV Bible Reader App with Firebase
// ================================

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

		// State management
		this.state = {
			currentBook: 'Genesis',
			currentChapter: 1,
			selectedVerse: null,
			fontSize: 18,
			showVerseNumbers: true,
			showHeadings: true,
			showFootnotes: false,
			verseByVerse: false
		};

		// Cache for search debouncing
		this.searchTimeout = null;

		// Scroll tracking
		this.scrollTimeout = null;

		// Reading position tracking
		this.lastScrollPosition = 0;

		// Initialize app
		this.init();

	}

	// ================================
	// Initialization
	// ================================
	init() {
		this.cacheElements();
		this.loadTheme();
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

	cacheElements() {
		// Header elements
		this.searchToggleBtn = document.getElementById('searchToggleBtn');
		this.settingsBtn = document.getElementById('settingsBtn');

		// Search elements
		this.searchContainer = document.getElementById('searchContainer');
		this.searchInput = document.getElementById('searchInput');
		this.closeSearchBtn = document.getElementById('closeSearchBtn');
		this.searchResults = document.getElementById('searchResults');

		// Navigation elements
		this.prevChapterBtn = document.getElementById('prevChapterBtn');
		this.nextChapterBtn = document.getElementById('nextChapterBtn');
		this.bookSelector = document.getElementById('bookSelector');
		this.chapterSelector = document.getElementById('chapterSelector');
		this.currentBookSpan = document.getElementById('currentBook');
		this.currentChapterSpan = document.getElementById('currentChapter');

		// Content elements
		this.passageTitle = document.getElementById('passageTitle');
		this.passageText = document.getElementById('passageText');
		this.copyright = document.getElementById('copyright');
		this.copyBtn = document.getElementById('copyBtn');

		// Modal elements
		this.bookModal = document.getElementById('bookModal');
		this.closeBookModal = document.getElementById('closeBookModal');
		this.oldTestamentBooks = document.getElementById('oldTestamentBooks');
		this.newTestamentBooks = document.getElementById('newTestamentBooks');

		this.chapterModal = document.getElementById('chapterModal');
		this.closeChapterModal = document.getElementById('closeChapterModal');
		this.chapterModalBook = document.getElementById('chapterModalBook');
		this.chapterGrid = document.getElementById('chapterGrid');

		this.verseModal = document.getElementById('verseModal');
		this.closeVerseModal = document.getElementById('closeVerseModal');
		this.verseModalBook = document.getElementById('verseModalBook');
		this.verseGrid = document.getElementById('verseGrid');
		this.verseSelector = document.getElementById('verseSelector');
		this.currentVerseSpan = document.getElementById('currentVerse');

		this.settingsModal = document.getElementById('settingsModal');
		this.closeSettingsModal = document.getElementById('closeSettingsModal');
		this.apiKeyInput = document.getElementById('apiKeyInput');
		this.saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
		this.verseNumbersToggle = document.getElementById('verseNumbersToggle');
		this.headingsToggle = document.getElementById('headingsToggle');
		this.footnotesToggle = document.getElementById('footnotesToggle');
		this.verseByVerseToggle = document.getElementById('verseByVerseToggle');
		this.fontSizeSlider = document.getElementById('fontSizeSlider');
		this.fontSizeValue = document.getElementById('fontSizeValue');

		// Theme & Auth elements
		this.themeToggleBtn = document.getElementById('themeToggleBtn');
		this.themeIcon = document.getElementById('themeIcon');
		this.userBtn = document.getElementById('userBtn');

		// Auth modals
		this.loginModal = document.getElementById('loginModal');
		this.signupModal = document.getElementById('signupModal');
		this.userMenuModal = document.getElementById('userMenuModal');
		this.closeLoginModal = document.getElementById('closeLoginModal');
		this.closeSignupModal = document.getElementById('closeSignupModal');
		this.closeUserMenuModal = document.getElementById('closeUserMenuModal');

		// Toast
		this.toast = document.getElementById('toast');
	}

	attachEventListeners() {
		// Header
		this.searchToggleBtn.addEventListener('click', () => this.toggleSearch());
		this.settingsBtn.addEventListener('click', () => this.openModal(this.settingsModal));

		// Search
		this.closeSearchBtn.addEventListener('click', () => this.closeSearch());
		this.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
		this.searchInput.addEventListener('keydown', (e) => {
			if (e.key === 'Escape') this.closeSearch();
		});

		// Navigation
		this.prevChapterBtn.addEventListener('click', () => this.navigateChapter(-1));
		this.nextChapterBtn.addEventListener('click', () => this.navigateChapter(1));
		this.bookSelector.addEventListener('click', () => this.openBookModal());
		this.chapterSelector.addEventListener('click', () => this.openChapterModal());

		// After chapterSelector listener
		this.verseSelector.addEventListener('click', () => this.openVerseModal());

		// After closeChapterModal listener
		this.closeVerseModal.addEventListener('click', () => this.closeModal(this.verseModal));

		// Update the modal array to include verseModal
		[this.bookModal, this.chapterModal, this.verseModal, this.settingsModal, this.loginModal, this.signupModal, this.userMenuModal].forEach(modal => {
			modal.addEventListener('click', (e) => {
				if (e.target === modal) this.closeModal(modal);
			});
		});

		// Copy button
		this.copyBtn.addEventListener('click', () => this.copyPassage());

		// Modals
		this.closeBookModal.addEventListener('click', () => this.closeModal(this.bookModal));
		this.closeChapterModal.addEventListener('click', () => this.closeModal(this.chapterModal));
		this.closeSettingsModal.addEventListener('click', () => this.closeModal(this.settingsModal));

		// Settings
		this.saveApiKeyBtn.addEventListener('click', () => this.saveApiKey());
		this.verseNumbersToggle.addEventListener('change', () => this.toggleSetting('showVerseNumbers'));
		this.headingsToggle.addEventListener('change', () => this.toggleSetting('showHeadings'));
		this.footnotesToggle.addEventListener('change', () => this.toggleSetting('showFootnotes'));
		this.verseByVerseToggle.addEventListener('change', () => this.toggleVerseByVerse());
		this.fontSizeSlider.addEventListener('input', (e) => this.updateFontSize(e.target.value));

		// Theme toggle
		this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());

		// User button
		this.userBtn.addEventListener('click', () => this.handleUserButtonClick());

		// Auth modal switching
		document.getElementById('showSignupLink').addEventListener('click', (e) => {
			e.preventDefault();
			this.closeModal(this.loginModal);
			this.openModal(this.signupModal);
		});

		document.getElementById('showLoginLink').addEventListener('click', (e) => {
			e.preventDefault();
			this.closeModal(this.signupModal);
			this.openModal(this.loginModal);
		});

		// Auth form submissions
		document.getElementById('loginForm').addEventListener('submit', (e) => {
			e.preventDefault();
			this.handleLogin();
		});

		document.getElementById('signupForm').addEventListener('submit', (e) => {
			e.preventDefault();
			this.handleSignup();
		});

		document.getElementById('logoutBtn').addEventListener('click', () => {
			this.handleLogout();
		});

		// Close auth modals
		this.closeLoginModal.addEventListener('click', () => this.closeModal(this.loginModal));
		this.closeSignupModal.addEventListener('click', () => this.closeModal(this.signupModal));
		this.closeUserMenuModal.addEventListener('click', () => this.closeModal(this.userMenuModal));

		// Track scroll position
		window.addEventListener('scroll', () => {
			clearTimeout(this.scrollTimeout);
			this.scrollTimeout = setTimeout(() => {
				this.saveReadingPosition();
			}, 500);
		});

		// Keyboard shortcuts
		document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
	}

	// ================================
	// Bible Structure
	// ================================
	initializeBibleStructure() {
		return {
			'Old Testament': {
				'Genesis': 50, 'Exodus': 40, 'Leviticus': 27, 'Numbers': 36, 'Deuteronomy': 34,
				'Joshua': 24, 'Judges': 21, 'Ruth': 4, '1 Samuel': 31, '2 Samuel': 24,
				'1 Kings': 22, '2 Kings': 25, '1 Chronicles': 29, '2 Chronicles': 36,
				'Ezra': 10, 'Nehemiah': 13, 'Esther': 10, 'Job': 42, 'Psalms': 150,
				'Proverbs': 31, 'Ecclesiastes': 12, 'Song of Solomon': 8, 'Isaiah': 66,
				'Jeremiah': 52, 'Lamentations': 5, 'Ezekiel': 48, 'Daniel': 12,
				'Hosea': 14, 'Joel': 3, 'Amos': 9, 'Obadiah': 1, 'Jonah': 4, 'Micah': 7,
				'Nahum': 3, 'Habakkuk': 3, 'Zephaniah': 3, 'Haggai': 2, 'Zechariah': 14,
				'Malachi': 4
			},
			'New Testament': {
				'Matthew': 28, 'Mark': 16, 'Luke': 24, 'John': 21, 'Acts': 28,
				'Romans': 16, '1 Corinthians': 16, '2 Corinthians': 13, 'Galatians': 6,
				'Ephesians': 6, 'Philippians': 4, 'Colossians': 4, '1 Thessalonians': 5,
				'2 Thessalonians': 3, '1 Timothy': 6, '2 Timothy': 4, 'Titus': 3,
				'Philemon': 1, 'Hebrews': 13, 'James': 5, '1 Peter': 5, '2 Peter': 3,
				'1 John': 5, '2 John': 1, '3 John': 1, 'Jude': 1, 'Revelation': 22
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
	// API Methods
	// ================================
	async fetchPassage(reference) {
		if (!this.API_KEY) {
			this.showError('Please set your ESV API key in Settings.');
			return null;
		}

		const params = new URLSearchParams({
			q: reference,
			'include-headings': this.state.showHeadings,
			'include-footnotes': this.state.showFootnotes,
			'include-verse-numbers': this.state.showVerseNumbers,
			'include-short-copyright': false,
			'include-passage-references': false
		});

		try {
			const response = await fetch(`${this.API_BASE_URL}/passage/html/?${params}`, {
				headers: {
					'Authorization': `Token ${this.API_KEY}`
				}
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			return data;
		} catch (error) {
			console.error('Error fetching passage:', error);
			this.showError('Failed to load passage. Please check your internet connection and API key.');
			return null;
		}
	}

	async searchPassages(query) {
		if (!this.API_KEY || !query.trim()) {
			return null;
		}

		const params = new URLSearchParams({
			q: query,
			'page-size': 20
		});

		try {
			const response = await fetch(`${this.API_BASE_URL}/passage/search/?${params}`, {
				headers: {
					'Authorization': `Token ${this.API_KEY}`
				}
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			return data;
		} catch (error) {
			console.error('Error searching passages:', error);
			return null;
		}
	}

	// ================================
	// Passage Loading
	// ================================
	async loadPassage(book, chapter, restoreScroll = false) {
		// Save previous scroll position before changing
		if (!restoreScroll) {
			this.saveReadingPosition();
		}

		this.state.currentBook = book;
		this.state.currentChapter = chapter;

		this.updateNavigationState();

		const reference = `${book} ${chapter}`;
		this.passageText.innerHTML = '<div class="loading">Loading passage...</div>';

		const data = await this.fetchPassage(reference);

		if (data && data.passages && data.passages.length > 0) {
			this.displayPassage(data, restoreScroll);
		}
	}

	displayPassage(data, restoreScroll = false) {
		const canonical = data.canonical || `${this.state.currentBook} ${this.state.currentChapter}`;

		this.passageTitle.textContent = canonical;
		this.passageText.innerHTML = data.passages[0];
		// Wrap each verse number and its text in a container span
		const verseNums = this.passageText.querySelectorAll('.verse-num');
		verseNums.forEach((verseNum, index) => {
			const container = document.createElement('span');
			container.classList.add('verse-container');

			const parent = verseNum.parentNode;
			parent.insertBefore(container, verseNum);

			// Move this verse number and its following text nodes into the container
			let node = verseNum;
			while (node) {
				const next = node.nextSibling;
				// Stop when hitting another verse number or a heading/paragraph break
				if (
					next &&
					next.nodeType === 1 &&
					next.classList.contains('verse-num')
				) {
					break;
				}
				container.appendChild(node);
				node = next;
			}
		});

		this.copyright.textContent = 'Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), copyright © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved.';

		// Reset verse selector
		this.currentVerseSpan.textContent = '1';

		// Restore scroll position or scroll to top
		if (restoreScroll) {
			setTimeout(() => {
				const savedPosition = this.getSavedScrollPosition();
				window.scrollTo({ top: savedPosition, behavior: 'smooth' });  // Changed from 'auto' to 'smooth'
			}, 100);
		} else {
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}

		// Save reading position after loading
		this.saveReadingPosition();
	}


	// ================================
	// Navigation
	// ================================
	navigateChapter(direction) {
		let newChapter = this.state.currentChapter + direction;
		let newBook = this.state.currentBook;

		const chapterCount = this.getChapterCount(this.state.currentBook);

		if (newChapter < 1) {
			// Go to previous book
			const books = this.getAllBooks();
			const currentIndex = books.indexOf(this.state.currentBook);
			if (currentIndex > 0) {
				newBook = books[currentIndex - 1];
				newChapter = this.getChapterCount(newBook);
			} else {
				return; // Already at the beginning
			}
		} else if (newChapter > chapterCount) {
			// Go to next book
			const books = this.getAllBooks();
			const currentIndex = books.indexOf(this.state.currentBook);
			if (currentIndex < books.length - 1) {
				newBook = books[currentIndex + 1];
				newChapter = 1;
			} else {
				return; // Already at the end
			}
		}

		// Clear selected verse when navigating by chapter
		this.state.selectedVerse = null;

		this.loadPassage(newBook, newChapter);
	}

	updateNavigationState() {
		this.currentBookSpan.textContent = this.state.currentBook;
		this.currentChapterSpan.textContent = this.state.currentChapter;

		// Update button states
		const books = this.getAllBooks();
		const currentBookIndex = books.indexOf(this.state.currentBook);
		const isFirstChapter = this.state.currentChapter === 1;
		const isLastChapter = this.state.currentChapter === this.getChapterCount(this.state.currentBook);

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
			/^[1-3]?\s*[a-z]+\s+\d+/i,  // Book Chapter
			/^[1-3]?\s*[a-z]+\s+\d+:\d+/i  // Book Chapter:Verse
		];
		return patterns.some(pattern => pattern.test(query.trim()));
	}

	async handlePassageReference(reference) {
		const data = await this.fetchPassage(reference);
		if (data && data.passages && data.passages.length > 0) {
			// Display as single result
			this.searchResults.innerHTML = `
                <div class="search-result-item" data-reference="${data.canonical}">
                    <div class="search-result-reference">${data.canonical}</div>
                    <div class="search-result-content">${this.stripHTML(data.passages[0]).substring(0, 200)}...</div>
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
		this.searchResults.innerHTML = '<div class="loading" style="min-height: 100px;">Searching...</div>';

		const data = await this.searchPassages(query);

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
		const match = reference.match(/^([1-3]?\s*[A-Za-z\s]+)\s+(\d+)/);
		if (match) {
			const book = match[1].trim();
			const chapter = parseInt(match[2]);
			this.loadPassage(book, chapter);
		}
	}

	highlightSearchTerm(text, term) {
		const regex = new RegExp(`(${term})`, 'gi');
		return text.replace(regex, '<strong>$1</strong>');
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
		modal.classList.add('active');
		document.body.style.overflow = 'hidden';
	}

	closeModal(modal) {
		modal.classList.remove('active');
		document.body.style.overflow = '';
	}

	openBookModal() {
		this.populateBookModal();
		this.openModal(this.bookModal);
	}

	populateBookModal() {
		const abbreviations = {
			'Genesis': 'Gen', 'Exodus': 'Exod', 'Leviticus': 'Lev', 'Numbers': 'Num', 'Deuteronomy': 'Deut',
			'Joshua': 'Josh', 'Judges': 'Judg', 'Ruth': 'Ruth', '1 Samuel': '1 Sam', '2 Samuel': '2 Sam',
			'1 Kings': '1 Kgs', '2 Kings': '2 Kgs', '1 Chronicles': '1 Chr', '2 Chronicles': '2 Chr',
			'Ezra': 'Ezra', 'Nehemiah': 'Neh', 'Esther': 'Esth', 'Job': 'Job', 'Psalms': 'Ps',
			'Proverbs': 'Prov', 'Ecclesiastes': 'Eccl', 'Song of Solomon': 'Song', 'Isaiah': 'Isa',
			'Jeremiah': 'Jer', 'Lamentations': 'Lam', 'Ezekiel': 'Ezek', 'Daniel': 'Dan',
			'Hosea': 'Hos', 'Joel': 'Joel', 'Amos': 'Amos', 'Obadiah': 'Obad', 'Jonah': 'Jonah',
			'Micah': 'Mic', 'Nahum': 'Nah', 'Habakkuk': 'Hab', 'Zephaniah': 'Zeph',
			'Haggai': 'Hag', 'Zechariah': 'Zech', 'Malachi': 'Mal',

			'Matthew': 'Matt', 'Mark': 'Mark', 'Luke': 'Luke', 'John': 'John', 'Acts': 'Acts',
			'Romans': 'Rom', '1 Corinthians': '1 Cor', '2 Corinthians': '2 Cor', 'Galatians': 'Gal',
			'Ephesians': 'Eph', 'Philippians': 'Phil', 'Colossians': 'Col',
			'1 Thessalonians': '1 Thess', '2 Thessalonians': '2 Thess',
			'1 Timothy': '1 Tim', '2 Timothy': '2 Tim', 'Titus': 'Titus',
			'Philemon': 'Phlm', 'Hebrews': 'Heb', 'James': 'Jas',
			'1 Peter': '1 Pet', '2 Peter': '2 Pet',
			'1 John': '1 John', '2 John': '2 John', '3 John': '3 John',
			'Jude': 'Jude', 'Revelation': 'Rev'
		};

		const createBookButton = (book) => {
			const btn = document.createElement('button');
			btn.className = 'book-item';
			btn.textContent = abbreviations[book] || book; // display abbreviation only
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
		// Set selected verse in state
		this.state.selectedVerse = verseNumber;
		this.currentVerseSpan.textContent = `${verseNumber}`;

		// Apply the glow effect
		this.applyVerseGlow();
	}

	applyVerseGlow() {
		// Remove previous glow
		const previousGlow = this.passageText.querySelector('.selected-verse-glow');
		if (previousGlow) {
			previousGlow.classList.remove('selected-verse-glow');
		}

		// Apply new glow if a verse is selected
		if (this.state.selectedVerse !== null) {
			const verseNums = this.passageText.querySelectorAll('.verse-num');
			for (const verseNum of verseNums) {
				if (verseNum.textContent.trim() === this.state.selectedVerse.toString()) {
					// Glow the whole paragraph (or div) that contains the verse
					const paragraph = verseNum.closest('p, div');
					if (paragraph) {
						paragraph.classList.add('selected-verse-glow');

						// Scroll into view
						setTimeout(() => {
							paragraph.scrollIntoView({ behavior: 'smooth', block: 'center' });
						}, 100);
					}
					break;
				}
			}
		}
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
		// Load from localStorage for non-logged-in users
		this.API_KEY = localStorage.getItem('esvApiKey') || '';
		this.state.fontSize = parseInt(localStorage.getItem('fontSize')) || 18;
		this.state.showVerseNumbers = localStorage.getItem('showVerseNumbers') !== 'false';
		this.state.showHeadings = localStorage.getItem('showHeadings') !== 'false';
		this.state.showFootnotes = localStorage.getItem('showFootnotes') === 'true';
		this.state.verseByVerse = localStorage.getItem('verseByVerse') === 'true';
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
	}

	async toggleSetting(setting) {
		const toggle = this[`${setting.replace('show', '').toLowerCase()}Toggle`];
		this.state[setting] = toggle.checked;

		// Save to Firebase or localStorage
		if (this.currentUser) {
			await this.database.ref(`users/${this.currentUser.uid}/settings/${setting}`).set(toggle.checked);
		} else {
			localStorage.setItem(setting, toggle.checked);
		}

		this.loadPassage(this.state.currentBook, this.state.currentChapter);
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

		navigator.clipboard.writeText(fullText).then(() => {
			this.showToast('Passage copied to clipboard!');
		}).catch(err => {
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
			if (this.settingsModal.classList.contains('active')) this.closeModal(this.settingsModal);
			if (this.loginModal.classList.contains('active')) this.closeModal(this.loginModal);
			if (this.signupModal.classList.contains('active')) this.closeModal(this.signupModal);
			if (this.userMenuModal.classList.contains('active')) this.closeModal(this.userMenuModal);
			if (this.searchContainer.classList.contains('active')) this.closeSearch();
			if (this.verseModal.classList.contains('active')) this.closeModal(this.verseModal);
		}

		// Arrow keys for navigation (when no modal is open)
		if (!document.querySelector('.modal.active') && !this.searchContainer.classList.contains('active')) {
			if (e.key === 'ArrowLeft') {
				e.preventDefault();
				this.navigateChapter(-1);
			} else if (e.key === 'ArrowRight') {
				e.preventDefault();
				this.navigateChapter(1);
			}
		}
	}

	// ================================
	// Theme Management
	// ================================
	loadTheme() {
		const savedTheme = localStorage.getItem('theme') || 'dark';
		if (savedTheme === 'light') {
			document.body.classList.add('light-mode');
		}
		this.updateThemeIcon();
	}

	toggleTheme() {
		document.body.classList.toggle('light-mode');
		const isLight = document.body.classList.contains('light-mode');
		const theme = isLight ? 'light' : 'dark';

		localStorage.setItem('theme', theme);
		this.updateThemeIcon();

		this.showToast(isLight ? 'Switched to Alucard (Light) theme' : 'Switched to Dracula (Dark) theme');
	}

	updateThemeIcon() {
		const isLight = document.body.classList.contains('light-mode');

		if (isLight) {
			// Sun icon for light mode
			this.themeIcon.innerHTML = `
                <circle cx="12" cy="12" r="5"/>
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
			// Moon icon for dark mode
			this.themeIcon.innerHTML = `
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            `;
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
				if (confirm('Invalid login. No account found with this email.\n\nWould you like to sign up instead?')) {
					this.closeModal(this.loginModal);
					this.openModal(this.signupModal);
					document.getElementById('signupEmail').value = email;
				}
			} else if (error.code === 'auth/wrong-password') {
				this.showToast('Incorrect password');
			} else {
				this.showToast('Login failed: ' + error.message);
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
				this.showToast('Signup failed: ' + error.message);
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

		try {
			const snapshot = await this.database.ref(`users/${this.currentUser.uid}`).once('value');
			const userData = snapshot.val();

			if (userData) {
				// Load API key
				if (userData.apiKey) {
					this.API_KEY = window.encryptionHelper.decrypt(userData.apiKey);
				}

				// Load settings
				if (userData.settings) {
					this.state.fontSize = userData.settings.fontSize || 18;
					this.state.showVerseNumbers = userData.settings.showVerseNumbers !== false;
					this.state.showHeadings = userData.settings.showHeadings !== false;
					this.state.showFootnotes = userData.settings.showFootnotes === true;
					this.state.verseByVerse = userData.settings.verseByVerse === true;
				}
			}
		} catch (error) {
			console.error('Error loading user data:', error);
		}
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
