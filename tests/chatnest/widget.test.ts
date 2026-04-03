/**
 * Tests for widget module:
 *   applyToggleButtonAnimation, disableToggleButtonAnimation, enableToggleButtonAnimation,
 *   ensureSendButtonIconSize, eraseChat, setupEraseButton, destroy
 */

// ── Inline implementations ────────────────────────────────────────────────────

function applyToggleButtonAnimation(chatnest) {
    const chatToggle = chatnest.widget.querySelector('.chat-toggle');
    if (chatToggle && chatnest.config.toggleButtonAnimation > 0) {
        chatToggle.classList.remove('animation-1', 'animation-2', 'animation-3', 'animation-4', 'animation-5');
        chatToggle.classList.add(`animation-${chatnest.config.toggleButtonAnimation}`);
    }
}

function disableToggleButtonAnimation(chatnest) {
    const chatToggle = chatnest.widget.querySelector('.chat-toggle');
    if (chatToggle) {
        chatToggle.classList.remove('animation-1', 'animation-2', 'animation-3', 'animation-4', 'animation-5');
    }
}

function enableToggleButtonAnimation(chatnest) {
    const chatToggle = chatnest.widget.querySelector('.chat-toggle');
    if (chatToggle && chatnest.config.toggleButtonAnimation > 0) {
        chatToggle.classList.add(`animation-${chatnest.config.toggleButtonAnimation}`);
    }
}

function ensureSendButtonIconSize(chatnest) {
    const sendButton = chatnest.widget.querySelector('.send-button');
    const sendButtonImg = chatnest.widget.querySelector('.send-button img');

    if (sendButton && sendButtonImg) {
        const iconSize = chatnest.config.sendButtonIconSize;
        sendButton.style.width = `${iconSize + 16}px`;
        sendButton.style.height = `${iconSize + 16}px`;
        sendButton.style.minWidth = `${iconSize + 16}px`;
        sendButton.style.minHeight = `${iconSize + 16}px`;
        sendButtonImg.style.width = `${iconSize}px`;
        sendButtonImg.style.height = `${iconSize}px`;
        sendButtonImg.style.minWidth = `${iconSize}px`;
        sendButtonImg.style.minHeight = `${iconSize}px`;
        sendButtonImg.style.maxWidth = `${iconSize}px`;
        sendButtonImg.style.maxHeight = `${iconSize}px`;
        sendButtonImg.style.objectFit = 'contain';
        sendButtonImg.style.display = 'block';
        sendButtonImg.style.flexShrink = '0';
    }
}

function setupEraseButton(chatnest) {
    const eraseButton = chatnest.widget?.querySelector('.erase-chat');
    if (!eraseButton) return;

    if (eraseButton._eraseChatHandler) {
        eraseButton.removeEventListener('click', eraseButton._eraseChatHandler);
    }

    const handler = () => chatnest.eraseChat();
    eraseButton._eraseChatHandler = handler;
    eraseButton.addEventListener('click', handler);
}

function eraseChat(chatnest) {
    if (!confirm('Are you sure you want to clear the chat history? This action cannot be undone.')) {
        return;
    }

    const eraseButton = chatnest.widget?.querySelector('.erase-chat');
    if (eraseButton) {
        eraseButton.style.opacity = '0.5';
        eraseButton.disabled = true;
    }

    try {
        const chatMessages = chatnest.widget.querySelector('.chat-messages');
        const messages = chatMessages.querySelectorAll('.message-row');

        messages.forEach(message => {
            if (message.id !== 'greeting-row' && !message.classList.contains('hubspot-form-row')) {
                message.remove();
            }
        });

        chatnest.storageManager.clearHistory();

        if (chatnest.config.enableServerHistoryDelete === true && chatnest.config.deleteEndpoint) {
            chatnest.deleteBackendHistory()
                .then(() => {})
                .catch(error => {
                    console.error('Failed to delete backend history:', error);
                });
        }

        const existingGreeting = chatMessages.querySelector('#greeting-row');
        if (!existingGreeting) {
            chatnest.addGreetingMessage();
        } else {
            const greetingHasAvatar = existingGreeting.querySelector('.ai-avatar');
            if (!greetingHasAvatar) {
                existingGreeting.remove();
                chatnest.addGreetingMessage();
            }
        }

        const chatInput = chatnest.widget.querySelector('.chat-input .chat-textarea');
        if (chatInput) {
            chatInput.value = '';
        }
    } catch (error) {
        console.error('Error during chat erasure:', error);
        chatnest.addMessage('Failed to clear chat history. Please try again.', 'bot', false, { isError: true });
    } finally {
        if (eraseButton) {
            eraseButton.style.opacity = '1';
            eraseButton.disabled = false;
        }
    }
}

