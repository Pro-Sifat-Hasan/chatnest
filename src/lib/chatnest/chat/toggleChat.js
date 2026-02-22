/**
 * Toggle chat open/closed state
 * @param {Chatnest} chatnest - Chatnest instance
 */
export function toggleChat(chatnest) {
    const chatWindow = chatnest.widget.querySelector('.chat-window');
    const chatToggle = chatnest.widget.querySelector('.chat-toggle');
    const chatInput = chatnest.widget.querySelector('.chat-input .chat-textarea');
    const isActive = chatWindow.classList.contains('active');

    if (isActive) {
        chatnest.closeChat();
    } else {
        chatnest.openChat();
    }
}
