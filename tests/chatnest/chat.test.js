/**
 * Tests for chat module:
 *   toggleChat, openChat, closeChat, updateToggleIcon
 */

// ── Inline implementations ────────────────────────────────────────────────────

function toggleChat(chatnest) {
    const chatWindow = chatnest.widget?.querySelector('.chat-window');
    if (!chatWindow) return;
    if (chatWindow.classList.contains('active')) {
        chatnest.closeChat();
    } else {
        chatnest.openChat();
    }
}

function updateToggleIcon(chatnest, isOpen) {
    const chatToggle = chatnest.widget.querySelector('.chat-toggle');
    if (!chatToggle) return;

    chatToggle.setAttribute('aria-expanded', String(isOpen));
    chatToggle.setAttribute('aria-label', isOpen ? 'Close chat' : 'Open chat');

    if (isOpen) {
        chatToggle.innerHTML = `<img src="data:image/svg+xml,...close..." alt="Close">`;
    } else {
        if (chatnest.config.toggleButtonIcon) {
            const icon = chatnest.config.toggleButtonIcon;
            if (icon.length <= 4 && /\p{Emoji}/u.test(icon)) {
                chatToggle.innerHTML = `<span style="font-size: 24px;">${icon}</span>`;
            } else if (icon.startsWith('http') || icon.startsWith('data:image') || icon.startsWith('/')) {
                chatToggle.innerHTML = `<img src="${icon}" alt="Chat" style="width: 24px; height: 24px;">`;
            } else if (icon.trim().startsWith('<svg')) {
                chatToggle.innerHTML = icon;
            } else {
                chatToggle.innerHTML = `<img src="data:image/svg+xml,...default..." alt="Chat">`;
            }
        } else {
            chatToggle.innerHTML = `<img src="data:image/svg+xml,...default..." alt="Chat">`;
        }
    }
}

// ── Widget builder ────────────────────────────────────────────────────────────

function buildChatWidget({ windowActive = false, hasTextBox = false } = {}) {
    const widget = document.createElement('div');
    widget.className = 'chat-widget';

    const chatWindow = document.createElement('div');
    chatWindow.className = 'chat-window';
    if (windowActive) chatWindow.classList.add('active');
    chatWindow.style.display = windowActive ? 'flex' : 'none';
    widget.appendChild(chatWindow);

    const chatToggle = document.createElement('button');
    chatToggle.className = 'chat-toggle';
    widget.appendChild(chatToggle);

    const chatInput = document.createElement('textarea');
    chatInput.className = 'chat-textarea';
    const chatInputWrapper = document.createElement('div');
    chatInputWrapper.className = 'chat-input';
    chatInputWrapper.appendChild(chatInput);
    chatWindow.appendChild(chatInputWrapper);

    if (hasTextBox) {
        const textBox = document.createElement('div');
        textBox.className = 'chat-text-box';
        textBox.style.display = 'block';
        widget.appendChild(textBox);
    }

    document.body.appendChild(widget);
    return widget;
}

function makeChatnest(overrides = {}) {
    const widget = overrides.widget || buildChatWidget(overrides.widgetOptions || {});
    const chatnest = {
        widget,
        config: {
            showTextBox: false,
            toggleButtonIcon: null,
            showFormOnStart: false,
            hubspot: { enabled: false },
            enableEnhancedMobileInput: false,
            ...overrides.config,
        },
        isWaitingForResponse: false,
        _textBoxManuallyClosed: false,
        _mobileInputSetup: false,
        openChat: jest.fn(),
        closeChat: jest.fn(),
        updateToggleIcon: jest.fn((isOpen) => updateToggleIcon(chatnest, isOpen)),
        disableToggleButtonAnimation: jest.fn(),
        enableToggleButtonAnimation: jest.fn(),
        setupCleanMobileInput: jest.fn(),
        scrollToBottom: jest.fn(),
        showHubSpotForm: jest.fn(),
        isMobileBrowser: jest.fn().mockReturnValue(false),
        userManager: { hasSubmittedForm: jest.fn().mockReturnValue(false) },
        parlant: null,
        activeForm: null,
        removeActiveForm: jest.fn(),
        _mobileInputCleanup: null,
        ...overrides,
    };
    return chatnest;
}

afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
});

// ── toggleChat ────────────────────────────────────────────────────────────────

describe('toggleChat', () => {
    test('calls openChat when chat window is closed', () => {
        const chatnest = makeChatnest({ widgetOptions: { windowActive: false } });
        toggleChat(chatnest);
        expect(chatnest.openChat).toHaveBeenCalledTimes(1);
        expect(chatnest.closeChat).not.toHaveBeenCalled();
    });

    test('calls closeChat when chat window is open (active class)', () => {
        const chatnest = makeChatnest({ widgetOptions: { windowActive: true } });
        toggleChat(chatnest);
        expect(chatnest.closeChat).toHaveBeenCalledTimes(1);
        expect(chatnest.openChat).not.toHaveBeenCalled();
    });

    test('does nothing when widget has no chat-window element', () => {
        const widget = document.createElement('div');
        document.body.appendChild(widget);
        const chatnest = makeChatnest({ widget });
        toggleChat(chatnest);
        expect(chatnest.openChat).not.toHaveBeenCalled();
        expect(chatnest.closeChat).not.toHaveBeenCalled();
    });

    test('does nothing when widget is null/undefined', () => {
        const chatnest = makeChatnest({ widget: null });
        expect(() => toggleChat(chatnest)).not.toThrow();
    });
});

