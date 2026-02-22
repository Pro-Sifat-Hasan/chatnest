/**
 * Re-enable chat input and chips after form is closed
 * @param {Chatnest} chatnest - Chatnest instance
 */
export function enableChatFunctionality(chatnest) {
    const chatInput = chatnest.widget.querySelector('.chat-input .chat-textarea');
    const sendButton = chatnest.widget.querySelector('.send-button');
    const chips = chatnest.widget.querySelectorAll('.chip');

    setTimeout(() => {
        chatInput.disabled = false;
        chatInput.style.opacity = '1';
        chatInput.style.pointerEvents = 'auto';
    }, 0);

    setTimeout(() => {
        sendButton.style.opacity = '1';
        sendButton.style.pointerEvents = 'auto';
    }, 100);

    chips.forEach((chip, index) => {
        setTimeout(() => {
            chip.style.opacity = '1';
            chip.style.pointerEvents = 'auto';
        }, 200 + (index * 100));
    });

    const inputContainer = chatInput.closest('.chat-input-container');
    inputContainer.classList.remove('disabled');
}
