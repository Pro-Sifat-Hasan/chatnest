/**
 * Setup erase chat button click handler.
 * Stores the bound handler on the element so it can be properly removed
 * on subsequent calls (e.g. after updateConfig rebuilds the widget).
 * @param {Chatnest} chatnest - Chatnest instance
 */
export function setupEraseButton(chatnest: any) {
    const eraseButton = chatnest.widget?.querySelector('.erase-chat');
    if (!eraseButton) return;

    // Remove any previously registered handler before attaching a new one
    if (eraseButton._eraseChatHandler) {
        eraseButton.removeEventListener('click', eraseButton._eraseChatHandler);
    }

    const handler = () => chatnest.eraseChat();
    eraseButton._eraseChatHandler = handler;
    eraseButton.addEventListener('click', handler);
}
