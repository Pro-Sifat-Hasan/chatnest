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

    // ── Supabase path ──────────────────────────────────────────────────────────
    if (chatnest.supabaseManager?.isReady) {
        const userId = chatnest.userManager.currentUser;
        const domain = chatnest.userManager.domain;

        const rows = await chatnest.supabaseManager.getChatHistory(userId, domain);
        const messages = chatnest.supabaseManager.rowsToMessages(rows);

        for (const item of messages) {
            chatnest.addMessage(item.message, item.sender, false, { timestamp: item.timestamp });
        }

        chatnest.scrollChatToBottom();
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
        chatnest.addMessage(item.message, item.sender, false, meta);
    });
}
