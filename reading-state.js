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

    // Reset passage DOM
    app.passageText.innerHTML = app.originalPassageHtml;
    if (app.state.selectedVerse == null) return;

    // Find selected verse number element
    const verseNums = app.passageText.querySelectorAll('.verse-num');
    let targetVerseNum = null;
    for (const vn of verseNums) {
        if (vn.textContent.trim() === String(app.state.selectedVerse)) {
            targetVerseNum = vn;
            break;
        }
    }
    if (!targetVerseNum) return;

    // If verse-by-verse layout already has discrete containers, use them directly
    if (app.state.verseByVerse) {
        const container = targetVerseNum.closest('.verse-container, p, div');
        if (!container) return;

        app.passageText
            .querySelectorAll('.selected-verse-glow')
            .forEach(el => el.classList.remove('selected-verse-glow'));

        container.classList.add('selected-verse-glow');
        container.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    // GENERAL CASE: wrap from this .verse-num up to (but not including) next .verse-num
    const paragraph = targetVerseNum.closest('p, div');
    if (!paragraph) return;

    const wrapper = document.createElement('div');
    wrapper.classList.add('selected-verse-glow');

    const beforeP = document.createElement(paragraph.tagName.toLowerCase());
    const afterP = document.createElement(paragraph.tagName.toLowerCase());

    let mode = 'before';
    const nodes = Array.from(paragraph.childNodes);

    for (const node of nodes) {
        if (node === targetVerseNum) {
            mode = 'selected';
            wrapper.appendChild(node);  // move verse-num itself
            continue;
        }

        if (mode === 'selected') {
            // If we hit the next verse-num, switch to "after"
            if (
                node.nodeType === 1 &&            // element
                node.classList.contains('verse-num')
            ) {
                mode = 'after';
                afterP.appendChild(node);
            } else {
                wrapper.appendChild(node);
            }
        } else if (mode === 'before') {
            beforeP.appendChild(node);
        } else {
            afterP.appendChild(node);
        }
    }

    const parent = paragraph.parentNode;

    // Insert in order: before, wrapper, after
    if (beforeP.childNodes.length > 0) {
        parent.insertBefore(beforeP, paragraph);
    }
    parent.insertBefore(wrapper, paragraph);
    if (afterP.childNodes.length > 0) {
        parent.insertBefore(afterP, paragraph);
    }

    parent.removeChild(paragraph);

    wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
}


