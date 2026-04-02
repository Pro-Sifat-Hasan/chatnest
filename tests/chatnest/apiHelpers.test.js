/**
 * Tests for API helper functions:
 *   deleteBackendHistory, updateUIForSending, resetUIAfterSending,
 *   processApiResponse, handleApiError
 */

// ── Inline implementations ────────────────────────────────────────────────────

function deleteBackendHistory(chatnest) {
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
        body: JSON.stringify({ userId, domain })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    });
}

function updateUIForSending(chatnest, typingIndicator, chatInput) {
    chatnest._userHasScrolledUp = false;
    chatnest.addMessage(chatInput.value.trim(), 'user');
    chatnest.storageManager.saveMessage(chatInput.value.trim(), 'user');
    chatInput.value = '';
    typingIndicator.classList.add('active');
    setTimeout(() => chatnest.startJavaScriptTypingAnimation(), 100);
    chatnest.isWaitingForResponse = true;
    chatnest.disableSendingFunctionality();
}

function resetUIAfterSending(chatnest, typingIndicator) {
    chatnest.isWaitingForResponse = false;
    if (!chatnest.isTypewriterActive) {
        chatnest.enableSendingFunctionality();
    }
    typingIndicator.classList.remove('active');
    chatnest.stopJavaScriptTypingAnimation();
}

function extractResponseText(data, config) {
    // Simplified version for testing
    if (!data) return { text: '', products: null };
    if (typeof data === 'string') return { text: data, products: null };
    if (typeof data.text === 'string') return { text: data.text, products: data.products || null };
    if (typeof data.message === 'string') return { text: data.message, products: null };
    if (typeof data.response === 'string') return { text: data.response, products: null };
    return { text: JSON.stringify(data), products: null };
}

function processApiResponse(chatnest, data, typingIndicator) {
    if (typingIndicator) {
        typingIndicator.classList.remove('active');
    }
    chatnest.stopJavaScriptTypingAnimation();

    const { text: responseText, products } = extractResponseText(data, chatnest.config);

    chatnest.widget?.querySelector('.chat-window')?.classList.add('active');
    chatnest.addMessage(responseText, 'bot', true, { products });
    chatnest.storageManager.saveMessage(responseText, 'bot');
}

function handleApiError(chatnest, error, typingIndicator) {
    if (typingIndicator) {
        typingIndicator.classList.remove('active');
    }
    chatnest.stopJavaScriptTypingAnimation();

    let message = 'Sorry, there was an error processing your request.';
    if (error?.name === 'AbortError') {
        message = 'Request timed out. Please try again.';
    } else if (error?.message?.includes('SSL_PROTOCOL_ERROR')) {
        message = 'A secure connection error occurred. Please ensure the server supports HTTPS.';
    } else if (error?.message?.includes('Failed to fetch')) {
        message = 'Unable to connect to the server. Please check your internet connection and try again.';
    }

    chatnest.addMessage(message, 'bot', false, { isError: true });
    chatnest.storageManager.saveMessage(message, 'bot');

    chatnest.isWaitingForResponse = false;
    chatnest.enableSendingFunctionality();
    chatnest.forceEnableInput();

    chatnest.config.onError?.(error);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildTypingIndicator() {
    const el = document.createElement('div');
    el.className = 'typing-indicator';
    document.body.appendChild(el);
    return el;
}

function buildChatInput(value = '') {
    const el = document.createElement('textarea');
    el.className = 'chat-textarea';
    el.value = value;
    document.body.appendChild(el);
    return el;
}

function buildWidget() {
    const widget = document.createElement('div');
    const chatWindow = document.createElement('div');
    chatWindow.className = 'chat-window';
    widget.appendChild(chatWindow);
    document.body.appendChild(widget);
    return widget;
}

function makeChatnest(overrides = {}) {
    return {
        widget: buildWidget(),
        config: {
            parlant: { enabled: false },
            deleteEndpoint: 'https://api.example.com/delete',
            apiHeaders: {},
            onError: null,
            ...overrides.config,
        },
        userManager: {
            currentUser: 'user-abc',
            domain: 'testdomain.com',
            ...overrides.userManager,
        },
        isWaitingForResponse: false,
        isTypewriterActive: false,
        _userHasScrolledUp: false,
        addMessage: jest.fn(),
        storageManager: { saveMessage: jest.fn(), clearHistory: jest.fn() },
        startJavaScriptTypingAnimation: jest.fn(),
        stopJavaScriptTypingAnimation: jest.fn(),
        disableSendingFunctionality: jest.fn(),
        enableSendingFunctionality: jest.fn(),
        forceEnableInput: jest.fn(),
        ...overrides,
    };
}

beforeEach(() => {
    global.fetch = jest.fn();
    jest.useFakeTimers();
});

afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
    jest.useRealTimers();
});

