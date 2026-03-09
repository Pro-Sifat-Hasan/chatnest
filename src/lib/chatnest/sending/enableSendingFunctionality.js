/**
 * Re-enable sending functionality after a response is received
 * @param {Chatnest} chatnest - Chatnest instance
 */
export function enableSendingFunctionality(chatnest) {
    if (chatnest.isWaitingForResponse || chatnest.isTypewriterActive) return;
    if (!chatnest.widget) return;

    const chatInput = chatnest.widget.querySelector('.chat-input .chat-textarea');
    const sendButton = chatnest.widget.querySelector('.send-button');

    if (chatInput) {
        chatInput.readOnly = false;
        chatInput.classList.remove('waiting');
    }
    if (sendButton) {
        sendButton.style.opacity = '1';
        sendButton.style.pointerEvents = 'auto';
    }
    chatnest.enableChips();
}
