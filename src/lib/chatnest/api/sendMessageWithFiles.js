import { fileToBase64 } from '../../utils/fileToBase64.js';
import { extractResponseText, splitResponseByTripleComma, isEmptyResponse } from '../../utils/response.js';

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

        chatnest._userHasScrolledUp = false;
        chatnest.addMessage(message, 'user', true, { files });
        const imageFiles = files.filter(f => f && f.type && f.type.startsWith('image/'));
        const filesForStorage = imageFiles.length > 0
            ? await Promise.all(imageFiles.map(f => fileToBase64(f)))
            : [];
        chatnest.storageManager.saveMessage(message, 'user', false, { files: filesForStorage });

        const requestData = chatnest.formatRequestData(message, files);
        chatnest.config.apiHeaders['Content-Type'] = 'multipart/form-data';

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
            chatnest.storageManager.saveMessage(responseText, 'bot', false, { products });
        }
        if (chatnest.supabaseManager?.isReady && !isEmptyResponse(responseText)) {
            chatnest.supabaseManager.saveChatPair(
                chatnest.userManager.currentUser,
                chatnest.userManager.domain,
                message,
                responseText
            ).catch(err => console.error('[Supabase] save failed:', err));
        }

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
