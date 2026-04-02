/**
 * Split text by ,,, into separate parts (multi-part AI responses)
 * @param {string} text
 * @returns {string[]}
 */
function splitByTripleComma(text) {
    if (!text || typeof text !== 'string') return [''];
    return String(text).split(',,,').map(s => s.trim()).filter(Boolean);
}

/**
 * Merge Supabase (last N rows) and localStorage history. No duplicates.
 * Supabase = source of truth for recent data. localStorage = older data only (timestamp < min Supabase).
 * This prevents the same message appearing from both sources.
 */
function mergeSupabaseAndLocalHistory(supabaseMessages, localHistory, supabaseRows) {
    const minSupabaseTs = supabaseRows?.length
        ? Math.min(...supabaseRows.map(r => (new Date(r.timestamp || 0)).getTime()))
        : Infinity;

    const localOlder = localHistory.filter(m => (new Date(m.timestamp || 0)).getTime() < minSupabaseTs);
    const merged = [...localOlder.map(m => ({
        sender: m.sender,
        message: m.message,
        timestamp: m.timestamp,
        skipMessageActions: null,
        files: m.files,
        products: m.products
    })), ...supabaseMessages.map(m => ({
        sender: m.sender,
        message: m.message,
        timestamp: m.timestamp,
        skipMessageActions: m.skipMessageActions,
        files: null,
        products: null
    }))];

    merged.sort((a, b) => (new Date(a.timestamp)).getTime() - (new Date(b.timestamp)).getTime());
    return merged;
}

/**
 * Load chat history from Supabase (when enabled) or localStorage and render it
 * Returns a Promise so the caller can await it.
 * @param {Chatnest} chatnest - Chatnest instance
 */
export async function loadChatHistory(chatnest) {
    if (!chatnest.widget) return;

    const chatMessages = chatnest.widget.querySelector('.chat-messages');
    if (!chatMessages) return;

    // Clear non-greeting messages before loading
    const existingRows = chatMessages.querySelectorAll('.message-row');
    const greetingRow  = chatMessages.querySelector('#greeting-row');
    existingRows.forEach(row => { if (row !== greetingRow) row.remove(); });

    if (!chatnest.config.enableHistory) return;

    // ── Supabase + localStorage merge path ───────────────────────────────────────
    if (chatnest.supabaseManager?.isReady) {
        const refreshIntervalMs = chatnest.supabaseManager.pollIntervalMs || 5000;

        function addRowToUI(row) {
            if (!chatnest.widget) return;
            // Skip if a response is currently in progress — the message is already live in the UI
            if (chatnest.isWaitingForResponse || chatnest.isTypewriterActive) return;
            chatnest.addMessage(row.query, 'user', false, { timestamp: row.timestamp });
            chatnest.storageManager.saveMessage(row.query, 'user');
            const parts = chatnest.supabaseManager._splitParts(row.response);
            parts.forEach((part, i) => {
                const isLast = i === parts.length - 1;
                chatnest.addMessage(part, 'bot', false, {
                    timestamp: row.timestamp,
                    skipMessageActions: !isLast
                });
            });
            if (row.response && String(row.response).trim()) {
                chatnest.storageManager.saveMessage(row.response, 'bot');
            }
            chatnest.scrollChatToBottom();
        }

        async function fetchAndRenderSupabaseHistory() {
            if (!chatnest.widget) return;
            // Never wipe and re-render while a live response/typewriter is active
            if (chatnest.isWaitingForResponse || chatnest.isTypewriterActive) return;
            const chatMessages = chatnest.widget.querySelector('.chat-messages');
            if (!chatMessages) return;
            const userId = chatnest.userManager.currentUser;
            const domain = chatnest.userManager.domain;

            const [rows, localHistory] = await Promise.all([
                chatnest.supabaseManager.getChatHistory(userId, domain),
                Promise.resolve(chatnest.storageManager.getChatHistory())
            ]);

            // Re-check after async fetch — a new response may have started while we awaited
            if (chatnest.isWaitingForResponse || chatnest.isTypewriterActive) return;

            chatnest.supabaseManager.setLastSeenFromRows(rows);
            const supabaseMessages = chatnest.supabaseManager.rowsToMessages(rows);
            const merged = mergeSupabaseAndLocalHistory(supabaseMessages, localHistory, rows);
            const maxShow = chatnest.config.maxHistoryLength || 100;

            const greetingRow = chatMessages.querySelector('#greeting-row');
            const existingRows = chatMessages.querySelectorAll('.message-row');
            existingRows.forEach(row => { if (row !== greetingRow) row.remove(); });

            merged.slice(-maxShow).forEach(item => {
                const meta = {
                    timestamp: item.timestamp,
                    files: item.files,
                    products: item.products
                };
                if (item.sender === 'bot') {
                    const parts = splitByTripleComma(item.message);
                    parts.forEach((part, i) => {
                        const isLast = i === parts.length - 1;
                        chatnest.addMessage(part, 'bot', false, {
                            ...meta,
                            skipMessageActions: item.skipMessageActions ?? !isLast,
                            products: i === 0 ? meta.products : []
                        });
                    });
                } else {
                    chatnest.addMessage(item.message, item.sender, false, meta);
                }
            });

            chatnest.scrollChatToBottom();
        }

        await fetchAndRenderSupabaseHistory();

        const userId = chatnest.userManager.currentUser;
        const domain = chatnest.userManager.domain;
        chatnest.supabaseManager.startRealtimeSubscription(userId, domain, addRowToUI);
        chatnest.supabaseManager.startBackgroundRefresh(refreshIntervalMs, fetchAndRenderSupabaseHistory);
        return;
    }

    // ── localStorage fallback ──────────────────────────────────────────────────
    const chatHistory = chatnest.storageManager.getChatHistory();

    const filteredHistory = chatHistory.reduce((acc, item) => {
        if (item.sender === 'user') {
            acc.push(item);
        } else if (item.sender === 'bot') {
            const lastUserIndex = acc.findLastIndex(msg => msg.sender === 'user');
            if (lastUserIndex !== -1) {
                acc = acc.filter((msg, index) =>
                    index <= lastUserIndex || msg.sender === 'user'
                );
            }
            acc.push(item);
        }
        return acc;
    }, []);

    filteredHistory.forEach(item => {
        const meta = { timestamp: item.timestamp };
        if (item.files    && item.files.length > 0)    meta.files    = item.files;
        if (item.products && item.products.length > 0) meta.products = item.products;

        if (item.sender === 'bot') {
            const parts = splitByTripleComma(item.message);
            parts.forEach((part, i) => {
                const isLast = i === parts.length - 1;
                const partMeta = {
                    ...meta,
                    products: i === 0 ? meta.products : [],
                    skipMessageActions: !isLast
                };
                chatnest.addMessage(part, item.sender, false, partMeta);
            });
        } else {
            chatnest.addMessage(item.message, item.sender, false, meta);
        }
    });
}
