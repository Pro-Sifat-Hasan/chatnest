/**
 * Tests for messages module:
 *   updateFilePreview, updateLastBotMessage, hideGreetingActions, synchronizeGreetingWidth
 */

// ── Utility: escapeHtml ───────────────────────────────────────────────────────

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ── Utility: formatFileSize ───────────────────────────────────────────────────

function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

// ── Inline implementations ────────────────────────────────────────────────────

function updateFilePreview(chatnest, files, filePreview) {
    if (files.length === 0) {
        filePreview.style.display = 'none';
        if (filePreview._objectUrls) {
            filePreview._objectUrls.forEach(url => URL.revokeObjectURL(url));
            filePreview._objectUrls = [];
        }
        filePreview.innerHTML = '';
        return;
    }

    if (filePreview._objectUrls) {
        filePreview._objectUrls.forEach(url => URL.revokeObjectURL(url));
    }
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
            } catch {
                thumbHtml = '';
            }
        }
        return `
            <div class="file-preview-item" data-index="${index}">
                ${thumbHtml}
                <div class="file-info">
                    <span class="file-name">${escapeHtml(file.name)}</span>
                    <span class="file-size">${escapeHtml(size)}</span>
                </div>
                <button class="remove-file" data-index="${index}" type="button" aria-label="Remove file">×</button>
            </div>
        `;
    }).join('');
}

function updateLastBotMessage(chatnest) {
    if (chatnest.config.parlant.enabled) {
        const botMessages = chatnest.widget.querySelectorAll('.bot-message-container');
        const queryGroups = new Map();

        botMessages.forEach((container) => {
            container.classList.remove('last');
            const actionsDiv = container.querySelector('.message-actions');
            if (actionsDiv) {
                actionsDiv.style.display = 'none';
            }
            const messageRow = container.closest('.message-row');
            const queryId = messageRow?.getAttribute('data-query-id');

            if (queryId) {
                if (!queryGroups.has(queryId)) {
                    queryGroups.set(queryId, []);
                }
                queryGroups.get(queryId).push({ container });
            }
        });

        queryGroups.forEach((messages) => {
            if (messages.length > 0) {
                const lastMessage = messages[messages.length - 1];
                lastMessage.container.classList.add('last');
                const actionsDiv = lastMessage.container.querySelector('.message-actions');
                if (actionsDiv) {
                    actionsDiv.style.display = 'flex';
                }
            }
        });

        if (queryGroups.size === 0 && botMessages.length > 0) {
            const lastContainer = botMessages[botMessages.length - 1];
            lastContainer.classList.add('last');
            const actionsDiv = lastContainer.querySelector('.message-actions');
            if (actionsDiv) {
                actionsDiv.style.display = 'flex';
            }
        }
    } else {
        const botMessages = chatnest.widget.querySelectorAll('.bot-message-container');
        botMessages.forEach((container, index) => {
            container.classList.remove('last');
            if (index === botMessages.length - 1) {
                container.classList.add('last');
            }
        });
    }
}

function hideGreetingActions(chatnest) {
    const greetingActions = chatnest.widget.querySelector('#greeting-row .greeting-actions');
    if (greetingActions) {
        greetingActions.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        greetingActions.style.opacity = '0';
        greetingActions.style.transform = 'translateY(-5px)';

        setTimeout(() => {
            greetingActions.style.display = 'none';
        }, 300);
    }
}

function synchronizeGreetingWidth(chatnest, greetingRow) {
    requestAnimationFrame(() => {
        const greetingMessage = greetingRow?.querySelector('.bot-message');
        const greetingContainer = greetingRow?.querySelector('.bot-message-container');
        if (!greetingMessage || !greetingContainer) return;

        greetingContainer.style.setProperty('max-width', '80%', 'important');
        greetingContainer.style.setProperty('width', '80%', 'important');
        greetingMessage.style.setProperty('max-width', '100%', 'important');
        greetingMessage.style.setProperty('width', '100%', 'important');
    });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeFile(name, size, type = 'application/pdf') {
    // Mock File object
    return { name, size, type };
}

function makeImageFile(name, size = 2048) {
    return { name, size, type: 'image/jpeg' };
}

function makeFilePreview() {
    const el = document.createElement('div');
    el.className = 'file-preview';
    document.body.appendChild(el);
    return el;
}

function makeChatnest(overrides = {}) {
    const widget = document.createElement('div');
    document.body.appendChild(widget);
    return {
        widget,
        config: {
            parlant: { enabled: false },
            ...overrides.config,
        },
        formatFileSize,
        ...overrides,
    };
}

// Mock URL.createObjectURL / URL.revokeObjectURL
beforeAll(() => {
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();
});

afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
    jest.useRealTimers();
});

