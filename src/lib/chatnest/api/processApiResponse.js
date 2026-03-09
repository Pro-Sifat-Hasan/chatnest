import { extractResponseText } from '../../utils/response.js';

/**
 * Process an API response and add the bot message to the chat.
 * Can be called externally for custom integrations.
 * @param {Chatnest} chatnest        - Chatnest instance
 * @param {*}        data            - Raw API response
 * @param {Element}  typingIndicator - Typing indicator element
 */
export function processApiResponse(chatnest, data, typingIndicator) {
    if (typingIndicator) {
        typingIndicator.classList.remove('active');
    }
    chatnest.stopJavaScriptTypingAnimation();

    const { text: responseText, products } = extractResponseText(data, chatnest.config);

    chatnest.widget?.querySelector('.chat-window')?.classList.add('active');
    chatnest.addMessage(responseText, 'bot', true, { products });
    chatnest.storageManager.saveMessage(responseText, 'bot');
}
