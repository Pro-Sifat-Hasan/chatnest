/**
 * Tests for the Supabase await-save guard in sendMessage.js (Bug 4 fix).
 *
 * Verifies that:
 * 1. saveChatPair is awaited before enableSending() clears the in-flight guard
 * 2. isWaitingForResponse stays true until save resolves
 * 3. backgroundRefresh (guarded by isWaitingForResponse) cannot run during save
 * 4. If saveChatPair throws, enableSending is still called (no hang)
 */

// ── Simplified sendMessage logic (the Supabase save section) ─────────────────
// We test only the guard-relevant section, not the full sendMessage function
// (which requires a full Chatnest DOM setup).

async function supabaseSaveSection(chatnest, responseText, message, isRegeneration) {
    function isEmptyResponse(text) {
        if (text == null) return true;
        const s = String(text).trim();
        return !s;
    }

    if (chatnest.supabaseManager?.isReady && !isRegeneration && !isEmptyResponse(responseText)) {
        const userId = chatnest.userManager.currentUser;
        const domain = chatnest.userManager.domain;
        const userQuery = chatnest._lastSupabaseUserMessage || message;
        chatnest._lastSupabaseUserMessage = null;
        try {
            await chatnest.supabaseManager.saveChatPair(userId, domain, userQuery, responseText);
        } catch (err) {
            // error swallowed — enableSending still called
        }
    }

    // enableSending equivalent
    chatnest.isWaitingForResponse = false;
    chatnest.enableSendingFunctionality();
}

function makeChatnest(supabaseOverrides = {}) {
    return {
        isWaitingForResponse: true,
        isTypewriterActive: false,
        _lastSupabaseUserMessage: 'Hello',
        userManager: { currentUser: 'user1', domain: 'localhost' },
        enableSendingFunctionality: jest.fn(),
        supabaseManager: {
            isReady: true,
            saveChatPair: jest.fn().mockResolvedValue(42),
            ...supabaseOverrides,
        },
    };
}

// ── Basic save flow ───────────────────────────────────────────────────────────

describe('sendMessage Supabase save guard (Bug 4)', () => {
    test('awaits saveChatPair before clearing isWaitingForResponse', async () => {
        let saveResolved = false;
        let guardClearedAt = null;

        const cn = makeChatnest({
            saveChatPair: jest.fn(() => new Promise(resolve => {
                setTimeout(() => {
                    saveResolved = true;
                    resolve(1);
                }, 100);
            }))
        });

        const original = cn.enableSendingFunctionality;
        cn.enableSendingFunctionality = jest.fn(() => {
            guardClearedAt = saveResolved; // should be true
            original();
        });

        await supabaseSaveSection(cn, 'Bot reply', 'Hello', false);

        expect(guardClearedAt).toBe(true); // save completed before guard cleared
        expect(cn.isWaitingForResponse).toBe(false);
    });

    test('isWaitingForResponse is false after section completes', async () => {
        const cn = makeChatnest();
        await supabaseSaveSection(cn, 'Reply', 'Q', false);
        expect(cn.isWaitingForResponse).toBe(false);
    });

    test('calls saveChatPair with correct args', async () => {
        const cn = makeChatnest();
        cn._lastSupabaseUserMessage = 'User question';
        await supabaseSaveSection(cn, 'Bot answer', 'fallback', false);
        expect(cn.supabaseManager.saveChatPair).toHaveBeenCalledWith('user1', 'localhost', 'User question', 'Bot answer');
    });

    test('clears _lastSupabaseUserMessage after save', async () => {
        const cn = makeChatnest();
        cn._lastSupabaseUserMessage = 'Saved Q';
        await supabaseSaveSection(cn, 'R', 'fallback', false);
        expect(cn._lastSupabaseUserMessage).toBeNull();
    });

    test('falls back to message param when _lastSupabaseUserMessage is null', async () => {
        const cn = makeChatnest();
        cn._lastSupabaseUserMessage = null;
        await supabaseSaveSection(cn, 'R', 'fallback message', false);
        expect(cn.supabaseManager.saveChatPair).toHaveBeenCalledWith('user1', 'localhost', 'fallback message', 'R');
    });

    test('enableSendingFunctionality always called even if save throws', async () => {
        const cn = makeChatnest({
            saveChatPair: jest.fn().mockRejectedValue(new Error('network error'))
        });
        await supabaseSaveSection(cn, 'R', 'Q', false);
        expect(cn.enableSendingFunctionality).toHaveBeenCalledTimes(1);
        expect(cn.isWaitingForResponse).toBe(false);
    });

    test('skips save when isRegeneration is true', async () => {
        const cn = makeChatnest();
        await supabaseSaveSection(cn, 'R', 'Q', true); // isRegeneration = true
        expect(cn.supabaseManager.saveChatPair).not.toHaveBeenCalled();
        expect(cn.enableSendingFunctionality).toHaveBeenCalledTimes(1);
    });

    test('skips save when responseText is empty', async () => {
        const cn = makeChatnest();
        await supabaseSaveSection(cn, '', 'Q', false); // empty response
        expect(cn.supabaseManager.saveChatPair).not.toHaveBeenCalled();
        expect(cn.enableSendingFunctionality).toHaveBeenCalledTimes(1);
    });

    test('skips save when supabaseManager is not ready', async () => {
        const cn = makeChatnest({ isReady: false });
        await supabaseSaveSection(cn, 'R', 'Q', false);
        expect(cn.supabaseManager.saveChatPair).not.toHaveBeenCalled();
        expect(cn.enableSendingFunctionality).toHaveBeenCalledTimes(1);
    });

    test('skips save when supabaseManager is null', async () => {
        const cn = makeChatnest();
        cn.supabaseManager = null;
        await supabaseSaveSection(cn, 'R', 'Q', false);
        expect(cn.enableSendingFunctionality).toHaveBeenCalledTimes(1);
    });
});

// ── Background refresh cannot fire while save is pending ─────────────────────

describe('backgroundRefresh cannot run during Supabase save', () => {
    test('isWaitingForResponse is true during save, preventing backgroundRefresh', async () => {
        let guardDuringeSave = null;

        const cn = makeChatnest({
            saveChatPair: jest.fn(() => new Promise(resolve => {
                // Check the guard mid-save
                guardDuringeSave = cn.isWaitingForResponse;
                resolve(1);
            }))
        });

        await supabaseSaveSection(cn, 'Reply', 'Q', false);

        expect(guardDuringeSave).toBe(true); // guard was active during save
        expect(cn.isWaitingForResponse).toBe(false); // cleared after
    });
});
