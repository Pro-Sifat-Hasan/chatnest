/**
 * Open the chat window
 * @param {Chatnest} chatnest - Chatnest instance
 */
export function openChat(chatnest) {
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

        if (chatInput) {
            chatInput.style.caretColor = 'transparent';
            chatInput.classList.remove('mobile-focused');
        }

        setTimeout(() => {
            chatnest.scrollToBottom();
        }, 100);

        if (chatnest.config.showFormOnStart && chatnest.config.hubspot?.enabled &&
            !chatnest.userManager.hasSubmittedForm()) {
            setTimeout(() => {
                chatnest.showHubSpotForm();
            }, 500);
        }
    });
}
