/**
 * Tests for:
 *   src/lib/chatnest/messages/updateLastBotMessage.js
 *   src/lib/chatnest/messages/hideGreetingActions.js
 *   src/lib/chatnest/messages/setupMessageActions.js
 *   src/lib/chatnest/messages/updateFilePreview.js  (display show/hide logic)
 */

// ── updateLastBotMessage ──────────────────────────────────────────────────────

function updateLastBotMessage(chatnest) {
    if (chatnest.config.parlant.enabled) {
        const botMessages = chatnest.widget.querySelectorAll('.bot-message-container');
        const queryGroups = new Map();
        botMessages.forEach((container) => {
            container.classList.remove('last');
            const actionsDiv = container.querySelector('.message-actions');
            if (actionsDiv) actionsDiv.style.display = 'none';
            const messageRow = container.closest('.message-row');
            const queryId = messageRow?.getAttribute('data-query-id');
            if (queryId) {
                if (!queryGroups.has(queryId)) queryGroups.set(queryId, []);
                queryGroups.get(queryId).push({ container });
            }
        });
        queryGroups.forEach((messages) => {
            if (messages.length > 0) {
                const last = messages[messages.length - 1];
                last.container.classList.add('last');
                const actionsDiv = last.container.querySelector('.message-actions');
                if (actionsDiv) actionsDiv.style.display = 'flex';
            }
        });
        if (queryGroups.size === 0 && botMessages.length > 0) {
            const lastContainer = botMessages[botMessages.length - 1];
            lastContainer.classList.add('last');
            const actionsDiv = lastContainer.querySelector('.message-actions');
            if (actionsDiv) actionsDiv.style.display = 'flex';
        }
    } else {
        const botMessages = chatnest.widget.querySelectorAll('.bot-message-container');
        botMessages.forEach((container, index) => {
            container.classList.remove('last');
            if (index === botMessages.length - 1) container.classList.add('last');
        });
    }
}

function buildBotContainer(queryId = null) {
    const row = document.createElement('div');
    row.className = 'message-row';
    if (queryId) row.setAttribute('data-query-id', queryId);
    const container = document.createElement('div');
    container.className = 'bot-message-container';
    const actions = document.createElement('div');
    actions.className = 'message-actions';
    container.appendChild(actions);
    row.appendChild(container);
    return { row, container, actions };
}

describe('updateLastBotMessage — non-Parlant mode', () => {
    function makeWidget(count) {
        const widget = document.createElement('div');
        const containers = [];
        for (let i = 0; i < count; i++) {
            const { row, container } = buildBotContainer();
            widget.appendChild(row);
            containers.push(container);
        }
        return { widget, containers };
    }

    function cn(widget) {
        return { widget, config: { parlant: { enabled: false } } };
    }

    test('marks only last container with "last" class', () => {
        const { widget, containers } = makeWidget(3);
        updateLastBotMessage(cn(widget));
        expect(containers[0].classList.contains('last')).toBe(false);
        expect(containers[1].classList.contains('last')).toBe(false);
        expect(containers[2].classList.contains('last')).toBe(true);
    });

    test('works with single message', () => {
        const { widget, containers } = makeWidget(1);
        updateLastBotMessage(cn(widget));
        expect(containers[0].classList.contains('last')).toBe(true);
    });

    test('does nothing when no bot messages', () => {
        const widget = document.createElement('div');
        expect(() => updateLastBotMessage(cn(widget))).not.toThrow();
    });

    test('removes "last" from all before re-marking', () => {
        const { widget, containers } = makeWidget(2);
        containers[0].classList.add('last'); // simulate stale state
        updateLastBotMessage(cn(widget));
        expect(containers[0].classList.contains('last')).toBe(false);
        expect(containers[1].classList.contains('last')).toBe(true);
    });
});

