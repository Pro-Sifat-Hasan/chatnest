/**
 * Color utility functions for Chatnest
 */

export function hexToRgb(color) {
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

export function isGradient(color) {
    return color && (color.includes('linear-gradient') || color.includes('radial-gradient'));
}
