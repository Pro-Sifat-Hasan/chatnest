/**
 * Update UI when sending message
 * @param {Chatnest} chatnest - Chatnest instance
 * @param {Element} typingIndicator - Typing indicator element
 * @param {Element} chatInput - Chat input element
 */
export function updateUIForSending(chatnest: any, typingIndicator: any, chatInput: any) {
    chatnest._userHasScrolledUp = false;
    chatnest.addMessage(chatInput.value.trim(), 'user');
    chatnest.storageManager.saveMessage(chatInput.value.trim(), 'user');
    chatInput.value = '';
    typingIndicator.classList.add('active');
    setTimeout(() => chatnest.startJavaScriptTypingAnimation(), 100);
    chatnest.isWaitingForResponse = true;
    chatnest.disableSendingFunctionality();

    // Show "Sending…" status badge on the input container
    const container = chatnest.widget?.querySelector('.chat-input-container');
    if (container) {
        container.classList.add('sending');
        container.classList.remove('send-failed');
        let badge = container.querySelector('.cn-send-status');
        if (!badge) {
            badge = document.createElement('div');
            badge.className = 'cn-send-status';
            container.appendChild(badge);
        }
        badge.textContent = 'Sending…';
        badge.setAttribute('role', 'status');
        badge.setAttribute('aria-live', 'polite');
    }
}