// ── deleteBackendHistory ──────────────────────────────────────────────────────

describe('deleteBackendHistory', () => {
    test('returns resolved promise skipping fetch in parlant mode', async () => {
        const chatnest = makeChatnest({ config: { parlant: { enabled: true }, apiHeaders: {} } });
        const result = await deleteBackendHistory(chatnest);
        expect(result.message).toContain('Parlant mode');
        expect(global.fetch).not.toHaveBeenCalled();
    });

    test('calls fetch with DELETE method and correct endpoint', async () => {
        global.fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ deleted: true }) });
        const chatnest = makeChatnest();
        await deleteBackendHistory(chatnest);
        expect(global.fetch).toHaveBeenCalledWith(
            'https://api.example.com/delete',
            expect.objectContaining({ method: 'DELETE' })
        );
    });

    test('sends userId and domain in body', async () => {
        global.fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
        const chatnest = makeChatnest();
        await deleteBackendHistory(chatnest);
        const call = global.fetch.mock.calls[0];
        const body = JSON.parse(call[1].body);
        expect(body.userId).toBe('user-abc');
        expect(body.domain).toBe('testdomain.com');
    });

    test('sends Content-Type application/json header', async () => {
        global.fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
        const chatnest = makeChatnest();
        await deleteBackendHistory(chatnest);
        const headers = global.fetch.mock.calls[0][1].headers;
        expect(headers['Content-Type']).toBe('application/json');
    });

    test('throws when server returns non-ok response', async () => {
        global.fetch.mockResolvedValue({ ok: false, status: 403 });
        const chatnest = makeChatnest();
        await expect(deleteBackendHistory(chatnest)).rejects.toThrow('HTTP error! status: 403');
    });

    test('rejects on network failure', async () => {
        global.fetch.mockRejectedValue(new Error('Network error'));
        const chatnest = makeChatnest();
        await expect(deleteBackendHistory(chatnest)).rejects.toThrow('Network error');
    });

    test('returns response JSON on success', async () => {
        const mockData = { deleted: true, count: 5 };
        global.fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(mockData) });
        const chatnest = makeChatnest();
        const result = await deleteBackendHistory(chatnest);
        expect(result).toEqual(mockData);
    });
});

// ── updateUIForSending ────────────────────────────────────────────────────────

describe('updateUIForSending', () => {
    test('adds active class to typing indicator', () => {
        const chatnest = makeChatnest();
        const typingIndicator = buildTypingIndicator();
        const chatInput = buildChatInput('Hello');
        updateUIForSending(chatnest, typingIndicator, chatInput);
        expect(typingIndicator.classList.contains('active')).toBe(true);
    });

    test('clears the chat input value', () => {
        const chatnest = makeChatnest();
        const typingIndicator = buildTypingIndicator();
        const chatInput = buildChatInput('Hello world');
        updateUIForSending(chatnest, typingIndicator, chatInput);
        expect(chatInput.value).toBe('');
    });

    test('calls addMessage with user message text', () => {
        const chatnest = makeChatnest();
        const typingIndicator = buildTypingIndicator();
        const chatInput = buildChatInput('  My message  ');
        updateUIForSending(chatnest, typingIndicator, chatInput);
        expect(chatnest.addMessage).toHaveBeenCalledWith('My message', 'user');
    });

    test('calls storageManager.saveMessage with user text', () => {
        const chatnest = makeChatnest();
        const typingIndicator = buildTypingIndicator();
        const chatInput = buildChatInput('Test message');
        updateUIForSending(chatnest, typingIndicator, chatInput);
        expect(chatnest.storageManager.saveMessage).toHaveBeenCalledWith('Test message', 'user');
    });

    test('sets isWaitingForResponse to true', () => {
        const chatnest = makeChatnest();
        const typingIndicator = buildTypingIndicator();
        const chatInput = buildChatInput('Hi');
        updateUIForSending(chatnest, typingIndicator, chatInput);
        expect(chatnest.isWaitingForResponse).toBe(true);
    });

    test('calls disableSendingFunctionality', () => {
        const chatnest = makeChatnest();
        const typingIndicator = buildTypingIndicator();
        const chatInput = buildChatInput('Hi');
        updateUIForSending(chatnest, typingIndicator, chatInput);
        expect(chatnest.disableSendingFunctionality).toHaveBeenCalledTimes(1);
    });

    test('resets _userHasScrolledUp to false', () => {
        const chatnest = makeChatnest({ _userHasScrolledUp: true });
        const typingIndicator = buildTypingIndicator();
        const chatInput = buildChatInput('Hi');
        updateUIForSending(chatnest, typingIndicator, chatInput);
        expect(chatnest._userHasScrolledUp).toBe(false);
    });

    test('calls startJavaScriptTypingAnimation via setTimeout', () => {
        const chatnest = makeChatnest();
        const typingIndicator = buildTypingIndicator();
        const chatInput = buildChatInput('Hi');
        updateUIForSending(chatnest, typingIndicator, chatInput);
        expect(chatnest.startJavaScriptTypingAnimation).not.toHaveBeenCalled();
        jest.advanceTimersByTime(100);
        expect(chatnest.startJavaScriptTypingAnimation).toHaveBeenCalledTimes(1);
    });
});

