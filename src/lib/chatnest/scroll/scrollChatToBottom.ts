/**
 * Scroll chat to bottom if user is near bottom. Respects user scroll intent: when user has scrolled up,
 * auto-scroll is disabled so they can read older messages without being pulled back to bottom.
 */
export function scrollChatToBottom(chatnest: any) {
    const chatMessages = chatnest.widget.querySelector('.chat-messages');
    if (!chatMessages) return;
    if (chatnest._userHasScrolledUp) return;

    const currentScroll = chatMessages.scrollTop;
    const maxScroll = Math.max(0, chatMessages.scrollHeight - chatMessages.clientHeight);
    const isNearBottom = maxScroll - currentScroll < 100;

    if (isNearBottom) {
        const scrollToEnd = () => {
            chatMessages.scrollTop = chatMessages.scrollHeight - chatMessages.clientHeight;
        };
        requestAnimationFrame(() => {
            scrollToEnd();
            requestAnimationFrame(scrollToEnd);
        });
    }
}