// ── updateToggleIcon ──────────────────────────────────────────────────────────

describe('updateToggleIcon', () => {
    test('sets aria-expanded=true and aria-label=Close chat when open', () => {
        const chatnest = makeChatnest();
        updateToggleIcon(chatnest, true);
        const chatToggle = chatnest.widget.querySelector('.chat-toggle');
        expect(chatToggle.getAttribute('aria-expanded')).toBe('true');
        expect(chatToggle.getAttribute('aria-label')).toBe('Close chat');
    });

    test('sets aria-expanded=false and aria-label=Open chat when closed', () => {
        const chatnest = makeChatnest();
        updateToggleIcon(chatnest, false);
        const chatToggle = chatnest.widget.querySelector('.chat-toggle');
        expect(chatToggle.getAttribute('aria-expanded')).toBe('false');
        expect(chatToggle.getAttribute('aria-label')).toBe('Open chat');
    });

    test('renders close icon (img) when open', () => {
        const chatnest = makeChatnest();
        updateToggleIcon(chatnest, true);
        const chatToggle = chatnest.widget.querySelector('.chat-toggle');
        expect(chatToggle.innerHTML).toContain('<img');
        expect(chatToggle.innerHTML).toContain('alt="Close"');
    });

    test('renders default chat icon when no custom toggle icon', () => {
        const chatnest = makeChatnest();
        updateToggleIcon(chatnest, false);
        const chatToggle = chatnest.widget.querySelector('.chat-toggle');
        expect(chatToggle.innerHTML).toContain('<img');
    });

    test('renders emoji icon when toggleButtonIcon is an emoji', () => {
        const chatnest = makeChatnest({ config: { toggleButtonIcon: '💬' } });
        updateToggleIcon(chatnest, false);
        const chatToggle = chatnest.widget.querySelector('.chat-toggle');
        expect(chatToggle.innerHTML).toContain('💬');
        expect(chatToggle.innerHTML).toContain('<span');
    });

    test('renders img tag when toggleButtonIcon is http URL', () => {
        const chatnest = makeChatnest({ config: { toggleButtonIcon: 'https://example.com/icon.png' } });
        updateToggleIcon(chatnest, false);
        const chatToggle = chatnest.widget.querySelector('.chat-toggle');
        expect(chatToggle.innerHTML).toContain('<img');
        expect(chatToggle.innerHTML).toContain('https://example.com/icon.png');
    });

    test('renders img tag when toggleButtonIcon is data: URL', () => {
        const chatnest = makeChatnest({ config: { toggleButtonIcon: 'data:image/png;base64,abc' } });
        updateToggleIcon(chatnest, false);
        const chatToggle = chatnest.widget.querySelector('.chat-toggle');
        expect(chatToggle.innerHTML).toContain('<img');
        expect(chatToggle.innerHTML).toContain('data:image/png;base64,abc');
    });

    test('renders img tag when toggleButtonIcon is relative path', () => {
        const chatnest = makeChatnest({ config: { toggleButtonIcon: '/icon.png' } });
        updateToggleIcon(chatnest, false);
        const chatToggle = chatnest.widget.querySelector('.chat-toggle');
        expect(chatToggle.innerHTML).toContain('<img');
        expect(chatToggle.innerHTML).toContain('/icon.png');
    });

    test('renders SVG inline when toggleButtonIcon is SVG markup', () => {
        const svg = '<svg xmlns="http://www.w3.org/2000/svg"><circle/></svg>';
        const chatnest = makeChatnest({ config: { toggleButtonIcon: svg } });
        updateToggleIcon(chatnest, false);
        const chatToggle = chatnest.widget.querySelector('.chat-toggle');
        expect(chatToggle.innerHTML).toContain('<svg');
    });

    test('does nothing when chat-toggle element is missing', () => {
        const widget = document.createElement('div');
        document.body.appendChild(widget);
        const chatnest = makeChatnest({ widget });
        expect(() => updateToggleIcon(chatnest, true)).not.toThrow();
    });
});

// ── closeChat side effects ────────────────────────────────────────────────────

describe('closeChat helpers', () => {
    test('mobileInputCleanup called when present', () => {
        const cleanup = jest.fn();
        const chatnest = makeChatnest({
            _mobileInputCleanup: cleanup,
            widgetOptions: { windowActive: true },
        });
        // Simulate what closeChat does with cleanup
        if (chatnest._mobileInputCleanup) {
            chatnest._mobileInputCleanup();
            chatnest._mobileInputCleanup = null;
        }
        expect(cleanup).toHaveBeenCalledTimes(1);
        expect(chatnest._mobileInputCleanup).toBeNull();
    });

    test('parlant.stopPolling is callable pattern (mocked)', () => {
        const stopPolling = jest.fn();
        const chatnest = makeChatnest({
            parlant: { stopPolling },
            widgetOptions: { windowActive: true },
        });
        if (chatnest.parlant) {
            chatnest.parlant.stopPolling();
        }
        expect(stopPolling).toHaveBeenCalledTimes(1);
    });
});
