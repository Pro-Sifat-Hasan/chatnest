/**
 * Close the chat window when the user clicks outside the widget.
 * Stores the handler on the instance so it can be removed before re-adding
 * (prevents duplicate listeners on updateConfig / initializeWidget calls).
 * @param {Chatnest} chatnest - Chatnest instance
 */
export function setupClickOutsideToClose(chatnest: any) {
    if (chatnest._outsideClickHandler) {
        document.removeEventListener('click', chatnest._outsideClickHandler);
    }

    chatnest._outsideClickHandler = (event: MouseEvent) => {
        const chatWindow = chatnest.widget?.querySelector('.chat-window');
        if (!chatWindow?.classList.contains('active')) return;
        if (!chatnest.widget?.contains(event.target)) {
            chatnest.closeChat();
        }
    };

    document.addEventListener('click', chatnest._outsideClickHandler);
}
