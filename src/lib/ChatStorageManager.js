/**
 * ChatStorageManager - Handles chat history persistence in localStorage
 */

/** @param {string} key @returns {any} */
function safeGet(key) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    } catch (_) {
        return null;
    }
}

/** @param {string} key @param {any} value */
function safeSet(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
        // QuotaExceededError (iOS private mode, full storage, etc.)
        console.warn('[Chatnest] localStorage write failed:', err?.message || err);
    }
}

export class ChatStorageManager {
    constructor(userManager, config) {
        this.userManager = userManager;
        this.config = config;
        this.enableHistory = config.enableHistory !== false;
        this.maxHistoryLength = config.maxHistoryLength || 100;
        this.widget = null;
        this.domain = userManager.domain;
        this.path = userManager.path;
    }

    setWidget(widget) {
        this.widget = widget;
    }

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
            if (lastUserIndex !== -1) {
                chatHistory = chatHistory.slice(0, lastUserIndex + 1);
            }
        }

        const messageData = {
            message,
            sender,
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
            message,
            sender,
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
