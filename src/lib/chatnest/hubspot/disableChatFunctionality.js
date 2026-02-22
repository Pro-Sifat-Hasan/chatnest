/**
 * Disable chat input and chips when form is shown
 * @param {Chatnest} chatnest - Chatnest instance
 */
export function disableChatFunctionality(chatnest) {
    const chatInput = chatnest.widget.querySelector('.chat-input .chat-textarea');
    const sendButton = chatnest.widget.querySelector('.send-button');
    const chips = chatnest.widget.querySelectorAll('.chip');

    chatInput.disabled = true;
    sendButton.style.opacity = chatnest.isMobileBrowser() ? '1' : '0.6';
    sendButton.style.pointerEvents = 'auto';
    chips.forEach(chip => {
        chip.style.opacity = '0.5';
        chip.style.pointerEvents = 'none';
    });

    const inputContainer = chatInput.closest('.chat-input-container');
    inputContainer.classList.add('disabled');
}
