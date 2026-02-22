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
}
