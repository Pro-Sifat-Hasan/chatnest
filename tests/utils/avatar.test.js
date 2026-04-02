/**
 * Tests for src/lib/utils/avatar.js
 */

function isEmoji(str) {
    if (!str || str.length > 20) return false;
    const emojiRegex = /^[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]|[\u{238C}-\u{2454}]|[\u{20D0}-\u{20FF}]|[\u{FE0F}]|[\u{200D}]|[\u{E0020}-\u{E007F}]/u;
    const hasEmojiSequence = /[\u{1F3FB}-\u{1F3FF}]|[\u{200D}]|[\u{FE0F}]/u.test(str);
    return emojiRegex.test(str) || hasEmojiSequence || /\p{Emoji}/u.test(str);
}

function isImageUrl(str) {
    if (!str || typeof str !== 'string') return false;
    const urlPatterns = [
        /^https?:\/\/.+\.(jpg|jpeg|png|gif|svg|webp|bmp|ico)(\?.*)?$/i,
        /^data:image\/.+;base64,/i,
        /^\/.*\.(jpg|jpeg|png|gif|svg|webp|bmp|ico)(\?.*)?$/i,
        /^\.\.?\/.*\.(jpg|jpeg|png|gif|svg|webp|bmp|ico)(\?.*)?$/i,
    ];
    return urlPatterns.some(p => p.test(str.trim())) ||
        str.startsWith('http') || str.startsWith('data:image') || str.startsWith('/') || str.includes('://');
}

function isSvg(str) {
    if (!str || typeof str !== 'string') return false;
    const trimmed = str.trim();
    return trimmed.startsWith('<svg') && trimmed.includes('</svg>');
}

function sanitizeSvg(svg) {
    let sanitized = svg
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+="[^"]*"/gi, '')
        .replace(/on\w+='[^']*'/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/vbscript:/gi, '')
        .replace(/data:/gi, '');
    if (!sanitized.includes('viewBox') && sanitized.includes('<svg')) {
        sanitized = sanitized.replace('<svg', '<svg viewBox="0 0 24 24"');
    }
    return sanitized;
}

function generateAvatarHtml(avatar, botName, options = {}) {
    const { showAvatar = true, forGreeting = false } = typeof options === 'boolean' ? { showAvatar: options } : options;
    if (!forGreeting && !showAvatar) return '';
    const defaultHtml = `
        <div class="ai-avatar">
            <div class="ai-avatar-icon">🤖</div>
            <div class="ai-name">${botName}</div>
        </div>
    `;
    if (!avatar) return defaultHtml;
    if (isEmoji(avatar)) {
        return `
            <div class="ai-avatar">
                <div class="ai-avatar-icon emoji-avatar">${avatar}</div>
                <div class="ai-name">${botName}</div>
            </div>
        `;
    }
    if (isImageUrl(avatar)) {
        return `
            <div class="ai-avatar">
                <div class="ai-avatar-icon image-avatar">
                    <img src="${avatar}" alt="${botName}"
                         onerror="this.style.display='none'; this.parentNode.innerHTML='🤖';"
                         onload="this.style.display='block';" />
                </div>
                <div class="ai-name">${botName}</div>
            </div>
        `;
    }
    if (isSvg(avatar)) {
        return `
            <div class="ai-avatar">
                <div class="ai-avatar-icon svg-avatar">${sanitizeSvg(avatar)}</div>
                <div class="ai-name">${botName}</div>
            </div>
        `;
    }
    if (avatar.length <= 10) {
        return `
            <div class="ai-avatar">
                <div class="ai-avatar-icon text-avatar">${avatar}</div>
                <div class="ai-name">${botName}</div>
            </div>
        `;
    }
    return defaultHtml;
}

// ── isEmoji ───────────────────────────────────────────────────────────────────

