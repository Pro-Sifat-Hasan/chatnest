/**
 * Handle an API error and show a user-friendly message.
 * Can be called externally for custom integrations.
 * @param {Chatnest} chatnest        - Chatnest instance
 * @param {Error}    error           - Error object
 * @param {Element}  typingIndicator - Typing indicator element
 */
export function handleApiError(chatnest, error, typingIndicator) {
    console.error('[Chatnest] API Error:', error);

    if (typingIndicator) {
        typingIndicator.classList.remove('active');
    }
    chatnest.stopJavaScriptTypingAnimation();

    let message = 'Sorry, there was an error processing your request.';
    if (error?.name === 'AbortError') {
        message = 'Request timed out. Please try again.';
    } else if (error?.message?.includes('SSL_PROTOCOL_ERROR')) {
        message = 'A secure connection error occurred. Please ensure the server supports HTTPS.';
    } else if (error?.message?.includes('Failed to fetch')) {
        message = 'Unable to connect to the server. Please check your internet connection and try again.';
    }

    chatnest.addMessage(message, 'bot', false, { isError: true, skipMessageActions: true });
    chatnest.storageManager.saveMessage(message, 'bot');

    chatnest.isWaitingForResponse = false;
    chatnest.enableSendingFunctionality();
    chatnest.forceEnableInput();

    // Show "Failed · Retry" badge on the input container
    const container = chatnest.widget?.querySelector('.chat-input-container');
    if (container) {
        container.classList.remove('sending');
        container.classList.add('send-failed');
        let badge = container.querySelector('.cn-send-status');
        if (!badge) {
            badge = document.createElement('div');
            badge.className = 'cn-send-status';
            container.appendChild(badge);
        }
        badge.innerHTML = '';
        badge.setAttribute('role', 'alert');
        badge.setAttribute('aria-live', 'assertive');
        const failSpan = document.createElement('span');
        failSpan.className = 'cn-send-status-text';
        failSpan.textContent = 'Failed to send';
        const retryBtn = document.createElement('button');
        retryBtn.type = 'button';
        retryBtn.className = 'cn-retry-btn';
        retryBtn.textContent = 'Retry';
        retryBtn.setAttribute('aria-label', 'Retry sending the message');
        retryBtn.addEventListener('click', () => {
            container.classList.remove('send-failed');
            badge.remove();
            // Re-focus the input so user can re-send
            const chatInput = chatnest.widget?.querySelector('.chat-input .chat-textarea');
            if (chatInput) chatInput.focus();
        });
        badge.appendChild(failSpan);
        badge.appendChild(retryBtn);
    }

    chatnest.config.onError?.(error);
}
