// bible-api.js
// Responsibility: talking to the ESV API.
// Use from BibleApp instead of inline methods.

export class BibleApi {
    constructor(apiBaseUrl, getApiKey, getState) {
        this.API_BASE_URL = apiBaseUrl;
        this.getApiKey = getApiKey;   // () => string
        this.getState = getState;     // () => current state object
    }

    async fetchPassage(reference) {
        const API_KEY = this.getApiKey();
        const state = this.getState();

        if (!API_KEY) {
            throw new Error('NO_API_KEY');
        }

        const params = new URLSearchParams({
            'q': reference,
            'include-headings': state.showHeadings,
            'include-footnotes': state.showFootnotes,
            'include-cross-references': state.showFootnotes, // Enable cross-refs when footnotes enabled
            'include-verse-numbers': true, // Always true for selection to work
            'include-short-copyright': false,
            'include-passage-references': false
        });



        const response = await fetch(`${this.API_BASE_URL}/passage/html/?${params}`, {
            headers: { 'Authorization': `Token ${API_KEY}` }
        });

        if (!response.ok) {
            throw new Error(`HTTP_${response.status}`);
        }

        return response.json();
    }


    async searchPassages(query) {
        const API_KEY = this.getApiKey();
        if (!API_KEY || !query.trim()) return null;

        const params = new URLSearchParams({
            q: query,
            'page-size': 20
        });

        const response = await fetch(`${this.API_BASE_URL}/passage/search/?${params}`, {
            headers: { 'Authorization': `Token ${API_KEY}` }
        });

        if (!response.ok) {
            throw new Error(`HTTP_${response.status}`);
        }

        return response.json();
    }
}
