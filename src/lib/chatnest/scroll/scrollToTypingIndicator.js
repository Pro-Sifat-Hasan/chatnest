/**
 * Scroll to typing indicator
 * @param {Chatnest} chatnest - Chatnest instance
 */
export function scrollToTypingIndicator(chatnest) {
    const chatMessages = chatnest.widget.querySelector('.chat-messages');
    const typingIndicator = chatnest.widget.querySelector('.typing-indicator');

    if (chatMessages && typingIndicator) {
        requestAnimationFrame(() => {
            chatMessages.scrollTo({
                top: chatMessages.scrollHeight,
                behavior: 'smooth'
            });

            typingIndicator.scrollIntoView({
                behavior: 'smooth',
                block: 'end'
            });
        });
    }
}
