/**
 * Submit form data to HubSpot API
 * @param {Chatnest} chatnest - Chatnest instance
 * @param {Object} data - Form data { firstName, lastName, email, phone }
 * @returns {Promise<Response>}
 */
export async function submitToHubSpot(chatnest: any, data: any) {
    const { portalId, formGuid } = chatnest.config.hubspot;
    const url = `https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${formGuid}`;

    const formData = {
        submittedAt: Date.now(),
        fields: [
            { name: 'firstname', value: data.firstName },
            { name: 'lastname', value: data.lastName },
            { name: 'email', value: data.email },
            { name: 'phone', value: data.phone }
        ],
        context: {
            pageUri: window.location.href,
            pageName: document.title
        }
    };

    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    });
}
