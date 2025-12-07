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
    if (!app.originalPassageHtml) return;

    app.passageText.innerHTML = app.originalPassageHtml;
    if (app.state.selectedVerse === null) return;

    // Find all verse numbers in the passage
    const verseNums = app.passageText.querySelectorAll('.verse-num');
    let targetVerseNum = null;

    for (const vn of verseNums) {
        if (vn.textContent.trim() === app.state.selectedVerse.toString()) {
            targetVerseNum = vn;
            break;
        }
    }

    if (!targetVerseNum) return;

    // Handle verse-by-verse mode
    if (app.state.verseByVerse) {
        const container = targetVerseNum.closest('.verse-container');
        if (container) {
            app.passageText.querySelectorAll('.selected-verse-glow').forEach(el => {
                el.classList.remove('selected-verse-glow');
            });
            container.classList.add('selected-verse-glow');
            container.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }

    // Standard mode: precise verse splitting
    const paragraph = targetVerseNum.closest('p');
    if (!paragraph) return;

    const beforeP = document.createElement('p');
    const selectedBlock = document.createElement('div');
    const afterP = document.createElement('p');
    selectedBlock.classList.add('selected-verse-glow');

    let mode = 'before';
    const nodes = Array.from(paragraph.childNodes);

    nodes.forEach(node => {
        if (node === targetVerseNum) {
            mode = 'selected';
            selectedBlock.appendChild(node);
            return;
        }
        if (mode === 'selected') {
            if (node.nodeType === 1 && node.classList.contains('verse-num')) {
                mode = 'after';
                afterP.appendChild(node);
                return;
            }
        }
        if (mode === 'before') {
            beforeP.appendChild(node);
        } else if (mode === 'selected') {
            selectedBlock.appendChild(node);
        } else {
            afterP.appendChild(node);
        }
    });

    const parent = paragraph.parentNode;
    if (beforeP.childNodes.length > 0) parent.insertBefore(beforeP, paragraph);
    parent.insertBefore(selectedBlock, paragraph);
    if (afterP.childNodes.length > 0) parent.insertBefore(afterP, paragraph);
    parent.removeChild(paragraph);

    selectedBlock.scrollIntoView({ behavior: 'smooth', block: 'center' });
}