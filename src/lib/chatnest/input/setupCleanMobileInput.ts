/**
 * Setup enhanced mobile input handling
 * @param {Chatnest} chatnest - Chatnest instance
 * @param {Element} inputElement - Input/textarea element
 */
export function setupCleanMobileInput(chatnest: any, inputElement: any) {
    let isInputFocused = false;

    const setupInput = () => {
        inputElement.removeAttribute('readonly');
        inputElement.removeAttribute('disabled');
        inputElement.style.userSelect = 'text';
        inputElement.style.webkitUserSelect = 'text';
        inputElement.style.pointerEvents = 'auto';
        inputElement.style.fontSize = '16px';
        inputElement.style.webkitAppearance = 'none';
        inputElement.style.appearance = 'none';
    };

    const focusInput = ({ forceEnd = true } = {}) => {
        setupInput();
        isInputFocused = true;

        inputElement.focus();
        inputElement.click();

        if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            const tempInput = document.createElement('input');
            tempInput.style.position = 'absolute';
            tempInput.style.left = '-9999px';
            tempInput.style.fontSize = '16px';
            tempInput.style.opacity = '0';
            document.body.appendChild(tempInput);
            tempInput.focus();

            setTimeout(() => {
                inputElement.focus();
                if (isInputFocused && forceEnd) {
                    inputElement.setSelectionRange(inputElement.value.length, inputElement.value.length);
                }
                document.body.removeChild(tempInput);
            }, 50);
        } else {
            setTimeout(() => {
                if (isInputFocused && forceEnd) {
                    inputElement.setSelectionRange(inputElement.value.length, inputElement.value.length);
                }
            }, 100);
        }
    };

    const blurInput = () => {
        isInputFocused = false;
        inputElement.blur();
        inputElement.classList.remove('mobile-focused');
        inputElement.style.caretColor = 'transparent';
    };

    inputElement.addEventListener('focus', () => {
        isInputFocused = true;
        inputElement.classList.add('mobile-focused');
        inputElement.style.caretColor = 'auto';
        inputElement.style.cursor = 'text';
    });

    inputElement.addEventListener('blur', () => {
        setTimeout(() => {
            const activeElement = document.activeElement;
            const chatWindow = chatnest.widget?.querySelector('.chat-window');

            if (!chatWindow || !chatWindow.contains(activeElement)) {
                isInputFocused = false;
                inputElement.classList.remove('mobile-focused');
                inputElement.style.caretColor = 'transparent';
            }
        }, 100);
    });

    inputElement.addEventListener('click', () => {
        if (!isInputFocused) {
            focusInput({ forceEnd: false });
        }
    });

    inputElement.addEventListener('touchstart', () => {
        if (!isInputFocused) {
            focusInput({ forceEnd: false });
        }
    });

    inputElement.addEventListener('touchend', () => {
        if (!isInputFocused) {
            focusInput({ forceEnd: false });
        }
    });

    const container = inputElement.closest('.chat-input');
    if (container) {
        const overlay = document.createElement('div');
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.right = '0';
        overlay.style.bottom = '0';
        overlay.style.zIndex = '0';
        overlay.style.background = 'transparent';
        overlay.style.cursor = 'text';
        overlay.style.pointerEvents = 'none';
        container.style.position = 'relative';
        container.appendChild(overlay);

        const handleContainerInteraction = (e: any) => {
            if (e && e.target && e.target.closest && e.target.closest('.send-button, .file-button')) {
                return;
            }
            if (e && (e.target === inputElement || (e.target.closest && e.target.closest('.chat-textarea')))) {
                return;
            }
            e.preventDefault();
            e.stopPropagation();
            focusInput();
        };

        container.addEventListener('click', (e: Event) => handleContainerInteraction(e));
        container.addEventListener('touchstart', (e: Event) => handleContainerInteraction(e));
        container.addEventListener('touchend', (e: Event) => handleContainerInteraction(e));
    }

    const handleOutsideClick = (e: any) => {
        const chatWindow = chatnest.widget.querySelector('.chat-window');
        if (isInputFocused && !chatWindow.contains(e.target)) {
            blurInput();
        }
    };

    document.addEventListener('click', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);

    chatnest._mobileInputCleanup = () => {
        document.removeEventListener('click', handleOutsideClick);
        document.removeEventListener('touchstart', handleOutsideClick);
    };

    setupInput();

    if (chatnest.isMobileBrowser()) {
        inputElement.style.caretColor = 'transparent';
    } else {
        inputElement.style.caretColor = 'auto';
    }
}
