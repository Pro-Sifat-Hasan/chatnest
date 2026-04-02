/**
 * Tests for events module:
 *   setupClickOutsideToClose, setupSuggestionChips, setupTextBoxEventListeners
 */

// ── Inline implementations ────────────────────────────────────────────────────

function setupClickOutsideToClose(chatnest) {
    if (chatnest._outsideClickHandler) {
        document.removeEventListener('click', chatnest._outsideClickHandler);
    }

    chatnest._outsideClickHandler = (event) => {
        const chatWindow = chatnest.widget?.querySelector('.chat-window');
        if (!chatWindow?.classList.contains('active')) return;
        if (!chatnest.widget?.contains(event.target)) {
            chatnest.closeChat();
        }
    };

    document.addEventListener('click', chatnest._outsideClickHandler);
}

function setupSuggestionChips(chatnest) {
    const chips = chatnest.widget.querySelectorAll('.chip');
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            if (!chatnest.isWaitingForResponse) {
                const message = chip.textContent;
                chatnest.sendMessage(message);
                chatnest.disableChips();
            }
        });
    });

    const style = document.createElement('style');
    style.textContent = `
        .chip { transition: opacity 0.3s ease, background-color 0.3s ease; }
        .chip.disabled { opacity: 0.5; cursor: not-allowed; pointer-events: none; background-color: #e0e0e0; }
    `;
    document.head.appendChild(style);
}

function setupTextBoxEventListeners(chatnest) {
    const textBoxClose = chatnest.widget.querySelector('.chat-text-box-close');
    const textBox = chatnest.widget.querySelector('.chat-text-box');

    if (textBox) {
        if (chatnest.config.showTextBox) {
            textBox.setAttribute('data-persistent', 'true');
            textBox.style.pointerEvents = 'auto';
            textBox.style.visibility = 'visible';
            textBox.style.opacity = '1';
        }

        if (textBoxClose && chatnest.config.showTextBoxCloseButton) {
            textBoxClose.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                chatnest._textBoxManuallyClosed = true;
                textBox.style.display = 'none';
            });
        }
    }
}

// ── Widget builders ───────────────────────────────────────────────────────────

function buildEventsWidget({ hasActive = false, chipTexts = [], hasTextBox = false, hasTextBoxClose = false } = {}) {
    const widget = document.createElement('div');
    widget.className = 'chat-widget';

    const chatWindow = document.createElement('div');
    chatWindow.className = 'chat-window';
    if (hasActive) chatWindow.classList.add('active');
    widget.appendChild(chatWindow);

    chipTexts.forEach(text => {
        const chip = document.createElement('button');
        chip.className = 'chip';
        chip.textContent = text;
        widget.appendChild(chip);
    });

    if (hasTextBox) {
        const textBox = document.createElement('div');
        textBox.className = 'chat-text-box';
        textBox.style.display = 'block';
        if (hasTextBoxClose) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'chat-text-box-close';
            textBox.appendChild(closeBtn);
        }
        widget.appendChild(textBox);
    }

    document.body.appendChild(widget);
    return widget;
}

function makeChatnest(overrides = {}) {
    const widget = overrides.widget || buildEventsWidget(overrides.widgetOptions || {});
    return {
        widget,
        config: {
            showTextBox: false,
            showTextBoxCloseButton: false,
            ...overrides.config,
        },
        isWaitingForResponse: false,
        _textBoxManuallyClosed: false,
        _outsideClickHandler: null,
        closeChat: jest.fn(),
        sendMessage: jest.fn(),
        disableChips: jest.fn(),
        ...overrides,
    };
}

afterEach(() => {
    document.body.innerHTML = '';
    document.head.querySelectorAll('style').forEach(s => s.remove());
    jest.clearAllMocks();
});

// ── setupClickOutsideToClose ──────────────────────────────────────────────────

describe('setupClickOutsideToClose', () => {
    test('registers an _outsideClickHandler on the instance', () => {
        const chatnest = makeChatnest({ widgetOptions: { hasActive: true } });
        setupClickOutsideToClose(chatnest);
        expect(typeof chatnest._outsideClickHandler).toBe('function');
    });

    test('calls closeChat when click is outside the widget and chat is active', () => {
        const chatnest = makeChatnest({ widgetOptions: { hasActive: true } });
        setupClickOutsideToClose(chatnest);
        const outsideEl = document.createElement('div');
        document.body.appendChild(outsideEl);
        outsideEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        expect(chatnest.closeChat).toHaveBeenCalledTimes(1);
    });

    test('does NOT call closeChat when click is inside the widget', () => {
        const chatnest = makeChatnest({ widgetOptions: { hasActive: true } });
        setupClickOutsideToClose(chatnest);
        const insideEl = document.createElement('button');
        chatnest.widget.appendChild(insideEl);
        insideEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        expect(chatnest.closeChat).not.toHaveBeenCalled();
    });

    test('does NOT call closeChat when chat window is not active', () => {
        const chatnest = makeChatnest({ widgetOptions: { hasActive: false } });
        setupClickOutsideToClose(chatnest);
        const outsideEl = document.createElement('div');
        document.body.appendChild(outsideEl);
        outsideEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        expect(chatnest.closeChat).not.toHaveBeenCalled();
    });

    test('removes old handler before registering new one (no duplicate listeners)', () => {
        const chatnest = makeChatnest({ widgetOptions: { hasActive: true } });
        setupClickOutsideToClose(chatnest);
        const firstHandler = chatnest._outsideClickHandler;
        setupClickOutsideToClose(chatnest);
        const secondHandler = chatnest._outsideClickHandler;
        expect(firstHandler).not.toBe(secondHandler);

        const outsideEl = document.createElement('div');
        document.body.appendChild(outsideEl);
        outsideEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        // Should only fire once, not twice
        expect(chatnest.closeChat).toHaveBeenCalledTimes(1);
    });
});

