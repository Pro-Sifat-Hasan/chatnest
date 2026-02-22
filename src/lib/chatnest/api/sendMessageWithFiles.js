import { fileToBase64 } from '../../utils/fileToBase64.js';

/**
 * Send message with file attachments
 * @param {Chatnest} chatnest - Chatnest instance
 * @param {string} message - User message
 * @param {File[]} files - File attachments
 */
export async function sendMessageWithFiles(chatnest, message, files = []) {
    if (chatnest.isWaitingForResponse || chatnest.isTypewriterActive) {
        return;
    }

    if (!chatnest.widget) return;
    const chatInput = chatnest.widget.querySelector('.chat-input .chat-textarea');
    const typingIndicator = chatnest.widget.querySelector('.typing-indicator');
    if (!chatInput || !typingIndicator) return;

    const originalHeaders = { ...chatnest.config.apiHeaders };

    try {
        chatnest.isWaitingForResponse = true;
        chatnest.disableSendingFunctionality();
        typingIndicator.classList.add('active');
        setTimeout(() => chatnest.startJavaScriptTypingAnimation(), 100);

        chatnest.addMessage(message, 'user', true, { files });
        const imageFiles = files.filter(f => f && f.type && f.type.startsWith('image/'));
        const filesForStorage = imageFiles.length > 0
            ? await Promise.all(imageFiles.map(f => fileToBase64(f)))
            : [];
        chatnest.storageManager.saveMessage(message, 'user', false, { files: filesForStorage });

        const requestData = chatnest.formatRequestData(message, files);
        chatnest.config.apiHeaders['Content-Type'] = 'multipart/form-data';

        const response = await chatnest.makeApiCall(requestData);

        let responseText;
        let products = [];

        try {
            if (chatnest.config.transformResponse) {
                const transformed = chatnest.config.transformResponse(response);
                if (typeof transformed === 'string') {
                    responseText = transformed;
                } else if (transformed && typeof transformed === 'object') {
                    responseText = transformed.response || transformed.message || JSON.stringify(transformed);
                    products = transformed.products || [];
                } else {
                    responseText = String(transformed);
                }
            } else if (typeof response === 'string') {
                responseText = response;
            } else if (response && typeof response === 'object') {
                const fmt = chatnest.config.apiResponseFormat || {};
                responseText = response.response || response.message || response.text || response.content || response.answer ||
                    response[fmt.response] || JSON.stringify(response, null, 2);
                products = response[fmt.products] || response.products || [];
            } else {
                responseText = String(response);
            }

            if (!responseText || responseText.trim() === '') {
                throw new Error('Empty response received from server');
            }

        } catch (error) {
            console.error('Error processing API response:', error);
            responseText = 'Sorry, there was an error processing the response. Please try again.';
        }

        chatnest.addMessage(responseText, 'bot', true, { products });
        chatnest.storageManager.saveMessage(responseText, 'bot', false, { products });

    } catch (error) {
        console.error('API Error:', error);
        chatnest.addMessage('Sorry, there was an error processing your request.', 'bot', false, { isError: true });
    } finally {
        chatnest.config.apiHeaders = originalHeaders;
        chatnest.isWaitingForResponse = false;
        chatnest.enableSendingFunctionality();
        if (typingIndicator) typingIndicator.classList.remove('active');
        chatnest.stopJavaScriptTypingAnimation();
        chatnest.forceEnableInput();

        if (chatInput) {
            chatInput.value = '';
            if (!(chatnest.isMobileBrowser() && chatnest.config.enableEnhancedMobileInput)) {
                chatInput.setAttribute('readonly', 'true');
            } else {
                chatInput.removeAttribute('readonly');
            }
            chatInput.classList.remove('cursor-active');
            if (chatnest.isMobileBrowser()) {
                setTimeout(() => chatnest.enableMobileInputInteraction(chatInput), 100);
            } else {
                chatInput.focus();
            }
        }
    }
}
