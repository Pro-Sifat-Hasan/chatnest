/**
 * Tests for:
 *   src/lib/api.js           — formatRequestData
 *   src/lib/chatnest/api/makeApiCall.js   — fetch mocking
 *   src/lib/chatnest/api/handleApiError.js
 *   src/lib/chatnest/api/processApiResponse.js
 */

// ─────────────────────────────────────────────────────────────────────────────
// formatRequestData
// ─────────────────────────────────────────────────────────────────────────────

function formatRequestData(config, userManager, message, files = []) {
    const baseRequest = {
        [config.apiRequestFormat.query]: message,
        [config.apiRequestFormat.userId]: userManager.currentUser,
        [config.apiRequestFormat.domain]: userManager.domain
    };
    if (files && files.length > 0) {
        if (config.apiDataFormat === 'form-data' && files.length === 1) {
            baseRequest['image'] = files[0];
        } else {
            files.forEach((file, index) => { baseRequest[`file_${index}`] = file; });
            baseRequest.fileCount = files.length;
        }
    }
    if (config.transformRequest) return config.transformRequest(baseRequest);
    return baseRequest;
}

const defaultConfig = {
    apiRequestFormat: { query: 'query', userId: 'userId', domain: 'domain' },
    apiDataFormat: 'json',
};
const defaultUM = { currentUser: 'u1', domain: 'localhost' };

