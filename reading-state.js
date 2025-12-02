// reading-state.js
// Responsibility: navigation, verse selection, highlight, reading position.

export function initializeState() {
    return {
        currentBook: 'Genesis',
        currentChapter: 1,
        selectedVerse: null,
        fontSize: 18,
        showVerseNumbers: true,
        showHeadings: true,
        showFootnotes: false,
        verseByVerse: false
    };
}

export function navigateChapter(app, direction) {
    let newChapter = app.state.currentChapter + direction;
    let newBook = app.state.currentBook;

    const chapterCount = app.getChapterCount(app.state.currentBook);

    if (newChapter < 1) {
        const books = app.getAllBooks();
        const currentIndex = books.indexOf(app.state.currentBook);
        if (currentIndex > 0) {
            newBook = books[currentIndex - 1];
            newChapter = app.getChapterCount(newBook);
        } else {
            return;
        }
    } else if (newChapter > chapterCount) {
        const books = app.getAllBooks();
        const currentIndex = books.indexOf(app.state.currentBook);
        if (currentIndex < books.length - 1) {
            newBook = books[currentIndex + 1];
            newChapter = 1;
        } else {
            return;
        }
    }

    app.state.selectedVerse = null;
    app.loadPassage(newBook, newChapter);
}

export function scrollToVerse(app, verseNumber) {
    app.state.selectedVerse = verseNumber;
    app.currentVerseSpan.textContent = `${verseNumber}`;
    app.applyVerseGlow();
}

export function applyVerseGlow(app) {
  if (!app.passageText) return;

  // Clear previous glow
  app.passageText.querySelectorAll('.selected-verse-glow')
    .forEach(el => el.classList.remove('selected-verse-glow'));

  if (app.state.selectedVerse === null) return;

  // Find the verse container for the selected verse
  const verseContainers = app.passageText.querySelectorAll('.verse-container');
  let targetContainer = null;

  verseContainers.forEach(container => {
    const num = container.querySelector('.verse-num');
    if (num && num.textContent.trim() === String(app.state.selectedVerse)) {
      targetContainer = container;
    }
  });

  if (!targetContainer) return;

  // Apply inline glow to the container
  targetContainer.classList.add('selected-verse-glow');

  setTimeout(() => {
    targetContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 100);
}

