/**
 * Setup click outside to close chat
 * @param {Chatnest} chatnest - Chatnest instance
 */
export function setupClickOutsideToClose(chatnest) {
    document.addEventListener('click', (event) => {
        const chatWindow = chatnest.widget.querySelector('.chat-window');
        const chatToggle = chatnest.widget.querySelector('.chat-toggle');
        const isActive = chatWindow && chatWindow.classList.contains('active');

        if (!isActive) return;

        const isClickInsideWidget = chatnest.widget.contains(event.target);

        if (!isClickInsideWidget) {
            chatnest.closeChat();
        }
    });
}
