/**
 * Scroll chat to bottom if user is near bottom
 * @param {Chatnest} chatnest - Chatnest instance
 */
export function scrollChatToBottom(chatnest) {
    const chatMessages = chatnest.widget.querySelector('.chat-messages');
    if (!chatMessages) return;

    const currentScroll = chatMessages.scrollTop;
    const maxScroll = chatMessages.scrollHeight - chatMessages.clientHeight;
    const isNearBottom = maxScroll - currentScroll < 100;

    if (isNearBottom) {
        requestAnimationFrame(() => {
            chatMessages.scrollTo({
                top: chatMessages.scrollHeight,
                behavior: 'smooth'
            });
        });

        if (typeof event !== 'undefined') {
            event?.preventDefault?.();
            event?.stopPropagation?.();
        }
    }
}