function destroy(chatnest) {
    if (chatnest._mobileInputCleanup) {
        chatnest._mobileInputCleanup();
        chatnest._mobileInputCleanup = null;
    }

    if (chatnest._mobileFullscreenCleanup) {
        chatnest._mobileFullscreenCleanup();
        chatnest._mobileFullscreenCleanup = null;
    }

    chatnest._mobileInputSetup = false;

    if (chatnest._typingIndicatorInterval) {
        clearInterval(chatnest._typingIndicatorInterval);
        chatnest._typingIndicatorInterval = null;
    }

    chatnest.removeActiveForm();

    if (chatnest.parlant) {
        chatnest.parlant.cleanup();
    }

    if (chatnest.supabaseManager) {
        chatnest.supabaseManager.stopRealtimeSync?.();
        chatnest.supabaseManager.stopRealtimeSubscription?.();
        chatnest.supabaseManager.stopBackgroundRefresh?.();
    }

    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.documentElement.style.overflow = '';

    if (chatnest.widget) {
        chatnest.widget.remove();
        chatnest.widget = null;
    }

    if (window.chatWidgetInstances) {
        const idx = window.chatWidgetInstances.indexOf(chatnest);
        if (idx !== -1) window.chatWidgetInstances.splice(idx, 1);
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildWidget({ animationClass = null } = {}) {
    const widget = document.createElement('div');

    const chatToggle = document.createElement('button');
    chatToggle.className = 'chat-toggle';
    if (animationClass) chatToggle.classList.add(animationClass);
    widget.appendChild(chatToggle);

    const sendButton = document.createElement('button');
    sendButton.className = 'send-button';
    const sendImg = document.createElement('img');
    sendButton.appendChild(sendImg);
    widget.appendChild(sendButton);

    const eraseBtn = document.createElement('button');
    eraseBtn.className = 'erase-chat';
    widget.appendChild(eraseBtn);

    const chatMessages = document.createElement('div');
    chatMessages.className = 'chat-messages';
    widget.appendChild(chatMessages);

    const chatInput = document.createElement('textarea');
    chatInput.className = 'chat-textarea';
    const chatInputWrapper = document.createElement('div');
    chatInputWrapper.className = 'chat-input';
    chatInputWrapper.appendChild(chatInput);
    widget.appendChild(chatInputWrapper);

    document.body.appendChild(widget);
    return widget;
}

function makeChatnest(overrides = {}) {
    const widget = overrides.widget !== undefined ? overrides.widget : buildWidget(overrides.widgetOptions || {});
    return {
        widget,
        config: {
            toggleButtonAnimation: 2,
            sendButtonIconSize: 24,
            enableServerHistoryDelete: false,
            deleteEndpoint: null,
            ...overrides.config,
        },
        _mobileInputSetup: false,
        _mobileInputCleanup: null,
        _mobileFullscreenCleanup: null,
        _typingIndicatorInterval: null,
        parlant: null,
        supabaseManager: null,
        activeForm: null,
        storageManager: { clearHistory: jest.fn() },
        removeActiveForm: jest.fn(),
        addGreetingMessage: jest.fn(),
        addMessage: jest.fn(),
        deleteBackendHistory: jest.fn().mockResolvedValue({}),
        eraseChat: jest.fn(),
        ...overrides,
    };
}

afterEach(() => {
    document.body.innerHTML = '';
    delete window.chatWidgetInstances;
    jest.clearAllMocks();
});

// ── applyToggleButtonAnimation ────────────────────────────────────────────────

describe('applyToggleButtonAnimation', () => {
    test('adds animation-N class based on config value', () => {
        const chatnest = makeChatnest({ config: { toggleButtonAnimation: 3, sendButtonIconSize: 24 } });
        applyToggleButtonAnimation(chatnest);
        expect(chatnest.widget.querySelector('.chat-toggle').classList.contains('animation-3')).toBe(true);
    });

    test('does nothing when toggleButtonAnimation is 0', () => {
        const chatnest = makeChatnest({ config: { toggleButtonAnimation: 0, sendButtonIconSize: 24 } });
        applyToggleButtonAnimation(chatnest);
        const toggle = chatnest.widget.querySelector('.chat-toggle');
        [1,2,3,4,5].forEach(n => {
            expect(toggle.classList.contains(`animation-${n}`)).toBe(false);
        });
    });

    test('removes other animation classes before adding the new one', () => {
        const widget = buildWidget({ animationClass: 'animation-5' });
        const chatnest = makeChatnest({ widget, config: { toggleButtonAnimation: 1, sendButtonIconSize: 24 } });
        applyToggleButtonAnimation(chatnest);
        const toggle = chatnest.widget.querySelector('.chat-toggle');
        expect(toggle.classList.contains('animation-1')).toBe(true);
        expect(toggle.classList.contains('animation-5')).toBe(false);
    });

    test('supports all animation values 1-5', () => {
        for (let i = 1; i <= 5; i++) {
            document.body.innerHTML = '';
            const chatnest = makeChatnest({ config: { toggleButtonAnimation: i, sendButtonIconSize: 24 } });
            applyToggleButtonAnimation(chatnest);
            expect(chatnest.widget.querySelector('.chat-toggle').classList.contains(`animation-${i}`)).toBe(true);
        }
    });

    test('does nothing when chat-toggle is not in widget', () => {
        const widget = document.createElement('div');
        document.body.appendChild(widget);
        const chatnest = makeChatnest({ widget, config: { toggleButtonAnimation: 2, sendButtonIconSize: 24 } });
        expect(() => applyToggleButtonAnimation(chatnest)).not.toThrow();
    });
});

// ── disableToggleButtonAnimation ──────────────────────────────────────────────

describe('disableToggleButtonAnimation', () => {
    test('removes all animation classes', () => {
        const widget = buildWidget({ animationClass: 'animation-3' });
        const chatnest = makeChatnest({ widget });
        disableToggleButtonAnimation(chatnest);
        const toggle = widget.querySelector('.chat-toggle');
        [1,2,3,4,5].forEach(n => {
            expect(toggle.classList.contains(`animation-${n}`)).toBe(false);
        });
    });

    test('does not throw when chat-toggle is missing', () => {
        const widget = document.createElement('div');
        document.body.appendChild(widget);
        const chatnest = makeChatnest({ widget });
        expect(() => disableToggleButtonAnimation(chatnest)).not.toThrow();
    });

    test('is safe to call when no animation classes are present', () => {
        const chatnest = makeChatnest();
        expect(() => disableToggleButtonAnimation(chatnest)).not.toThrow();
    });
});

// ── enableToggleButtonAnimation ───────────────────────────────────────────────

describe('enableToggleButtonAnimation', () => {
    test('adds the configured animation class', () => {
        const chatnest = makeChatnest({ config: { toggleButtonAnimation: 4, sendButtonIconSize: 24 } });
        enableToggleButtonAnimation(chatnest);
        expect(chatnest.widget.querySelector('.chat-toggle').classList.contains('animation-4')).toBe(true);
    });

    test('does nothing when toggleButtonAnimation is 0', () => {
        const chatnest = makeChatnest({ config: { toggleButtonAnimation: 0, sendButtonIconSize: 24 } });
        enableToggleButtonAnimation(chatnest);
        const toggle = chatnest.widget.querySelector('.chat-toggle');
        [1,2,3,4,5].forEach(n => {
            expect(toggle.classList.contains(`animation-${n}`)).toBe(false);
        });
    });

    test('does not throw when chat-toggle is missing', () => {
        const widget = document.createElement('div');
        document.body.appendChild(widget);
        const chatnest = makeChatnest({ widget });
        expect(() => enableToggleButtonAnimation(chatnest)).not.toThrow();
    });
});

// ── ensureSendButtonIconSize ──────────────────────────────────────────────────

describe('ensureSendButtonIconSize', () => {
    test('sets button dimensions to iconSize + 16', () => {
        const chatnest = makeChatnest({ config: { toggleButtonAnimation: 2, sendButtonIconSize: 24 } });
        ensureSendButtonIconSize(chatnest);
        const btn = chatnest.widget.querySelector('.send-button');
        expect(btn.style.width).toBe('40px');
        expect(btn.style.height).toBe('40px');
        expect(btn.style.minWidth).toBe('40px');
        expect(btn.style.minHeight).toBe('40px');
    });

    test('sets img dimensions to iconSize', () => {
        const chatnest = makeChatnest({ config: { toggleButtonAnimation: 2, sendButtonIconSize: 20 } });
        ensureSendButtonIconSize(chatnest);
        const img = chatnest.widget.querySelector('.send-button img');
        expect(img.style.width).toBe('20px');
        expect(img.style.height).toBe('20px');
        expect(img.style.maxWidth).toBe('20px');
        expect(img.style.maxHeight).toBe('20px');
    });

    test('sets objectFit contain on img', () => {
        const chatnest = makeChatnest({ config: { toggleButtonAnimation: 2, sendButtonIconSize: 24 } });
        ensureSendButtonIconSize(chatnest);
        expect(chatnest.widget.querySelector('.send-button img').style.objectFit).toBe('contain');
    });

    test('does not throw when send button is missing', () => {
        const widget = document.createElement('div');
        document.body.appendChild(widget);
        const chatnest = makeChatnest({ widget });
        expect(() => ensureSendButtonIconSize(chatnest)).not.toThrow();
    });

    test('does not throw when send button img is missing', () => {
        const widget = document.createElement('div');
        const btn = document.createElement('button');
        btn.className = 'send-button';
        widget.appendChild(btn);
        document.body.appendChild(widget);
        const chatnest = makeChatnest({ widget });
        expect(() => ensureSendButtonIconSize(chatnest)).not.toThrow();
    });

    test('works correctly with different icon sizes', () => {
        const sizes = [16, 24, 32, 48];
        sizes.forEach(size => {
            document.body.innerHTML = '';
            const chatnest = makeChatnest({ config: { toggleButtonAnimation: 2, sendButtonIconSize: size } });
            ensureSendButtonIconSize(chatnest);
            const btn = chatnest.widget.querySelector('.send-button');
            expect(btn.style.width).toBe(`${size + 16}px`);
        });
    });
});

// ── setupEraseButton ──────────────────────────────────────────────────────────

describe('setupEraseButton', () => {
    test('attaches click handler to erase button that calls eraseChat', () => {
        const chatnest = makeChatnest();
        setupEraseButton(chatnest);
        const eraseBtn = chatnest.widget.querySelector('.erase-chat');
        eraseBtn.click();
        expect(chatnest.eraseChat).toHaveBeenCalledTimes(1);
    });

    test('does not throw when erase button is missing', () => {
        const widget = document.createElement('div');
        document.body.appendChild(widget);
        const chatnest = makeChatnest({ widget });
        expect(() => setupEraseButton(chatnest)).not.toThrow();
    });

    test('replaces existing handler on second call (no duplicate listeners)', () => {
        const chatnest = makeChatnest();
        setupEraseButton(chatnest);
        setupEraseButton(chatnest);
        const eraseBtn = chatnest.widget.querySelector('.erase-chat');
        eraseBtn.click();
        expect(chatnest.eraseChat).toHaveBeenCalledTimes(1);
    });

    test('stores handler reference on element as _eraseChatHandler', () => {
        const chatnest = makeChatnest();
        setupEraseButton(chatnest);
        const eraseBtn = chatnest.widget.querySelector('.erase-chat');
        expect(typeof eraseBtn._eraseChatHandler).toBe('function');
    });
});

// ── eraseChat ─────────────────────────────────────────────────────────────────

describe('eraseChat', () => {
    beforeEach(() => {
        global.confirm = jest.fn().mockReturnValue(true);
    });

    afterEach(() => {
        delete global.confirm;
    });

    test('does nothing when user cancels the confirmation dialog', () => {
        global.confirm.mockReturnValue(false);
        const chatnest = makeChatnest();
        // Override eraseChat to use the real implementation for this test
        const realEraseChat = eraseChat;
        realEraseChat(chatnest);
        expect(chatnest.storageManager.clearHistory).not.toHaveBeenCalled();
    });

    test('clears non-greeting messages from the DOM', () => {
        const chatnest = makeChatnest();
        const chatMessages = chatnest.widget.querySelector('.chat-messages');

        // Greeting must have an .ai-avatar so eraseChat keeps it
        const greeting = document.createElement('div');
        greeting.className = 'message-row';
        greeting.id = 'greeting-row';
        const avatar = document.createElement('div');
        avatar.className = 'ai-avatar';
        greeting.appendChild(avatar);
        chatMessages.appendChild(greeting);

        const userMsg = document.createElement('div');
        userMsg.className = 'message-row';
        chatMessages.appendChild(userMsg);

        const botMsg = document.createElement('div');
        botMsg.className = 'message-row';
        chatMessages.appendChild(botMsg);

        eraseChat(chatnest);

        expect(chatMessages.querySelectorAll('.message-row').length).toBe(1);
        expect(chatMessages.querySelector('#greeting-row')).not.toBeNull();
    });

    test('calls storageManager.clearHistory', () => {
        const chatnest = makeChatnest();
        const chatMessages = chatnest.widget.querySelector('.chat-messages');
        const greeting = document.createElement('div');
        greeting.id = 'greeting-row';
        greeting.className = 'message-row';
        const avatar = document.createElement('div');
        avatar.className = 'ai-avatar';
        greeting.appendChild(avatar);
        chatMessages.appendChild(greeting);

        eraseChat(chatnest);
        expect(chatnest.storageManager.clearHistory).toHaveBeenCalledTimes(1);
    });

    test('clears the chat input value', () => {
        const chatnest = makeChatnest();
        const chatInput = chatnest.widget.querySelector('.chat-textarea');
        chatInput.value = 'some text';

        const chatMessages = chatnest.widget.querySelector('.chat-messages');
        const greeting = document.createElement('div');
        greeting.id = 'greeting-row';
        greeting.className = 'message-row';
        const avatar = document.createElement('div');
        avatar.className = 'ai-avatar';
        greeting.appendChild(avatar);
        chatMessages.appendChild(greeting);

        eraseChat(chatnest);
        expect(chatInput.value).toBe('');
    });

    test('calls addGreetingMessage if greeting row is missing', () => {
        const chatnest = makeChatnest();
        eraseChat(chatnest);
        expect(chatnest.addGreetingMessage).toHaveBeenCalledTimes(1);
    });

    test('does not call deleteBackendHistory when enableServerHistoryDelete is false', () => {
        const chatnest = makeChatnest({ config: { toggleButtonAnimation: 2, sendButtonIconSize: 24, enableServerHistoryDelete: false, deleteEndpoint: null } });
        eraseChat(chatnest);
        expect(chatnest.deleteBackendHistory).not.toHaveBeenCalled();
    });

    test('calls deleteBackendHistory when enableServerHistoryDelete is true and deleteEndpoint set', () => {
        const chatnest = makeChatnest({
            config: { toggleButtonAnimation: 2, sendButtonIconSize: 24, enableServerHistoryDelete: true, deleteEndpoint: 'https://api.example.com/delete' },
        });
        eraseChat(chatnest);
        expect(chatnest.deleteBackendHistory).toHaveBeenCalledTimes(1);
    });

    test('re-enables erase button after completion', () => {
        const chatnest = makeChatnest();
        const eraseBtn = chatnest.widget.querySelector('.erase-chat');

        const chatMessages = chatnest.widget.querySelector('.chat-messages');
        const greeting = document.createElement('div');
        greeting.id = 'greeting-row';
        greeting.className = 'message-row';
        const avatar = document.createElement('div');
        avatar.className = 'ai-avatar';
        greeting.appendChild(avatar);
        chatMessages.appendChild(greeting);

        eraseChat(chatnest);
        expect(eraseBtn.disabled).toBe(false);
        expect(eraseBtn.style.opacity).toBe('1');
    });

    test('preserves hubspot-form-row elements', () => {
        const chatnest = makeChatnest();
        const chatMessages = chatnest.widget.querySelector('.chat-messages');

        const hubspotRow = document.createElement('div');
        hubspotRow.className = 'message-row hubspot-form-row';
        chatMessages.appendChild(hubspotRow);

        const userMsg = document.createElement('div');
        userMsg.className = 'message-row';
        chatMessages.appendChild(userMsg);

        eraseChat(chatnest);
        expect(chatMessages.querySelector('.hubspot-form-row')).not.toBeNull();
    });
});

// ── destroy ───────────────────────────────────────────────────────────────────

describe('destroy', () => {
    test('removes widget from DOM and sets widget to null', () => {
        const chatnest = makeChatnest();
        expect(document.body.contains(chatnest.widget)).toBe(true);
        destroy(chatnest);
        expect(chatnest.widget).toBeNull();
    });

    test('calls _mobileInputCleanup if present', () => {
        const cleanup = jest.fn();
        const chatnest = makeChatnest({ _mobileInputCleanup: cleanup });
        destroy(chatnest);
        expect(cleanup).toHaveBeenCalledTimes(1);
        expect(chatnest._mobileInputCleanup).toBeNull();
    });

    test('calls _mobileFullscreenCleanup if present', () => {
        const cleanup = jest.fn();
        const chatnest = makeChatnest({ _mobileFullscreenCleanup: cleanup });
        destroy(chatnest);
        expect(cleanup).toHaveBeenCalledTimes(1);
        expect(chatnest._mobileFullscreenCleanup).toBeNull();
    });

    test('clears _typingIndicatorInterval', () => {
        const intervalId = setInterval(() => {}, 99999);
        const chatnest = makeChatnest({ _typingIndicatorInterval: intervalId });
        destroy(chatnest);
        expect(chatnest._typingIndicatorInterval).toBeNull();
    });

    test('calls removeActiveForm', () => {
        const chatnest = makeChatnest();
        destroy(chatnest);
        expect(chatnest.removeActiveForm).toHaveBeenCalledTimes(1);
    });

    test('calls parlant.cleanup if parlant is present', () => {
        const cleanup = jest.fn();
        const chatnest = makeChatnest({ parlant: { cleanup } });
        destroy(chatnest);
        expect(cleanup).toHaveBeenCalledTimes(1);
    });

    test('calls supabaseManager stop methods if present', () => {
        const stopRealtimeSync = jest.fn();
        const stopRealtimeSubscription = jest.fn();
        const stopBackgroundRefresh = jest.fn();
        const chatnest = makeChatnest({
            supabaseManager: { stopRealtimeSync, stopRealtimeSubscription, stopBackgroundRefresh },
        });
        destroy(chatnest);
        expect(stopRealtimeSync).toHaveBeenCalledTimes(1);
        expect(stopRealtimeSubscription).toHaveBeenCalledTimes(1);
        expect(stopBackgroundRefresh).toHaveBeenCalledTimes(1);
    });

    test('resets _mobileInputSetup to false', () => {
        const chatnest = makeChatnest({ _mobileInputSetup: true });
        destroy(chatnest);
        expect(chatnest._mobileInputSetup).toBe(false);
    });

    test('removes from window.chatWidgetInstances if present', () => {
        const chatnest = makeChatnest();
        window.chatWidgetInstances = [chatnest, {}];
        destroy(chatnest);
        expect(window.chatWidgetInstances.includes(chatnest)).toBe(false);
        expect(window.chatWidgetInstances.length).toBe(1);
    });

    test('does not throw when widget is already null', () => {
        const chatnest = makeChatnest({ widget: null });
        expect(() => destroy(chatnest)).not.toThrow();
    });

    test('resets body overflow styles', () => {
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        const chatnest = makeChatnest();
        destroy(chatnest);
        expect(document.body.style.overflow).toBe('');
        expect(document.body.style.position).toBe('');
    });
});
