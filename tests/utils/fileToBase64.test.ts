/**
 * Tests for src/lib/utils/fileToBase64.js
 * jsdom provides FileReader; we use it directly.
 */

const { fileToBase64 } = require('../../src/lib/utils/fileToBase64.js');

describe('fileToBase64', () => {
    test('rejects for null input', async () => {
        await expect(fileToBase64(null)).rejects.toThrow('Invalid file');
    });

    test('rejects for undefined input', async () => {
        await expect(fileToBase64(undefined)).rejects.toThrow('Invalid file');
    });

    test('rejects for plain object (not File)', async () => {
        await expect(fileToBase64({ name: 'x.txt' })).rejects.toThrow('Invalid file');
    });

    test('rejects for string input', async () => {
        await expect(fileToBase64('file.txt')).rejects.toThrow('Invalid file');
    });

    test('resolves with base64, name, type for valid File', async () => {
        const file = new File(['hello world'], 'test.txt', { type: 'text/plain' });
        const result = await fileToBase64(file);
        expect(result.name).toBe('test.txt');
        expect(result.type).toBe('text/plain');
        expect(typeof result.base64).toBe('string');
        expect(result.base64).toMatch(/^data:text\/plain;base64,/);
    });

    test('base64 string contains encoded content', async () => {
        const file = new File(['abc'], 'a.txt', { type: 'text/plain' });
        const result = await fileToBase64(file);
        // "abc" in base64 is "YWJj"
        expect(result.base64).toContain('YWJj');
    });

    test('resolves correct name for image file', async () => {
        const file = new File([new Uint8Array([137, 80, 78, 71])], 'photo.png', { type: 'image/png' });
        const result = await fileToBase64(file);
        expect(result.name).toBe('photo.png');
        expect(result.type).toBe('image/png');
    });

    test('resolves with data URL prefix for image', async () => {
        const file = new File(['fakeimgdata'], 'icon.png', { type: 'image/png' });
        const result = await fileToBase64(file);
        expect(result.base64).toMatch(/^data:image\/png;base64,/);
    });

    test('handles empty file', async () => {
        const file = new File([], 'empty.txt', { type: 'text/plain' });
        const result = await fileToBase64(file);
        expect(result.base64).toMatch(/^data:text\/plain;base64,/);
        expect(result.name).toBe('empty.txt');
    });
});