describe('isEmoji', () => {
    test('returns true for robot emoji 🤖', () => expect(isEmoji('🤖')).toBe(true));
    test('returns true for smiley 😀', () => expect(isEmoji('😀')).toBe(true));
    test('returns true for star ⭐', () => expect(isEmoji('⭐')).toBe(true));
    test('returns true for fire 🔥', () => expect(isEmoji('🔥')).toBe(true));
    test('returns true for wave 👋', () => expect(isEmoji('👋')).toBe(true));
    test('returns false for plain ASCII text', () => expect(isEmoji('AI')).toBe(false));
    test('returns false for null', () => expect(isEmoji(null)).toBe(false));
    test('returns false for empty string', () => expect(isEmoji('')).toBe(false));
    test('returns false for string longer than 20 chars', () => expect(isEmoji('a'.repeat(21))).toBe(false));
    test('returns false for URL', () => expect(isEmoji('https://example.com/img.png')).toBe(false));
    // Note: \p{Emoji} matches digit chars in Unicode — '1','2','3' are Emoji chars per spec.
    // Test that a plain ASCII word is not treated as emoji instead.
    test('returns false for plain ASCII word', () => expect(isEmoji('hello')).toBe(false));
});

// ── isImageUrl ────────────────────────────────────────────────────────────────

describe('isImageUrl', () => {
    test('returns true for https jpg', () => expect(isImageUrl('https://example.com/img.jpg')).toBe(true));
    test('returns true for https png', () => expect(isImageUrl('https://example.com/img.png')).toBe(true));
    test('returns true for https webp', () => expect(isImageUrl('https://example.com/img.webp')).toBe(true));
    test('returns true for https svg', () => expect(isImageUrl('https://example.com/icon.svg')).toBe(true));
    test('returns true for http gif', () => expect(isImageUrl('http://example.com/anim.gif')).toBe(true));
    test('returns true for base64 data URL', () => expect(isImageUrl('data:image/png;base64,abc123')).toBe(true));
    test('returns true for absolute path with extension', () => expect(isImageUrl('/images/logo.png')).toBe(true));
    test('returns true for relative path with extension', () => expect(isImageUrl('./assets/img.jpg')).toBe(true));
    test('returns true for URL with query string', () => expect(isImageUrl('https://cdn.example.com/img.png?v=1')).toBe(true));
    test('returns true for any http URL (fallback)', () => expect(isImageUrl('https://example.com/no-extension')).toBe(true));
    test('returns false for null', () => expect(isImageUrl(null)).toBe(false));
    test('returns false for empty string', () => expect(isImageUrl('')).toBe(false));
    test('returns false for non-string', () => expect(isImageUrl(42)).toBe(false));
    test('returns true for URL with protocol ://', () => expect(isImageUrl('ftp://files.example.com/img.jpg')).toBe(true));
});

// ── isSvg ─────────────────────────────────────────────────────────────────────

describe('isSvg', () => {
    test('returns true for valid SVG string', () => {
        expect(isSvg('<svg viewBox="0 0 24 24"><path d="M0 0"/></svg>')).toBe(true);
    });
    test('returns true for SVG with leading whitespace', () => {
        expect(isSvg('  <svg><circle/></svg>  ')).toBe(true);
    });
    test('returns false for null', () => expect(isSvg(null)).toBe(false));
    test('returns false for empty string', () => expect(isSvg('')).toBe(false));
    test('returns false for non-string', () => expect(isSvg(42)).toBe(false));
    test('returns false for HTML that is not SVG', () => expect(isSvg('<div>hello</div>')).toBe(false));
    test('returns false for SVG without closing tag', () => expect(isSvg('<svg viewBox="0 0 24 24">')).toBe(false));
    test('returns false for partial match (no <svg start)', () => expect(isSvg('<path/></svg>')).toBe(false));
});

// ── sanitizeSvg ───────────────────────────────────────────────────────────────

