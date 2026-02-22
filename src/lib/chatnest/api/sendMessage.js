/**
 * Send a text message (regular API or Parlant)
 * @param {Chatnest} chatnest - Chatnest instance
 * @param {string} message - User message
 * @param {boolean} isRegeneration - Whether this is a regeneration
 */
export async function sendMessage(chatnest, message, isRegeneration = false) {
    if (chatnest.isWaitingForResponse || chatnest.isTypewriterActive) {
        return;
    }

    if (!chatnest.widget) return;
    const chatInput = chatnest.widget.querySelector('.chat-input .chat-textarea');
    const typingIndicator = chatnest.widget.querySelector('.typing-indicator');
    if (!chatInput || !typingIndicator) return;

    const resetInputState = () => {
        chatInput.value = '';
        if (!(chatnest.isMobileBrowser() && chatnest.config.enableEnhancedMobileInput)) {
            chatInput.setAttribute('readonly', 'true');
        } else {
            chatInput.removeAttribute('readonly');
        }
        chatInput.classList.remove('cursor-active');

        if (chatnest.isMobileBrowser()) {
            setTimeout(() => {
                chatnest.enableMobileInputInteraction(chatInput);
            }, 100);
        } else {
            chatInput.focus();
        }
    };

    const disableSending = () => {
        chatnest.isWaitingForResponse = true;
        chatnest.disableSendingFunctionality();
        typingIndicator.classList.add('active');
        setTimeout(() => chatnest.startJavaScriptTypingAnimation(), 100);
    };

    const enableSending = () => {
        chatnest.isWaitingForResponse = false;
        chatnest.enableSendingFunctionality();
        typingIndicator.classList.remove('active');
        chatnest.stopJavaScriptTypingAnimation();
    };

    try {
        disableSending();

        if (!isRegeneration) {
            chatnest.addMessage(message, 'user');
            chatnest.storageManager.saveMessage(message, 'user');
        }

        if (chatnest.parlant && chatnest.config.parlant.apiBaseUrl) {
            await chatnest.parlant.sendMessage(message, {
                disableSending,
                enableSending,
                resetInputState,
                forceEnableInput: chatnest.forceEnableInput.bind(chatnest)
            });
        } else {
            const requestData = chatnest.formatRequestData(message);
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
            chatnest.storageManager.saveMessage(responseText, 'bot', isRegeneration, { products });

            enableSending();
            resetInputState();
        }

    } catch (error) {
        console.error('API Error:', error);
        chatnest.addMessage('Sorry, there was an error processing your request.', 'bot', false, { isError: true });
        enableSending();
        resetInputState();
        chatnest.forceEnableInput();
    }
}
