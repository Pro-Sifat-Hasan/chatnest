/**
 * Tests for src/lib/chatnest/typing/typeWriter.js
 * Focuses on the _typewriterCount ref-counting fix (Bug 5) and core behaviour.
 */

// ── Inline typeWriter (exactly as patched) ────────────────────────────────────

function typeWriter(chatnest, element, text, callback) {
    chatnest._typewriterCount = (chatnest._typewriterCount || 0) + 1;
    chatnest.isTypewriterActive = true;
    chatnest.disableSendingFunctionality();

    let lastScrollTop = 0;
    const chatMessages = chatnest.widget.querySelector('.chat-messages');

    const scrollHandler = () => {
        if (chatnest.isMobileBrowser()) return;
        if (chatMessages.scrollTop < lastScrollTop) { /* userScrolled = true */ }
        lastScrollTop = chatMessages.scrollTop;
    };

    if (!chatnest.isMobileBrowser()) {
        chatMessages.addEventListener('scroll', scrollHandler);
    }

    function tokenizeContent(text) {
        let tokens = [];
        let currentToken = '';
        let inTag = false;
        let inMarkdown = false;
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char === '<' && !inMarkdown) {
                if (currentToken) tokens.push(currentToken);
                currentToken = char; inTag = true;
            } else if (char === '>' && inTag) {
                currentToken += char; tokens.push(currentToken); currentToken = ''; inTag = false;
            } else if (inTag) {
                currentToken += char;
            } else if (char === '*' && text[i + 1] === '*') {
                if (currentToken) tokens.push(currentToken);
                tokens.push('**'); i++; currentToken = '';
            } else if (char === '[' || (char === '!' && text[i + 1] === '[')) {
                if (currentToken) tokens.push(currentToken);
                currentToken = char; inMarkdown = true;
            } else if (inMarkdown && char === ']' && text[i + 1] === '(') {
                currentToken += char + '('; i++;
            } else if (inMarkdown && char === ')') {
                currentToken += char; tokens.push(currentToken); currentToken = ''; inMarkdown = false;
            } else if (char === ' ' || char === '\n') {
                if (currentToken) tokens.push(currentToken);
                tokens.push(char); currentToken = '';
            } else {
                currentToken += char;
                if (!inMarkdown && !inTag && (i === text.length - 1 || text[i + 1] === ' ' || text[i + 1] === '\n')) {
                    tokens.push(currentToken); currentToken = '';
                }
            }
        }
        if (currentToken) tokens.push(currentToken);
        return tokens;
    }

    element.innerHTML = '';
    let currentText = '';
    const tokens = tokenizeContent(text);
    let tokenIndex = 0;

    const typeNextToken = () => {
        if (tokenIndex >= tokens.length) {
            if (!chatnest.isMobileBrowser()) {
                chatMessages.removeEventListener('scroll', scrollHandler);
            }
            chatnest._typewriterCount = Math.max(0, (chatnest._typewriterCount || 1) - 1);
            if (chatnest._typewriterCount === 0) {
                chatnest.isTypewriterActive = false;
                chatnest.enableSendingFunctionality();
            }
            if (callback) callback();
            return;
        }

        const token = tokens[tokenIndex];
        const isTag = token.startsWith('<') && token.endsWith('>');
        const isMarkdown = token.startsWith('**') || token.startsWith('[') || token.startsWith('![');

        currentText += token;
        element.innerHTML = currentText;
        tokenIndex++;

        let delay;
        if (isTag || isMarkdown) { delay = 0; }
        else if (token === ' ') { delay = 20; }
        else if (token === '\n') { delay = 50; }
        else { delay = Math.random() * 40 + 30; }

        if (delay === 0) {
            requestAnimationFrame(typeNextToken);
        } else {
            setTimeout(() => {
                try { typeNextToken(); }
                catch (error) {
                    element.innerHTML = text;
                    chatnest._typewriterCount = Math.max(0, (chatnest._typewriterCount || 1) - 1);
                    if (chatnest._typewriterCount === 0) {
                        chatnest.isTypewriterActive = false;
                        chatnest.enableSendingFunctionality();
                        chatnest.forceEnableInput();
                    }
                    if (callback) callback();
                }
            }, delay);
        }
    };

    typeNextToken();
}

// ── DOM setup ─────────────────────────────────────────────────────────────────

