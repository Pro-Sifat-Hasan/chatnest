/**
 * Load chat history from storage and display in UI
 * @param {Chatnest} chatnest - Chatnest instance
 */
export function loadChatHistory(chatnest) {
    if (!chatnest.widget) return;

    const chatMessages = chatnest.widget.querySelector('.chat-messages');
    if (!chatMessages) return;

    const messages = chatMessages.querySelectorAll('.message-row');
    const greetingRow = chatMessages.querySelector('#greeting-row');

    messages.forEach(message => {
        if (message !== greetingRow) {
            message.remove();
        }
    });

    if (!chatnest.config.enableHistory) {
        return;
    }

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
        if (item.files && item.files.length > 0) meta.files = item.files;
        if (item.products && item.products.length > 0) meta.products = item.products;
        chatnest.addMessage(item.message, item.sender, false, meta);
    });
}