// ── updateFilePreview ─────────────────────────────────────────────────────────

describe('updateFilePreview', () => {
    test('hides and clears preview when files array is empty', () => {
        const chatnest = makeChatnest();
        const filePreview = makeFilePreview();
        filePreview.innerHTML = '<div>existing content</div>';
        filePreview.style.display = 'block';
        updateFilePreview(chatnest, [], filePreview);
        expect(filePreview.style.display).toBe('none');
        expect(filePreview.innerHTML).toBe('');
    });

    test('shows preview block when files exist', () => {
        const chatnest = makeChatnest();
        const filePreview = makeFilePreview();
        const files = [makeFile('report.pdf', 1024)];
        updateFilePreview(chatnest, files, filePreview);
        expect(filePreview.style.display).toBe('block');
    });

    test('renders one file-preview-item per file', () => {
        const chatnest = makeChatnest();
        const filePreview = makeFilePreview();
        const files = [makeFile('a.pdf', 100), makeFile('b.txt', 200)];
        updateFilePreview(chatnest, files, filePreview);
        expect(filePreview.querySelectorAll('.file-preview-item').length).toBe(2);
    });

    test('displays file name in .file-name span', () => {
        const chatnest = makeChatnest();
        const filePreview = makeFilePreview();
        updateFilePreview(chatnest, [makeFile('document.pdf', 500)], filePreview);
        expect(filePreview.querySelector('.file-name').textContent).toBe('document.pdf');
    });

    test('displays formatted file size in .file-size span', () => {
        const chatnest = makeChatnest();
        const filePreview = makeFilePreview();
        updateFilePreview(chatnest, [makeFile('doc.pdf', 1024)], filePreview);
        expect(filePreview.querySelector('.file-size').textContent).toContain('KB');
    });

    test('renders remove button with correct data-index', () => {
        const chatnest = makeChatnest();
        const filePreview = makeFilePreview();
        const files = [makeFile('a.pdf', 100), makeFile('b.pdf', 200)];
        updateFilePreview(chatnest, files, filePreview);
        const removeButtons = filePreview.querySelectorAll('.remove-file');
        expect(removeButtons[0].getAttribute('data-index')).toBe('0');
        expect(removeButtons[1].getAttribute('data-index')).toBe('1');
    });

    test('renders thumbnail img for image files', () => {
        const chatnest = makeChatnest();
        const filePreview = makeFilePreview();
        updateFilePreview(chatnest, [makeImageFile('photo.jpg')], filePreview);
        expect(filePreview.querySelector('.file-preview-thumb')).not.toBeNull();
        expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    });

    test('does NOT render thumbnail for non-image files', () => {
        const chatnest = makeChatnest();
        const filePreview = makeFilePreview();
        updateFilePreview(chatnest, [makeFile('report.pdf', 500, 'application/pdf')], filePreview);
        expect(filePreview.querySelector('.file-preview-thumb')).toBeNull();
        expect(URL.createObjectURL).not.toHaveBeenCalled();
    });

    test('escapes special characters in file name', () => {
        const chatnest = makeChatnest();
        const filePreview = makeFilePreview();
        updateFilePreview(chatnest, [makeFile('<script>alert(1)</script>.pdf', 100)], filePreview);
        expect(filePreview.innerHTML).not.toContain('<script>');
        expect(filePreview.innerHTML).toContain('&lt;script&gt;');
    });

    test('revokes old object URLs when called again', () => {
        const chatnest = makeChatnest();
        const filePreview = makeFilePreview();
        // First call with image
        updateFilePreview(chatnest, [makeImageFile('img1.jpg')], filePreview);
        expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
        // Second call
        updateFilePreview(chatnest, [makeImageFile('img2.jpg')], filePreview);
        expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
    });

    test('revokes URLs on empty files call', () => {
        const chatnest = makeChatnest();
        const filePreview = makeFilePreview();
        updateFilePreview(chatnest, [makeImageFile('img.jpg')], filePreview);
        updateFilePreview(chatnest, [], filePreview);
        expect(URL.revokeObjectURL).toHaveBeenCalled();
    });
});

// ── updateLastBotMessage ──────────────────────────────────────────────────────

