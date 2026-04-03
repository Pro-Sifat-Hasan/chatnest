// @ts-nocheck
/**
 * Avatar detection and generation utilities for Chatnest
 */

export function isEmoji(str) {
    if (!str || str.length > 20) return false;
    const emojiRegex = /^[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]|[\u{238C}-\u{2454}]|[\u{20D0}-\u{20FF}]|[\u{FE0F}]|[\u{200D}]|[\u{E0020}-\u{E007F}]/u;
    const hasEmojiSequence = /[\u{1F3FB}-\u{1F3FF}]|[\u{200D}]|[\u{FE0F}]/u.test(str);
    return emojiRegex.test(str) || hasEmojiSequence || /\p{Emoji}/u.test(str);
}

export function isImageUrl(str) {
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

export function isSvg(str) {
    if (!str || typeof str !== 'string') return false;
    const trimmed = str.trim();
    return trimmed.startsWith('<svg') && trimmed.includes('</svg>');
}

export function sanitizeSvg(svg) {
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

export function generateAvatarHtml(avatar, botName, options = {}) {
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
