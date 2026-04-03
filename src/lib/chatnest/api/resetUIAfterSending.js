/**
 * Reset UI after sending
 * @param {Chatnest} chatnest - Chatnest instance
 * @param {Element} typingIndicator - Typing indicator element
 */
export function resetUIAfterSending(chatnest, typingIndicator) {
    chatnest.isWaitingForResponse = false;
    if (!chatnest.isTypewriterActive) {
        chatnest.enableSendingFunctionality();
    }
    typingIndicator.classList.remove('active');
    chatnest.stopJavaScriptTypingAnimation();

    // Clear send status badge
    const container = chatnest.widget?.querySelector('.chat-input-container');
    if (container) {
        container.classList.remove('sending', 'send-failed');
        const badge = container.querySelector('.cn-send-status');
        if (badge) badge.remove();
    }
}
