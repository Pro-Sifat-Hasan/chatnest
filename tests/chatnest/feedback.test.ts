/**
 * Tests for feedback module:
 *   sendFeedback, saveFeedbackState, restoreFeedbackState
 */

// ── Inline implementations ────────────────────────────────────────────────────

async function sendFeedback(chatnest, type, response) {
    if (chatnest.config.parlant.enabled) {
        chatnest.saveFeedbackState(response, type);
        return;
    }

    const endpoint = chatnest.config.feedbackEndpoint;
    if (!endpoint || /your-api|example\.com|localhost:7000/.test(endpoint)) {
        chatnest.saveFeedbackState(response, type);
        return;
    }

    try {
        const feedback = {
            type: type,
            response: response,
            feedback: null,
            timestamp: new Date().toISOString(),
            userId: chatnest.userManager.currentUser,
            domain: chatnest.userManager.domain
        };

        const res = await fetch(chatnest.config.feedbackEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...chatnest.config.apiHeaders
            },
            body: JSON.stringify(feedback)
        });

        if (!res.ok) {
            throw new Error('Failed to send feedback');
        }

        chatnest.saveFeedbackState(response, type);

    } catch {
        chatnest.saveFeedbackState(response, type);
    }
}

function saveFeedbackState(chatnest, response, type) {
    const feedbackKey = `feedback_${chatnest.userManager.currentUser}`;
    let feedbackState = JSON.parse(localStorage.getItem(feedbackKey) || '{}');

    if (type === 'remove') {
        delete feedbackState[response];
    } else {
        feedbackState[response] = type;
    }

    localStorage.setItem(feedbackKey, JSON.stringify(feedbackState));
}

function restoreFeedbackState(chatnest, container, response) {
    try {
        const feedbackKey = `feedback_${chatnest.userManager.currentUser}`;
        const raw = localStorage.getItem(feedbackKey);
        const feedbackState = raw ? JSON.parse(raw) : {};
        const state = feedbackState[response];
        if (!state) return;

        const likeBtn = container?.querySelector('.like-btn');
        const dislikeBtn = container?.querySelector('.dislike-btn');
        if (!likeBtn || !dislikeBtn) return;

        if (state === 'like') {
            likeBtn.classList.add('active');
            dislikeBtn.classList.remove('active');
        } else if (state === 'dislike') {
            dislikeBtn.classList.add('active');
            likeBtn.classList.remove('active');
        }
    } catch {
        // Storage may be unavailable or contain corrupted data
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeChatnest(overrides = {}) {
    const chatnest = {
        config: {
            parlant: { enabled: false },
            feedbackEndpoint: 'https://real-endpoint.com/feedback',
            apiHeaders: {},
            ...overrides.config,
        },
        userManager: {
            currentUser: 'user-123',
            domain: 'example.com',
            ...overrides.userManager,
        },
        ...overrides,
    };
    chatnest.saveFeedbackState = (response, type) => saveFeedbackState(chatnest, response, type);
    return chatnest;
}

function buildFeedbackContainer(likeActive = false, dislikeActive = false) {
    const container = document.createElement('div');
    const likeBtn = document.createElement('button');
    likeBtn.className = 'like-btn';
    if (likeActive) likeBtn.classList.add('active');
    const dislikeBtn = document.createElement('button');
    dislikeBtn.className = 'dislike-btn';
    if (dislikeActive) dislikeBtn.classList.add('active');
    container.appendChild(likeBtn);
    container.appendChild(dislikeBtn);
    return container;
}

beforeEach(() => {
    localStorage.clear();
    global.fetch = jest.fn();
});

afterEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
});

// ── saveFeedbackState ─────────────────────────────────────────────────────────

