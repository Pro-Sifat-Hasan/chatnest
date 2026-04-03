/**
 * Setup text box event listeners (close button, persistence)
 * @param {Chatnest} chatnest - Chatnest instance
 */
export function setupTextBoxEventListeners(chatnest: any) {
    const textBoxClose = chatnest.widget.querySelector('.chat-text-box-close');
    const textBox = chatnest.widget.querySelector('.chat-text-box');

    if (textBox) {
        if (chatnest.config.showTextBox) {
            textBox.setAttribute('data-persistent', 'true');
            textBox.style.pointerEvents = 'auto';
            textBox.style.visibility = 'visible';
            textBox.style.opacity = '1';

            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        mutation.removedNodes.forEach((node) => {
                            if (node === textBox && chatnest.config.showTextBox && !chatnest._textBoxManuallyClosed) {
                                console.warn('🛡️ Text box removal prevented - showTextBox is true');
                                if (!chatnest.widget.querySelector('.chat-text-box')) {
                                    chatnest.widget.insertBefore(textBox, chatnest.widget.firstChild);
                                }
                            }
                        });
                    }
                });
            });

            observer.observe(chatnest.widget, { childList: true, subtree: true });
        }

        if (textBoxClose && chatnest.config.showTextBoxCloseButton) {
            textBoxClose.addEventListener('click', (e: Event) => {
                e.preventDefault();
                e.stopPropagation();
                chatnest._textBoxManuallyClosed = true;
                textBox.style.display = 'none';
            });
        }
    }
}