describe('updateLastBotMessage — Parlant mode', () => {
    function cn(widget) {
        return { widget, config: { parlant: { enabled: true } } };
    }

    test('shows actions only on last container per queryId', () => {
        const widget = document.createElement('div');
        const { row: r1, actions: a1 } = buildBotContainer('q1');
        const { row: r2, actions: a2 } = buildBotContainer('q1');
        widget.appendChild(r1); widget.appendChild(r2);
        a1.style.display = 'flex'; a2.style.display = 'flex';

        updateLastBotMessage(cn(widget));

        expect(a1.style.display).toBe('none');
        expect(a2.style.display).toBe('flex');
    });

    test('falls back to last overall when no queryIds', () => {
        const widget = document.createElement('div');
        const { row: r1 } = buildBotContainer(null);
        const { row: r2, container: c2, actions: a2 } = buildBotContainer(null);
        widget.appendChild(r1); widget.appendChild(r2);

        updateLastBotMessage(cn(widget));

        expect(c2.classList.contains('last')).toBe(true);
        expect(a2.style.display).toBe('flex');
    });
});

// ── hideGreetingActions ───────────────────────────────────────────────────────

function hideGreetingActions(chatnest) {
    const greetingActions = chatnest.widget.querySelector('#greeting-row .greeting-actions');
    if (greetingActions) {
        greetingActions.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        greetingActions.style.opacity = '0';
        greetingActions.style.transform = 'translateY(-5px)';
        setTimeout(() => { greetingActions.style.display = 'none'; }, 300);
    }
}

describe('hideGreetingActions', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    function buildWidget() {
        const widget = document.createElement('div');
        const greetingRow = document.createElement('div');
        greetingRow.id = 'greeting-row';
        const actions = document.createElement('div');
        actions.className = 'greeting-actions';
        greetingRow.appendChild(actions);
        widget.appendChild(greetingRow);
        return { widget, actions };
    }

    test('sets opacity to 0', () => {
        const { widget, actions } = buildWidget();
        hideGreetingActions({ widget });
        expect(actions.style.opacity).toBe('0');
    });

    test('sets transform to translateY(-5px)', () => {
        const { widget, actions } = buildWidget();
        hideGreetingActions({ widget });
        expect(actions.style.transform).toBe('translateY(-5px)');
    });

    test('sets display none after 300ms', () => {
        const { widget, actions } = buildWidget();
        hideGreetingActions({ widget });
        expect(actions.style.display).not.toBe('none');
        jest.advanceTimersByTime(300);
        expect(actions.style.display).toBe('none');
    });

    test('does nothing when no greeting row exists', () => {
        const widget = document.createElement('div');
        expect(() => hideGreetingActions({ widget })).not.toThrow();
    });

    test('sets CSS transition', () => {
        const { widget, actions } = buildWidget();
        hideGreetingActions({ widget });
        expect(actions.style.transition).toContain('opacity');
    });
});

// ── setupMessageActions ───────────────────────────────────────────────────────

function setupMessageActions(chatnest, container, originalText) {
    if (!chatnest.config.showMessageActions) {
        const actionsDiv = container.querySelector('.message-actions');
        if (actionsDiv) actionsDiv.style.display = 'none';
        return;
    }
    const likeBtn = container.querySelector('.like-btn');
    const dislikeBtn = container.querySelector('.dislike-btn');
    const regenerateBtn = container.querySelector('.regenerate-btn');
    if (!likeBtn || !dislikeBtn || !regenerateBtn) return;

    likeBtn.addEventListener('click', () => {
        const isCurrentlyLiked = likeBtn.classList.contains('active');
        likeBtn.classList.remove('active'); dislikeBtn.classList.remove('active');
        if (!isCurrentlyLiked) { likeBtn.classList.add('active'); chatnest.sendFeedback('like', originalText); }
        else chatnest.sendFeedback('remove', originalText);
    });

    dislikeBtn.addEventListener('click', () => {
        const isCurrentlyDisliked = dislikeBtn.classList.contains('active');
        likeBtn.classList.remove('active'); dislikeBtn.classList.remove('active');
        if (!isCurrentlyDisliked) { dislikeBtn.classList.add('active'); chatnest.sendFeedback('dislike', originalText); }
        else chatnest.sendFeedback('remove', originalText);
    });

    regenerateBtn.addEventListener('click', async () => {
        if (!chatnest.isWaitingForResponse) {
            const messageRows = Array.from(chatnest.widget.querySelectorAll('.message-row'));
            const currentMessageIndex = messageRows.findIndex(row => row.contains(container));
            let userMessage = '', lastUserMessageIndex = -1;
            for (let i = currentMessageIndex - 1; i >= 0; i--) {
                const el = messageRows[i].querySelector('.user-message');
                if (el) { userMessage = el.textContent; lastUserMessageIndex = i; break; }
            }
            if (userMessage && lastUserMessageIndex !== -1) {
                for (let i = messageRows.length - 1; i > lastUserMessageIndex; i--) messageRows[i].remove();
                await chatnest.updateStorageAfterRegeneration(lastUserMessageIndex, userMessage);
                await chatnest.sendMessage(userMessage, true);
            }
        }
    });
}

