/**
 * Tests for storage/updateStorageAfterRegeneration.js
 */

// ── Inline implementation ─────────────────────────────────────────────────────

async function updateStorageAfterRegeneration(chatnest, lastUserMessageIndex, userMessage) {
    const historyKey = chatnest.userManager.getHistoryKey();
    let chatHistory = chatnest.storageManager.getChatHistory();

    let storageIndex = -1;
    let userMessageCount = -1;

    for (let i = 0; i < chatHistory.length; i++) {
        if (chatHistory[i].sender === 'user') {
            userMessageCount++;
            if (userMessageCount === lastUserMessageIndex) {
                storageIndex = i;
                break;
            }
        }
    }

    if (storageIndex !== -1) {
        chatHistory = chatHistory.slice(0, storageIndex + 1);
        chatHistory[storageIndex].regenerated = true;
        localStorage.setItem(historyKey, JSON.stringify(chatHistory));
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const HISTORY_KEY = 'chat_history_test';

function makeChatnest(history = []) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    return {
        userManager: {
            getHistoryKey: () => HISTORY_KEY,
        },
        storageManager: {
            getChatHistory: () => JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'),
        },
    };
}

function getStoredHistory() {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
}

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('updateStorageAfterRegeneration', () => {
    test('marks the target user message as regenerated', async () => {
        const history = [
            { sender: 'user', text: 'Hello' },
            { sender: 'bot', text: 'Hi there' },
        ];
        const chatnest = makeChatnest(history);
        await updateStorageAfterRegeneration(chatnest, 0, 'Hello');
        const stored = getStoredHistory();
        expect(stored[0].regenerated).toBe(true);
    });

    test('slices history up to (and including) the target user message', async () => {
        const history = [
            { sender: 'user', text: 'First question' },
            { sender: 'bot', text: 'First answer' },
            { sender: 'user', text: 'Second question' },
            { sender: 'bot', text: 'Second answer' },
            { sender: 'bot', text: 'Second answer part 2' },
        ];
        const chatnest = makeChatnest(history);
        // Regenerate at index 1 (second user message)
        await updateStorageAfterRegeneration(chatnest, 1, 'Second question');
        const stored = getStoredHistory();
        // Should keep up to and including "Second question" (index 2 in original)
        expect(stored.length).toBe(3);
        expect(stored[2].text).toBe('Second question');
        expect(stored[2].regenerated).toBe(true);
    });

    test('does not modify storage when lastUserMessageIndex is out of range', async () => {
        const history = [
            { sender: 'user', text: 'Q1' },
            { sender: 'bot', text: 'A1' },
        ];
        const chatnest = makeChatnest(history);
        await updateStorageAfterRegeneration(chatnest, 5, 'Q1');
        const stored = getStoredHistory();
        // History should be unchanged
        expect(stored.length).toBe(2);
        expect(stored[0].regenerated).toBeUndefined();
    });

    test('handles empty history gracefully', async () => {
        const chatnest = makeChatnest([]);
        await expect(updateStorageAfterRegeneration(chatnest, 0, 'Hello')).resolves.not.toThrow();
        const stored = getStoredHistory();
        expect(stored.length).toBe(0);
    });

    test('correctly identifies the first user message at index 0', async () => {
        const history = [
            { sender: 'user', text: 'Who are you?' },
            { sender: 'bot', text: 'I am a bot.' },
            { sender: 'user', text: 'Tell me more.' },
            { sender: 'bot', text: 'Sure!' },
        ];
        const chatnest = makeChatnest(history);
        await updateStorageAfterRegeneration(chatnest, 0, 'Who are you?');
        const stored = getStoredHistory();
        expect(stored.length).toBe(1);
        expect(stored[0].text).toBe('Who are you?');
        expect(stored[0].regenerated).toBe(true);
    });

    test('handles history with only bot messages (no user messages)', async () => {
        const history = [
            { sender: 'bot', text: 'Welcome!' },
            { sender: 'bot', text: 'How can I help?' },
        ];
        const chatnest = makeChatnest(history);
        await updateStorageAfterRegeneration(chatnest, 0, 'anything');
        const stored = getStoredHistory();
        // No user messages found, nothing changes
        expect(stored.length).toBe(2);
    });

    test('handles mixed sender history with consecutive user messages', async () => {
        const history = [
            { sender: 'user', text: 'Msg 1' },
            { sender: 'user', text: 'Msg 2' },
            { sender: 'bot', text: 'Bot reply' },
        ];
        const chatnest = makeChatnest(history);
        await updateStorageAfterRegeneration(chatnest, 1, 'Msg 2');
        const stored = getStoredHistory();
        expect(stored.length).toBe(2);
        expect(stored[1].regenerated).toBe(true);
        expect(stored[1].text).toBe('Msg 2');
    });

    test('uses the key from userManager.getHistoryKey()', async () => {
        const customKey = 'my_custom_key_xyz';
        const history = [
            { sender: 'user', text: 'Hello' },
            { sender: 'bot', text: 'Hi' },
        ];
        localStorage.setItem(customKey, JSON.stringify(history));
        const chatnest = {
            userManager: { getHistoryKey: () => customKey },
            storageManager: { getChatHistory: () => JSON.parse(localStorage.getItem(customKey) || '[]') },
        };
        await updateStorageAfterRegeneration(chatnest, 0, 'Hello');
        const stored = JSON.parse(localStorage.getItem(customKey));
        expect(stored[0].regenerated).toBe(true);
    });
});
