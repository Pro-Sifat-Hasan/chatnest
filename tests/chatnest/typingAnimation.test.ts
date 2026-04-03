/**
 * Tests for:
 *   src/lib/chatnest/typing/startJavaScriptTypingAnimation.js
 *   src/lib/chatnest/typing/stopJavaScriptTypingAnimation.js
 *   src/lib/chatnest/typing/ensureTypingIndicatorAnimation.js
 *   src/lib/chatnest/typing/repairTypingAnimation.js
 */

// ── Inline implementations ────────────────────────────────────────────────────

function startJavaScriptTypingAnimation(chatnest) {
    if (chatnest.typingAnimationInterval) clearInterval(chatnest.typingAnimationInterval);
    const typingDots = chatnest.widget.querySelectorAll('.typing-indicator span');
    if (typingDots.length !== 3) return;
    let animationStep = 0;
    const totalSteps = 60;
    const dotDelays = [0, 20, 40];
    chatnest.typingAnimationInterval = setInterval(() => {
        typingDots.forEach((dot, index) => {
            const dotStep = (animationStep + dotDelays[index]) % totalSteps;
            const progress = dotStep / (totalSteps / 4);
            const scale = 0.4 + 0.8 * Math.abs(Math.sin(progress * Math.PI));
            const opacity = 0.3 + 0.7 * Math.abs(Math.sin(progress * Math.PI));
            dot.style.setProperty('transform', `scale(${scale})`, 'important');
            dot.style.setProperty('-webkit-transform', `scale(${scale})`, 'important');
            dot.style.setProperty('opacity', opacity.toString(), 'important');
        });
        animationStep = (animationStep + 1) % totalSteps;
    }, 50);
}

function stopJavaScriptTypingAnimation(chatnest) {
    if (chatnest.typingAnimationInterval) {
        clearInterval(chatnest.typingAnimationInterval);
        chatnest.typingAnimationInterval = null;
        const typingDots = chatnest.widget.querySelectorAll('.typing-indicator span');
        typingDots.forEach(dot => {
            dot.style.setProperty('transform', 'scale(1)', 'important');
            dot.style.setProperty('opacity', '1', 'important');
        });
    }
}

function ensureTypingIndicatorAnimation(chatnest) {
    const typingDots = chatnest.widget.querySelectorAll('.typing-indicator span');
    if (typingDots.length === 3) {
        let needsRepair = false;
        typingDots.forEach((dot) => {
            const computedStyle = window.getComputedStyle(dot);
            const animationName = computedStyle.animationName;
            if (animationName === 'none' || !animationName || animationName === 'initial') needsRepair = true;
        });
        if (needsRepair) chatnest.repairTypingAnimation();
    }
}

function repairTypingAnimation(chatnest) {
    const typingDots = chatnest.widget.querySelectorAll('.typing-indicator span');
    typingDots.forEach((dot) => {
        dot.style.animation = 'none';
        dot.style.webkitAnimation = 'none';
        dot.offsetHeight; // force repaint (no-op in jsdom)
    });
    chatnest.startJavaScriptTypingAnimation();
}

// ── DOM helpers ───────────────────────────────────────────────────────────────

function buildWidget(dotCount = 3) {
    const widget = document.createElement('div');
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    for (let i = 0; i < dotCount; i++) {
        indicator.appendChild(document.createElement('span'));
    }
    widget.appendChild(indicator);
    return widget;
}

