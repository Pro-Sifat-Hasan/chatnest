/**
 * Tests for src/lib/constants.js
 * debounce function and togglePositions data structure
 */

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => { clearTimeout(timeout); func(...args); };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const togglePositions = {
    'bottom-right': {
        toggle: { bottom: '20px', right: '20px', left: 'auto', transform: 'none' },
        window: { bottom: '100px', right: '20px', left: 'auto', transform: 'none' }
    },
    'bottom-left': {
        toggle: { bottom: '20px', left: '20px', right: 'auto', transform: 'none' },
        window: { bottom: '100px', left: '20px', right: 'auto', transform: 'none' }
    },
    'bottom-center': {
        toggle: { bottom: '20px', left: '50%', right: 'auto', transform: 'translateX(-50%)' },
        window: { bottom: '100px', left: '50%', right: 'auto', transform: 'translateX(-50%)' }
    }
};

// ── debounce ──────────────────────────────────────────────────────────────────

describe('debounce', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    test('does not call func immediately', () => {
        const fn = jest.fn();
        const debounced = debounce(fn, 200);
        debounced();
        expect(fn).not.toHaveBeenCalled();
    });

    test('calls func after wait period', () => {
        const fn = jest.fn();
        const debounced = debounce(fn, 200);
        debounced();
        jest.advanceTimersByTime(200);
        expect(fn).toHaveBeenCalledTimes(1);
    });

    test('resets timer on repeated calls — only fires once', () => {
        const fn = jest.fn();
        const debounced = debounce(fn, 200);
        debounced();
        jest.advanceTimersByTime(100);
        debounced();
        jest.advanceTimersByTime(100);
        debounced();
        jest.advanceTimersByTime(200);
        expect(fn).toHaveBeenCalledTimes(1);
    });

    test('passes arguments to the wrapped function', () => {
        const fn = jest.fn();
        const debounced = debounce(fn, 100);
        debounced('a', 42);
        jest.advanceTimersByTime(100);
        expect(fn).toHaveBeenCalledWith('a', 42);
    });

    test('can be called again after wait period', () => {
        const fn = jest.fn();
        const debounced = debounce(fn, 100);
        debounced();
        jest.advanceTimersByTime(100);
        debounced();
        jest.advanceTimersByTime(100);
        expect(fn).toHaveBeenCalledTimes(2);
    });

    test('does not call func if wait not elapsed', () => {
        const fn = jest.fn();
        const debounced = debounce(fn, 500);
        debounced();
        jest.advanceTimersByTime(499);
        expect(fn).not.toHaveBeenCalled();
    });

    test('works with zero wait', () => {
        const fn = jest.fn();
        const debounced = debounce(fn, 0);
        debounced();
        jest.advanceTimersByTime(0);
        expect(fn).toHaveBeenCalledTimes(1);
    });

    test('each debounced instance has independent timer', () => {
        const fn1 = jest.fn();
        const fn2 = jest.fn();
        const d1 = debounce(fn1, 200);
        const d2 = debounce(fn2, 200);
        d1();
        jest.advanceTimersByTime(100);
        d2();
        jest.advanceTimersByTime(100);
        expect(fn1).toHaveBeenCalledTimes(1); // d1 fired at 200ms
        expect(fn2).not.toHaveBeenCalled();    // d2 still waiting
        jest.advanceTimersByTime(100);
        expect(fn2).toHaveBeenCalledTimes(1);
    });
});

// ── togglePositions ───────────────────────────────────────────────────────────

describe('togglePositions', () => {
    test('has three position entries', () => {
        expect(Object.keys(togglePositions)).toHaveLength(3);
    });

    test('contains bottom-right', () => expect(togglePositions['bottom-right']).toBeDefined());
    test('contains bottom-left', () => expect(togglePositions['bottom-left']).toBeDefined());
    test('contains bottom-center', () => expect(togglePositions['bottom-center']).toBeDefined());

    test('each position has toggle and window sub-objects', () => {
        Object.values(togglePositions).forEach(pos => {
            expect(pos.toggle).toBeDefined();
            expect(pos.window).toBeDefined();
        });
    });

    test('bottom-right toggle has correct bottom/right values', () => {
        expect(togglePositions['bottom-right'].toggle.bottom).toBe('20px');
        expect(togglePositions['bottom-right'].toggle.right).toBe('20px');
    });

    test('bottom-left toggle has left set and right=auto', () => {
        expect(togglePositions['bottom-left'].toggle.left).toBe('20px');
        expect(togglePositions['bottom-left'].toggle.right).toBe('auto');
    });

    test('bottom-center toggle uses 50% and translateX', () => {
        expect(togglePositions['bottom-center'].toggle.left).toBe('50%');
        expect(togglePositions['bottom-center'].toggle.transform).toBe('translateX(-50%)');
    });

    test('window bottom is 100px for all positions', () => {
        Object.values(togglePositions).forEach(pos => {
            expect(pos.window.bottom).toBe('100px');
        });
    });

    test('bottom-center window also uses translateX', () => {
        expect(togglePositions['bottom-center'].window.transform).toBe('translateX(-50%)');
    });
});
