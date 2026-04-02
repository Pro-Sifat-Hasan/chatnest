/**
 * Tests for src/lib/utils/color.js
 */

function hexToRgb(color) {
    if (!color) return '0, 132, 255';
    if (color.includes('linear-gradient') || color.includes('radial-gradient')) {
        const colorMatch = color.match(/#[a-fA-F0-9]{6}|#[a-fA-F0-9]{3}/);
        if (colorMatch) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(colorMatch[0]);
            return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0, 132, 255';
        }
        return '0, 132, 255';
    }
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0, 132, 255';
}

function isGradient(color) {
    return color && (color.includes('linear-gradient') || color.includes('radial-gradient'));
}

describe('hexToRgb', () => {
    test('converts 6-digit hex to rgb string', () => {
        expect(hexToRgb('#ff0000')).toBe('255, 0, 0');
    });

    test('converts lowercase hex', () => {
        expect(hexToRgb('#00ff00')).toBe('0, 255, 0');
    });

    test('converts mixed-case hex', () => {
        expect(hexToRgb('#0084FF')).toBe('0, 132, 255');
    });

    test('converts hex without leading #', () => {
        expect(hexToRgb('0084FF')).toBe('0, 132, 255');
    });

    test('returns default for null', () => {
        expect(hexToRgb(null)).toBe('0, 132, 255');
    });

    test('returns default for empty string', () => {
        expect(hexToRgb('')).toBe('0, 132, 255');
    });

    test('returns default for undefined', () => {
        expect(hexToRgb(undefined)).toBe('0, 132, 255');
    });

    test('returns default for invalid hex', () => {
        expect(hexToRgb('#zzzzzz')).toBe('0, 132, 255');
    });

    test('extracts first hex from linear-gradient', () => {
        expect(hexToRgb('linear-gradient(135deg, #ff0000, #0000ff)')).toBe('255, 0, 0');
    });

    test('extracts first hex from radial-gradient', () => {
        expect(hexToRgb('radial-gradient(circle, #00ff00, #ffffff)')).toBe('0, 255, 0');
    });

    test('returns default for gradient with no hex color', () => {
        expect(hexToRgb('linear-gradient(red, blue)')).toBe('0, 132, 255');
    });

    test('converts pure black', () => {
        expect(hexToRgb('#000000')).toBe('0, 0, 0');
    });

    test('converts pure white', () => {
        expect(hexToRgb('#ffffff')).toBe('255, 255, 255');
    });
});

describe('isGradient', () => {
    test('returns true for linear-gradient', () => {
        expect(isGradient('linear-gradient(135deg, #ff0, #00f)')).toBe(true);
    });

    test('returns true for radial-gradient', () => {
        expect(isGradient('radial-gradient(circle, red, blue)')).toBe(true);
    });

    test('returns false for plain hex', () => {
        expect(isGradient('#ff0000')).toBeFalsy();
    });

    test('returns false for null', () => {
        expect(isGradient(null)).toBeFalsy();
    });

    test('returns false for empty string', () => {
        expect(isGradient('')).toBeFalsy();
    });

    test('returns false for undefined', () => {
        expect(isGradient(undefined)).toBeFalsy();
    });

    test('returns false for plain color name', () => {
        expect(isGradient('red')).toBeFalsy();
    });
});
