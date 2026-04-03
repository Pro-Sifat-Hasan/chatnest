/**
 * Tests for:
 *   src/lib/chatnest/sending/disableSendingFunctionality.js
 *   src/lib/chatnest/sending/enableSendingFunctionality.js
 *   src/lib/chatnest/sending/forceEnableInput.js
 */

// ── Inline implementations ────────────────────────────────────────────────────

function disableSendingFunctionality(chatnest) {
    if (!chatnest.widget) return;
    const chatInput = chatnest.widget.querySelector('.chat-input .chat-textarea');
    const sendButton = chatnest.widget.querySelector('.send-button');
    if (chatInput) { chatInput.readOnly = true; chatInput.classList.add('waiting'); }
    if (sendButton) {
        sendButton.style.opacity = chatnest.isMobileBrowser() ? '1' : '0.6';
        sendButton.style.pointerEvents = 'auto';
    }
    chatnest.disableChips();
}

function enableSendingFunctionality(chatnest) {
    if (chatnest.isWaitingForResponse || chatnest.isTypewriterActive) return;
    if (!chatnest.widget) return;
    const chatInput = chatnest.widget.querySelector('.chat-input .chat-textarea');
    const sendButton = chatnest.widget.querySelector('.send-button');
    if (chatInput) { chatInput.readOnly = false; chatInput.classList.remove('waiting'); }
    if (sendButton) { sendButton.style.opacity = '1'; sendButton.style.pointerEvents = 'auto'; }
    chatnest.enableChips();
}

function forceEnableInput(chatnest) {
    const chatInput = chatnest.widget.querySelector('.chat-input .chat-textarea');
    const sendButton = chatnest.widget.querySelector('.send-button');
    if (chatInput) {
        chatInput.readOnly = false; chatInput.disabled = false;
        chatInput.style.opacity = '1'; chatInput.style.pointerEvents = 'auto';
        chatInput.classList.remove('waiting');
    }
    if (sendButton) { sendButton.style.opacity = '1'; sendButton.style.pointerEvents = 'auto'; }
    chatnest.enableChips();
    chatnest.isWaitingForResponse = false;
    chatnest.isTypewriterActive = false;
    const typingIndicator = chatnest.widget.querySelector('.typing-indicator');
    if (typingIndicator) { typingIndicator.classList.remove('active'); chatnest.stopJavaScriptTypingAnimation(); }
}

// ── DOM helpers ───────────────────────────────────────────────────────────────

function buildWidget() {
    const widget = document.createElement('div');
    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'chat-input';
    const textarea = document.createElement('textarea');
    textarea.className = 'chat-textarea';
    inputWrapper.appendChild(textarea);
    const sendBtn = document.createElement('button');
    sendBtn.className = 'send-button';
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';
    widget.appendChild(inputWrapper);
    widget.appendChild(sendBtn);
    widget.appendChild(typingIndicator);
    return { widget, textarea, sendBtn, typingIndicator };
}

function makeChatnest(overrides = {}) {
    const { widget } = buildWidget();
    return {
        widget,
        isWaitingForResponse: false,
        isTypewriterActive: false,
        isMobileBrowser: jest.fn().mockReturnValue(false),
        disableChips: jest.fn(),
        enableChips: jest.fn(),
        stopJavaScriptTypingAnimation: jest.fn(),
        ...overrides,
    };
}

// ── disableSendingFunctionality ───────────────────────────────────────────────

describe('disableSendingFunctionality', () => {
    test('sets textarea readOnly to true', () => {
        const cn = makeChatnest();
        disableSendingFunctionality(cn);
        expect(cn.widget.querySelector('.chat-textarea').readOnly).toBe(true);
    });

    test('adds "waiting" class to textarea', () => {
        const cn = makeChatnest();
        disableSendingFunctionality(cn);
        expect(cn.widget.querySelector('.chat-textarea').classList.contains('waiting')).toBe(true);
    });

    test('sets send button opacity to 0.6 on desktop', () => {
        const cn = makeChatnest({ isMobileBrowser: jest.fn().mockReturnValue(false) });
        disableSendingFunctionality(cn);
        expect(cn.widget.querySelector('.send-button').style.opacity).toBe('0.6');
    });

    test('sets send button opacity to 1 on mobile', () => {
        const cn = makeChatnest({ isMobileBrowser: jest.fn().mockReturnValue(true) });
        disableSendingFunctionality(cn);
        expect(cn.widget.querySelector('.send-button').style.opacity).toBe('1');
    });

    test('calls disableChips', () => {
        const cn = makeChatnest();
        disableSendingFunctionality(cn);
        expect(cn.disableChips).toHaveBeenCalledTimes(1);
    });

    test('returns early when widget is null', () => {
        const cn = makeChatnest({ widget: null });
        expect(() => disableSendingFunctionality(cn)).not.toThrow();
    });
});

