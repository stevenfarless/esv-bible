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

    // Verse-by-verse: just glow the existing container
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

    // General case: wrap from this .verse-num up to (but not including) next .verse-num
    const paragraph = targetVerseNum.closest('p, div');
    if (!paragraph) return;

    const parent = paragraph.parentNode;
    if (!parent) return;

    // New wrapper will hold ONLY the selected verse content
    const wrapper = document.createElement('div');
    wrapper.classList.add('selected-verse-glow');

    const beforeBlock = document.createElement(paragraph.tagName.toLowerCase());
    const afterBlock = document.createElement(paragraph.tagName.toLowerCase());

    let mode = 'before';
    const nodes = Array.from(paragraph.childNodes);

    for (const node of nodes) {
        if (node === targetVerseNum) {
            // We are at the selected verse number: switch to selected mode
            mode = 'selected';
            wrapper.appendChild(node); // move the verse-num itself
            continue;
        }

        if (mode === 'selected') {
            // If we hit the NEXT verse-num, switch to "after" and keep it (and all that follows) out of the wrapper
            if (
                node.nodeType === 1 && // element
                node.classList.contains('verse-num')
            ) {
                mode = 'after';
                afterBlock.appendChild(node);
            } else {
                wrapper.appendChild(node);
            }
        } else if (mode === 'before') {
            beforeBlock.appendChild(node);
        } else {
            // mode === 'after'
            afterBlock.appendChild(node);
        }
    }

    // Replace original paragraph with before + wrapper + after
    const referenceNode = paragraph.nextSibling;
    parent.removeChild(paragraph);

    if (beforeBlock.childNodes.length > 0) {
        parent.insertBefore(beforeBlock, referenceNode);
    }

    parent.insertBefore(wrapper, referenceNode);

    if (afterBlock.childNodes.length > 0) {
        parent.insertBefore(afterBlock, referenceNode);
    }

    wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

