/**
 * Enable mobile input for interaction after sending
 * @param {Chatnest} chatnest - Chatnest instance
 * @param {Element} inputElement - Input/textarea element
 */
export function enableMobileInputInteraction(chatnest, inputElement) {
    if (!inputElement) return;
    try {
        inputElement.removeAttribute('readonly');
        inputElement.disabled = false;
        inputElement.readOnly = false;
        inputElement.style.pointerEvents = 'auto';
        inputElement.style.userSelect = 'text';
        inputElement.style.webkitUserSelect = 'text';
        inputElement.style.caretColor = 'auto';
    } catch (_) {}
}
