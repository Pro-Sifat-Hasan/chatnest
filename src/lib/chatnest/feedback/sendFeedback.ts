/**
 * Send feedback (like/dislike/remove) to backend
 * @param {Chatnest} chatnest - Chatnest instance
 * @param {string} type - 'like', 'dislike', or 'remove'
 * @param {string} response - The bot response text
 */
export async function sendFeedback(chatnest: any, type: any, response: any) {
    if (chatnest.config.parlant.enabled) {
        chatnest.saveFeedbackState(response, type);
        return;
    }

    const endpoint = chatnest.config.feedbackEndpoint;
    if (!endpoint || /your-api|example\.com|localhost:7000/.test(endpoint)) {
        chatnest.saveFeedbackState(response, type);
        return;
    }

    try {
        const feedback = {
            type: type,
            response: response,
            feedback: null,
            timestamp: new Date().toISOString(),
            userId: chatnest.userManager.currentUser,
            domain: chatnest.userManager.domain
        };

        const res = await fetch(chatnest.config.feedbackEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...chatnest.config.apiHeaders
            },
            body: JSON.stringify(feedback)
        });

        if (!res.ok) {
            throw new Error('Failed to send feedback');
        }

        chatnest.saveFeedbackState(response, type);

    } catch {
        chatnest.saveFeedbackState(response, type);
    }
}
