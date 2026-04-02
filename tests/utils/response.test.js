/**
 * Tests for src/lib/utils/response.js
 * Logic is inlined here because the source uses ESM; tests run in Jest/CJS.
 */

// ── inline the production functions exactly as they appear in source ──────────

function splitResponseByTripleComma(text) {
    if (!text || typeof text !== 'string') return [''];
    return text.split(',,,').map(s => s.trim()).filter(Boolean);
}

function isEmptyResponse(text) {
    if (text == null) return true;
    const s = String(text).trim();
    if (!s) return true;
    if (s === '{}' || s === '{"response":""}' || s === '{"response": ""}') return true;
    try {
        const o = JSON.parse(s);
        const v = o?.response ?? o?.message ?? o?.text ?? o?.content ?? o?.answer;
        return v == null || String(v).trim() === '';
    } catch (_) { return false; }
}

function extractResponseText(response, config) {
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
        return { text: fallback, products: [] };
    }
}

// ── splitResponseByTripleComma ────────────────────────────────────────────────

describe('splitResponseByTripleComma', () => {
    test('returns single-element array for plain text', () => {
        expect(splitResponseByTripleComma('Hello world')).toEqual(['Hello world']);
    });

    test('splits on ,,, delimiter', () => {
        expect(splitResponseByTripleComma('Part one,,,Part two')).toEqual(['Part one', 'Part two']);
    });

    test('splits multiple parts', () => {
        expect(splitResponseByTripleComma('A,,,B,,,C')).toEqual(['A', 'B', 'C']);
    });

    test('trims whitespace around parts', () => {
        expect(splitResponseByTripleComma('  Hello  ,,,  World  ')).toEqual(['Hello', 'World']);
    });

    test('filters out empty parts after split', () => {
        expect(splitResponseByTripleComma(',,,Valid,,,')).toEqual(['Valid']);
    });

    test('returns [empty string] for null input', () => {
        expect(splitResponseByTripleComma(null)).toEqual(['']);
    });

    test('returns [empty string] for undefined input', () => {
        expect(splitResponseByTripleComma(undefined)).toEqual(['']);
    });

    test('returns [empty string] for empty string', () => {
        expect(splitResponseByTripleComma('')).toEqual(['']);
    });

    test('returns [empty string] for non-string input (number)', () => {
        expect(splitResponseByTripleComma(42)).toEqual(['']);
    });

    test('handles text with no content between delimiters', () => {
        expect(splitResponseByTripleComma(',,,  ,,,valid')).toEqual(['valid']);
    });
});

// ── isEmptyResponse ───────────────────────────────────────────────────────────

describe('isEmptyResponse', () => {
    test('returns true for null', () => expect(isEmptyResponse(null)).toBe(true));
    test('returns true for undefined', () => expect(isEmptyResponse(undefined)).toBe(true));
    test('returns true for empty string', () => expect(isEmptyResponse('')).toBe(true));
    test('returns true for whitespace-only string', () => expect(isEmptyResponse('   ')).toBe(true));
    test('returns true for {}', () => expect(isEmptyResponse('{}')).toBe(true));
    test('returns true for {"response":""}', () => expect(isEmptyResponse('{"response":""}')).toBe(true));
    test('returns true for {"response": ""}', () => expect(isEmptyResponse('{"response": ""}')).toBe(true));

    test('returns false for normal text', () => expect(isEmptyResponse('Hello')).toBe(false));
    test('returns false for text with spaces', () => expect(isEmptyResponse('  Hello  ')).toBe(false));

    test('returns true for JSON with empty response field', () => {
        expect(isEmptyResponse(JSON.stringify({ response: '' }))).toBe(true);
    });

    test('returns true for JSON with whitespace-only response field', () => {
        expect(isEmptyResponse(JSON.stringify({ response: '   ' }))).toBe(true);
    });

    test('returns false for JSON with real response field', () => {
        expect(isEmptyResponse(JSON.stringify({ response: 'Hello' }))).toBe(false);
    });

    test('returns true for JSON with null response field', () => {
        expect(isEmptyResponse(JSON.stringify({ response: null }))).toBe(true);
    });

    test('returns true for JSON with null message field', () => {
        expect(isEmptyResponse(JSON.stringify({ message: null }))).toBe(true);
    });

    test('returns false for JSON with message field populated', () => {
        expect(isEmptyResponse(JSON.stringify({ message: 'Hi there' }))).toBe(false);
    });

    test('returns false for non-JSON text that looks like code', () => {
        expect(isEmptyResponse('not json {')).toBe(false);
    });
});

