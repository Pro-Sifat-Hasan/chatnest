/**
 * Apply toggle button animation class
 * @param {Chatnest} chatnest - Chatnest instance
 */
export function applyToggleButtonAnimation(chatnest: any) {
    const chatToggle = chatnest.widget.querySelector('.chat-toggle');
    if (chatToggle && chatnest.config.toggleButtonAnimation > 0) {
        chatToggle.classList.remove('animation-1', 'animation-2', 'animation-3', 'animation-4', 'animation-5');
        chatToggle.classList.add(`animation-${chatnest.config.toggleButtonAnimation}`);
    }
}
