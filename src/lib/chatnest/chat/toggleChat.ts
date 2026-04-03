/**
 * Toggle chat open/closed state
 * @param {Chatnest} chatnest - Chatnest instance
 */
export function toggleChat(chatnest: any) {
    const chatWindow = chatnest.widget?.querySelector('.chat-window');
    if (!chatWindow) return;
    if (chatWindow.classList.contains('active')) {
        chatnest.closeChat();
    } else {
        chatnest.openChat();
    }
}