describe('saveFeedbackState', () => {
    test('saves "like" for a response', () => {
        const chatnest = makeChatnest();
        saveFeedbackState(chatnest, 'Hello world', 'like');
        const stored = JSON.parse(localStorage.getItem('feedback_user-123'));
        expect(stored['Hello world']).toBe('like');
    });

    test('saves "dislike" for a response', () => {
        const chatnest = makeChatnest();
        saveFeedbackState(chatnest, 'Some answer', 'dislike');
        const stored = JSON.parse(localStorage.getItem('feedback_user-123'));
        expect(stored['Some answer']).toBe('dislike');
    });

    test('removes entry when type is "remove"', () => {
        const chatnest = makeChatnest();
        saveFeedbackState(chatnest, 'Answer', 'like');
        saveFeedbackState(chatnest, 'Answer', 'remove');
        const stored = JSON.parse(localStorage.getItem('feedback_user-123'));
        expect(stored['Answer']).toBeUndefined();
    });

    test('preserves other feedback entries when updating one', () => {
        const chatnest = makeChatnest();
        saveFeedbackState(chatnest, 'Response A', 'like');
        saveFeedbackState(chatnest, 'Response B', 'dislike');
        const stored = JSON.parse(localStorage.getItem('feedback_user-123'));
        expect(stored['Response A']).toBe('like');
        expect(stored['Response B']).toBe('dislike');
    });

    test('overwrites existing feedback type', () => {
        const chatnest = makeChatnest();
        saveFeedbackState(chatnest, 'Answer', 'like');
        saveFeedbackState(chatnest, 'Answer', 'dislike');
        const stored = JSON.parse(localStorage.getItem('feedback_user-123'));
        expect(stored['Answer']).toBe('dislike');
    });

    test('uses userId-scoped key in localStorage', () => {
        const chatnest = makeChatnest({ userManager: { currentUser: 'user-xyz', domain: 'test.com' } });
        saveFeedbackState(chatnest, 'Resp', 'like');
        expect(localStorage.getItem('feedback_user-xyz')).not.toBeNull();
        expect(localStorage.getItem('feedback_user-123')).toBeNull();
    });

    test('remove on non-existent key does not throw', () => {
        const chatnest = makeChatnest();
        expect(() => saveFeedbackState(chatnest, 'nonexistent', 'remove')).not.toThrow();
    });
});

// ── restoreFeedbackState ──────────────────────────────────────────────────────

describe('restoreFeedbackState', () => {
    test('adds active class to likeBtn for "like" state', () => {
        const chatnest = makeChatnest();
        saveFeedbackState(chatnest, 'Answer', 'like');
        const container = buildFeedbackContainer();
        restoreFeedbackState(chatnest, container, 'Answer');
        expect(container.querySelector('.like-btn').classList.contains('active')).toBe(true);
        expect(container.querySelector('.dislike-btn').classList.contains('active')).toBe(false);
    });

    test('adds active class to dislikeBtn for "dislike" state', () => {
        const chatnest = makeChatnest();
        saveFeedbackState(chatnest, 'Answer', 'dislike');
        const container = buildFeedbackContainer();
        restoreFeedbackState(chatnest, container, 'Answer');
        expect(container.querySelector('.dislike-btn').classList.contains('active')).toBe(true);
        expect(container.querySelector('.like-btn').classList.contains('active')).toBe(false);
    });

    test('does nothing when no stored feedback for the response', () => {
        const chatnest = makeChatnest();
        const container = buildFeedbackContainer();
        restoreFeedbackState(chatnest, container, 'Unknown response');
        expect(container.querySelector('.like-btn').classList.contains('active')).toBe(false);
        expect(container.querySelector('.dislike-btn').classList.contains('active')).toBe(false);
    });

    test('removes active from dislikeBtn when state is "like"', () => {
        const chatnest = makeChatnest();
        saveFeedbackState(chatnest, 'Resp', 'like');
        const container = buildFeedbackContainer(false, true); // dislike active
        restoreFeedbackState(chatnest, container, 'Resp');
        expect(container.querySelector('.dislike-btn').classList.contains('active')).toBe(false);
        expect(container.querySelector('.like-btn').classList.contains('active')).toBe(true);
    });

    test('removes active from likeBtn when state is "dislike"', () => {
        const chatnest = makeChatnest();
        saveFeedbackState(chatnest, 'Resp', 'dislike');
        const container = buildFeedbackContainer(true, false); // like active
        restoreFeedbackState(chatnest, container, 'Resp');
        expect(container.querySelector('.like-btn').classList.contains('active')).toBe(false);
        expect(container.querySelector('.dislike-btn').classList.contains('active')).toBe(true);
    });

    test('does not throw when container is null', () => {
        const chatnest = makeChatnest();
        expect(() => restoreFeedbackState(chatnest, null, 'Resp')).not.toThrow();
    });

    test('does not throw when like/dislike buttons are missing from container', () => {
        const chatnest = makeChatnest();
        saveFeedbackState(chatnest, 'Resp', 'like');
        const emptyContainer = document.createElement('div');
        expect(() => restoreFeedbackState(chatnest, emptyContainer, 'Resp')).not.toThrow();
    });

    test('handles corrupted localStorage gracefully', () => {
        const chatnest = makeChatnest();
        localStorage.setItem('feedback_user-123', 'not-valid-json{{');
        const container = buildFeedbackContainer();
        expect(() => restoreFeedbackState(chatnest, container, 'Any')).not.toThrow();
    });
});

// ── sendFeedback ──────────────────────────────────────────────────────────────

