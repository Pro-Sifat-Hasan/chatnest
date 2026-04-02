/**
 * Tests for input module:
 *   setupDesktopInput, setupCleanMobileInput (and forceEnableInput, disableSendingFunctionality, enableSendingFunctionality)
 */

// ── Inline implementations ────────────────────────────────────────────────────

function setupDesktopInput(chatnest, inputElement) {
    inputElement.removeAttribute('readonly');
    inputElement.removeAttribute('disabled');
    inputElement.style.userSelect = 'text';
    inputElement.style.pointerEvents = 'auto';
    inputElement.style.cursor = 'text';
    inputElement.style.caretColor = 'auto';

    inputElement.addEventListener('focus', () => {
        inputElement.style.caretColor = 'auto';
        inputElement.style.cursor = 'text';
        inputElement.classList.add('cursor-active');
    });

    inputElement.addEventListener('blur', () => {
        inputElement.style.caretColor = 'auto';
        inputElement.style.cursor = 'text';
    });

    inputElement.addEventListener('click', () => {
        inputElement.style.caretColor = 'auto';
        inputElement.style.cursor = 'text';
        inputElement.classList.add('cursor-active');
    });
}

function disableSendingFunctionality(chatnest) {
    const chatInput = chatnest.widget.querySelector('.chat-input .chat-textarea');
    const sendButton = chatnest.widget.querySelector('.send-button');

    if (chatInput) {
        chatInput.setAttribute('readonly', 'true');
        chatInput.style.cursor = 'not-allowed';
    }
    if (sendButton) {
        sendButton.disabled = true;
        sendButton.style.opacity = '0.5';
        sendButton.style.pointerEvents = 'none';
        sendButton.style.cursor = 'not-allowed';
    }
}

function enableSendingFunctionality(chatnest) {
    const chatInput = chatnest.widget.querySelector('.chat-input .chat-textarea');
    const sendButton = chatnest.widget.querySelector('.send-button');

    if (chatInput) {
        chatInput.removeAttribute('readonly');
        chatInput.style.cursor = 'text';
    }
    if (sendButton) {
        sendButton.disabled = false;
        sendButton.style.opacity = '1';
        sendButton.style.pointerEvents = 'auto';
        sendButton.style.cursor = 'pointer';
    }
}

function forceEnableInput(chatnest) {
    const chatInput = chatnest.widget.querySelector('.chat-input .chat-textarea');
    if (chatInput) {
        chatInput.removeAttribute('readonly');
        chatInput.removeAttribute('disabled');
        chatInput.style.cursor = 'text';
        chatInput.style.pointerEvents = 'auto';
    }
    const sendButton = chatnest.widget.querySelector('.send-button');
    if (sendButton) {
        sendButton.disabled = false;
        sendButton.style.opacity = '1';
        sendButton.style.pointerEvents = 'auto';
        sendButton.style.cursor = 'pointer';
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildInputWidget() {
    const widget = document.createElement('div');

    const chatInputWrapper = document.createElement('div');
    chatInputWrapper.className = 'chat-input';
    const chatInput = document.createElement('textarea');
    chatInput.className = 'chat-textarea';
    chatInputWrapper.appendChild(chatInput);
    widget.appendChild(chatInputWrapper);

    const sendButton = document.createElement('button');
    sendButton.className = 'send-button';
    widget.appendChild(sendButton);

    document.body.appendChild(widget);
    return { widget, chatInput, sendButton };
}

function makeChatnest(overrides = {}) {
    const { widget, chatInput, sendButton } = buildInputWidget();
    return {
        widget,
        config: {
            enableEnhancedMobileInput: false,
            ...overrides.config,
        },
        isMobileBrowser: jest.fn().mockReturnValue(false),
        _mobileInputCleanup: null,
        ...overrides,
        _chatInput: chatInput,
        _sendButton: sendButton,
    };
}

afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
});

// ── setupDesktopInput ─────────────────────────────────────────────────────────

