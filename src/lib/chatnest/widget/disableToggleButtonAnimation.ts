/**
 * Disable toggle button animation (when chat opens)
 * @param {Chatnest} chatnest - Chatnest instance
 */
export function disableToggleButtonAnimation(chatnest: any) {
    const chatToggle = chatnest.widget.querySelector('.chat-toggle');
    if (chatToggle) {
        chatToggle.classList.remove('animation-1', 'animation-2', 'animation-3', 'animation-4', 'animation-5');
    }
}
