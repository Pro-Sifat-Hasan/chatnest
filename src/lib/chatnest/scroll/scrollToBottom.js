/**
 * Scroll to the bottom of chat container
 * @param {Chatnest} chatnest - Chatnest instance
 */
export function scrollToBottom(chatnest) {
    const chatMessages = chatnest.widget.querySelector('.chat-messages');
    if (!chatMessages) return;

    requestAnimationFrame(() => {
        chatMessages.scrollTo({
            top: chatMessages.scrollHeight,
            behavior: 'smooth'
        });
    });
}