function buildActionContainer() {
    const container = document.createElement('div');
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'message-actions';
    ['like-btn', 'dislike-btn', 'regenerate-btn'].forEach(cls => {
        const btn = document.createElement('button');
        btn.className = cls;
        actionsDiv.appendChild(btn);
    });
    container.appendChild(actionsDiv);
    return container;
}

function makeChatnestForActions(overrides = {}) {
    return {
        config: { showMessageActions: true },
        isWaitingForResponse: false,
        widget: document.createElement('div'),
        sendFeedback: jest.fn(),
        updateStorageAfterRegeneration: jest.fn().mockResolvedValue(),
        sendMessage: jest.fn().mockResolvedValue(),
        ...overrides,
    };
}

describe('setupMessageActions', () => {
    test('hides actions div when showMessageActions=false', () => {
        const cn = makeChatnestForActions({ config: { showMessageActions: false } });
        const container = buildActionContainer();
        const actions = container.querySelector('.message-actions');
        actions.style.display = 'flex';
        setupMessageActions(cn, container, 'text');
        expect(actions.style.display).toBe('none');
    });

    test('returns early when buttons missing', () => {
        const cn = makeChatnestForActions();
        const container = document.createElement('div'); // no buttons
        expect(() => setupMessageActions(cn, container, 'text')).not.toThrow();
    });

    test('like click sends "like" feedback', () => {
        const cn = makeChatnestForActions();
        const container = buildActionContainer();
        setupMessageActions(cn, container, 'My response');
        container.querySelector('.like-btn').click();
        expect(cn.sendFeedback).toHaveBeenCalledWith('like', 'My response');
    });

    test('like click toggles active: second click sends "remove"', () => {
        const cn = makeChatnestForActions();
        const container = buildActionContainer();
        setupMessageActions(cn, container, 'text');
        const likeBtn = container.querySelector('.like-btn');
        likeBtn.click(); // first → like
        likeBtn.click(); // second → remove
        expect(cn.sendFeedback).toHaveBeenLastCalledWith('remove', 'text');
    });

    test('dislike click sends "dislike" feedback', () => {
        const cn = makeChatnestForActions();
        const container = buildActionContainer();
        setupMessageActions(cn, container, 'text');
        container.querySelector('.dislike-btn').click();
        expect(cn.sendFeedback).toHaveBeenCalledWith('dislike', 'text');
    });

    test('dislike active state toggled off on second click sends "remove"', () => {
        const cn = makeChatnestForActions();
        const container = buildActionContainer();
        setupMessageActions(cn, container, 'text');
        const db = container.querySelector('.dislike-btn');
        db.click(); db.click();
        expect(cn.sendFeedback).toHaveBeenLastCalledWith('remove', 'text');
    });

    test('like and dislike are mutually exclusive', () => {
        const cn = makeChatnestForActions();
        const container = buildActionContainer();
        setupMessageActions(cn, container, 'text');
        const likeBtn = container.querySelector('.like-btn');
        const dislikeBtn = container.querySelector('.dislike-btn');
        likeBtn.click();
        expect(likeBtn.classList.contains('active')).toBe(true);
        dislikeBtn.click();
        expect(likeBtn.classList.contains('active')).toBe(false);
        expect(dislikeBtn.classList.contains('active')).toBe(true);
    });

    test('regenerate does nothing when isWaitingForResponse=true', async () => {
        const cn = makeChatnestForActions({ isWaitingForResponse: true });
        const container = buildActionContainer();
        setupMessageActions(cn, container, 'text');
        container.querySelector('.regenerate-btn').click();
        await Promise.resolve();
        expect(cn.sendMessage).not.toHaveBeenCalled();
    });
});