// ── setupSuggestionChips ──────────────────────────────────────────────────────

describe('setupSuggestionChips', () => {
    test('clicking a chip calls sendMessage with chip text', () => {
        const chatnest = makeChatnest({ widgetOptions: { chipTexts: ['Pricing', 'Demo'] } });
        setupSuggestionChips(chatnest);
        const chip = chatnest.widget.querySelector('.chip');
        chip.click();
        expect(chatnest.sendMessage).toHaveBeenCalledWith('Pricing');
    });

    test('clicking a chip calls disableChips', () => {
        const chatnest = makeChatnest({ widgetOptions: { chipTexts: ['Help'] } });
        setupSuggestionChips(chatnest);
        chatnest.widget.querySelector('.chip').click();
        expect(chatnest.disableChips).toHaveBeenCalledTimes(1);
    });

    test('chip click does nothing when isWaitingForResponse is true', () => {
        const chatnest = makeChatnest({ widgetOptions: { chipTexts: ['Pricing'] }, isWaitingForResponse: true });
        setupSuggestionChips(chatnest);
        chatnest.widget.querySelector('.chip').click();
        expect(chatnest.sendMessage).not.toHaveBeenCalled();
        expect(chatnest.disableChips).not.toHaveBeenCalled();
    });

    test('injects a <style> tag into document.head', () => {
        const chatnest = makeChatnest({ widgetOptions: { chipTexts: [] } });
        const before = document.head.querySelectorAll('style').length;
        setupSuggestionChips(chatnest);
        const after = document.head.querySelectorAll('style').length;
        expect(after).toBe(before + 1);
    });

    test('does not throw when there are no chips', () => {
        const chatnest = makeChatnest({ widgetOptions: { chipTexts: [] } });
        expect(() => setupSuggestionChips(chatnest)).not.toThrow();
    });

    test('sends correct message for each chip independently', () => {
        const chatnest = makeChatnest({ widgetOptions: { chipTexts: ['Pricing', 'Demo', 'Support'] } });
        setupSuggestionChips(chatnest);
        const chips = chatnest.widget.querySelectorAll('.chip');
        chips[1].click();
        expect(chatnest.sendMessage).toHaveBeenCalledWith('Demo');
    });
});

// ── setupTextBoxEventListeners ────────────────────────────────────────────────

describe('setupTextBoxEventListeners', () => {
    test('does nothing when no text box in widget', () => {
        const chatnest = makeChatnest({ widgetOptions: { hasTextBox: false } });
        expect(() => setupTextBoxEventListeners(chatnest)).not.toThrow();
    });

    test('sets data-persistent attribute when showTextBox is true', () => {
        const chatnest = makeChatnest({
            widgetOptions: { hasTextBox: true },
            config: { showTextBox: true, showTextBoxCloseButton: false },
        });
        setupTextBoxEventListeners(chatnest);
        const textBox = chatnest.widget.querySelector('.chat-text-box');
        expect(textBox.getAttribute('data-persistent')).toBe('true');
    });

    test('does not set data-persistent when showTextBox is false', () => {
        const chatnest = makeChatnest({
            widgetOptions: { hasTextBox: true },
            config: { showTextBox: false, showTextBoxCloseButton: false },
        });
        setupTextBoxEventListeners(chatnest);
        const textBox = chatnest.widget.querySelector('.chat-text-box');
        expect(textBox.getAttribute('data-persistent')).toBeNull();
    });

    test('sets visible styles when showTextBox is true', () => {
        const chatnest = makeChatnest({
            widgetOptions: { hasTextBox: true },
            config: { showTextBox: true, showTextBoxCloseButton: false },
        });
        setupTextBoxEventListeners(chatnest);
        const textBox = chatnest.widget.querySelector('.chat-text-box');
        expect(textBox.style.opacity).toBe('1');
        expect(textBox.style.visibility).toBe('visible');
        expect(textBox.style.pointerEvents).toBe('auto');
    });

    test('close button hides text box and sets _textBoxManuallyClosed', () => {
        const chatnest = makeChatnest({
            widgetOptions: { hasTextBox: true, hasTextBoxClose: true },
            config: { showTextBox: false, showTextBoxCloseButton: true },
        });
        setupTextBoxEventListeners(chatnest);
        const closeBtn = chatnest.widget.querySelector('.chat-text-box-close');
        closeBtn.click();
        expect(chatnest._textBoxManuallyClosed).toBe(true);
        const textBox = chatnest.widget.querySelector('.chat-text-box');
        expect(textBox.style.display).toBe('none');
    });

    test('close button does nothing when showTextBoxCloseButton is false', () => {
        const chatnest = makeChatnest({
            widgetOptions: { hasTextBox: true, hasTextBoxClose: true },
            config: { showTextBox: false, showTextBoxCloseButton: false },
        });
        setupTextBoxEventListeners(chatnest);
        const closeBtn = chatnest.widget.querySelector('.chat-text-box-close');
        closeBtn.click();
        expect(chatnest._textBoxManuallyClosed).toBe(false);
    });

    test('does not register close listener when no close button in DOM', () => {
        const chatnest = makeChatnest({
            widgetOptions: { hasTextBox: true, hasTextBoxClose: false },
            config: { showTextBox: false, showTextBoxCloseButton: true },
        });
        expect(() => setupTextBoxEventListeners(chatnest)).not.toThrow();
        expect(chatnest._textBoxManuallyClosed).toBe(false);
    });
});