describe('updateLastBotMessage (non-parlant mode)', () => {
    function addBotContainer(widget) {
        const row = document.createElement('div');
        row.className = 'message-row';
        const container = document.createElement('div');
        container.className = 'bot-message-container';
        row.appendChild(container);
        widget.appendChild(row);
        return container;
    }

    test('adds "last" class only to the last bot container', () => {
        const chatnest = makeChatnest();
        const c1 = addBotContainer(chatnest.widget);
        const c2 = addBotContainer(chatnest.widget);
        const c3 = addBotContainer(chatnest.widget);
        updateLastBotMessage(chatnest);
        expect(c1.classList.contains('last')).toBe(false);
        expect(c2.classList.contains('last')).toBe(false);
        expect(c3.classList.contains('last')).toBe(true);
    });

    test('removes "last" class from previous last container', () => {
        const chatnest = makeChatnest();
        const c1 = addBotContainer(chatnest.widget);
        c1.classList.add('last');
        const c2 = addBotContainer(chatnest.widget);
        updateLastBotMessage(chatnest);
        expect(c1.classList.contains('last')).toBe(false);
        expect(c2.classList.contains('last')).toBe(true);
    });

    test('works when there is only one bot message', () => {
        const chatnest = makeChatnest();
        const c1 = addBotContainer(chatnest.widget);
        updateLastBotMessage(chatnest);
        expect(c1.classList.contains('last')).toBe(true);
    });

    test('does nothing when there are no bot messages', () => {
        const chatnest = makeChatnest();
        expect(() => updateLastBotMessage(chatnest)).not.toThrow();
    });
});

describe('updateLastBotMessage (parlant mode)', () => {
    function addParlantBotContainer(widget, queryId) {
        const row = document.createElement('div');
        row.className = 'message-row';
        row.setAttribute('data-query-id', queryId);
        const container = document.createElement('div');
        container.className = 'bot-message-container';
        const actions = document.createElement('div');
        actions.className = 'message-actions';
        actions.style.display = 'none';
        container.appendChild(actions);
        row.appendChild(container);
        widget.appendChild(row);
        return container;
    }

    test('shows actions on last message per query group', () => {
        const chatnest = makeChatnest({ config: { parlant: { enabled: true } } });
        const c1 = addParlantBotContainer(chatnest.widget, 'q1');
        const c2 = addParlantBotContainer(chatnest.widget, 'q1');
        updateLastBotMessage(chatnest);
        expect(c1.querySelector('.message-actions').style.display).toBe('none');
        expect(c2.querySelector('.message-actions').style.display).toBe('flex');
    });

    test('marks last container of each query group with "last" class', () => {
        const chatnest = makeChatnest({ config: { parlant: { enabled: true } } });
        const c1 = addParlantBotContainer(chatnest.widget, 'q1');
        const c2 = addParlantBotContainer(chatnest.widget, 'q1');
        updateLastBotMessage(chatnest);
        expect(c1.classList.contains('last')).toBe(false);
        expect(c2.classList.contains('last')).toBe(true);
    });

    test('handles multiple distinct query groups independently', () => {
        const chatnest = makeChatnest({ config: { parlant: { enabled: true } } });
        const c1 = addParlantBotContainer(chatnest.widget, 'q1');
        const c2 = addParlantBotContainer(chatnest.widget, 'q2');
        updateLastBotMessage(chatnest);
        expect(c1.classList.contains('last')).toBe(true);
        expect(c2.classList.contains('last')).toBe(true);
    });

    test('falls back to last container when no query IDs present', () => {
        const chatnest = makeChatnest({ config: { parlant: { enabled: true } } });
        const widget = chatnest.widget;
        // Add containers without data-query-id
        const c1 = document.createElement('div');
        c1.className = 'bot-message-container';
        widget.appendChild(c1);
        const c2 = document.createElement('div');
        c2.className = 'bot-message-container';
        const actions = document.createElement('div');
        actions.className = 'message-actions';
        c2.appendChild(actions);
        widget.appendChild(c2);
        updateLastBotMessage(chatnest);
        expect(c2.classList.contains('last')).toBe(true);
    });
});

// ── hideGreetingActions ───────────────────────────────────────────────────────

