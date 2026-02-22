/**
 * Force enable input regardless of state - used for error recovery
 * @param {Chatnest} chatnest - Chatnest instance
 */
export function forceEnableInput(chatnest) {
    const chatInput = chatnest.widget.querySelector('.chat-input .chat-textarea');
    const sendButton = chatnest.widget.querySelector('.send-button');

    if (chatInput) {
        chatInput.readOnly = false;
        chatInput.disabled = false;
        chatInput.style.opacity = '1';
        chatInput.style.pointerEvents = 'auto';
        chatInput.classList.remove('waiting');
    }

    if (sendButton) {
        sendButton.style.opacity = '1';
        sendButton.style.pointerEvents = 'auto';
    }

    chatnest.enableChips();
    chatnest.isWaitingForResponse = false;
    chatnest.isTypewriterActive = false;

    const typingIndicator = chatnest.widget.querySelector('.typing-indicator');
    if (typingIndicator) {
        typingIndicator.classList.remove('active');
        chatnest.stopJavaScriptTypingAnimation();
    }
}
