/**
 * Force greeting message width to match other AI responses
 * @param {Chatnest} chatnest - Chatnest instance
 * @param {Element} greetingRow - Greeting row element
 */
export function synchronizeGreetingWidth(chatnest, greetingRow) {
    requestAnimationFrame(() => {
        const greetingMessage = greetingRow.querySelector('.bot-message');
        const greetingContainer = greetingRow.querySelector('.bot-message-container');

        if (greetingMessage && greetingContainer) {
            greetingMessage.offsetHeight;
            greetingContainer.offsetHeight;

            const chatMessages = chatnest.widget.querySelector('.chat-messages');
            const otherBotMessages = chatMessages.querySelectorAll('.bot-message:not(#greeting-row .bot-message)');

            if (otherBotMessages.length > 0) {
                const referenceMessage = otherBotMessages[0];
                const referenceContainer = referenceMessage.closest('.bot-message-container');
                const computedStyle = window.getComputedStyle(referenceMessage);
                const containerStyle = referenceContainer ? window.getComputedStyle(referenceContainer) : null;

                greetingMessage.style.setProperty('max-width', computedStyle.maxWidth, 'important');
                greetingMessage.style.setProperty('width', computedStyle.width, 'important');
                greetingMessage.style.setProperty('min-width', computedStyle.minWidth, 'important');

                if (containerStyle) {
                    greetingContainer.style.setProperty('max-width', containerStyle.maxWidth, 'important');
                    greetingContainer.style.setProperty('width', containerStyle.width, 'important');
                    greetingContainer.style.setProperty('min-width', containerStyle.minWidth, 'important');
                } else {
                    greetingContainer.style.setProperty('max-width', '80%', 'important');
                    greetingContainer.style.setProperty('width', '80%', 'important');
                }
            } else {
                greetingContainer.style.setProperty('max-width', '80%', 'important');
                greetingContainer.style.setProperty('width', '80%', 'important');
                greetingMessage.style.setProperty('max-width', '100%', 'important');
                greetingMessage.style.setProperty('width', '100%', 'important');
            }

            greetingMessage.offsetHeight;
            greetingContainer.offsetHeight;

            setTimeout(() => {
                greetingMessage.style.setProperty('max-width', '100%', 'important');
                greetingMessage.style.setProperty('width', '100%', 'important');
                greetingContainer.style.setProperty('max-width', '80%', 'important');
                greetingContainer.style.setProperty('width', '80%', 'important');
            }, 50);
        }
    });
}