describe('sendFeedback', () => {
    test('calls saveFeedbackState directly when parlant is enabled', async () => {
        const chatnest = makeChatnest({ config: { parlant: { enabled: true }, apiHeaders: {} } });
        const saveSpy = jest.spyOn(chatnest, 'saveFeedbackState');
        await sendFeedback(chatnest, 'like', 'Response text');
        expect(saveSpy).toHaveBeenCalledWith('Response text', 'like');
        expect(global.fetch).not.toHaveBeenCalled();
    });

    test('calls saveFeedbackState directly for placeholder endpoint', async () => {
        const chatnest = makeChatnest({ config: { parlant: { enabled: false }, feedbackEndpoint: 'https://your-api.com/feedback', apiHeaders: {} } });
        const saveSpy = jest.spyOn(chatnest, 'saveFeedbackState');
        await sendFeedback(chatnest, 'like', 'Response text');
        expect(saveSpy).toHaveBeenCalledWith('Response text', 'like');
        expect(global.fetch).not.toHaveBeenCalled();
    });

    test('calls saveFeedbackState directly for example.com endpoint', async () => {
        const chatnest = makeChatnest({ config: { parlant: { enabled: false }, feedbackEndpoint: 'https://example.com/feedback', apiHeaders: {} } });
        const saveSpy = jest.spyOn(chatnest, 'saveFeedbackState');
        await sendFeedback(chatnest, 'dislike', 'Response');
        expect(saveSpy).toHaveBeenCalledWith('Response', 'dislike');
        expect(global.fetch).not.toHaveBeenCalled();
    });

    test('calls saveFeedbackState directly for localhost:7000 endpoint', async () => {
        const chatnest = makeChatnest({ config: { parlant: { enabled: false }, feedbackEndpoint: 'http://localhost:7000/feedback', apiHeaders: {} } });
        const saveSpy = jest.spyOn(chatnest, 'saveFeedbackState');
        await sendFeedback(chatnest, 'like', 'Response');
        expect(saveSpy).toHaveBeenCalledWith('Response', 'like');
    });

    test('calls saveFeedbackState directly when no endpoint', async () => {
        const chatnest = makeChatnest({ config: { parlant: { enabled: false }, feedbackEndpoint: null, apiHeaders: {} } });
        const saveSpy = jest.spyOn(chatnest, 'saveFeedbackState');
        await sendFeedback(chatnest, 'like', 'Response');
        expect(saveSpy).toHaveBeenCalledWith('Response', 'like');
        expect(global.fetch).not.toHaveBeenCalled();
    });

    test('POSTs to real endpoint and calls saveFeedbackState on success', async () => {
        const chatnest = makeChatnest();
        global.fetch.mockResolvedValue({ ok: true });
        const saveSpy = jest.spyOn(chatnest, 'saveFeedbackState');
        await sendFeedback(chatnest, 'like', 'Bot response');
        expect(global.fetch).toHaveBeenCalledWith(
            'https://real-endpoint.com/feedback',
            expect.objectContaining({ method: 'POST' })
        );
        expect(saveSpy).toHaveBeenCalledWith('Bot response', 'like');
    });

    test('calls saveFeedbackState on fetch error (network failure)', async () => {
        const chatnest = makeChatnest();
        global.fetch.mockRejectedValue(new Error('Network error'));
        const saveSpy = jest.spyOn(chatnest, 'saveFeedbackState');
        await sendFeedback(chatnest, 'dislike', 'Error response');
        expect(saveSpy).toHaveBeenCalledWith('Error response', 'dislike');
    });

    test('calls saveFeedbackState when server returns non-ok response', async () => {
        const chatnest = makeChatnest();
        global.fetch.mockResolvedValue({ ok: false, status: 500 });
        const saveSpy = jest.spyOn(chatnest, 'saveFeedbackState');
        await sendFeedback(chatnest, 'like', 'Some response');
        expect(saveSpy).toHaveBeenCalledWith('Some response', 'like');
    });

    test('includes userId and domain in fetch body', async () => {
        const chatnest = makeChatnest();
        global.fetch.mockResolvedValue({ ok: true });
        await sendFeedback(chatnest, 'like', 'Response');
        const fetchCall = global.fetch.mock.calls[0];
        const body = JSON.parse(fetchCall[1].body);
        expect(body.userId).toBe('user-123');
        expect(body.domain).toBe('example.com');
        expect(body.type).toBe('like');
        expect(body.response).toBe('Response');
    });

    test('includes Content-Type header in fetch', async () => {
        const chatnest = makeChatnest();
        global.fetch.mockResolvedValue({ ok: true });
        await sendFeedback(chatnest, 'like', 'Response');
        const fetchCall = global.fetch.mock.calls[0];
        expect(fetchCall[1].headers['Content-Type']).toBe('application/json');
    });
});
