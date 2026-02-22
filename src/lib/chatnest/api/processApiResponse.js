/**
 * Process API response and add to chat
 * @param {Chatnest} chatnest - Chatnest instance
 * @param {Object} data - API response data
 * @param {Element} typingIndicator - Typing indicator element
 */
export function processApiResponse(chatnest, data, typingIndicator) {
    typingIndicator.classList.remove('active');
    chatnest.stopJavaScriptTypingAnimation();

    let responseText;

    try {
        if (chatnest.config.transformResponse) {
            responseText = chatnest.config.transformResponse(data);
        } else if (typeof data === 'string') {
            responseText = data;
        } else if (data && typeof data === 'object') {
            if (data.response) {
                responseText = data.response;
            } else if (data.message) {
                responseText = data.message;
            } else if (data.text) {
                responseText = data.text;
            } else if (data.content) {
                responseText = data.content;
            } else if (data.answer) {
                responseText = data.answer;
            } else {
                responseText = data[chatnest.config.apiResponseFormat.response] ||
                    JSON.stringify(data, null, 2);
            }
        } else {
            responseText = String(data);
        }

        if (!responseText || responseText.trim() === '') {
            throw new Error('Empty response received from server');
        }

    } catch (error) {
        console.error('Error processing API response:', error);
        responseText = 'Sorry, there was an error processing the response. Please try again.';
    }

    const chatWindow = chatnest.widget.querySelector('.chat-window');
    chatWindow.classList.add('active');

    chatnest.addMessage(responseText, 'bot', true);
    chatnest.storageManager.saveMessage(responseText, 'bot');
}
