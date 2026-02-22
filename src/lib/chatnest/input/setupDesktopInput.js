/**
 * Setup desktop input handling
 * @param {Chatnest} chatnest - Chatnest instance
 * @param {Element} inputElement - Input/textarea element
 */
export function setupDesktopInput(chatnest, inputElement) {
    inputElement.removeAttribute('readonly');
    inputElement.removeAttribute('disabled');
    inputElement.style.userSelect = 'text';
    inputElement.style.pointerEvents = 'auto';
    inputElement.style.cursor = 'text';
    inputElement.style.caretColor = 'auto';

    inputElement.addEventListener('focus', () => {
        inputElement.style.caretColor = 'auto';
        inputElement.style.cursor = 'text';
        inputElement.classList.add('cursor-active');
    });

    inputElement.addEventListener('blur', () => {
        inputElement.style.caretColor = 'auto';
        inputElement.style.cursor = 'text';
    });

    inputElement.addEventListener('click', () => {
        inputElement.style.caretColor = 'auto';
        inputElement.style.cursor = 'text';
        inputElement.classList.add('cursor-active');
    });
}
