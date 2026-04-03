/**
 * Restore like/dislike button state from localStorage
 * @param {Chatnest} chatnest - Chatnest instance
 * @param {Element} container - Message container with like/dislike buttons
 * @param {string} response - The bot response text
 */
export function restoreFeedbackState(chatnest: any, container: any, response: any) {
    try {
        const feedbackKey = `feedback_${chatnest.userManager.currentUser}`;
        const raw = localStorage.getItem(feedbackKey);
        const feedbackState = raw ? JSON.parse(raw) : {};
        const state = feedbackState[response];
        if (!state) return;

        const likeBtn = container?.querySelector('.like-btn');
        const dislikeBtn = container?.querySelector('.dislike-btn');
        if (!likeBtn || !dislikeBtn) return;

        if (state === 'like') {
            likeBtn.classList.add('active');
            dislikeBtn.classList.remove('active');
        } else if (state === 'dislike') {
            dislikeBtn.classList.add('active');
            likeBtn.classList.remove('active');
        }
    } catch {
        // Storage may be unavailable or contain corrupted data
    }
}
