/**
 * Handle API error
 * @param {Chatnest} chatnest - Chatnest instance
 * @param {Error} error - Error object
 * @param {Element} typingIndicator - Typing indicator element
 */
export function handleApiError(chatnest, error, typingIndicator) {
    console.error('API Error:', error);
    typingIndicator.classList.remove('active');
    chatnest.stopJavaScriptTypingAnimation();

    let errorMessage = 'Sorry, there was an error processing your request.';

    if (error.name === 'AbortError') {
        errorMessage = 'Request timed out. Please try again.';
    } else if (error.message.includes('SSL_PROTOCOL_ERROR')) {
        errorMessage = 'There was a secure connection error. Please ensure the server supports HTTPS.';
    } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
    }

    chatnest.addMessage(errorMessage, 'bot', true, { isError: true });
    chatnest.storageManager.saveMessage(errorMessage, 'bot');

    chatnest.isWaitingForResponse = false;
    chatnest.enableSendingFunctionality();
    chatnest.forceEnableInput();

    if (chatnest.config.onError) {
        chatnest.config.onError(error);
    }
}