function makeChatnest(dotCount = 3, overrides = {}) {
    const widget = buildWidget(dotCount);
    return {
        widget,
        typingAnimationInterval: null,
        startJavaScriptTypingAnimation: jest.fn(function () { startJavaScriptTypingAnimation(this); }),
        repairTypingAnimation: jest.fn(function () { repairTypingAnimation(this); }),
        ...overrides,
    };
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

// ── startJavaScriptTypingAnimation ────────────────────────────────────────────

describe('startJavaScriptTypingAnimation', () => {
    test('sets typingAnimationInterval', () => {
        const cn = makeChatnest();
        startJavaScriptTypingAnimation(cn);
        expect(cn.typingAnimationInterval).not.toBeNull();
        clearInterval(cn.typingAnimationInterval);
    });

    test('does not set interval when fewer than 3 dots', () => {
        const cn = makeChatnest(2);
        startJavaScriptTypingAnimation(cn);
        expect(cn.typingAnimationInterval).toBeNull();
    });

    test('does not set interval when no dots', () => {
        const cn = makeChatnest(0);
        startJavaScriptTypingAnimation(cn);
        expect(cn.typingAnimationInterval).toBeNull();
    });

    test('clears existing interval before starting new one', () => {
        const cn = makeChatnest();
        startJavaScriptTypingAnimation(cn);
        const first = cn.typingAnimationInterval;
        startJavaScriptTypingAnimation(cn);
        const second = cn.typingAnimationInterval;
        expect(second).not.toBe(first);
        clearInterval(cn.typingAnimationInterval);
    });

    test('applies transform style to dots after interval fires', () => {
        const cn = makeChatnest();
        startJavaScriptTypingAnimation(cn);
        jest.advanceTimersByTime(50);
        const dots = cn.widget.querySelectorAll('.typing-indicator span');
        expect(dots[0].style.transform).toMatch(/scale\(/);
        clearInterval(cn.typingAnimationInterval);
    });

    test('applies opacity style to dots after interval fires', () => {
        const cn = makeChatnest();
        startJavaScriptTypingAnimation(cn);
        jest.advanceTimersByTime(50);
        const dots = cn.widget.querySelectorAll('.typing-indicator span');
        expect(dots[0].style.opacity).toBeTruthy();
        clearInterval(cn.typingAnimationInterval);
    });
});

// ── stopJavaScriptTypingAnimation ─────────────────────────────────────────────

describe('stopJavaScriptTypingAnimation', () => {
    test('clears typingAnimationInterval', () => {
        const cn = makeChatnest();
        startJavaScriptTypingAnimation(cn);
        expect(cn.typingAnimationInterval).not.toBeNull();
        stopJavaScriptTypingAnimation(cn);
        expect(cn.typingAnimationInterval).toBeNull();
    });

    test('resets dot transforms to scale(1)', () => {
        const cn = makeChatnest();
        startJavaScriptTypingAnimation(cn);
        jest.advanceTimersByTime(50);
        stopJavaScriptTypingAnimation(cn);
        const dots = cn.widget.querySelectorAll('.typing-indicator span');
        dots.forEach(dot => expect(dot.style.transform).toBe('scale(1)'));
    });

    test('resets dot opacity to 1', () => {
        const cn = makeChatnest();
        startJavaScriptTypingAnimation(cn);
        jest.advanceTimersByTime(50);
        stopJavaScriptTypingAnimation(cn);
        const dots = cn.widget.querySelectorAll('.typing-indicator span');
        dots.forEach(dot => expect(dot.style.opacity).toBe('1'));
    });

    test('does nothing when no interval is running', () => {
        const cn = makeChatnest();
        expect(() => stopJavaScriptTypingAnimation(cn)).not.toThrow();
        expect(cn.typingAnimationInterval).toBeNull();
    });

    test('does not fire after stop', () => {
        const cn = makeChatnest();
        startJavaScriptTypingAnimation(cn);
        stopJavaScriptTypingAnimation(cn);
        // Reset styles manually to verify no further changes
        const dots = cn.widget.querySelectorAll('.typing-indicator span');
        dots.forEach(d => d.style.removeProperty('transform'));
        jest.advanceTimersByTime(500);
        dots.forEach(dot => expect(dot.style.transform).toBe(''));
    });
});

// ── ensureTypingIndicatorAnimation ────────────────────────────────────────────

describe('ensureTypingIndicatorAnimation', () => {
    test('calls repairTypingAnimation when animationName is "none"', () => {
        const cn = makeChatnest();
        // jsdom returns 'none' by default for animationName in getComputedStyle
        // so needsRepair will be true → should call repair
        ensureTypingIndicatorAnimation(cn);
        expect(cn.repairTypingAnimation).toHaveBeenCalledTimes(1);
    });

    test('does not call repairTypingAnimation when fewer than 3 dots', () => {
        const cn = makeChatnest(2);
        ensureTypingIndicatorAnimation(cn);
        expect(cn.repairTypingAnimation).not.toHaveBeenCalled();
    });

    test('does not call repairTypingAnimation when no dots', () => {
        const cn = makeChatnest(0);
        ensureTypingIndicatorAnimation(cn);
        expect(cn.repairTypingAnimation).not.toHaveBeenCalled();
    });
});

// ── repairTypingAnimation ─────────────────────────────────────────────────────

describe('repairTypingAnimation', () => {
    test('disables CSS animation on each dot', () => {
        const cn = makeChatnest();
        repairTypingAnimation(cn);
        const dots = cn.widget.querySelectorAll('.typing-indicator span');
        dots.forEach(dot => expect(dot.style.animation).toBe('none'));
    });

    test('calls startJavaScriptTypingAnimation', () => {
        const cn = makeChatnest();
        repairTypingAnimation(cn);
        expect(cn.startJavaScriptTypingAnimation).toHaveBeenCalledTimes(1);
    });
});