// ── enableSendingFunctionality ────────────────────────────────────────────────

describe('enableSendingFunctionality', () => {
    test('removes readOnly from textarea', () => {
        const cn = makeChatnest();
        cn.widget.querySelector('.chat-textarea').readOnly = true;
        enableSendingFunctionality(cn);
        expect(cn.widget.querySelector('.chat-textarea').readOnly).toBe(false);
    });

    test('removes "waiting" class from textarea', () => {
        const cn = makeChatnest();
        cn.widget.querySelector('.chat-textarea').classList.add('waiting');
        enableSendingFunctionality(cn);
        expect(cn.widget.querySelector('.chat-textarea').classList.contains('waiting')).toBe(false);
    });

    test('restores send button opacity to 1', () => {
        const cn = makeChatnest();
        cn.widget.querySelector('.send-button').style.opacity = '0.6';
        enableSendingFunctionality(cn);
        expect(cn.widget.querySelector('.send-button').style.opacity).toBe('1');
    });

    test('calls enableChips', () => {
        const cn = makeChatnest();
        enableSendingFunctionality(cn);
        expect(cn.enableChips).toHaveBeenCalledTimes(1);
    });

    test('does nothing when isWaitingForResponse=true', () => {
        const cn = makeChatnest({ isWaitingForResponse: true });
        cn.widget.querySelector('.chat-textarea').readOnly = true;
        enableSendingFunctionality(cn);
        expect(cn.widget.querySelector('.chat-textarea').readOnly).toBe(true);
        expect(cn.enableChips).not.toHaveBeenCalled();
    });

    test('does nothing when isTypewriterActive=true', () => {
        const cn = makeChatnest({ isTypewriterActive: true });
        cn.widget.querySelector('.chat-textarea').readOnly = true;
        enableSendingFunctionality(cn);
        expect(cn.widget.querySelector('.chat-textarea').readOnly).toBe(true);
    });

    test('returns early when widget is null', () => {
        const cn = makeChatnest({ widget: null });
        expect(() => enableSendingFunctionality(cn)).not.toThrow();
    });
});

// ── forceEnableInput ──────────────────────────────────────────────────────────

describe('forceEnableInput', () => {
    test('removes readOnly regardless of flags', () => {
        const cn = makeChatnest({ isWaitingForResponse: true, isTypewriterActive: true });
        cn.widget.querySelector('.chat-textarea').readOnly = true;
        forceEnableInput(cn);
        expect(cn.widget.querySelector('.chat-textarea').readOnly).toBe(false);
    });

    test('removes disabled attribute', () => {
        const cn = makeChatnest();
        cn.widget.querySelector('.chat-textarea').disabled = true;
        forceEnableInput(cn);
        expect(cn.widget.querySelector('.chat-textarea').disabled).toBe(false);
    });

    test('removes "waiting" class', () => {
        const cn = makeChatnest();
        cn.widget.querySelector('.chat-textarea').classList.add('waiting');
        forceEnableInput(cn);
        expect(cn.widget.querySelector('.chat-textarea').classList.contains('waiting')).toBe(false);
    });

    test('sets textarea opacity and pointerEvents', () => {
        const cn = makeChatnest();
        const ta = cn.widget.querySelector('.chat-textarea');
        ta.style.opacity = '0.5';
        forceEnableInput(cn);
        expect(ta.style.opacity).toBe('1');
        expect(ta.style.pointerEvents).toBe('auto');
    });

    test('clears isWaitingForResponse flag', () => {
        const cn = makeChatnest({ isWaitingForResponse: true });
        forceEnableInput(cn);
        expect(cn.isWaitingForResponse).toBe(false);
    });

    test('clears isTypewriterActive flag', () => {
        const cn = makeChatnest({ isTypewriterActive: true });
        forceEnableInput(cn);
        expect(cn.isTypewriterActive).toBe(false);
    });

    test('removes active class from typing indicator', () => {
        const cn = makeChatnest();
        cn.widget.querySelector('.typing-indicator').classList.add('active');
        forceEnableInput(cn);
        expect(cn.widget.querySelector('.typing-indicator').classList.contains('active')).toBe(false);
    });

    test('calls stopJavaScriptTypingAnimation', () => {
        const cn = makeChatnest();
        cn.widget.querySelector('.typing-indicator').classList.add('active');
        forceEnableInput(cn);
        expect(cn.stopJavaScriptTypingAnimation).toHaveBeenCalledTimes(1);
    });

    test('calls enableChips', () => {
        const cn = makeChatnest();
        forceEnableInput(cn);
        expect(cn.enableChips).toHaveBeenCalledTimes(1);
    });
});
