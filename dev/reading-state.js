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

    // Special handling for verse 1 - find first paragraph/content
    if (app.state.selectedVerse === 1) {
        const firstParagraph = app.passageText.querySelector('p');
        if (!firstParagraph) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        // Find where verse 2 starts (if it exists)
        const verse2 = app.passageText.querySelector('.verse-num');

        if (verse2 && firstParagraph.contains(verse2)) {
            // Split the paragraph at verse 2
            const verse1Block = document.createElement('div');
            verse1Block.classList.add('selected-verse-glow');

            const afterVerse1 = document.createElement('p');
            let foundVerse2 = false;
            const nodes = Array.from(firstParagraph.childNodes);

            nodes.forEach(node => {
                if (node === verse2) {
                    foundVerse2 = true;
                    afterVerse1.appendChild(node);
                } else if (foundVerse2) {
                    afterVerse1.appendChild(node);
                } else {
                    verse1Block.appendChild(node);
                }
            });

            const parent = firstParagraph.parentNode;
            parent.insertBefore(verse1Block, firstParagraph);
            if (afterVerse1.childNodes.length > 0) {
                parent.insertBefore(afterVerse1, firstParagraph);
            }
            parent.removeChild(firstParagraph);

            setTimeout(() => {
                verse1Block.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        } else {
            // Entire first paragraph is verse 1
            firstParagraph.classList.add('selected-verse-glow');
            setTimeout(() => {
                firstParagraph.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
        return;
    }

    const verseNums = app.passageText.querySelectorAll('.verse-num');
    let targetVerseNum = null;

    for (const vn of verseNums) {
        if (vn.textContent.trim() === app.state.selectedVerse.toString()) {
            targetVerseNum = vn;
            break;
        }
    }

    if (!targetVerseNum) return;

    if (app.state.verseByVerse) {
        const container = targetVerseNum.closest('.verse-container');
        if (!container) return;

        app.passageText.querySelectorAll('.selected-verse-glow').forEach(el => {
            el.classList.remove('selected-verse-glow');
        });
        container.classList.add('selected-verse-glow');
        setTimeout(() => {
            container.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
        return;
    }

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
    if (beforeP.childNodes.length > 0) {
        parent.insertBefore(beforeP, paragraph);
    }
    parent.insertBefore(selectedBlock, paragraph);
    if (afterP.childNodes.length > 0) {
        parent.insertBefore(afterP, paragraph);
    }
    parent.removeChild(paragraph);

    setTimeout(() => {
        selectedBlock.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
}

