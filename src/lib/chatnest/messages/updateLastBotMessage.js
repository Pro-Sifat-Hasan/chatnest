/**
 * Update which bot message shows action buttons (last message per query for Parlant)
 * @param {Chatnest} chatnest - Chatnest instance
 */
export function updateLastBotMessage(chatnest) {
    if (chatnest.config.parlant.enabled) {
        const botMessages = chatnest.widget.querySelectorAll('.bot-message-container');
        const queryGroups = new Map();

        botMessages.forEach((container, index) => {
            container.classList.remove('last');
            const actionsDiv = container.querySelector('.message-actions');
            if (actionsDiv) {
                actionsDiv.style.display = 'none';
            }
            const messageRow = container.closest('.message-row');
            const queryId = messageRow?.getAttribute('data-query-id');

            if (queryId) {
                if (!queryGroups.has(queryId)) {
                    queryGroups.set(queryId, []);
                }
                queryGroups.get(queryId).push({ container, index });
            }
        });

        queryGroups.forEach((messages) => {
            if (messages.length > 0) {
                const lastMessage = messages[messages.length - 1];
                lastMessage.container.classList.add('last');
                const actionsDiv = lastMessage.container.querySelector('.message-actions');
                if (actionsDiv) {
                    actionsDiv.style.display = 'flex';
                }
            }
        });

        if (queryGroups.size === 0 && botMessages.length > 0) {
            const lastContainer = botMessages[botMessages.length - 1];
            lastContainer.classList.add('last');
            const actionsDiv = lastContainer.querySelector('.message-actions');
            if (actionsDiv) {
                actionsDiv.style.display = 'flex';
            }
        }
    } else {
        const botMessages = chatnest.widget.querySelectorAll('.bot-message-container');
        botMessages.forEach((container, index) => {
            container.classList.remove('last');
            if (index === botMessages.length - 1) {
                container.classList.add('last');
            }
        });
    }
}