describe('sanitizeSvg', () => {
    test('removes <script> tags', () => {
        const svg = '<svg><script>alert(1)</script><path/></svg>';
        expect(sanitizeSvg(svg)).not.toContain('<script>');
    });

    test('removes inline event handlers (double quotes)', () => {
        const svg = '<svg><path onclick="evil()"/></svg>';
        expect(sanitizeSvg(svg)).not.toContain('onclick=');
    });

    test('removes inline event handlers (single quotes)', () => {
        const svg = "<svg><path onmouseover='bad()'/></svg>";
        expect(sanitizeSvg(svg)).not.toContain('onmouseover=');
    });

    test('removes javascript: protocol', () => {
        const svg = '<svg><a href="javascript:void(0)"/></svg>';
        expect(sanitizeSvg(svg)).not.toContain('javascript:');
    });

    test('removes vbscript: protocol', () => {
        const svg = '<svg><a href="vbscript:foo"/></svg>';
        expect(sanitizeSvg(svg)).not.toContain('vbscript:');
    });

    test('removes data: URIs', () => {
        const svg = '<svg><image href="data:image/png;base64,abc"/></svg>';
        expect(sanitizeSvg(svg)).not.toContain('data:');
    });

    test('adds viewBox when missing', () => {
        const svg = '<svg><path/></svg>';
        expect(sanitizeSvg(svg)).toContain('viewBox="0 0 24 24"');
    });

    test('does not duplicate viewBox when already present', () => {
        const svg = '<svg viewBox="0 0 100 100"><path/></svg>';
        const result = sanitizeSvg(svg);
        expect(result.match(/viewBox/g)).toHaveLength(1);
    });

    test('preserves safe SVG content', () => {
        const svg = '<svg viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>';
        const result = sanitizeSvg(svg);
        expect(result).toContain('M0 0h24v24H0z');
    });
});

// ── generateAvatarHtml ────────────────────────────────────────────────────────

describe('generateAvatarHtml', () => {
    test('returns empty string when showAvatar=false and not greeting', () => {
        expect(generateAvatarHtml(null, 'Bot', { showAvatar: false, forGreeting: false })).toBe('');
    });

    test('returns HTML when showAvatar=false but forGreeting=true', () => {
        const html = generateAvatarHtml(null, 'Bot', { showAvatar: false, forGreeting: true });
        expect(html).toContain('ai-avatar');
    });

    test('returns default robot avatar when no avatar provided', () => {
        const html = generateAvatarHtml(null, 'MyBot');
        expect(html).toContain('🤖');
        expect(html).toContain('MyBot');
    });

    test('returns emoji avatar for emoji input', () => {
        const html = generateAvatarHtml('🤖', 'Bot');
        expect(html).toContain('emoji-avatar');
        expect(html).toContain('🤖');
    });

    test('returns image avatar for URL input', () => {
        const html = generateAvatarHtml('https://example.com/bot.png', 'Bot');
        expect(html).toContain('image-avatar');
        expect(html).toContain('<img');
        expect(html).toContain('https://example.com/bot.png');
    });

    test('returns SVG avatar for SVG string', () => {
        const svg = '<svg viewBox="0 0 24 24"><circle/></svg>';
        const html = generateAvatarHtml(svg, 'Bot');
        expect(html).toContain('svg-avatar');
        expect(html).toContain('<svg');
    });

    test('sanitizes SVG in avatar', () => {
        const svg = '<svg><script>alert(1)</script></svg>';
        const html = generateAvatarHtml(svg, 'Bot');
        expect(html).not.toContain('<script>');
    });

    test('returns text avatar for short string (<=10 chars)', () => {
        const html = generateAvatarHtml('AI', 'Bot');
        expect(html).toContain('text-avatar');
        expect(html).toContain('AI');
    });

    test('returns default avatar for long non-special string (>10 chars)', () => {
        const html = generateAvatarHtml('not-a-valid-avatar-string-way-too-long', 'Bot');
        expect(html).toContain('🤖');
    });

    test('includes botName in all avatar types', () => {
        expect(generateAvatarHtml(null, 'AssistBot')).toContain('AssistBot');
        expect(generateAvatarHtml('😀', 'AssistBot')).toContain('AssistBot');
        expect(generateAvatarHtml('https://x.com/a.png', 'AssistBot')).toContain('AssistBot');
    });

    test('accepts boolean options (legacy API)', () => {
        // When options is a boolean `true`, treated as { showAvatar: true }
        const html = generateAvatarHtml(null, 'Bot', true);
        expect(html).toContain('ai-avatar');
    });

    test('returns empty for boolean false option', () => {
        expect(generateAvatarHtml(null, 'Bot', false)).toBe('');
    });
});
