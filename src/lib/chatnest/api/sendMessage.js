import { extractResponseText } from '../../utils/response.js';

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
            // Track user message so we can pair it with bot response for Supabase
            if (chatnest.supabaseManager?.isReady) {
                chatnest._lastSupabaseUserMessage = message;
            }
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

            const { text: responseText, products } = extractResponseText(response, chatnest.config);

            chatnest.addMessage(responseText, 'bot', true, { products });
            chatnest.storageManager.saveMessage(responseText, 'bot', isRegeneration, { products });

            // Persist the Q&A pair to Supabase when enabled
            if (chatnest.supabaseManager?.isReady && !isRegeneration) {
                const userId = chatnest.userManager.currentUser;
                const domain = chatnest.userManager.domain;
                const userQuery = chatnest._lastSupabaseUserMessage || message;
                chatnest.supabaseManager.saveChatPair(userId, domain, userQuery, responseText)
                    .catch(err => console.error('[Supabase] background save failed:', err));
                chatnest._lastSupabaseUserMessage = null;
            }

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
