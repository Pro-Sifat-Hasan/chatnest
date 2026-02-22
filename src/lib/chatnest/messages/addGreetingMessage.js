/**
 * Add greeting message to chat
 * @param {Chatnest} chatnest - Chatnest instance
 */
import { synchronizeGreetingWidth } from './synchronizeGreetingWidth.js';

export function addGreetingMessage(chatnest) {
    const chatMessages = chatnest.widget.querySelector('.chat-messages');
    const existingGreeting = chatMessages.querySelector('#greeting-row');

    if (!existingGreeting) {
        const messageRow = document.createElement('div');
        messageRow.className = 'message-row';
        messageRow.id = 'greeting-row';

        const botMessageContainer = document.createElement('div');
        botMessageContainer.className = 'bot-message-container';

        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';

        const avatarHtml = chatnest.generateGreetingAvatar();
        messageDiv.innerHTML = avatarHtml;

        const contentContainer = document.createElement('div');
        contentContainer.className = 'message-content';
        contentContainer.textContent = chatnest.config.greeting;
        messageDiv.appendChild(contentContainer);

        botMessageContainer.appendChild(messageDiv);
        messageRow.appendChild(botMessageContainer);

        chatMessages.insertBefore(messageRow, chatMessages.firstChild);

        synchronizeGreetingWidth(chatnest, messageRow);

        setTimeout(() => {
            synchronizeGreetingWidth(chatnest, messageRow);
        }, 100);

        setTimeout(() => {
            synchronizeGreetingWidth(chatnest, messageRow);
        }, 300);
    }
}
