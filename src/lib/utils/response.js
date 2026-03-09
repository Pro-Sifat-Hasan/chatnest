/**
 * Shared utility for extracting text (and optional products) from an API response.
 * Centralises the extraction logic so sendMessage, sendMessageWithFiles, and
 * processApiResponse all behave identically.
 *
 * @param {*}      response - Raw response from makeApiCall
 * @param {object} config   - Chatnest config (apiResponseFormat, transformResponse)
 * @returns {{ text: string, products: Array }}
 */
export function extractResponseText(response, config) {
    const fallback = 'Sorry, there was an error processing the response. Please try again.';
    try {
        if (config?.transformResponse) {
            const transformed = config.transformResponse(response);
            if (typeof transformed === 'string') {
                return { text: transformed || fallback, products: [] };
            }
            if (transformed && typeof transformed === 'object') {
                return {
                    text: transformed.response || transformed.message || JSON.stringify(transformed) || fallback,
                    products: transformed.products || []
                };
            }
            return { text: String(transformed) || fallback, products: [] };
        }

        if (typeof response === 'string') {
            return { text: response || fallback, products: [] };
        }

        if (response && typeof response === 'object') {
            const fmt = config?.apiResponseFormat || {};
            const text =
                response.response ||
                response.message  ||
                response.text     ||
                response.content  ||
                response.answer   ||
                response[fmt.response] ||
                JSON.stringify(response, null, 2);
            const products = response[fmt.products] || response.products || [];
            return { text: text || fallback, products };
        }

        return { text: String(response) || fallback, products: [] };
    } catch (err) {
        console.error('[Chatnest] extractResponseText error:', err);
        return { text: fallback, products: [] };
    }
}
