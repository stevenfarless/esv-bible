export class BibleApi {
    constructor(baseUrl, getApiKey, getState) {
        this.baseUrl = baseUrl;
        this.getApiKey = getApiKey;
        this.getState = getState;
    }

    async fetchPassage(reference) {
        const apiKey = this.getApiKey();
        if (!apiKey) {
            console.error('No API key available');
            return null;
        }

        const state = this.getState();

        const params = new URLSearchParams({
            'q': reference,
            'include-headings': state.showHeadings,
            'include-footnotes': state.showFootnotes,
            'include-cross-references': state.showCrossReferences,
            'include-verse-numbers': true,
            'include-short-copyright': false,
            'include-passage-references': false
        });

        try {
            const response = await fetch(`${this.baseUrl}/passage/html/?${params}`, {
                headers: {
                    'Authorization': `Token ${apiKey}`
                }
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching passage:', error);
            return null;
        }
    }

    async searchPassages(query) {
        const apiKey = this.getApiKey();
        if (!apiKey) return null;

        const params = new URLSearchParams({
            q: query,
            'page-size': 20
        });

        try {
            const response = await fetch(`${this.baseUrl}/passage/search/?${params}`, {
                headers: {
                    'Authorization': `Token ${apiKey}`
                }
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error searching passages:', error);
            return null;
        }
    }
}