// ── resetUIAfterSending ───────────────────────────────────────────────────────

describe('resetUIAfterSending', () => {
    test('removes active class from typing indicator', () => {
        const chatnest = makeChatnest();
        const typingIndicator = buildTypingIndicator();
        typingIndicator.classList.add('active');
        resetUIAfterSending(chatnest, typingIndicator);
        expect(typingIndicator.classList.contains('active')).toBe(false);
    });

    test('sets isWaitingForResponse to false', () => {
        const chatnest = makeChatnest({ isWaitingForResponse: true });
        const typingIndicator = buildTypingIndicator();
        resetUIAfterSending(chatnest, typingIndicator);
        expect(chatnest.isWaitingForResponse).toBe(false);
    });

    test('calls enableSendingFunctionality when typewriter is not active', () => {
        const chatnest = makeChatnest({ isTypewriterActive: false });
        const typingIndicator = buildTypingIndicator();
        resetUIAfterSending(chatnest, typingIndicator);
        expect(chatnest.enableSendingFunctionality).toHaveBeenCalledTimes(1);
    });

    test('does NOT call enableSendingFunctionality when typewriter is active', () => {
        const chatnest = makeChatnest({ isTypewriterActive: true });
        const typingIndicator = buildTypingIndicator();
        resetUIAfterSending(chatnest, typingIndicator);
        expect(chatnest.enableSendingFunctionality).not.toHaveBeenCalled();
    });

    test('calls stopJavaScriptTypingAnimation', () => {
        const chatnest = makeChatnest();
        const typingIndicator = buildTypingIndicator();
        resetUIAfterSending(chatnest, typingIndicator);
        expect(chatnest.stopJavaScriptTypingAnimation).toHaveBeenCalledTimes(1);
    });
});

// ── processApiResponse ────────────────────────────────────────────────────────

describe('processApiResponse', () => {
    test('removes active class from typing indicator', () => {
        const chatnest = makeChatnest();
        const typingIndicator = buildTypingIndicator();
        typingIndicator.classList.add('active');
        processApiResponse(chatnest, { text: 'Hello' }, typingIndicator);
        expect(typingIndicator.classList.contains('active')).toBe(false);
    });

    test('calls addMessage with extracted bot response', () => {
        const chatnest = makeChatnest();
        const typingIndicator = buildTypingIndicator();
        processApiResponse(chatnest, { text: 'Bot reply here' }, typingIndicator);
        expect(chatnest.addMessage).toHaveBeenCalledWith('Bot reply here', 'bot', true, expect.any(Object));
    });

    test('calls storageManager.saveMessage with bot response', () => {
        const chatnest = makeChatnest();
        const typingIndicator = buildTypingIndicator();
        processApiResponse(chatnest, { text: 'Saved response' }, typingIndicator);
        expect(chatnest.storageManager.saveMessage).toHaveBeenCalledWith('Saved response', 'bot');
    });

    test('calls stopJavaScriptTypingAnimation', () => {
        const chatnest = makeChatnest();
        const typingIndicator = buildTypingIndicator();
        processApiResponse(chatnest, { text: 'Hi' }, typingIndicator);
        expect(chatnest.stopJavaScriptTypingAnimation).toHaveBeenCalledTimes(1);
    });

    test('handles null typingIndicator gracefully', () => {
        const chatnest = makeChatnest();
        expect(() => processApiResponse(chatnest, { text: 'Response' }, null)).not.toThrow();
    });

    test('handles string response data', () => {
        const chatnest = makeChatnest();
        const typingIndicator = buildTypingIndicator();
        processApiResponse(chatnest, 'Plain string response', typingIndicator);
        expect(chatnest.addMessage).toHaveBeenCalledWith('Plain string response', 'bot', true, expect.any(Object));
    });

    test('handles message field in response', () => {
        const chatnest = makeChatnest();
        const typingIndicator = buildTypingIndicator();
        processApiResponse(chatnest, { message: 'Hello from message field' }, typingIndicator);
        expect(chatnest.addMessage).toHaveBeenCalledWith('Hello from message field', 'bot', true, expect.any(Object));
    });

    test('adds active class to chat window', () => {
        const chatnest = makeChatnest();
        const typingIndicator = buildTypingIndicator();
        processApiResponse(chatnest, { text: 'Hi' }, typingIndicator);
        const chatWindow = chatnest.widget.querySelector('.chat-window');
        expect(chatWindow.classList.contains('active')).toBe(true);
    });
});

