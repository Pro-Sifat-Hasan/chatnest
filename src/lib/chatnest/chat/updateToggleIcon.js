/**
 * Update toggle button icon based on open/closed state
 * @param {Chatnest} chatnest - Chatnest instance
 * @param {boolean} isOpen - Whether chat is open
 */
export function updateToggleIcon(chatnest, isOpen) {
    const chatToggle = chatnest.widget.querySelector('.chat-toggle');
    if (!chatToggle) return;

    chatToggle.setAttribute('aria-expanded', String(isOpen));
    chatToggle.setAttribute('aria-label', isOpen ? 'Close chat' : 'Open chat');

    if (isOpen) {
        chatToggle.innerHTML = `<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z'/%3E%3C/svg%3E" alt="Close">`;
    } else {
        if (chatnest.config.toggleButtonIcon) {
            const icon = chatnest.config.toggleButtonIcon;
            if (icon.length <= 4 && /\p{Emoji}/u.test(icon)) {
                chatToggle.innerHTML = `<span style="font-size: 24px;">${icon}</span>`;
            } else if (icon.startsWith('http') || icon.startsWith('data:image') || icon.startsWith('/')) {
                chatToggle.innerHTML = `<img src="${icon}" alt="Chat" style="width: 24px; height: 24px;">`;
            } else if (icon.trim().startsWith('<svg')) {
                chatToggle.innerHTML = icon;
            } else {
                chatToggle.innerHTML = `<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z'/%3E%3C/svg%3E" alt="Chat">`;
            }
        } else {
            chatToggle.innerHTML = `<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z'/%3E%3C/svg%3E" alt="Chat">`;
        }
    }
}