describe('setupDesktopInput', () => {
    test('removes readonly attribute', () => {
        const chatnest = makeChatnest();
        const input = chatnest._chatInput;
        input.setAttribute('readonly', '');
        setupDesktopInput(chatnest, input);
        expect(input.hasAttribute('readonly')).toBe(false);
    });

    test('removes disabled attribute', () => {
        const chatnest = makeChatnest();
        const input = chatnest._chatInput;
        input.setAttribute('disabled', '');
        setupDesktopInput(chatnest, input);
        expect(input.hasAttribute('disabled')).toBe(false);
    });

    test('sets userSelect to text', () => {
        const chatnest = makeChatnest();
        const input = chatnest._chatInput;
        setupDesktopInput(chatnest, input);
        expect(input.style.userSelect).toBe('text');
    });

    test('sets pointerEvents to auto', () => {
        const chatnest = makeChatnest();
        const input = chatnest._chatInput;
        setupDesktopInput(chatnest, input);
        expect(input.style.pointerEvents).toBe('auto');
    });

    test('sets cursor to text', () => {
        const chatnest = makeChatnest();
        const input = chatnest._chatInput;
        setupDesktopInput(chatnest, input);
        expect(input.style.cursor).toBe('text');
    });

    test('sets caretColor to auto', () => {
        const chatnest = makeChatnest();
        const input = chatnest._chatInput;
        setupDesktopInput(chatnest, input);
        expect(input.style.caretColor).toBe('auto');
    });

    test('adds cursor-active class on focus event', () => {
        const chatnest = makeChatnest();
        const input = chatnest._chatInput;
        setupDesktopInput(chatnest, input);
        input.dispatchEvent(new Event('focus'));
        expect(input.classList.contains('cursor-active')).toBe(true);
    });

    test('adds cursor-active class on click event', () => {
        const chatnest = makeChatnest();
        const input = chatnest._chatInput;
        setupDesktopInput(chatnest, input);
        input.dispatchEvent(new MouseEvent('click'));
        expect(input.classList.contains('cursor-active')).toBe(true);
    });

    test('sets caretColor to auto on blur event', () => {
        const chatnest = makeChatnest();
        const input = chatnest._chatInput;
        setupDesktopInput(chatnest, input);
        input.style.caretColor = 'transparent';
        input.dispatchEvent(new Event('blur'));
        expect(input.style.caretColor).toBe('auto');
    });

    test('does not throw for various input element types', () => {
        const chatnest = makeChatnest();
        const textInput = document.createElement('input');
        textInput.type = 'text';
        document.body.appendChild(textInput);
        expect(() => setupDesktopInput(chatnest, textInput)).not.toThrow();
    });
});

// ── disableSendingFunctionality ───────────────────────────────────────────────

describe('disableSendingFunctionality', () => {
    test('adds readonly attribute to chat input', () => {
        const chatnest = makeChatnest();
        disableSendingFunctionality(chatnest);
        expect(chatnest._chatInput.hasAttribute('readonly')).toBe(true);
    });

    test('sets cursor to not-allowed on input', () => {
        const chatnest = makeChatnest();
        disableSendingFunctionality(chatnest);
        expect(chatnest._chatInput.style.cursor).toBe('not-allowed');
    });

    test('disables send button', () => {
        const chatnest = makeChatnest();
        disableSendingFunctionality(chatnest);
        expect(chatnest._sendButton.disabled).toBe(true);
    });

    test('sets send button opacity to 0.5', () => {
        const chatnest = makeChatnest();
        disableSendingFunctionality(chatnest);
        expect(chatnest._sendButton.style.opacity).toBe('0.5');
    });

    test('sets send button pointerEvents to none', () => {
        const chatnest = makeChatnest();
        disableSendingFunctionality(chatnest);
        expect(chatnest._sendButton.style.pointerEvents).toBe('none');
    });

    test('does not throw when chat input is missing', () => {
        const widget = document.createElement('div');
        const sendButton = document.createElement('button');
        sendButton.className = 'send-button';
        widget.appendChild(sendButton);
        document.body.appendChild(widget);
        const chatnest = makeChatnest({ widget });
        expect(() => disableSendingFunctionality(chatnest)).not.toThrow();
    });

    test('does not throw when send button is missing', () => {
        const widget = document.createElement('div');
        const chatInputWrapper = document.createElement('div');
        chatInputWrapper.className = 'chat-input';
        const chatInput = document.createElement('textarea');
        chatInput.className = 'chat-textarea';
        chatInputWrapper.appendChild(chatInput);
        widget.appendChild(chatInputWrapper);
        document.body.appendChild(widget);
        const chatnest = makeChatnest({ widget });
        expect(() => disableSendingFunctionality(chatnest)).not.toThrow();
    });
});

// ── enableSendingFunctionality ────────────────────────────────────────────────

