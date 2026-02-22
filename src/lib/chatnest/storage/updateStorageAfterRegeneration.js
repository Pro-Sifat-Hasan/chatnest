/**
 * Update storage after regeneration - remove deleted messages and mark as regenerated
 * @param {Chatnest} chatnest - Chatnest instance
 * @param {number} lastUserMessageIndex - Index of last user message in DOM
 * @param {string} userMessage - The user message text
 */
export async function updateStorageAfterRegeneration(chatnest, lastUserMessageIndex, userMessage) {
    const historyKey = chatnest.userManager.getHistoryKey();
    let chatHistory = chatnest.storageManager.getChatHistory();

    let storageIndex = -1;
    let userMessageCount = -1;

    for (let i = 0; i < chatHistory.length; i++) {
        if (chatHistory[i].sender === 'user') {
            userMessageCount++;
            if (userMessageCount === lastUserMessageIndex) {
                storageIndex = i;
                break;
            }
        }
    }

    if (storageIndex !== -1) {
        chatHistory = chatHistory.slice(0, storageIndex + 1);
        chatHistory[storageIndex].regenerated = true;
        localStorage.setItem(historyKey, JSON.stringify(chatHistory));
    }
}
