/**
 * Delete chat history from backend
 * @param {Chatnest} chatnest - Chatnest instance
 * @returns {Promise}
 */
export function deleteBackendHistory(chatnest) {
    if (chatnest.config.parlant.enabled) {
        return Promise.resolve({ message: 'Parlant mode: backend history deletion skipped' });
    }

    const userId = chatnest.userManager.currentUser;
    const domain = chatnest.userManager.domain;

    return fetch(chatnest.config.deleteEndpoint, {
        method: 'DELETE',
        headers: {
            ...chatnest.config.apiHeaders,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            userId: userId,
            domain: domain
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    });
}