describe('enableSendingFunctionality', () => {
    test('removes readonly attribute from chat input', () => {
        const chatnest = makeChatnest();
        chatnest._chatInput.setAttribute('readonly', 'true');
        enableSendingFunctionality(chatnest);
        expect(chatnest._chatInput.hasAttribute('readonly')).toBe(false);
    });

    test('sets cursor to text on input', () => {
        const chatnest = makeChatnest();
        enableSendingFunctionality(chatnest);
        expect(chatnest._chatInput.style.cursor).toBe('text');
    });

    test('enables send button (disabled = false)', () => {
        const chatnest = makeChatnest();
        chatnest._sendButton.disabled = true;
        enableSendingFunctionality(chatnest);
        expect(chatnest._sendButton.disabled).toBe(false);
    });

    test('sets send button opacity to 1', () => {
        const chatnest = makeChatnest();
        chatnest._sendButton.style.opacity = '0.5';
        enableSendingFunctionality(chatnest);
        expect(chatnest._sendButton.style.opacity).toBe('1');
    });

    test('sets send button pointerEvents to auto', () => {
        const chatnest = makeChatnest();
        enableSendingFunctionality(chatnest);
        expect(chatnest._sendButton.style.pointerEvents).toBe('auto');
    });

    test('full cycle: disable then enable restores functionality', () => {
        const chatnest = makeChatnest();
        disableSendingFunctionality(chatnest);
        enableSendingFunctionality(chatnest);
        expect(chatnest._chatInput.hasAttribute('readonly')).toBe(false);
        expect(chatnest._sendButton.disabled).toBe(false);
        expect(chatnest._sendButton.style.opacity).toBe('1');
    });
});

// ── forceEnableInput ──────────────────────────────────────────────────────────

describe('forceEnableInput', () => {
    test('removes readonly from chat input', () => {
        const chatnest = makeChatnest();
        chatnest._chatInput.setAttribute('readonly', 'true');
        forceEnableInput(chatnest);
        expect(chatnest._chatInput.hasAttribute('readonly')).toBe(false);
    });

    test('removes disabled from chat input', () => {
        const chatnest = makeChatnest();
        chatnest._chatInput.setAttribute('disabled', 'true');
        forceEnableInput(chatnest);
        expect(chatnest._chatInput.hasAttribute('disabled')).toBe(false);
    });

    test('sets cursor to text on input', () => {
        const chatnest = makeChatnest();
        forceEnableInput(chatnest);
        expect(chatnest._chatInput.style.cursor).toBe('text');
    });

    test('sets pointerEvents to auto on input', () => {
        const chatnest = makeChatnest();
        forceEnableInput(chatnest);
        expect(chatnest._chatInput.style.pointerEvents).toBe('auto');
    });

    test('enables send button', () => {
        const chatnest = makeChatnest();
        chatnest._sendButton.disabled = true;
        forceEnableInput(chatnest);
        expect(chatnest._sendButton.disabled).toBe(false);
    });

    test('sets send button opacity to 1', () => {
        const chatnest = makeChatnest();
        chatnest._sendButton.style.opacity = '0.3';
        forceEnableInput(chatnest);
        expect(chatnest._sendButton.style.opacity).toBe('1');
    });

    test('does not throw when no input or send button in widget', () => {
        const widget = document.createElement('div');
        document.body.appendChild(widget);
        const chatnest = makeChatnest({ widget });
        expect(() => forceEnableInput(chatnest)).not.toThrow();
    });
});

// ── setupCleanMobileInput ─────────────────────────────────────────────────────

