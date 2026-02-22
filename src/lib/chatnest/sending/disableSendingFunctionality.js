/**
 * Disable sending functionality (visual feedback, chips)
 * @param {Chatnest} chatnest - Chatnest instance
 */
export function disableSendingFunctionality(chatnest) {
    const chatInput = chatnest.widget.querySelector('.chat-input .chat-textarea');
    const sendButton = chatnest.widget.querySelector('.send-button');

    chatInput.readOnly = false;
    sendButton.style.opacity = chatnest.isMobileBrowser() ? '1' : '0.6';
    sendButton.style.pointerEvents = 'auto';
    chatnest.disableChips();
    chatInput.classList.add('waiting');
}
