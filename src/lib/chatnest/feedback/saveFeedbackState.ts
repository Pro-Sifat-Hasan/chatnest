/**
 * Save feedback state (like/dislike) to localStorage
 * @param {Chatnest} chatnest - Chatnest instance
 * @param {string} response - The bot response text
 * @param {string} type - 'like', 'dislike', or 'remove'
 */
export function saveFeedbackState(chatnest: any, response: any, type: any) {
    const feedbackKey = `feedback_${chatnest.userManager.currentUser}`;
    const feedbackState = JSON.parse(localStorage.getItem(feedbackKey) || '{}');

    if (type === 'remove') {
        delete feedbackState[response];
    } else {
        feedbackState[response] = type;
    }

    localStorage.setItem(feedbackKey, JSON.stringify(feedbackState));
}
