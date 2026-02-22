/**
 * Setup erase chat button click handler
 * @param {Chatnest} chatnest - Chatnest instance
 */
export function setupEraseButton(chatnest) {
    const eraseButton = chatnest.widget.querySelector('.erase-chat');
    if (eraseButton) {
        eraseButton.removeEventListener('click', chatnest.eraseChat.bind(chatnest));
        eraseButton.addEventListener('click', chatnest.eraseChat.bind(chatnest));
    }
}