describe('hideGreetingActions', () => {
    beforeEach(() => jest.useFakeTimers());

    test('sets opacity to 0 on greeting actions', () => {
        const chatnest = makeChatnest();
        const greetingRow = document.createElement('div');
        greetingRow.id = 'greeting-row';
        const actions = document.createElement('div');
        actions.className = 'greeting-actions';
        greetingRow.appendChild(actions);
        chatnest.widget.appendChild(greetingRow);

        hideGreetingActions(chatnest);
        expect(actions.style.opacity).toBe('0');
    });

    test('sets transform to translateY(-5px)', () => {
        const chatnest = makeChatnest();
        const greetingRow = document.createElement('div');
        greetingRow.id = 'greeting-row';
        const actions = document.createElement('div');
        actions.className = 'greeting-actions';
        greetingRow.appendChild(actions);
        chatnest.widget.appendChild(greetingRow);

        hideGreetingActions(chatnest);
        expect(actions.style.transform).toBe('translateY(-5px)');
    });

    test('sets transition style on greeting actions', () => {
        const chatnest = makeChatnest();
        const greetingRow = document.createElement('div');
        greetingRow.id = 'greeting-row';
        const actions = document.createElement('div');
        actions.className = 'greeting-actions';
        greetingRow.appendChild(actions);
        chatnest.widget.appendChild(greetingRow);

        hideGreetingActions(chatnest);
        expect(actions.style.transition).toContain('opacity');
    });

    test('hides actions with display:none after 300ms', () => {
        const chatnest = makeChatnest();
        const greetingRow = document.createElement('div');
        greetingRow.id = 'greeting-row';
        const actions = document.createElement('div');
        actions.className = 'greeting-actions';
        greetingRow.appendChild(actions);
        chatnest.widget.appendChild(greetingRow);

        hideGreetingActions(chatnest);
        expect(actions.style.display).not.toBe('none');
        jest.advanceTimersByTime(300);
        expect(actions.style.display).toBe('none');
    });

    test('does nothing when greeting-row is missing', () => {
        const chatnest = makeChatnest();
        expect(() => hideGreetingActions(chatnest)).not.toThrow();
    });

    test('does nothing when greeting-actions is missing inside greeting-row', () => {
        const chatnest = makeChatnest();
        const greetingRow = document.createElement('div');
        greetingRow.id = 'greeting-row';
        chatnest.widget.appendChild(greetingRow);
        expect(() => hideGreetingActions(chatnest)).not.toThrow();
    });
});

// ── synchronizeGreetingWidth ──────────────────────────────────────────────────

describe('synchronizeGreetingWidth', () => {
    beforeEach(() => {
        // Make requestAnimationFrame execute the callback synchronously
        jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => { cb(); return 0; });
    });

    afterEach(() => {
        window.requestAnimationFrame.mockRestore();
    });

    test('sets max-width and width to 80% on container', () => {
        const chatnest = makeChatnest();
        const greetingRow = document.createElement('div');
        const container = document.createElement('div');
        container.className = 'bot-message-container';
        const message = document.createElement('div');
        message.className = 'bot-message';
        greetingRow.appendChild(container);
        greetingRow.appendChild(message);
        chatnest.widget.appendChild(greetingRow);

        synchronizeGreetingWidth(chatnest, greetingRow);

        expect(container.style.maxWidth).toBe('80%');
        expect(container.style.width).toBe('80%');
    });

    test('sets max-width and width to 100% on the bot message', () => {
        const chatnest = makeChatnest();
        const greetingRow = document.createElement('div');
        const container = document.createElement('div');
        container.className = 'bot-message-container';
        const message = document.createElement('div');
        message.className = 'bot-message';
        greetingRow.appendChild(container);
        greetingRow.appendChild(message);
        chatnest.widget.appendChild(greetingRow);

        synchronizeGreetingWidth(chatnest, greetingRow);
        expect(message.style.maxWidth).toBe('100%');
        expect(message.style.width).toBe('100%');
    });

    test('does nothing when greetingRow is null', () => {
        const chatnest = makeChatnest();
        expect(() => synchronizeGreetingWidth(chatnest, null)).not.toThrow();
    });

    test('does nothing when bot-message-container is missing', () => {
        const chatnest = makeChatnest();
        const greetingRow = document.createElement('div');
        const message = document.createElement('div');
        message.className = 'bot-message';
        greetingRow.appendChild(message);
        expect(() => synchronizeGreetingWidth(chatnest, greetingRow)).not.toThrow();
    });

    test('does nothing when bot-message is missing', () => {
        const chatnest = makeChatnest();
        const greetingRow = document.createElement('div');
        const container = document.createElement('div');
        container.className = 'bot-message-container';
        greetingRow.appendChild(container);
        expect(() => synchronizeGreetingWidth(chatnest, greetingRow)).not.toThrow();
    });
});
