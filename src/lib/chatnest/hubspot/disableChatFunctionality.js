/**
 * Disable chat input and chips while a form is shown
 * @param {Chatnest} chatnest - Chatnest instance
 */
export function disableChatFunctionality(chatnest) {
    if (!chatnest.widget) return;
    const chatInput = chatnest.widget.querySelector('.chat-input .chat-textarea');
    const sendButton = chatnest.widget.querySelector('.send-button');
    const chips = chatnest.widget.querySelectorAll('.chip');

    if (chatInput) {
        chatInput.disabled = true;
        chatInput.closest('.chat-input-container')?.classList.add('disabled');
    }
    if (sendButton) {
        sendButton.style.opacity = chatnest.isMobileBrowser() ? '1' : '0.6';
        sendButton.style.pointerEvents = 'auto';
    }
    chips.forEach(chip => {
        chip.style.opacity = '0.5';
        chip.style.pointerEvents = 'none';
    });
}
