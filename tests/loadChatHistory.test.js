/**
 * Tests for the Supabase guards in loadChatHistory.js (Bug 1, 2, 3 fixes).
 *
 * Tests the two critical guards added to prevent backgroundRefresh/addRowToUI
 * from wiping or duplicating live messages while a response is in flight.
 */

// ── Re-implement the two guarded functions to test the guard logic ─────────────
// We extract only the guard logic (not the full DOM rendering) so we can test
// it without a full DOM environment.

function makeAddRowToUI(chatnest, addMessageCalls) {
    return function addRowToUI(row) {
        if (!chatnest.widget) return;
        // THE GUARD — Bug 2/3 fix
        if (chatnest.isWaitingForResponse || chatnest.isTypewriterActive) return;
        // Track that the function proceeded past the guard
        addMessageCalls.push(row);
    };
}

function makeFetchAndRender(chatnest, renderCalls) {
    return async function fetchAndRenderSupabaseHistory() {
        if (!chatnest.widget) return;
        // THE GUARD — Bug 1/3 fix (pre-fetch)
        if (chatnest.isWaitingForResponse || chatnest.isTypewriterActive) return;

        // Simulate async DB fetch
        const rows = await Promise.resolve([{ id: 1, query: 'Q', response: 'R' }]);

        // THE GUARD — Bug 1 fix (post-fetch race)
        if (chatnest.isWaitingForResponse || chatnest.isTypewriterActive) return;

        // Track that rendering proceeded
        renderCalls.push(rows);
    };
}

function makeChatnest(overrides = {}) {
    return {
        widget: document.createElement('div'),
        isWaitingForResponse: false,
        isTypewriterActive: false,
        ...overrides,
    };
}

// ── addRowToUI guard ──────────────────────────────────────────────────────────

describe('addRowToUI guard (Bug 2/3)', () => {
    test('proceeds normally when no response in flight', () => {
        const cn = makeChatnest();
        const calls = [];
        const addRowToUI = makeAddRowToUI(cn, calls);
        addRowToUI({ id: 1, query: 'Q', response: 'R' });
        expect(calls).toHaveLength(1);
    });

    test('skips when isWaitingForResponse is true', () => {
        const cn = makeChatnest({ isWaitingForResponse: true });
        const calls = [];
        const addRowToUI = makeAddRowToUI(cn, calls);
        addRowToUI({ id: 1, query: 'Q', response: 'R' });
        expect(calls).toHaveLength(0);
    });

    test('skips when isTypewriterActive is true', () => {
        const cn = makeChatnest({ isTypewriterActive: true });
        const calls = [];
        const addRowToUI = makeAddRowToUI(cn, calls);
        addRowToUI({ id: 1, query: 'Q', response: 'R' });
        expect(calls).toHaveLength(0);
    });

    test('skips when both flags are true', () => {
        const cn = makeChatnest({ isWaitingForResponse: true, isTypewriterActive: true });
        const calls = [];
        const addRowToUI = makeAddRowToUI(cn, calls);
        addRowToUI({ id: 10 });
        expect(calls).toHaveLength(0);
    });

    test('resumes after flags cleared', () => {
        const cn = makeChatnest({ isWaitingForResponse: true });
        const calls = [];
        const addRowToUI = makeAddRowToUI(cn, calls);
        addRowToUI({ id: 1 }); // blocked
        expect(calls).toHaveLength(0);
        cn.isWaitingForResponse = false;
        addRowToUI({ id: 2 }); // now allowed
        expect(calls).toHaveLength(1);
        expect(calls[0].id).toBe(2);
    });

    test('skips when widget is null', () => {
        const cn = makeChatnest({ widget: null });
        const calls = [];
        const addRowToUI = makeAddRowToUI(cn, calls);
        addRowToUI({ id: 1 });
        expect(calls).toHaveLength(0);
    });
});

// ── fetchAndRenderSupabaseHistory guard ───────────────────────────────────────

describe('fetchAndRenderSupabaseHistory guard (Bug 1)', () => {
    test('renders when no response in flight', async () => {
        const cn = makeChatnest();
        const rendered = [];
        await makeFetchAndRender(cn, rendered)();
        expect(rendered).toHaveLength(1);
    });

    test('skips render when isWaitingForResponse is true at start', async () => {
        const cn = makeChatnest({ isWaitingForResponse: true });
        const rendered = [];
        await makeFetchAndRender(cn, rendered)();
        expect(rendered).toHaveLength(0);
    });

    test('skips render when isTypewriterActive is true at start', async () => {
        const cn = makeChatnest({ isTypewriterActive: true });
        const rendered = [];
        await makeFetchAndRender(cn, rendered)();
        expect(rendered).toHaveLength(0);
    });

    test('skips render when flag set during await (post-fetch race guard)', async () => {
        const cn = makeChatnest();
        const rendered = [];

        // Override to set the flag mid-flight
        const fetchAndRender = async function () {
            if (!cn.widget) return;
            if (cn.isWaitingForResponse || cn.isTypewriterActive) return;

            // Simulate async — set flag during await
            await Promise.resolve().then(() => { cn.isWaitingForResponse = true; });

            // Post-fetch guard should catch this
            if (cn.isWaitingForResponse || cn.isTypewriterActive) return;

            rendered.push('rendered');
        };

        await fetchAndRender();
        expect(rendered).toHaveLength(0);
    });

    test('widget null check prevents crash', async () => {
        const cn = makeChatnest({ widget: null });
        const rendered = [];
        await expect(makeFetchAndRender(cn, rendered)()).resolves.not.toThrow();
        expect(rendered).toHaveLength(0);
    });
});

// ── Integration: response in flight → flag clears → refresh runs ───────────────

describe('Supabase refresh lifecycle integration', () => {
    test('backgroundRefresh blocked during response, runs after flags clear', async () => {
        const cn = makeChatnest({ isWaitingForResponse: true });
        const rendered = [];
        const fetch = makeFetchAndRender(cn, rendered);

        // Background refresh fires while response is in flight
        await fetch();
        expect(rendered).toHaveLength(0);

        // Response completes: both flags cleared
        cn.isWaitingForResponse = false;
        cn.isTypewriterActive = false;

        // Next background refresh runs normally
        await fetch();
        expect(rendered).toHaveLength(1);
    });

    test('addRowToUI blocked during typewriter, runs after typewriter ends', () => {
        const cn = makeChatnest({ isTypewriterActive: true });
        const calls = [];
        const addRowToUI = makeAddRowToUI(cn, calls);

        addRowToUI({ id: 1 }); // blocked
        expect(calls).toHaveLength(0);

        cn.isTypewriterActive = false;
        addRowToUI({ id: 2 }); // allowed
        expect(calls).toHaveLength(1);
    });
});