describe('formatRequestData', () => {
    test('builds basic request with query/userId/domain', () => {
        const req = formatRequestData(defaultConfig, defaultUM, 'Hello');
        expect(req.query).toBe('Hello');
        expect(req.userId).toBe('u1');
        expect(req.domain).toBe('localhost');
    });

    test('uses custom apiRequestFormat keys', () => {
        const config = { ...defaultConfig, apiRequestFormat: { query: 'msg', userId: 'uid', domain: 'site' } };
        const req = formatRequestData(config, defaultUM, 'Hi');
        expect(req.msg).toBe('Hi');
        expect(req.uid).toBe('u1');
        expect(req.site).toBe('localhost');
    });

    test('adds files as file_0, file_1 for multi-file json mode', () => {
        const f1 = new File(['a'], 'a.txt', { type: 'text/plain' });
        const f2 = new File(['b'], 'b.txt', { type: 'text/plain' });
        const req = formatRequestData(defaultConfig, defaultUM, 'msg', [f1, f2]);
        expect(req.file_0).toBe(f1);
        expect(req.file_1).toBe(f2);
        expect(req.fileCount).toBe(2);
    });

    test('uses "image" key for single file in form-data mode', () => {
        const config = { ...defaultConfig, apiDataFormat: 'form-data' };
        const f = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
        const req = formatRequestData(config, defaultUM, 'msg', [f]);
        expect(req.image).toBe(f);
        expect(req.file_0).toBeUndefined();
    });

    test('applies transformRequest when provided', () => {
        const config = { ...defaultConfig, transformRequest: (base) => ({ ...base, extra: 'value' }) };
        const req = formatRequestData(config, defaultUM, 'Hello');
        expect(req.extra).toBe('value');
        expect(req.query).toBe('Hello');
    });

    test('returns base request unmodified when no files', () => {
        const req = formatRequestData(defaultConfig, defaultUM, 'msg', []);
        expect(req.fileCount).toBeUndefined();
        expect(req.file_0).toBeUndefined();
    });

    test('returns base request unmodified when files is null', () => {
        const req = formatRequestData(defaultConfig, defaultUM, 'msg', null);
        expect(req.fileCount).toBeUndefined();
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// makeApiCall
// ─────────────────────────────────────────────────────────────────────────────

async function makeApiCall(chatnest, requestData) {
    const headers = { ...chatnest.config.apiHeaders };
    if (chatnest.config.apiKey) headers['Authorization'] = `Bearer ${chatnest.config.apiKey}`;

    const shouldUseMultipart = chatnest.config.useMultipartFormData ||
        chatnest.config.apiHeaders['Content-Type']?.includes('multipart/form-data') ||
        (chatnest.config.apiMethod === 'POST' && chatnest.config.apiEndpoint.includes('upload')) ||
        chatnest.config.apiDataFormat === 'form-data';

    let requestBody, finalHeaders = { ...headers };
    if (shouldUseMultipart) {
        const formData = new FormData();
        Object.keys(requestData).forEach(key => {
            const value = requestData[key];
            if (value instanceof File || value instanceof Blob) formData.append(key, value);
            else if (typeof value === 'object' && value !== null) formData.append(key, JSON.stringify(value));
            else formData.append(key, String(value));
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
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) return await response.json();
        else if (contentType && contentType.includes('text/')) return { response: await response.text() };
        else return { response: URL.createObjectURL(await response.blob()) };
    } catch (error) {
        if (error.name === 'AbortError') throw new Error('Request timed out. Please try again.');
        else if (error.message.includes('Failed to fetch')) throw new Error('Network error. Please check your internet connection.');
        else if (error.message.includes('SSL_PROTOCOL_ERROR')) throw new Error('Secure connection error. Please ensure the server supports HTTPS.');
        else throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}

function makeChatnest(overrides = {}) {
    const baseConfig = {
        apiEndpoint: 'https://api.example.com/chat',
        apiMethod: 'POST',
        apiHeaders: { 'Content-Type': 'application/json' },
        apiKey: '',
        apiTimeout: 5000,
        useMultipartFormData: false,
        apiDataFormat: 'json',
    };
    return {
        config: { ...baseConfig, ...(overrides.config || {}), apiHeaders: { ...baseConfig.apiHeaders, ...(overrides.config?.apiHeaders || {}) } },
        ...overrides,
    };
}

function mockFetch(responseData, options = {}) {
    global.fetch = jest.fn().mockResolvedValue({
        ok: options.ok !== false,
        status: options.status || 200,
        statusText: options.statusText || 'OK',
        headers: { get: () => options.contentType || 'application/json' },
        json: () => Promise.resolve(responseData),
        text: () => Promise.resolve(String(responseData)),
        blob: () => Promise.resolve(new Blob([String(responseData)])),
    });
}

afterEach(() => { if (global.fetch?.mockReset) global.fetch.mockReset(); });

describe('makeApiCall', () => {
    test('returns parsed JSON for application/json response', async () => {
        mockFetch({ response: 'Hello' });
        const result = await makeApiCall(makeChatnest(), { query: 'Hi' });
        expect(result).toEqual({ response: 'Hello' });
    });

    test('returns { response: text } for text/ content-type', async () => {
        mockFetch('Hello text', { contentType: 'text/plain' });
        const result = await makeApiCall(makeChatnest(), { query: 'Hi' });
        expect(result).toEqual({ response: 'Hello text' });
    });

    test('sends Authorization header when apiKey provided', async () => {
        mockFetch({ response: 'ok' });
        const cn = makeChatnest();
        cn.config.apiKey = 'secret-key';
        await makeApiCall(cn, { query: 'hi' });
        const calledHeaders = global.fetch.mock.calls[0][1].headers;
        expect(calledHeaders['Authorization']).toBe('Bearer secret-key');
    });

    test('does not send Authorization header when no apiKey', async () => {
        mockFetch({ response: 'ok' });
        await makeApiCall(makeChatnest(), { query: 'hi' });
        const calledHeaders = global.fetch.mock.calls[0][1].headers;
        expect(calledHeaders['Authorization']).toBeUndefined();
    });

    test('throws HTTP error for non-ok response', async () => {
        mockFetch(null, { ok: false, status: 500, statusText: 'Internal Server Error' });
        await expect(makeApiCall(makeChatnest(), {})).rejects.toThrow('HTTP error! status: 500');
    });

    test('throws timeout error for AbortError', async () => {
        global.fetch = jest.fn().mockRejectedValue(Object.assign(new Error('Aborted'), { name: 'AbortError' }));
        await expect(makeApiCall(makeChatnest(), {})).rejects.toThrow('Request timed out');
    });

    test('throws network error for "Failed to fetch"', async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error('Failed to fetch'));
        await expect(makeApiCall(makeChatnest(), {})).rejects.toThrow('Network error');
    });

    test('throws SSL error for SSL_PROTOCOL_ERROR', async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error('SSL_PROTOCOL_ERROR occurred'));
        await expect(makeApiCall(makeChatnest(), {})).rejects.toThrow('Secure connection error');
    });

    test('sends FormData when useMultipartFormData=true', async () => {
        mockFetch({ response: 'ok' });
        const cn = makeChatnest({ config: { useMultipartFormData: true } });
        await makeApiCall(cn, { query: 'hello' });
        const body = global.fetch.mock.calls[0][1].body;
        expect(body).toBeInstanceOf(FormData);
    });

    test('sends JSON string when useMultipartFormData=false', async () => {
        mockFetch({ response: 'ok' });
        await makeApiCall(makeChatnest(), { query: 'hello', userId: 'u1' });
        const body = global.fetch.mock.calls[0][1].body;
        expect(typeof body).toBe('string');
        expect(JSON.parse(body)).toMatchObject({ query: 'hello', userId: 'u1' });
    });

    test('removes Content-Type header for multipart (lets browser set boundary)', async () => {
        mockFetch({ response: 'ok' });
        const cn = makeChatnest({ config: { useMultipartFormData: true } });
        await makeApiCall(cn, { query: 'hi' });
        const headers = global.fetch.mock.calls[0][1].headers;
        expect(headers['Content-Type']).toBeUndefined();
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// handleApiError
// ─────────────────────────────────────────────────────────────────────────────

function handleApiError(chatnest, error, typingIndicator) {
    if (typingIndicator) typingIndicator.classList.remove('active');
    chatnest.stopJavaScriptTypingAnimation();
    let message = 'Sorry, there was an error processing your request.';
    if (error?.name === 'AbortError') message = 'Request timed out. Please try again.';
    else if (error?.message?.includes('SSL_PROTOCOL_ERROR')) message = 'A secure connection error occurred. Please ensure the server supports HTTPS.';
    else if (error?.message?.includes('Failed to fetch')) message = 'Unable to connect to the server. Please check your internet connection and try again.';
    chatnest.addMessage(message, 'bot', false, { isError: true });
    chatnest.storageManager.saveMessage(message, 'bot');
    chatnest.isWaitingForResponse = false;
    chatnest.enableSendingFunctionality();
    chatnest.forceEnableInput();
    chatnest.config.onError?.(error);
}

function makeErrorChatnest() {
    return {
        isWaitingForResponse: true,
        isTypewriterActive: false,
        config: { onError: null },
        stopJavaScriptTypingAnimation: jest.fn(),
        addMessage: jest.fn(),
        storageManager: { saveMessage: jest.fn() },
        enableSendingFunctionality: jest.fn(),
        forceEnableInput: jest.fn(),
    };
}

describe('handleApiError', () => {
    test('removes active class from typingIndicator', () => {
        const cn = makeErrorChatnest();
        const ti = document.createElement('div');
        ti.classList.add('active');
        handleApiError(cn, new Error('oops'), ti);
        expect(ti.classList.contains('active')).toBe(false);
    });

    test('works with null typingIndicator', () => {
        const cn = makeErrorChatnest();
        expect(() => handleApiError(cn, new Error('oops'), null)).not.toThrow();
    });

    test('shows generic error message by default', () => {
        const cn = makeErrorChatnest();
        handleApiError(cn, new Error('something'), null);
        expect(cn.addMessage).toHaveBeenCalledWith(
            'Sorry, there was an error processing your request.',
            'bot', false, { isError: true }
        );
    });

    test('shows timeout message for AbortError', () => {
        const cn = makeErrorChatnest();
        const err = Object.assign(new Error('Aborted'), { name: 'AbortError' });
        handleApiError(cn, err, null);
        expect(cn.addMessage.mock.calls[0][0]).toContain('timed out');
    });

    test('shows network message for "Failed to fetch"', () => {
        const cn = makeErrorChatnest();
        handleApiError(cn, new Error('Failed to fetch'), null);
        expect(cn.addMessage.mock.calls[0][0]).toContain('connect to the server');
    });

    test('shows SSL message for SSL_PROTOCOL_ERROR', () => {
        const cn = makeErrorChatnest();
        handleApiError(cn, new Error('SSL_PROTOCOL_ERROR'), null);
        expect(cn.addMessage.mock.calls[0][0]).toContain('secure connection');
    });

    test('clears isWaitingForResponse', () => {
        const cn = makeErrorChatnest();
        handleApiError(cn, new Error('x'), null);
        expect(cn.isWaitingForResponse).toBe(false);
    });

    test('calls enableSendingFunctionality and forceEnableInput', () => {
        const cn = makeErrorChatnest();
        handleApiError(cn, new Error('x'), null);
        expect(cn.enableSendingFunctionality).toHaveBeenCalledTimes(1);
        expect(cn.forceEnableInput).toHaveBeenCalledTimes(1);
    });

    test('calls onError callback when configured', () => {
        const cn = makeErrorChatnest();
        const err = new Error('test');
        const onError = jest.fn();
        cn.config.onError = onError;
        handleApiError(cn, err, null);
        expect(onError).toHaveBeenCalledWith(err);
    });

    test('saves error message to storageManager', () => {
        const cn = makeErrorChatnest();
        handleApiError(cn, new Error('x'), null);
        expect(cn.storageManager.saveMessage).toHaveBeenCalledWith(
            expect.stringContaining('error'), 'bot'
        );
    });
});