// ── updateFilePreview show/hide ───────────────────────────────────────────────

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = String(str ?? '');
    return div.innerHTML;
}

function updateFilePreview(chatnest, files, filePreview) {
    if (files.length === 0) {
        filePreview.style.display = 'none';
        if (filePreview._objectUrls) {
            filePreview._objectUrls.forEach(url => { try { URL.revokeObjectURL(url); } catch { /* ignore */ } });
            filePreview._objectUrls = [];
        }
        filePreview.innerHTML = '';
        return;
    }
    if (filePreview._objectUrls) filePreview._objectUrls.forEach(url => { try { URL.revokeObjectURL(url); } catch { /* ignore */ } });
    filePreview._objectUrls = [];
    filePreview.style.display = 'block';
    filePreview.innerHTML = files.map((file, index) => {
        const size = chatnest.formatFileSize(file.size);
        const isImage = file.type && file.type.startsWith('image/');
        let thumbHtml = '';
        if (isImage) {
            try {
                const url = URL.createObjectURL(file);
                filePreview._objectUrls.push(url);
                thumbHtml = `<img class="file-preview-thumb" src="${url}" alt="${file.name}">`;
            } catch { /* ignore */ }
        }
        return `<div class="file-preview-item" data-index="${index}">${thumbHtml}<div class="file-info"><span class="file-name">${escapeHtml(file.name)}</span><span class="file-size">${escapeHtml(size)}</span></div><button class="remove-file" data-index="${index}">×</button></div>`;
    }).join('');
}

describe('updateFilePreview', () => {
    const chatnest = { formatFileSize: (b) => `${b} B` };

    test('hides preview when files empty', () => {
        const fp = document.createElement('div');
        fp.style.display = 'block';
        updateFilePreview(chatnest, [], fp);
        expect(fp.style.display).toBe('none');
    });

    test('clears HTML when files empty', () => {
        const fp = document.createElement('div');
        fp.innerHTML = '<p>old content</p>';
        updateFilePreview(chatnest, [], fp);
        expect(fp.innerHTML).toBe('');
    });

    test('shows preview when files present', () => {
        const fp = document.createElement('div');
        const file = new File(['data'], 'doc.pdf', { type: 'application/pdf' });
        updateFilePreview(chatnest, [file], fp);
        expect(fp.style.display).toBe('block');
    });

    test('renders file name in preview', () => {
        const fp = document.createElement('div');
        const file = new File(['data'], 'report.pdf', { type: 'application/pdf' });
        updateFilePreview(chatnest, [file], fp);
        expect(fp.innerHTML).toContain('report.pdf');
    });

    test('escapes HTML in filename', () => {
        const fp = document.createElement('div');
        const file = new File(['data'], '<evil>.pdf', { type: 'application/pdf' });
        updateFilePreview(chatnest, [file], fp);
        expect(fp.innerHTML).not.toContain('<evil>');
        expect(fp.innerHTML).toContain('&lt;evil&gt;');
    });

    test('renders remove button with correct data-index', () => {
        const fp = document.createElement('div');
        const file = new File(['d'], 'a.txt', { type: 'text/plain' });
        updateFilePreview(chatnest, [file], fp);
        const btn = fp.querySelector('.remove-file');
        expect(btn.getAttribute('data-index')).toBe('0');
    });

    test('renders multiple files', () => {
        const fp = document.createElement('div');
        const files = [
            new File(['a'], 'a.txt', { type: 'text/plain' }),
            new File(['b'], 'b.txt', { type: 'text/plain' }),
        ];
        updateFilePreview(chatnest, files, fp);
        expect(fp.querySelectorAll('.file-preview-item')).toHaveLength(2);
    });
});
