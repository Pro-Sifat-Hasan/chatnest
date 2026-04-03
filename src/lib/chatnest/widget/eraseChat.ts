/**
 * Erase chat history (frontend + storage + optional backend)
 * @param {Chatnest} chatnest - Chatnest instance
 */
export function eraseChat(chatnest: any) {
    if (!confirm('Are you sure you want to clear the chat history? This action cannot be undone.')) {
        return;
    }

    const eraseButton = chatnest.widget?.querySelector('.erase-chat');
    if (eraseButton) {
        eraseButton.style.opacity = '0.5';
        eraseButton.disabled = true;
    }

    try {
        const chatMessages = chatnest.widget.querySelector('.chat-messages');
        const messages = chatMessages.querySelectorAll('.message-row');

        messages.forEach((message: any) => {
            if (message.id !== 'greeting-row' && !message.classList.contains('hubspot-form-row')) {
                message.remove();
            }
        });

        chatnest.storageManager.clearHistory();

        if (chatnest.config.enableServerHistoryDelete === true && chatnest.config.deleteEndpoint) {
            chatnest.deleteBackendHistory()
                .then(() => {})
                .catch((error: any) => {
                    console.error('Failed to delete backend history:', error);
                });
        }

        const existingGreeting = chatMessages.querySelector('#greeting-row');
        if (!existingGreeting) {
            chatnest.addGreetingMessage();
        } else {
            const greetingHasAvatar = existingGreeting.querySelector('.ai-avatar');
            if (!greetingHasAvatar) {
                existingGreeting.remove();
                chatnest.addGreetingMessage();
            }
        }

        const chatInput = chatnest.widget.querySelector('.chat-input .chat-textarea');
        if (chatInput) {
            chatInput.value = '';
        }
    } catch (error: any) {
        console.error('Error during chat erasure:', error);
        chatnest.addMessage('Failed to clear chat history. Please try again.', 'bot', false, { isError: true });
    } finally {
        if (eraseButton) {
            eraseButton.style.opacity = '1';
            eraseButton.disabled = false;
        }
    }
}
