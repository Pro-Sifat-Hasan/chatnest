/**
 * Enable sending functionality
 * @param {Chatnest} chatnest - Chatnest instance
 */
export function enableSendingFunctionality(chatnest) {
    if (chatnest.isWaitingForResponse || chatnest.isTypewriterActive) {
        return;
    }

    const chatInput = chatnest.widget.querySelector('.chat-input .chat-textarea');
    const sendButton = chatnest.widget.querySelector('.send-button');

    chatInput.readOnly = false;
    sendButton.style.opacity = '1';
    sendButton.style.pointerEvents = 'auto';
    chatnest.enableChips();
    chatInput.classList.remove('waiting');
}