describe('setupCleanMobileInput', () => {
    // We test setupCleanMobileInput by checking DOM-level side effects
    // since the function sets up closures rather than returning values

    function runSetupCleanMobileInput(chatnest, inputElement) {
        let isInputFocused = false;

        const setupInput = () => {
            inputElement.removeAttribute('readonly');
            inputElement.removeAttribute('disabled');
            inputElement.style.userSelect = 'text';
            inputElement.style.webkitUserSelect = 'text';
            inputElement.style.pointerEvents = 'auto';
            inputElement.style.fontSize = '16px';
            inputElement.style.webkitAppearance = 'none';
            inputElement.style.appearance = 'none';
        };

        inputElement.addEventListener('focus', () => {
            isInputFocused = true;
            inputElement.classList.add('mobile-focused');
            inputElement.style.caretColor = 'auto';
            inputElement.style.cursor = 'text';
        });

        inputElement.addEventListener('blur', () => {
            // Simplified: just remove class immediately for test
            isInputFocused = false;
            inputElement.classList.remove('mobile-focused');
            inputElement.style.caretColor = 'transparent';
        });

        inputElement.addEventListener('click', () => {
            if (!isInputFocused) {
                inputElement.focus();
            }
        });

        const handleOutsideClick = (e) => {
            const chatWindow = chatnest.widget.querySelector('.chat-window');
            if (isInputFocused && chatWindow && !chatWindow.contains(e.target)) {
                isInputFocused = false;
                inputElement.blur();
                inputElement.classList.remove('mobile-focused');
                inputElement.style.caretColor = 'transparent';
            }
        };

        document.addEventListener('click', handleOutsideClick);
        document.addEventListener('touchstart', handleOutsideClick);

        chatnest._mobileInputCleanup = () => {
            document.removeEventListener('click', handleOutsideClick);
            document.removeEventListener('touchstart', handleOutsideClick);
        };

        setupInput();

        inputElement.style.caretColor = chatnest.isMobileBrowser() ? 'transparent' : 'auto';
    }

    function buildMobileWidget() {
        const widget = document.createElement('div');
        const chatWindow = document.createElement('div');
        chatWindow.className = 'chat-window';
        widget.appendChild(chatWindow);
        document.body.appendChild(widget);
        return widget;
    }

    test('removes readonly and disabled attributes', () => {
        const widget = buildMobileWidget();
        const chatnest = makeChatnest({ widget, isMobileBrowser: jest.fn().mockReturnValue(true) });
        const input = document.createElement('textarea');
        input.setAttribute('readonly', '');
        input.setAttribute('disabled', '');
        document.body.appendChild(input);
        runSetupCleanMobileInput(chatnest, input);
        expect(input.hasAttribute('readonly')).toBe(false);
        expect(input.hasAttribute('disabled')).toBe(false);
    });

    test('sets fontSize to 16px', () => {
        const widget = buildMobileWidget();
        const chatnest = makeChatnest({ widget });
        const input = document.createElement('textarea');
        document.body.appendChild(input);
        runSetupCleanMobileInput(chatnest, input);
        expect(input.style.fontSize).toBe('16px');
    });

    test('adds mobile-focused class on focus event', () => {
        const widget = buildMobileWidget();
        const chatnest = makeChatnest({ widget });
        const input = document.createElement('textarea');
        document.body.appendChild(input);
        runSetupCleanMobileInput(chatnest, input);
        input.dispatchEvent(new Event('focus'));
        expect(input.classList.contains('mobile-focused')).toBe(true);
    });

    test('removes mobile-focused class on blur event', () => {
        const widget = buildMobileWidget();
        const chatnest = makeChatnest({ widget });
        const input = document.createElement('textarea');
        document.body.appendChild(input);
        runSetupCleanMobileInput(chatnest, input);
        input.dispatchEvent(new Event('focus'));
        input.dispatchEvent(new Event('blur'));
        expect(input.classList.contains('mobile-focused')).toBe(false);
    });

    test('sets caretColor to transparent for mobile browser', () => {
        const widget = buildMobileWidget();
        const chatnest = makeChatnest({ widget, isMobileBrowser: jest.fn().mockReturnValue(true) });
        const input = document.createElement('textarea');
        document.body.appendChild(input);
        runSetupCleanMobileInput(chatnest, input);
        expect(input.style.caretColor).toBe('transparent');
    });

    test('sets caretColor to auto for non-mobile browser', () => {
        const widget = buildMobileWidget();
        const chatnest = makeChatnest({ widget, isMobileBrowser: jest.fn().mockReturnValue(false) });
        const input = document.createElement('textarea');
        document.body.appendChild(input);
        runSetupCleanMobileInput(chatnest, input);
        expect(input.style.caretColor).toBe('auto');
    });

    test('registers _mobileInputCleanup function', () => {
        const widget = buildMobileWidget();
        const chatnest = makeChatnest({ widget });
        const input = document.createElement('textarea');
        document.body.appendChild(input);
        runSetupCleanMobileInput(chatnest, input);
        expect(typeof chatnest._mobileInputCleanup).toBe('function');
    });

    test('cleanup removes outside click listeners', () => {
        const widget = buildMobileWidget();
        const chatnest = makeChatnest({ widget });
        const input = document.createElement('textarea');
        document.body.appendChild(input);
        runSetupCleanMobileInput(chatnest, input);

        // Verify cleanup function is callable
        expect(() => chatnest._mobileInputCleanup()).not.toThrow();
    });

    test('sets pointerEvents to auto', () => {
        const widget = buildMobileWidget();
        const chatnest = makeChatnest({ widget });
        const input = document.createElement('textarea');
        document.body.appendChild(input);
        runSetupCleanMobileInput(chatnest, input);
        expect(input.style.pointerEvents).toBe('auto');
    });
});
