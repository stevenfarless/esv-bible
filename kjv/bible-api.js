export class BibleApi {
    constructor(baseUrl, getApiKey, getState) {
        this.baseUrl = baseUrl;
        this.getApiKey = getApiKey;
        this.getState = getState;
        this.kjvBaseUrl = 'https://bible-api.com';
    }

    async fetchPassage(reference) {
        const state = this.getState();

        // Route to appropriate API based on translation
        if (state.translation === 'KJV') {
            return await this.fetchKJVPassage(reference);
        } else {
            return await this.fetchESVPassage(reference);
        }
    }

    async fetchESVPassage(reference) {
        const apiKey = this.getApiKey();
        if (!apiKey) {
            console.error('No API key available');
            return null;
        }

        const state = this.getState();
        const params = new URLSearchParams({
            'q': reference,
            'include-headings': state.showHeadings,
            'include-verse-numbers': state.showVerseNumbers,
            'include-short-copyright': false,
            'include-passage-references': false,
            'include-footnotes': state.showFootnotes,
            'include-footnote-body': state.showFootnotes,
            'include-cross-references': state.showCrossReferences || false,
            'include-selahs': true,
            'indent-poetry': true,
            'indent-paragraphs': 0,
            'indent-declares': 0
        });

        try {
            const response = await fetch(`${this.baseUrl}/passage/html?${params}`, {
                headers: { 'Authorization': `Token ${apiKey}` }
            });

            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching ESV passage:', error);
            return null;
        }
    }

    async fetchKJVPassage(reference) {
        try {
            // bible-api.com uses format: "John 3:16" or "John 3"
            const response = await fetch(`${this.kjvBaseUrl}/${encodeURIComponent(reference)}?translation=kjv`);

            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            const data = await response.json();

            // Transform to match ESV API format
            return this.transformKJVResponse(data);
        } catch (error) {
            console.error('Error fetching KJV passage:', error);
            return null;
        }
    }

    transformKJVResponse(kjvData) {
        if (!kjvData || !kjvData.verses) return null;

        const state = this.getState();
        let html = '';

        // Group verses by chapter if multiple chapters
        const versesByChapter = {};
        kjvData.verses.forEach(verse => {
            const chapterNum = verse.chapter;
            if (!versesByChapter[chapterNum]) {
                versesByChapter[chapterNum] = [];
            }
            versesByChapter[chapterNum].push(verse);
        });

        // Build HTML
        Object.keys(versesByChapter).forEach(chapterNum => {
            const verses = versesByChapter[chapterNum];

            verses.forEach((verse, index) => {
                // Add verse number if enabled
                if (state.showVerseNumbers) {
                    html += `<sup class="verse-num">${verse.verse}</sup>`;
                }

                // Add verse text
                html += ` ${verse.text.trim()}`;

                // Add space between verses if not verse-by-verse mode
                if (!state.verseByVerse && index < verses.length - 1) {
                    html += ' ';
                } else if (state.verseByVerse) {
                    html += '<br><br>';
                }
            });
        });

        // Wrap in paragraph
        html = `<p>${html}</p>`;

        return {
            query: kjvData.reference,
            canonical: kjvData.reference,
            passages: [html],
            passage_meta: [{
                canonical: kjvData.reference
            }]
        };
    }

    async searchPassages(query) {
        const state = this.getState();

        // Only ESV supports search
        if (state.translation === 'KJV') {
            // Return empty results for KJV search
            return { results: [], total_results: 0 };
        }

        const apiKey = this.getApiKey();
        if (!apiKey) return null;

        const params = new URLSearchParams({
            'q': query,
            'page-size': 20
        });

        try {
            const response = await fetch(`${this.baseUrl}/passage/search?${params}`, {
                headers: { 'Authorization': `Token ${apiKey}` }
            });

            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Error searching passages:', error);
            return null;
        }
    }
}

export default BibleApi;
