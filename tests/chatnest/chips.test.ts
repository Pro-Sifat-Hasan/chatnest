/**
 * Tests for chips module:
 *   disableChips, enableChips
 */

// ── Inline implementations ────────────────────────────────────────────────────

function disableChips(chatnest) {
    const chips = chatnest.widget.querySelectorAll('.chip');
    chips.forEach(chip => chip.classList.add('disabled'));
}

function enableChips(chatnest) {
    const chips = chatnest.widget.querySelectorAll('.chip');
    chips.forEach(chip => chip.classList.remove('disabled'));
}

// ── Widget builder ────────────────────────────────────────────────────────────

function buildChipsWidget(chipTexts = []) {
    const widget = document.createElement('div');
    chipTexts.forEach(text => {
        const chip = document.createElement('button');
        chip.className = 'chip';
        chip.textContent = text;
        widget.appendChild(chip);
    });
    document.body.appendChild(widget);
    return widget;
}

function makeChatnest(chipTexts = []) {
    return { widget: buildChipsWidget(chipTexts) };
}

afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
});

// ── disableChips ──────────────────────────────────────────────────────────────

describe('disableChips', () => {
    test('adds disabled class to every chip', () => {
        const chatnest = makeChatnest(['Option A', 'Option B', 'Option C']);
        disableChips(chatnest);
        const chips = chatnest.widget.querySelectorAll('.chip');
        chips.forEach(chip => {
            expect(chip.classList.contains('disabled')).toBe(true);
        });
    });

    test('does not throw when there are no chips', () => {
        const chatnest = makeChatnest([]);
        expect(() => disableChips(chatnest)).not.toThrow();
    });

    test('is idempotent — calling twice still results in disabled class', () => {
        const chatnest = makeChatnest(['A']);
        disableChips(chatnest);
        disableChips(chatnest);
        const chip = chatnest.widget.querySelector('.chip');
        expect(chip.classList.contains('disabled')).toBe(true);
    });

    test('only affects .chip elements, not other children', () => {
        const widget = buildChipsWidget(['Chip']);
        const otherEl = document.createElement('div');
        otherEl.className = 'other';
        widget.appendChild(otherEl);
        const chatnest = { widget };
        disableChips(chatnest);
        expect(otherEl.classList.contains('disabled')).toBe(false);
    });

    test('disables a single chip', () => {
        const chatnest = makeChatnest(['Single']);
        disableChips(chatnest);
        expect(chatnest.widget.querySelector('.chip').classList.contains('disabled')).toBe(true);
    });
});

// ── enableChips ───────────────────────────────────────────────────────────────

describe('enableChips', () => {
    test('removes disabled class from every chip', () => {
        const chatnest = makeChatnest(['A', 'B', 'C']);
        // First disable them all
        disableChips(chatnest);
        enableChips(chatnest);
        const chips = chatnest.widget.querySelectorAll('.chip');
        chips.forEach(chip => {
            expect(chip.classList.contains('disabled')).toBe(false);
        });
    });

    test('does not throw when there are no chips', () => {
        const chatnest = makeChatnest([]);
        expect(() => enableChips(chatnest)).not.toThrow();
    });

    test('is idempotent on already-enabled chips', () => {
        const chatnest = makeChatnest(['A']);
        enableChips(chatnest);
        enableChips(chatnest);
        const chip = chatnest.widget.querySelector('.chip');
        expect(chip.classList.contains('disabled')).toBe(false);
    });

    test('enables chips that were manually disabled', () => {
        const chatnest = makeChatnest(['X', 'Y']);
        // Manually add disabled to one chip
        chatnest.widget.querySelectorAll('.chip')[0].classList.add('disabled');
        enableChips(chatnest);
        const chips = chatnest.widget.querySelectorAll('.chip');
        chips.forEach(chip => {
            expect(chip.classList.contains('disabled')).toBe(false);
        });
    });
});

// ── disable/enable cycle ──────────────────────────────────────────────────────

describe('disable/enable chip cycle', () => {
    test('chips are accessible again after enable following disable', () => {
        const chatnest = makeChatnest(['Pricing', 'Demo', 'Support']);
        disableChips(chatnest);
        let chips = chatnest.widget.querySelectorAll('.chip');
        chips.forEach(c => expect(c.classList.contains('disabled')).toBe(true));

        enableChips(chatnest);
        chips = chatnest.widget.querySelectorAll('.chip');
        chips.forEach(c => expect(c.classList.contains('disabled')).toBe(false));
    });

    test('multiple disable/enable cycles work correctly', () => {
        const chatnest = makeChatnest(['A', 'B']);
        for (let i = 0; i < 3; i++) {
            disableChips(chatnest);
            chatnest.widget.querySelectorAll('.chip').forEach(c =>
                expect(c.classList.contains('disabled')).toBe(true));
            enableChips(chatnest);
            chatnest.widget.querySelectorAll('.chip').forEach(c =>
                expect(c.classList.contains('disabled')).toBe(false));
        }
    });
});
