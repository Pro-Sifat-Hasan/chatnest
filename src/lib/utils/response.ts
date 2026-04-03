/**
 * Split a bot response by ,,, into separate messages.
 * Used when AI returns multiple responses concatenated with triple comma.
 * @param {string} text
 * @returns {string[]}
 */
export function splitResponseByTripleComma(text: string): string[] {
    if (!text || typeof text !== 'string') return [''];
    return text.split(',,,').map(s => s.trim()).filter(Boolean);
}

/**
 * Shared utility for extracting text (and optional products) from an API response.
 * Centralises the extraction logic so sendMessage, sendMessageWithFiles, and
 * processApiResponse all behave identically.
 *
 * @param {*}      response - Raw response from makeApiCall
 * @param {object} config   - Chatnest config (apiResponseFormat, transformResponse)
 * @returns {{ text: string, products: Array }}
 */
function isEmptyResponse(text: any): boolean {
    if (text === null || text === undefined) return true;
    const s = String(text).trim();
    if (!s) return true;
    if (s === '{}' || s === '{"response":""}' || s === '{"response": ""}') return true;
    try {
        const o = JSON.parse(s);
        const v = o?.response ?? o?.message ?? o?.text ?? o?.content ?? o?.answer;
        return v === null || v === undefined || String(v).trim() === '';
    } catch {
        return false;
    }
}

export { isEmptyResponse };

export function extractResponseText(response: any, config: any): { text: string, products: any[] } {
    const fallback = 'Sorry, there was an error processing the response. Please try again.';
    try {
        if (config?.transformResponse) {
            const transformed = config.transformResponse(response);
            if (typeof transformed === 'string') {
                return { text: isEmptyResponse(transformed) ? '' : transformed, products: [] };
            }
            if (transformed && typeof transformed === 'object') {
                const t = transformed.response ?? transformed.message ?? '';
                return {
                    text: isEmptyResponse(t) ? '' : (t || transformed.response || transformed.message || ''),
                    products: transformed.products || []
                };
            }
            return { text: isEmptyResponse(transformed) ? '' : (String(transformed) || ''), products: [] };
        }

        if (typeof response === 'string') {
            return { text: isEmptyResponse(response) ? '' : response, products: [] };
        }

        if (response && typeof response === 'object') {
            const fmt = config?.apiResponseFormat || {};
            const text =
                response.response ??
                response.message ??
                response.text ??
                response.content ??
                response.answer ??
                response[fmt.response];
            const products = response[fmt.products] || response.products || [];
            if (isEmptyResponse(text)) return { text: '', products };
            return { text: text || fallback, products };
        }

        return { text: fallback, products: [] };
    } catch (err) {
        console.error('[Chatnest] extractResponseText error:', err);
        return { text: fallback, products: [] };
    }
}
