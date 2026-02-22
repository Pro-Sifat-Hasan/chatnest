/**
 * Setup message action buttons (like, dislike, regenerate)
 * @param {Chatnest} chatnest - Chatnest instance
 * @param {Element} container - Message container element
 * @param {string} originalText - Original message text
 */
export function setupMessageActions(chatnest, container, originalText) {
    if (!chatnest.config.showMessageActions) {
        const actionsDiv = container.querySelector('.message-actions');
        if (actionsDiv) {
            actionsDiv.style.display = 'none';
        }
        return;
    }

    const likeBtn = container.querySelector('.like-btn');
    const dislikeBtn = container.querySelector('.dislike-btn');
    const regenerateBtn = container.querySelector('.regenerate-btn');

    if (!likeBtn || !dislikeBtn || !regenerateBtn) return;

    likeBtn.addEventListener('click', () => {
        const isCurrentlyLiked = likeBtn.classList.contains('active');

        likeBtn.classList.remove('active');
        dislikeBtn.classList.remove('active');

        if (!isCurrentlyLiked) {
            likeBtn.classList.add('active');
            chatnest.sendFeedback('like', originalText);
        } else {
            chatnest.sendFeedback('remove', originalText);
        }
    });

    dislikeBtn.addEventListener('click', () => {
        const isCurrentlyDisliked = dislikeBtn.classList.contains('active');

        likeBtn.classList.remove('active');
        dislikeBtn.classList.remove('active');

        if (!isCurrentlyDisliked) {
            dislikeBtn.classList.add('active');
            chatnest.sendFeedback('dislike', originalText);
        } else {
            chatnest.sendFeedback('remove', originalText);
        }
    });

    regenerateBtn.addEventListener('click', async () => {
        if (!chatnest.isWaitingForResponse) {
            const messageRows = Array.from(chatnest.widget.querySelectorAll('.message-row'));
            const currentMessageIndex = messageRows.findIndex(row => row.contains(container));
            let userMessage = '';
            let lastUserMessageIndex = -1;

            for (let i = currentMessageIndex - 1; i >= 0; i--) {
                const userMessageElement = messageRows[i].querySelector('.user-message');
                if (userMessageElement) {
                    userMessage = userMessageElement.textContent;
                    lastUserMessageIndex = i;
                    break;
                }
            }

            if (userMessage && lastUserMessageIndex !== -1) {
                for (let i = messageRows.length - 1; i > lastUserMessageIndex; i--) {
                    messageRows[i].remove();
                }

                await chatnest.updateStorageAfterRegeneration(lastUserMessageIndex, userMessage);
                await chatnest.sendMessage(userMessage, true);
            }
        }
    });
}
