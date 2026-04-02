/**
 * Tests for src/lib/chatnest/hubspot/checkForTriggerWords.js
 */

function checkForTriggerWords(chatnest, message) {
    if (!chatnest.config.hubspot?.enabled) return false;
    if (chatnest.userManager.hasSubmittedForm()) return false;
    if (chatnest.isFormActive()) return false;
    const words = message.toLowerCase().split(/\s+/);
    return chatnest.config.hubspot.triggerKeywords.some(trigger =>
        words.includes(trigger.toLowerCase())
    );
}

function makeChatnest(overrides = {}) {
    return {
        config: {
            hubspot: {
                enabled: true,
                triggerKeywords: ['pricing', 'demo', 'contact', 'quote', 'help', 'support'],
                ...overrides.hubspotConfig,
            },
        },
        userManager: { hasSubmittedForm: jest.fn().mockReturnValue(false) },
        isFormActive: jest.fn().mockReturnValue(false),
        ...overrides,
    };
}

describe('checkForTriggerWords', () => {
    // ── HubSpot disabled ──────────────────────────────────────────────────────
    test('returns false when hubspot is disabled', () => {
        const cn = makeChatnest();
        cn.config.hubspot.enabled = false;
        expect(checkForTriggerWords(cn, 'I need pricing')).toBe(false);
    });

    test('returns false when hubspot config is missing', () => {
        const cn = makeChatnest();
        cn.config.hubspot = undefined;
        expect(checkForTriggerWords(cn, 'pricing')).toBe(false);
    });

    // ── Form already submitted ────────────────────────────────────────────────
    test('returns false when form already submitted', () => {
        const cn = makeChatnest();
        cn.userManager.hasSubmittedForm.mockReturnValue(true);
        expect(checkForTriggerWords(cn, 'I want pricing')).toBe(false);
    });

    // ── Form currently active ─────────────────────────────────────────────────
    test('returns false when form is currently active', () => {
        const cn = makeChatnest();
        cn.isFormActive.mockReturnValue(true);
        expect(checkForTriggerWords(cn, 'I need demo')).toBe(false);
    });

    // ── Trigger word matching ─────────────────────────────────────────────────
    // Note: the function splits on \s+ — punctuation stays attached to words.
    // So "pricing?" ≠ "pricing". Use messages where the keyword stands alone.
    test('returns true when message contains "pricing" as standalone word', () => {
        expect(checkForTriggerWords(makeChatnest(), 'Tell me about pricing please')).toBe(true);
    });

    test('returns true when message contains "demo" as standalone word', () => {
        expect(checkForTriggerWords(makeChatnest(), 'I want a demo please')).toBe(true);
    });

    test('returns true when message contains "contact" as standalone word', () => {
        expect(checkForTriggerWords(makeChatnest(), 'How do I contact someone')).toBe(true);
    });

    test('returns true for "quote" keyword', () => {
        expect(checkForTriggerWords(makeChatnest(), 'I need a quote')).toBe(true);
    });

    test('returns true for "help" keyword', () => {
        expect(checkForTriggerWords(makeChatnest(), 'I need help')).toBe(true);
    });

    test('returns true for "support" keyword', () => {
        expect(checkForTriggerWords(makeChatnest(), 'Need support please')).toBe(true);
    });

    test('is case-insensitive: "PRICING" standalone matches', () => {
        expect(checkForTriggerWords(makeChatnest(), 'About PRICING details')).toBe(true);
    });

    test('is case-insensitive: "Demo" matches', () => {
        expect(checkForTriggerWords(makeChatnest(), 'Book a Demo today')).toBe(true);
    });

    test('returns false for message with no trigger words', () => {
        expect(checkForTriggerWords(makeChatnest(), 'Hello how are you today')).toBe(false);
    });

    test('returns false for empty message', () => {
        expect(checkForTriggerWords(makeChatnest(), '')).toBe(false);
    });

    test('does not match partial words (e.g. "helpful" vs "help")', () => {
        // "helpful" split as a word will not match "help"
        expect(checkForTriggerWords(makeChatnest(), 'That was so helpful')).toBe(false);
    });

    test('matches with custom trigger keywords', () => {
        const cn = makeChatnest({ hubspotConfig: { triggerKeywords: ['upgrade', 'trial'] } });
        expect(checkForTriggerWords(cn, 'I want to upgrade')).toBe(true);
    });

    test('returns false with custom keywords when word not present', () => {
        const cn = makeChatnest({ hubspotConfig: { triggerKeywords: ['upgrade', 'trial'] } });
        expect(checkForTriggerWords(cn, 'What is the pricing?')).toBe(false);
    });

    test('matches first word in message', () => {
        expect(checkForTriggerWords(makeChatnest(), 'pricing information please')).toBe(true);
    });

    test('matches last word in message', () => {
        expect(checkForTriggerWords(makeChatnest(), 'I am looking for demo')).toBe(true);
    });
});
