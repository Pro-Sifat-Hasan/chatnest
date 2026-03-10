/**
 * Scroll to the bottom of chat container. Uses instant scroll to ensure the very bottom is reachable.
 * @param {Chatnest} chatnest - Chatnest instance
 */
export function scrollToBottom(chatnest) {
    const chatMessages = chatnest.widget.querySelector('.chat-messages');
    if (!chatMessages) return;

    const scrollToEnd = () => {
        const maxScroll = chatMessages.scrollHeight - chatMessages.clientHeight;
        chatMessages.scrollTop = maxScroll;
    };

    requestAnimationFrame(() => {
        scrollToEnd();
        requestAnimationFrame(scrollToEnd);
    });
}
