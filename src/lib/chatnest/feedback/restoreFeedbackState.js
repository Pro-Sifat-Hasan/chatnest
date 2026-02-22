/**
 * Restore like/dislike button state from localStorage
 * @param {Chatnest} chatnest - Chatnest instance
 * @param {Element} container - Message container with like/dislike buttons
 * @param {string} response - The bot response text
 */
export function restoreFeedbackState(chatnest, container, response) {
    const feedbackKey = `feedback_${chatnest.userManager.currentUser}`;
    const feedbackState = JSON.parse(localStorage.getItem(feedbackKey) || '{}');
    const state = feedbackState[response];

    if (state) {
        const likeBtn = container.querySelector('.like-btn');
        const dislikeBtn = container.querySelector('.dislike-btn');

        if (state === 'like') {
            likeBtn.classList.add('active');
            dislikeBtn.classList.remove('active');
        } else if (state === 'dislike') {
            dislikeBtn.classList.add('active');
            likeBtn.classList.remove('active');
        }
    }
}