// ── handleApiError ────────────────────────────────────────────────────────────

describe('handleApiError', () => {
    test('removes active class from typing indicator', () => {
        const chatnest = makeChatnest();
        const typingIndicator = buildTypingIndicator();
        typingIndicator.classList.add('active');
        handleApiError(chatnest, new Error('Some error'), typingIndicator);
        expect(typingIndicator.classList.contains('active')).toBe(false);
    });

    test('shows generic error message by default', () => {
        const chatnest = makeChatnest();
        const typingIndicator = buildTypingIndicator();
        handleApiError(chatnest, new Error('Some error'), typingIndicator);
        expect(chatnest.addMessage).toHaveBeenCalledWith(
            'Sorry, there was an error processing your request.',
            'bot', false, { isError: true }
        );
    });

    test('shows timeout message on AbortError', () => {
        const chatnest = makeChatnest();
        const typingIndicator = buildTypingIndicator();
        const abortError = new Error('Aborted');
        abortError.name = 'AbortError';
        handleApiError(chatnest, abortError, typingIndicator);
        expect(chatnest.addMessage).toHaveBeenCalledWith(
            'Request timed out. Please try again.',
            'bot', false, { isError: true }
        );
    });

    test('shows SSL error message for SSL_PROTOCOL_ERROR', () => {
        const chatnest = makeChatnest();
        const typingIndicator = buildTypingIndicator();
        handleApiError(chatnest, new Error('SSL_PROTOCOL_ERROR occurred'), typingIndicator);
        expect(chatnest.addMessage).toHaveBeenCalledWith(
            expect.stringContaining('secure connection'),
            'bot', false, { isError: true }
        );
    });

    test('shows connection error message for Failed to fetch', () => {
        const chatnest = makeChatnest();
        const typingIndicator = buildTypingIndicator();
        handleApiError(chatnest, new Error('Failed to fetch'), typingIndicator);
        expect(chatnest.addMessage).toHaveBeenCalledWith(
            expect.stringContaining('Unable to connect'),
            'bot', false, { isError: true }
        );
    });

    test('sets isWaitingForResponse to false', () => {
        const chatnest = makeChatnest({ isWaitingForResponse: true });
        const typingIndicator = buildTypingIndicator();
        handleApiError(chatnest, new Error('Error'), typingIndicator);
        expect(chatnest.isWaitingForResponse).toBe(false);
    });

    test('calls enableSendingFunctionality', () => {
        const chatnest = makeChatnest();
        const typingIndicator = buildTypingIndicator();
        handleApiError(chatnest, new Error('Error'), typingIndicator);
        expect(chatnest.enableSendingFunctionality).toHaveBeenCalledTimes(1);
    });

    test('calls forceEnableInput', () => {
        const chatnest = makeChatnest();
        const typingIndicator = buildTypingIndicator();
        handleApiError(chatnest, new Error('Error'), typingIndicator);
        expect(chatnest.forceEnableInput).toHaveBeenCalledTimes(1);
    });

    test('calls stopJavaScriptTypingAnimation', () => {
        const chatnest = makeChatnest();
        const typingIndicator = buildTypingIndicator();
        handleApiError(chatnest, new Error('Error'), typingIndicator);
        expect(chatnest.stopJavaScriptTypingAnimation).toHaveBeenCalledTimes(1);
    });

    test('calls onError callback if configured', () => {
        const onError = jest.fn();
        const chatnest = makeChatnest({ config: { parlant: { enabled: false }, deleteEndpoint: null, apiHeaders: {}, onError } });
        const typingIndicator = buildTypingIndicator();
        const error = new Error('Test error');
        handleApiError(chatnest, error, typingIndicator);
        expect(onError).toHaveBeenCalledWith(error);
    });

    test('does not throw when onError is not configured', () => {
        const chatnest = makeChatnest({ config: { parlant: { enabled: false }, deleteEndpoint: null, apiHeaders: {}, onError: null } });
        const typingIndicator = buildTypingIndicator();
        expect(() => handleApiError(chatnest, new Error('Error'), typingIndicator)).not.toThrow();
    });

    test('handles null typingIndicator gracefully', () => {
        const chatnest = makeChatnest();
        expect(() => handleApiError(chatnest, new Error('Error'), null)).not.toThrow();
    });

    test('saves error message to storage', () => {
        const chatnest = makeChatnest();
        const typingIndicator = buildTypingIndicator();
        handleApiError(chatnest, new Error('Error'), typingIndicator);
        expect(chatnest.storageManager.saveMessage).toHaveBeenCalledWith(
            expect.stringContaining('error'),
            'bot'
        );
    });
});
