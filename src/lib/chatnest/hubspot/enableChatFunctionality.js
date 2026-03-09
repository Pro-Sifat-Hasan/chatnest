/**
 * Re-enable chat input and chips after a form is closed
 * @param {Chatnest} chatnest - Chatnest instance
 */
export function enableChatFunctionality(chatnest) {
    if (!chatnest.widget) return;
    const chatInput = chatnest.widget.querySelector('.chat-input .chat-textarea');
    const sendButton = chatnest.widget.querySelector('.send-button');
    const chips = chatnest.widget.querySelectorAll('.chip');

    if (chatInput) {
        setTimeout(() => {
            chatInput.disabled = false;
            chatInput.style.opacity = '1';
            chatInput.style.pointerEvents = 'auto';
            chatInput.closest('.chat-input-container')?.classList.remove('disabled');
        }, 0);
    }

    if (sendButton) {
        setTimeout(() => {
            sendButton.style.opacity = '1';
            sendButton.style.pointerEvents = 'auto';
        }, 100);
    }

    chips.forEach((chip, index) => {
        setTimeout(() => {
            chip.style.opacity = '1';
            chip.style.pointerEvents = 'auto';
        }, 200 + index * 100);
    });
}
