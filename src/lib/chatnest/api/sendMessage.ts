import { extractResponseText, splitResponseByTripleComma, isEmptyResponse } from '../../utils/response.js';

/**
 * Send a text message (regular API or Parlant)
 * @param {Chatnest} chatnest - Chatnest instance
 * @param {string} message - User message
 * @param {boolean} isRegeneration - Whether this is a regeneration
 */
export async function sendMessage(chatnest: any, message: any, isRegeneration = false) {
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
            chatnest._userHasScrolledUp = false;
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

            const parts = splitResponseByTripleComma(responseText);
            parts.forEach((part, i) => {
                const isLast = i === parts.length - 1;
                chatnest.addMessage(part, 'bot', true, {
                    products: i === 0 ? products : [],
                    skipMessageActions: !isLast
                });
            });
            if (!isEmptyResponse(responseText)) {
                chatnest.storageManager.saveMessage(responseText, 'bot', isRegeneration, { products });
            }

            // Save to Supabase before releasing the response-in-flight guard.
            // This prevents backgroundRefresh from wiping the live messages before
            // the pair is persisted — if the guard is cleared while the save is
            // still pending the next refresh will omit the new messages.
            if (chatnest.supabaseManager?.isReady && !isRegeneration && !isEmptyResponse(responseText)) {
                const userId = chatnest.userManager.currentUser;
                const domain = chatnest.userManager.domain;
                const userQuery = chatnest._lastSupabaseUserMessage || message;
                chatnest._lastSupabaseUserMessage = null;
                try {
                    await chatnest.supabaseManager.saveChatPair(userId, domain, userQuery, responseText);
                } catch (err) {
                    console.error('[Supabase] background save failed:', err);
                }
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
