/**
 * Open the chat window
 * @param {Chatnest} chatnest - Chatnest instance
 */
export function openChat(chatnest: any) {
    const chatWindow = chatnest.widget.querySelector('.chat-window');
    const chatInput = chatnest.widget.querySelector('.chat-input .chat-textarea');
    const textBox = chatnest.widget.querySelector('.chat-text-box');

    if (textBox && chatnest.config.showTextBox && !chatnest._textBoxManuallyClosed) {
        textBox.style.display = 'none';
    }

    chatWindow.style.display = 'flex';
    chatnest.updateToggleIcon(true);

    chatnest.disableToggleButtonAnimation();

    requestAnimationFrame(() => {
        chatWindow.classList.add('active');

        if (window.innerWidth <= 480) {
            chatWindow.style.setProperty('position', 'fixed', 'important');
            chatWindow.style.setProperty('top', '0', 'important');
            chatWindow.style.setProperty('left', '0', 'important');
            chatWindow.style.setProperty('right', '0', 'important');
            chatWindow.style.setProperty('bottom', '0', 'important');
            chatWindow.style.setProperty('width', '100vw', 'important');
            chatWindow.style.setProperty('height', 'var(--chat-mobile-vh, 100dvh)', 'important');
            chatWindow.style.setProperty('min-width', '100vw', 'important');
            chatWindow.style.setProperty('max-width', '100vw', 'important');
            chatWindow.style.setProperty('min-height', 'var(--chat-mobile-vh, 100dvh)', 'important');
            chatWindow.style.setProperty('max-height', 'var(--chat-mobile-vh, 100dvh)', 'important');
            chatWindow.style.setProperty('margin', '0', 'important');
            chatWindow.style.setProperty('padding', '0', 'important');
            chatWindow.style.setProperty('border', 'none', 'important');
            chatWindow.style.setProperty('border-radius', '0', 'important');
            chatWindow.style.setProperty('box-sizing', 'border-box', 'important');
            chatWindow.style.setProperty('z-index', '2147483647', 'important');
            chatWindow.style.setProperty('background', 'white', 'important');
            chatWindow.style.setProperty('overflow', 'hidden', 'important');
            chatWindow.style.setProperty('transform', 'translateY(0)', 'important');

            document.body.style.setProperty('overflow', 'hidden', 'important');
            document.documentElement.style.setProperty('overflow', 'hidden', 'important');
        }

        if (chatnest.isMobileBrowser() && chatnest.config.enableEnhancedMobileInput && chatInput && !chatnest._mobileInputSetup) {
            chatnest.setupCleanMobileInput(chatInput);
            chatnest._mobileInputSetup = true;
        }

        // Move focus into the dialog for screen readers and keyboard users
        // (no caretColor hack — let the browser render the caret naturally)
        setTimeout(() => {
            if (chatInput) {
                chatInput.focus({ preventScroll: true });
            } else {
                const firstFocusable = chatWindow.querySelector(
                    'button:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
                );
                if (firstFocusable) firstFocusable.focus({ preventScroll: true });
            }
        }, 50);

        // Update toggle ARIA state
        const chatToggle = chatnest.widget.querySelector('.chat-toggle');
        if (chatToggle) chatToggle.setAttribute('aria-expanded', 'true');

        setTimeout(() => {
            chatnest.scrollToBottom();
        }, 100);

        if (chatnest.config.showFormOnStart && chatnest.config.hubspot?.enabled &&
            !chatnest.userManager.hasSubmittedForm()) {
            setTimeout(() => {
                chatnest.showHubSpotForm();
            }, 500);
        }

        // Native form — trigger: 'onOpen'
        if (
            chatnest.config.nativeForm?.enabled &&
            chatnest.config.nativeForm?.trigger === 'onOpen' &&
            !chatnest.nativeFormManager?.hasSubmitted()
        ) {
            setTimeout(() => {
                chatnest.showNativeForm();
            }, 400);
        }
    });
}
