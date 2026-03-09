/**
 * Disable sending functionality while waiting for a response
 * @param {Chatnest} chatnest - Chatnest instance
 */
export function disableSendingFunctionality(chatnest) {
    if (!chatnest.widget) return;
    const chatInput = chatnest.widget.querySelector('.chat-input .chat-textarea');
    const sendButton = chatnest.widget.querySelector('.send-button');

    if (chatInput) {
        chatInput.readOnly = true;
        chatInput.classList.add('waiting');
    }
    if (sendButton) {
        sendButton.style.opacity = chatnest.isMobileBrowser() ? '1' : '0.6';
        sendButton.style.pointerEvents = 'auto';
    }
    chatnest.disableChips();
}
