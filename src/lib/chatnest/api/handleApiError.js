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

    chatnest.addMessage(message, 'bot', false, { isError: true });
    chatnest.storageManager.saveMessage(message, 'bot');

    chatnest.isWaitingForResponse = false;
    chatnest.enableSendingFunctionality();
    chatnest.forceEnableInput();

    chatnest.config.onError?.(error);
}
