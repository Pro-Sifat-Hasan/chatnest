/**
 * Update UI when sending message
 * @param {Chatnest} chatnest - Chatnest instance
 * @param {Element} typingIndicator - Typing indicator element
 * @param {Element} chatInput - Chat input element
 */
export function updateUIForSending(chatnest, typingIndicator, chatInput) {
    chatnest.addMessage(chatInput.value.trim(), 'user');
    chatnest.storageManager.saveMessage(chatInput.value.trim(), 'user');
    chatInput.value = '';
    typingIndicator.classList.add('active');
    setTimeout(() => chatnest.startJavaScriptTypingAnimation(), 100);
    chatnest.isWaitingForResponse = true;
    chatnest.disableSendingFunctionality();
}
