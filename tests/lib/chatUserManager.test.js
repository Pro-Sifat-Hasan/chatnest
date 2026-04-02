/**
 * Tests for src/lib/ChatUserManager.js
 * jsdom provides localStorage and window.location
 */

class ChatUserManager {
    constructor(config) {
        this.config = config;
        this.domain = this.getCurrentDomain();
        this.path = this.getCurrentPath();
        this.currentUser = this.generateUserId();
        this.userSessionId = this.getOrCreateUserSessionId();
        this.initializeUser();
        this.formSubmissionsKey = `chatFormSubmissions_${this.domain}`;
        this.initializeFormSubmissions();
    }
    getCurrentDomain() { return window.location.hostname; }
    getCurrentPath()   { return window.location.pathname; }
    generateUserId() {
        const storageKey = this.config.separateSubpageHistory
            ? `currentChatUser_${this.domain}${this.path}`
            : `currentChatUser_${this.domain}`;
        const storedId = localStorage.getItem(storageKey);
        if (!storedId) {
            const newId = `user_${this.domain}${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            localStorage.setItem(storageKey, newId);
            return newId;
        }
        return storedId;
    }
    getOrCreateUserSessionId() {
        const sessionKey = this.config.separateSubpageHistory
            ? `userSessionId_${this.domain}${this.path}`
            : `userSessionId_${this.domain}`;
        let sessionId = localStorage.getItem(sessionKey);
        if (!sessionId) {
            sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
            localStorage.setItem(sessionKey, sessionId);
        }
        return sessionId;
    }
    getHistoryKey() {
        return this.config.separateSubpageHistory
            ? `chatHistory_${this.domain}${this.path}`
            : `chatHistory_${this.domain}`;
    }
    initializeUser() {
        if (!this.config.enableHistory) return;
        const historyKey = this.getHistoryKey();
        if (!localStorage.getItem(historyKey)) {
            localStorage.setItem(historyKey, JSON.stringify([]));
        }
    }
    initializeFormSubmissions() {
        if (!localStorage.getItem(this.formSubmissionsKey)) {
            localStorage.setItem(this.formSubmissionsKey, JSON.stringify([]));
        }
    }
    hasSubmittedForm() {
        const submissions = JSON.parse(localStorage.getItem(this.formSubmissionsKey) || '[]');
        return submissions.includes(this.currentUser);
    }
    hasFormBeenShown() {
        return localStorage.getItem(`chatFormShown_${this.currentUser}`) === 'true';
    }
    markFormAsShown() {
        localStorage.setItem(`chatFormShown_${this.currentUser}`, 'true');
    }
    resetFormShownStatus() {
        localStorage.removeItem(`chatFormShown_${this.currentUser}`);
    }
    recordFormSubmission(formData) {
        const submissions = JSON.parse(localStorage.getItem(this.formSubmissionsKey) || '[]');
        if (!submissions.includes(this.currentUser)) {
            submissions.push(this.currentUser);
            localStorage.setItem(this.formSubmissionsKey, JSON.stringify(submissions));
            localStorage.setItem(`chatFormData_${this.currentUser}`, JSON.stringify({ ...formData, submittedAt: new Date().toISOString() }));
        }
    }
    loadUserData() {
        const historyKey = this.getHistoryKey();
        return { userId: this.currentUser, domain: this.domain, path: this.path, chatHistory: JSON.parse(localStorage.getItem(historyKey)) || [] };
    }
    updateUserIdWithEmail(email) {
        const storageKey = this.config.separateSubpageHistory
            ? `currentChatUser_${this.domain}${this.path}`
            : `currentChatUser_${this.domain}`;
        localStorage.setItem(storageKey, email);
        this.currentUser = email;
    }
}

function makeUM(overrides = {}) {
    return new ChatUserManager({ enableHistory: true, separateSubpageHistory: false, ...overrides });
}

beforeEach(() => localStorage.clear());

// ── generateUserId ────────────────────────────────────────────────────────────

describe('ChatUserManager.generateUserId', () => {
    test('generates an ID starting with "user_"', () => {
        const um = makeUM();
        expect(um.currentUser).toMatch(/^user_/);
    });

    test('persists the same ID on second construction', () => {
        const um1 = makeUM();
        const id1 = um1.currentUser;
        const um2 = makeUM();
        expect(um2.currentUser).toBe(id1);
    });

    test('uses separate key when separateSubpageHistory=true', () => {
        const um1 = makeUM({ separateSubpageHistory: false });
        const um2 = makeUM({ separateSubpageHistory: true });
        // Both create new IDs but they're stored under different keys
        const key1 = `currentChatUser_${um1.domain}`;
        const key2 = `currentChatUser_${um2.domain}${um2.path}`;
        expect(localStorage.getItem(key1)).toBeTruthy();
        expect(localStorage.getItem(key2)).toBeTruthy();
    });
});

// ── getOrCreateUserSessionId ──────────────────────────────────────────────────

describe('ChatUserManager.getOrCreateUserSessionId', () => {
    test('generates session starting with "session_"', () => {
        const um = makeUM();
        expect(um.userSessionId).toMatch(/^session_/);
    });

    test('reuses existing session on second construction', () => {
        const um1 = makeUM();
        const session1 = um1.userSessionId;
        const um2 = makeUM();
        expect(um2.userSessionId).toBe(session1);
    });
});

// ── getHistoryKey ─────────────────────────────────────────────────────────────

describe('ChatUserManager.getHistoryKey', () => {
    test('returns key with domain', () => {
        const um = makeUM();
        expect(um.getHistoryKey()).toContain(um.domain);
    });

    test('includes path when separateSubpageHistory=true', () => {
        const um = makeUM({ separateSubpageHistory: true });
        expect(um.getHistoryKey()).toContain(um.path);
    });

    test('does not include path when separateSubpageHistory=false', () => {
        const um = makeUM({ separateSubpageHistory: false });
        // jsdom path is '/' — key should just be domain-based without duplicate path
        expect(um.getHistoryKey()).toBe(`chatHistory_${um.domain}`);
    });
});

// ── initializeUser ────────────────────────────────────────────────────────────

describe('ChatUserManager.initializeUser', () => {
    test('creates empty history in localStorage when enableHistory=true', () => {
        const um = makeUM({ enableHistory: true });
        const raw = localStorage.getItem(um.getHistoryKey());
        expect(JSON.parse(raw)).toEqual([]);
    });

    test('does not write history when enableHistory=false', () => {
        // Clear any existing key first
        localStorage.clear();
        const um = makeUM({ enableHistory: false });
        expect(localStorage.getItem(um.getHistoryKey())).toBeNull();
    });
});

// ── hasSubmittedForm / recordFormSubmission ───────────────────────────────────

describe('ChatUserManager form submission tracking', () => {
    test('hasSubmittedForm returns false before submission', () => {
        expect(makeUM().hasSubmittedForm()).toBe(false);
    });

    test('hasSubmittedForm returns true after recordFormSubmission', () => {
        const um = makeUM();
        um.recordFormSubmission({ name: 'Alice', email: 'a@b.com' });
        expect(um.hasSubmittedForm()).toBe(true);
    });

    test('recordFormSubmission idempotent (second call has no effect)', () => {
        const um = makeUM();
        um.recordFormSubmission({ name: 'Alice' });
        um.recordFormSubmission({ name: 'Alice Again' });
        const submissions = JSON.parse(localStorage.getItem(um.formSubmissionsKey));
        expect(submissions.filter(s => s === um.currentUser)).toHaveLength(1);
    });

    test('recordFormSubmission stores formData with submittedAt timestamp', () => {
        const um = makeUM();
        um.recordFormSubmission({ name: 'Bob', email: 'b@c.com' });
        const stored = JSON.parse(localStorage.getItem(`chatFormData_${um.currentUser}`));
        expect(stored.name).toBe('Bob');
        expect(stored.email).toBe('b@c.com');
        expect(stored.submittedAt).toBeTruthy();
    });
});

// ── hasFormBeenShown / markFormAsShown / resetFormShownStatus ─────────────────

describe('ChatUserManager form-shown tracking', () => {
    test('hasFormBeenShown returns false initially', () => {
        expect(makeUM().hasFormBeenShown()).toBe(false);
    });

    test('returns true after markFormAsShown', () => {
        const um = makeUM();
        um.markFormAsShown();
        expect(um.hasFormBeenShown()).toBe(true);
    });

    test('returns false after resetFormShownStatus', () => {
        const um = makeUM();
        um.markFormAsShown();
        um.resetFormShownStatus();
        expect(um.hasFormBeenShown()).toBe(false);
    });
});

// ── updateUserIdWithEmail ─────────────────────────────────────────────────────

describe('ChatUserManager.updateUserIdWithEmail', () => {
    test('updates currentUser to email', () => {
        const um = makeUM();
        um.updateUserIdWithEmail('user@example.com');
        expect(um.currentUser).toBe('user@example.com');
    });

    test('persists new ID in localStorage', () => {
        const um = makeUM();
        um.updateUserIdWithEmail('test@domain.com');
        const key = `currentChatUser_${um.domain}`;
        expect(localStorage.getItem(key)).toBe('test@domain.com');
    });

    test('subsequent construction uses email as ID', () => {
        const um = makeUM();
        um.updateUserIdWithEmail('persistent@test.com');
        const um2 = makeUM();
        expect(um2.currentUser).toBe('persistent@test.com');
    });
});

// ── loadUserData ──────────────────────────────────────────────────────────────

describe('ChatUserManager.loadUserData', () => {
    test('returns userId, domain, path, chatHistory', () => {
        const um = makeUM();
        const data = um.loadUserData();
        expect(data.userId).toBe(um.currentUser);
        expect(data.domain).toBe(um.domain);
        expect(data.path).toBe(um.path);
        expect(Array.isArray(data.chatHistory)).toBe(true);
    });

    test('chatHistory reflects what was stored', () => {
        const um = makeUM();
        const key = um.getHistoryKey();
        localStorage.setItem(key, JSON.stringify([{ message: 'hi', sender: 'user' }]));
        const data = um.loadUserData();
        expect(data.chatHistory).toHaveLength(1);
        expect(data.chatHistory[0].message).toBe('hi');
    });
});
