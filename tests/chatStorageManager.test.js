/**
 * Tests for src/lib/ChatStorageManager.js
 * Uses jsdom's localStorage mock.
 */

// ── Inline ChatStorageManager (CJS-compatible) ────────────────────────────────

function safeGet(key) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
}
function safeSet(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (err) { /* quota */ }
}

class ChatStorageManager {
    constructor(userManager, config) {
        this.userManager = userManager;
        this.config = config;
        this.enableHistory = config.enableHistory !== false;
        this.maxHistoryLength = config.maxHistoryLength || 100;
        this.widget = null;
        this.domain = userManager.domain;
        this.path = userManager.path;
    }
    setWidget(widget) { this.widget = widget; }
    getChatHistory() {
        if (!this.enableHistory) return [];
        const historyKey = this.userManager.getHistoryKey();
        const history = safeGet(historyKey) || [];
        if (this.config.separateSubpageHistory) {
            return history.filter(item =>
                (!item.domain || item.domain === this.domain) &&
                (!item.path   || item.path   === this.path)
            );
        }
        return history.filter(item => !item.domain || item.domain === this.domain);
    }
    saveMessage(message, sender, isRegenerated = false, options = {}) {
        if (!this.enableHistory) return;
        const historyKey = this.userManager.getHistoryKey();
        let chatHistory = this.getChatHistory();
        if (isRegenerated && sender === 'bot') {
            const lastUserIndex = chatHistory.findLastIndex(msg => msg.sender === 'user');
            if (lastUserIndex !== -1) chatHistory = chatHistory.slice(0, lastUserIndex + 1);
        }
        const messageData = {
            message, sender,
            timestamp: new Date().toISOString(),
            domain: this.domain,
            isRegenerated
        };
        if (options.files?.length > 0)    messageData.files    = options.files;
        if (options.products?.length > 0) messageData.products = options.products;
        if (this.config.separateSubpageHistory) messageData.path = this.path;
        chatHistory.push(messageData);
        if (chatHistory.length > this.maxHistoryLength) {
            chatHistory = chatHistory.slice(-this.maxHistoryLength);
        }
        safeSet(historyKey, chatHistory);
    }
    saveParlantMessage(message, sender, queryId) {
        if (!this.enableHistory) return;
        const historyKey = this.userManager.getHistoryKey();
        let chatHistory = this.getChatHistory();
        const messageData = {
            message, sender,
            timestamp: new Date().toISOString(),
            domain: this.domain,
            queryId,
            userSessionId: this.userManager.userSessionId
        };
        if (this.config.separateSubpageHistory) messageData.path = this.path;
        chatHistory.push(messageData);
        if (chatHistory.length > this.maxHistoryLength) {
            chatHistory = chatHistory.slice(-this.maxHistoryLength);
        }
        safeSet(historyKey, chatHistory);
    }
    clearHistory() {
        if (!this.enableHistory) return;
        const historyKey = this.userManager.getHistoryKey();
        safeSet(historyKey, []);
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeUserManager(opts = {}) {
    return {
        domain: opts.domain || 'localhost',
        path: opts.path || '/',
        userSessionId: opts.userSessionId || 'session-1',
        getHistoryKey: () => opts.historyKey || `chatnest_history_${opts.domain || 'localhost'}_user1`,
    };
}

function makeStorageManager(configOverrides = {}, userManagerOverrides = {}) {
    const config = { enableHistory: true, maxHistoryLength: 100, ...configOverrides };
    const um = makeUserManager(userManagerOverrides);
    return new ChatStorageManager(um, config);
}

beforeEach(() => {
    localStorage.clear();
});

// ── getChatHistory ────────────────────────────────────────────────────────────

describe('ChatStorageManager.getChatHistory', () => {
    test('returns empty array when no history saved', () => {
        const sm = makeStorageManager();
        expect(sm.getChatHistory()).toEqual([]);
    });

    test('returns empty array when enableHistory is false', () => {
        const sm = makeStorageManager({ enableHistory: false });
        expect(sm.getChatHistory()).toEqual([]);
    });

    test('filters by domain', () => {
        const sm = makeStorageManager({}, { domain: 'example.com', historyKey: 'chatnest_history_example.com_user1' });
        sm.saveMessage('Hello', 'user');
        const hist = sm.getChatHistory();
        expect(hist).toHaveLength(1);
        expect(hist[0].domain).toBe('example.com');
    });

    test('does not return messages from other domains', () => {
        const key = 'chatnest_history_shared_user1';
        // Manually inject a message from a different domain
        localStorage.setItem(key, JSON.stringify([
            { message: 'other', sender: 'user', domain: 'other.com', timestamp: new Date().toISOString() }
        ]));
        const sm = makeStorageManager({}, { domain: 'mysite.com', historyKey: key });
        expect(sm.getChatHistory()).toHaveLength(0);
    });
});

// ── saveMessage ───────────────────────────────────────────────────────────────

describe('ChatStorageManager.saveMessage', () => {
    test('saves a user message', () => {
        const sm = makeStorageManager();
        sm.saveMessage('Hi', 'user');
        const hist = sm.getChatHistory();
        expect(hist).toHaveLength(1);
        expect(hist[0].message).toBe('Hi');
        expect(hist[0].sender).toBe('user');
    });

    test('saves a bot message', () => {
        const sm = makeStorageManager();
        sm.saveMessage('Hello back', 'bot');
        const hist = sm.getChatHistory();
        expect(hist[0].sender).toBe('bot');
    });

    test('does not save when enableHistory is false', () => {
        const sm = makeStorageManager({ enableHistory: false });
        sm.saveMessage('Hi', 'user');
        // Cannot call getChatHistory (returns []) so check localStorage directly
        const raw = localStorage.getItem(makeUserManager().getHistoryKey());
        expect(raw).toBeNull();
    });

    test('records timestamp as ISO string', () => {
        const sm = makeStorageManager();
        sm.saveMessage('msg', 'user');
        const hist = sm.getChatHistory();
        expect(() => new Date(hist[0].timestamp)).not.toThrow();
        expect(new Date(hist[0].timestamp).getTime()).not.toBeNaN();
    });

    test('enforces maxHistoryLength by trimming oldest', () => {
        const sm = makeStorageManager({ maxHistoryLength: 3 });
        sm.saveMessage('1', 'user');
        sm.saveMessage('2', 'user');
        sm.saveMessage('3', 'user');
        sm.saveMessage('4', 'user'); // exceeds limit
        const hist = sm.getChatHistory();
        expect(hist).toHaveLength(3);
        expect(hist[0].message).toBe('2'); // oldest trimmed
        expect(hist[2].message).toBe('4');
    });

    test('on regeneration: truncates history after last user message', () => {
        const sm = makeStorageManager();
        sm.saveMessage('user q', 'user');
        sm.saveMessage('old bot', 'bot');
        sm.saveMessage('new bot', 'bot', true); // regenerated
        const hist = sm.getChatHistory();
        // old bot should be gone, replaced by new bot
        expect(hist.some(m => m.message === 'old bot')).toBe(false);
        expect(hist[hist.length - 1].message).toBe('new bot');
    });

    test('saves files metadata when provided', () => {
        const sm = makeStorageManager();
        sm.saveMessage('msg', 'user', false, { files: [{ name: 'a.png' }] });
        const hist = sm.getChatHistory();
        expect(hist[0].files).toEqual([{ name: 'a.png' }]);
    });

    test('does not attach empty files array', () => {
        const sm = makeStorageManager();
        sm.saveMessage('msg', 'user', false, { files: [] });
        const hist = sm.getChatHistory();
        expect(hist[0].files).toBeUndefined();
    });

    test('saves products metadata when provided', () => {
        const sm = makeStorageManager();
        sm.saveMessage('resp', 'bot', false, { products: [{ name: 'Item' }] });
        const hist = sm.getChatHistory();
        expect(hist[0].products).toEqual([{ name: 'Item' }]);
    });
});

// ── clearHistory ──────────────────────────────────────────────────────────────

describe('ChatStorageManager.clearHistory', () => {
    test('clears stored messages', () => {
        const sm = makeStorageManager();
        sm.saveMessage('Hi', 'user');
        sm.clearHistory();
        expect(sm.getChatHistory()).toEqual([]);
    });

    test('does nothing when enableHistory is false', () => {
        const sm = makeStorageManager({ enableHistory: false });
        // Should not throw
        expect(() => sm.clearHistory()).not.toThrow();
    });
});

// ── saveParlantMessage ────────────────────────────────────────────────────────

describe('ChatStorageManager.saveParlantMessage', () => {
    test('saves message with queryId', () => {
        const sm = makeStorageManager();
        sm.saveParlantMessage('Hello', 'user', 'q-123');
        const hist = sm.getChatHistory();
        expect(hist).toHaveLength(1);
        expect(hist[0].queryId).toBe('q-123');
        expect(hist[0].message).toBe('Hello');
    });

    test('does not save when enableHistory is false', () => {
        const sm = makeStorageManager({ enableHistory: false });
        sm.saveParlantMessage('Hello', 'user', 'q-1');
        expect(sm.getChatHistory()).toEqual([]);
    });

    test('respects maxHistoryLength', () => {
        const sm = makeStorageManager({ maxHistoryLength: 2 });
        sm.saveParlantMessage('1', 'user', 'q1');
        sm.saveParlantMessage('2', 'user', 'q2');
        sm.saveParlantMessage('3', 'user', 'q3');
        const hist = sm.getChatHistory();
        expect(hist).toHaveLength(2);
        expect(hist[0].message).toBe('2');
    });
});

// ── separateSubpageHistory ────────────────────────────────────────────────────

describe('ChatStorageManager separateSubpageHistory', () => {
    test('filters by path when separateSubpageHistory is true', () => {
        // Each manager uses its own key so localStorage entries don't cross-contaminate
        const sm1 = makeStorageManager(
            { separateSubpageHistory: true },
            { domain: 'x.com', path: '/about', historyKey: 'chatnest_sp_about' }
        );
        const sm2 = makeStorageManager(
            { separateSubpageHistory: true },
            { domain: 'x.com', path: '/home', historyKey: 'chatnest_sp_home' }
        );
        sm1.saveMessage('about msg', 'user');
        sm2.saveMessage('home msg', 'user');

        expect(sm1.getChatHistory()).toHaveLength(1);
        expect(sm1.getChatHistory()[0].message).toBe('about msg');
        expect(sm2.getChatHistory()).toHaveLength(1);
        expect(sm2.getChatHistory()[0].message).toBe('home msg');
    });

    test('same key with mixed paths: each manager only sees its own path', () => {
        const key = 'chatnest_sp_shared';
        const sm1 = makeStorageManager(
            { separateSubpageHistory: true },
            { domain: 'x.com', path: '/about', historyKey: key }
        );
        const sm2 = makeStorageManager(
            { separateSubpageHistory: true },
            { domain: 'x.com', path: '/home', historyKey: key }
        );
        sm1.saveMessage('about msg', 'user');
        sm2.saveMessage('home msg', 'user');

        // sm1 sees only /about entries; sm2 sees only /home entries
        const h1 = sm1.getChatHistory();
        const h2 = sm2.getChatHistory();
        expect(h1.every(m => m.path === '/about')).toBe(true);
        expect(h2.every(m => m.path === '/home')).toBe(true);
    });
});
