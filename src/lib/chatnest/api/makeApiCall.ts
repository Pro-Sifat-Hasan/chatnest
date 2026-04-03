/**
 * Make API call to backend
 * @param {Chatnest} chatnest - Chatnest instance
 * @param {Object} requestData - Request payload
 * @returns {Promise<Object>}
 */
export async function makeApiCall(chatnest: any, requestData: any) {
    const headers = {
        ...chatnest.config.apiHeaders
    };

    if (chatnest.config.apiKey) {
        headers['Authorization'] = `Bearer ${chatnest.config.apiKey}`;
    }

    const shouldUseMultipart = chatnest.config.useMultipartFormData ||
        chatnest.config.apiHeaders['Content-Type']?.includes('multipart/form-data') ||
        chatnest.config.apiMethod === 'POST' && chatnest.config.apiEndpoint.includes('upload') ||
        chatnest.config.apiDataFormat === 'form-data';

    let requestBody;
    const finalHeaders = { ...headers };

    if (shouldUseMultipart) {
        const formData = new FormData();

        Object.keys(requestData).forEach(key => {
            const value = requestData[key];

            if (value instanceof File) {
                formData.append(key, value);
            } else if (value instanceof Blob) {
                formData.append(key, value);
            } else if (typeof value === 'object' && value !== null) {
                formData.append(key, JSON.stringify(value));
            } else {
                formData.append(key, String(value));
            }
        });

        requestBody = formData;
        delete finalHeaders['Content-Type'];
    } else {
        requestBody = JSON.stringify(requestData);
        finalHeaders['Content-Type'] = 'application/json';
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), chatnest.config.apiTimeout);

    try {
        const response = await fetch(chatnest.config.apiEndpoint, {
            method: chatnest.config.apiMethod,
            headers: finalHeaders,
            body: requestBody,
            signal: controller.signal
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');

        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            return data;
        } else if (contentType && contentType.includes('text/')) {
            const text = await response.text();
            return { response: text };
        } else {
            const blob = await response.blob();
            return { response: URL.createObjectURL(blob) };
        }

    } catch (error) {
        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timed out. Please try again.');
            } else if (error.message.includes('Failed to fetch')) {
                throw new Error('Network error. Please check your internet connection.');
            } else if (error.message.includes('SSL_PROTOCOL_ERROR')) {
                throw new Error('Secure connection error. Please ensure the server supports HTTPS.');
            }
        }
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}
