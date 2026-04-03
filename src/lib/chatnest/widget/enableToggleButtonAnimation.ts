/**
 * Enable toggle button animation (when chat closes)
 * @param {Chatnest} chatnest - Chatnest instance
 */
export function enableToggleButtonAnimation(chatnest: any) {
    const chatToggle = chatnest.widget.querySelector('.chat-toggle');
    if (chatToggle && chatnest.config.toggleButtonAnimation > 0) {
        chatToggle.classList.add(`animation-${chatnest.config.toggleButtonAnimation}`);
    }
}
