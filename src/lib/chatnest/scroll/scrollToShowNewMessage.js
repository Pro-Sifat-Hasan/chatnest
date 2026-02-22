/**
 * Scroll to show new message at the top of the view
 * @param {Chatnest} chatnest - Chatnest instance
 * @param {Element} messageElement - Message element to show
 */
export function scrollToShowNewMessage(chatnest, messageElement) {
    const chatMessages = chatnest.widget.querySelector('.chat-messages');
    if (!chatMessages || !messageElement) return;

    requestAnimationFrame(() => {
        const messageTop = messageElement.offsetTop;
        const targetScrollTop = Math.max(0, messageTop - 20);

        chatMessages.scrollTo({
            top: targetScrollTop,
            behavior: 'smooth'
        });
    });
}