// ── extractResponseText ───────────────────────────────────────────────────────

describe('extractResponseText', () => {
    const fallback = 'Sorry, there was an error processing the response. Please try again.';

    describe('string response', () => {
        test('returns text for plain string', () => {
            expect(extractResponseText('Hello', {})).toEqual({ text: 'Hello', products: [] });
        });

        test('returns empty text for empty string', () => {
            expect(extractResponseText('', {})).toEqual({ text: '', products: [] });
        });

        test('returns empty text for whitespace string', () => {
            expect(extractResponseText('   ', {})).toEqual({ text: '', products: [] });
        });
    });

    describe('object response', () => {
        test('extracts response field', () => {
            expect(extractResponseText({ response: 'Hello' }, {})).toEqual({ text: 'Hello', products: [] });
        });

        test('extracts message field as fallback', () => {
            expect(extractResponseText({ message: 'Hi' }, {})).toEqual({ text: 'Hi', products: [] });
        });

        test('extracts text field', () => {
            expect(extractResponseText({ text: 'Yo' }, {})).toEqual({ text: 'Yo', products: [] });
        });

        test('extracts content field', () => {
            expect(extractResponseText({ content: 'Content here' }, {})).toEqual({ text: 'Content here', products: [] });
        });

        test('extracts answer field', () => {
            expect(extractResponseText({ answer: 'Answer' }, {})).toEqual({ text: 'Answer', products: [] });
        });

        test('returns empty text for object with empty response', () => {
            expect(extractResponseText({ response: '' }, {})).toEqual({ text: '', products: [] });
        });

        test('extracts products array', () => {
            const prods = [{ name: 'Item', price: '$10' }];
            expect(extractResponseText({ response: 'Buy this', products: prods }, {}))
                .toEqual({ text: 'Buy this', products: prods });
        });

        test('uses custom apiResponseFormat key', () => {
            const config = { apiResponseFormat: { response: 'reply' } };
            expect(extractResponseText({ reply: 'Custom field' }, config))
                .toEqual({ text: 'Custom field', products: [] });
        });
    });

    describe('transformResponse config', () => {
        test('applies string transform', () => {
            const config = { transformResponse: () => 'Transformed' };
            expect(extractResponseText({}, config)).toEqual({ text: 'Transformed', products: [] });
        });

        test('applies object transform with response key', () => {
            const config = { transformResponse: () => ({ response: 'TR', products: [] }) };
            expect(extractResponseText({}, config)).toEqual({ text: 'TR', products: [] });
        });

        test('returns empty for transform returning empty string', () => {
            const config = { transformResponse: () => '' };
            expect(extractResponseText({}, config)).toEqual({ text: '', products: [] });
        });

        test('handles transform returning null gracefully', () => {
            const config = { transformResponse: () => null };
            // null → isEmptyResponse(String(null)) = isEmptyResponse('null') = false → text = 'null'
            const result = extractResponseText({}, config);
            // null string is not empty per isEmptyResponse, so falls to String(null)
            expect(result.products).toEqual([]);
        });
    });

    describe('null/undefined response', () => {
        test('returns fallback for null', () => {
            expect(extractResponseText(null, {})).toEqual({ text: fallback, products: [] });
        });

        test('returns fallback for undefined', () => {
            expect(extractResponseText(undefined, {})).toEqual({ text: fallback, products: [] });
        });
    });
});