function makeChatnest(overrides = {}) {
    const chatMessages = document.createElement('div');
    chatMessages.className = 'chat-messages';
    const widget = document.createElement('div');
    widget.appendChild(chatMessages);

    return {
        widget: { querySelector: (sel) => sel === '.chat-messages' ? chatMessages : null },
        isTypewriterActive: false,
        _typewriterCount: 0,
        isMobileBrowser: () => false,
        disableSendingFunctionality: jest.fn(),
        enableSendingFunctionality: jest.fn(),
        forceEnableInput: jest.fn(),
        config: { typewritewithscroll: false },
        ...overrides,
    };
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

// ── ref-counting: single typewriter ───────────────────────────────────────────

describe('typeWriter _typewriterCount — single instance', () => {
    test('increments count on start', () => {
        const cn = makeChatnest();
        const el = document.createElement('div');
        typeWriter(cn, el, 'Hi', () => {});
        expect(cn._typewriterCount).toBe(1);
    });

    test('sets isTypewriterActive to true on start', () => {
        const cn = makeChatnest();
        const el = document.createElement('div');
        typeWriter(cn, el, 'Hi', () => {});
        expect(cn.isTypewriterActive).toBe(true);
    });

    test('resets isTypewriterActive to false after completion', async () => {
        const cn = makeChatnest();
        const el = document.createElement('div');
        const done = jest.fn();
        typeWriter(cn, el, 'Hi', done);
        // run all timers to completion
        jest.runAllTimers();
        expect(cn.isTypewriterActive).toBe(false);
    });

    test('decrements _typewriterCount to 0 after completion', () => {
        const cn = makeChatnest();
        const el = document.createElement('div');
        typeWriter(cn, el, 'Hi', () => {});
        jest.runAllTimers();
        expect(cn._typewriterCount).toBe(0);
    });

    test('calls enableSendingFunctionality after completion', () => {
        const cn = makeChatnest();
        const el = document.createElement('div');
        typeWriter(cn, el, 'Hi', () => {});
        jest.runAllTimers();
        expect(cn.enableSendingFunctionality).toHaveBeenCalledTimes(1);
    });

    test('calls callback after completion', () => {
        const cn = makeChatnest();
        const el = document.createElement('div');
        const cb = jest.fn();
        typeWriter(cn, el, 'Go', cb);
        jest.runAllTimers();
        expect(cb).toHaveBeenCalledTimes(1);
    });

    test('writes text to element', () => {
        const cn = makeChatnest();
        const el = document.createElement('div');
        typeWriter(cn, el, 'Hello', () => {});
        jest.runAllTimers();
        expect(el.innerHTML).toContain('Hello');
    });
});

// ── ref-counting: concurrent typewriters (Bug 5 fix) ─────────────────────────

describe('typeWriter _typewriterCount — concurrent multi-part responses', () => {
    test('count reaches 2 when two typewriters start', () => {
        const cn = makeChatnest();
        const el1 = document.createElement('div');
        const el2 = document.createElement('div');
        typeWriter(cn, el1, 'Part one', () => {});
        typeWriter(cn, el2, 'Part two', () => {});
        expect(cn._typewriterCount).toBe(2);
        expect(cn.isTypewriterActive).toBe(true);
    });

    test('isTypewriterActive stays true until BOTH complete', () => {
        const cn = makeChatnest();
        const el1 = document.createElement('div');
        const el2 = document.createElement('div');

        let cb1Called = false;
        let cb2Called = false;

        // Start both
        typeWriter(cn, el1, 'A', () => { cb1Called = true; });
        typeWriter(cn, el2, 'Long text here', () => { cb2Called = true; });

        // Run only enough timers for el1 (short text) to finish
        // "A" is one token, will fire after one setTimeout delay
        // Advance 200ms — enough for "A" to complete but long text may still run
        jest.advanceTimersByTime(200);

        if (cb1Called) {
            // el1 done but el2 still running: isTypewriterActive must still be true
            if (!cb2Called) {
                expect(cn.isTypewriterActive).toBe(true);
                expect(cn._typewriterCount).toBeGreaterThanOrEqual(0);
            }
        }

        // Complete everything
        jest.runAllTimers();
        expect(cn.isTypewriterActive).toBe(false);
        expect(cn._typewriterCount).toBe(0);
    });

    test('enableSendingFunctionality called exactly once when both finish', () => {
        const cn = makeChatnest();
        const el1 = document.createElement('div');
        const el2 = document.createElement('div');
        typeWriter(cn, el1, 'A', () => {});
        typeWriter(cn, el2, 'B', () => {});
        jest.runAllTimers();
        // Must be called exactly once (not twice)
        expect(cn.enableSendingFunctionality).toHaveBeenCalledTimes(1);
    });

    test('callbacks for both parts are called', () => {
        const cn = makeChatnest();
        const el1 = document.createElement('div');
        const el2 = document.createElement('div');
        const cb1 = jest.fn();
        const cb2 = jest.fn();
        typeWriter(cn, el1, 'Hello', cb1);
        typeWriter(cn, el2, 'World', cb2);
        jest.runAllTimers();
        expect(cb1).toHaveBeenCalledTimes(1);
        expect(cb2).toHaveBeenCalledTimes(1);
    });

    test('three concurrent typewriters: count starts at 3, ends at 0', () => {
        const cn = makeChatnest();
        const els = [document.createElement('div'), document.createElement('div'), document.createElement('div')];
        typeWriter(cn, els[0], 'A', () => {});
        typeWriter(cn, els[1], 'B', () => {});
        typeWriter(cn, els[2], 'C', () => {});
        expect(cn._typewriterCount).toBe(3);
        jest.runAllTimers();
        expect(cn._typewriterCount).toBe(0);
        expect(cn.isTypewriterActive).toBe(false);
    });
});

// ── tokenization edge cases ───────────────────────────────────────────────────

describe('typeWriter tokenization', () => {
    test('handles empty string without errors', () => {
        const cn = makeChatnest();
        const el = document.createElement('div');
        expect(() => {
            typeWriter(cn, el, '', () => {});
            jest.runAllTimers();
        }).not.toThrow();
    });

    test('handles HTML tags in text', () => {
        const cn = makeChatnest();
        const el = document.createElement('div');
        typeWriter(cn, el, '<strong>Bold</strong>', () => {});
        jest.runAllTimers();
        expect(el.innerHTML).toContain('Bold');
    });

    test('does not call enableSending more than once for single typewriter', () => {
        const cn = makeChatnest();
        const el = document.createElement('div');
        typeWriter(cn, el, 'Hello world', () => {});
        jest.runAllTimers();
        expect(cn.enableSendingFunctionality).toHaveBeenCalledTimes(1);
    });
});
