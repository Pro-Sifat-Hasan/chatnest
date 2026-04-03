/**
 * Smart scroll to show latest message
 * @param {Chatnest} chatnest - Chatnest instance
 */
export function scrollToLatestMessage(chatnest: any) {
    const chatMessages = chatnest.widget.querySelector('.chat-messages');
    if (!chatMessages) return;

    if (chatnest.isTypewriterActive) return;

    requestAnimationFrame(() => {
        const messageRows = chatMessages.querySelectorAll('.message-row:not(#greeting-row)');
        if (messageRows.length === 0) return;

        const lastMessage = messageRows[messageRows.length - 1];
        if (!lastMessage) return;

        const containerHeight = chatMessages.clientHeight;
        const currentScrollTop = chatMessages.scrollTop;

        const messageTop = lastMessage.offsetTop;
        const messageBottom = lastMessage.offsetTop + lastMessage.offsetHeight;
        const visibleTop = currentScrollTop;
        const visibleBottom = currentScrollTop + containerHeight;

        if (messageTop < visibleTop || messageBottom > visibleBottom) {
            const targetScrollTop = Math.max(0, messageTop - 50);

            chatMessages.scrollTo({
                top: targetScrollTop,
                behavior: 'smooth'
            });
        }
    });
}
