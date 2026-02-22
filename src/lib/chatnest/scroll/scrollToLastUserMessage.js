/**
 * Scroll to show the last user message when opening chat
 * @param {Chatnest} chatnest - Chatnest instance
 */
export function scrollToLastUserMessage(chatnest) {
    const chatMessages = chatnest.widget.querySelector('.chat-messages');
    if (!chatMessages) return;

    const allMessageRows = chatMessages.querySelectorAll('.message-row');
    const userMessageRows = Array.from(allMessageRows).filter(row =>
        row.querySelector('.user-message')
    );

    if (userMessageRows.length === 0) return;

    const lastUserMessage = userMessageRows[userMessageRows.length - 1];

    requestAnimationFrame(() => {
        const messageTop = lastUserMessage.offsetTop;
        const targetScrollTop = Math.max(0, messageTop - 20);

        chatMessages.scrollTo({
            top: targetScrollTop,
            behavior: 'smooth'
        });
    });
}
