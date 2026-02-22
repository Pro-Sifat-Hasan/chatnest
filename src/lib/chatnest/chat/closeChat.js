/**
 * Close the chat window
 * @param {Chatnest} chatnest - Chatnest instance
 */
export function closeChat(chatnest) {
    const chatWindow = chatnest.widget.querySelector('.chat-window');
    const chatToggle = chatnest.widget.querySelector('.chat-toggle');
    const chatInput = chatnest.widget.querySelector('.chat-input .chat-textarea');

    if (chatnest.parlant) {
        chatnest.parlant.stopPolling();
    }

    if (chatInput) {
        chatInput.classList.remove('cursor-active', 'mobile-focused');
        chatInput.blur();
        chatInput.style.caretColor = 'transparent';

        if (chatnest._mobileInputCleanup) {
            chatnest._mobileInputCleanup();
            chatnest._mobileInputCleanup = null;
        }
    }

    if (chatnest.activeModal) {
        chatnest.removeActiveForm();
    }

    document.body.style.setProperty('overflow', '', 'important');
    document.body.style.setProperty('position', '', 'important');
    document.body.style.setProperty('width', '', 'important');
    document.documentElement.style.setProperty('overflow', '', 'important');

    const chatMessages = chatnest.widget.querySelector('.chat-messages');
    if (chatMessages) {
        chatMessages.style.overflow = '';
        chatMessages.style.overscrollBehavior = '';
    }

    chatWindow.classList.remove('active');
    chatnest.updateToggleIcon(false);

    if (chatToggle) {
        chatToggle.focus();
    }

    setTimeout(() => {
        chatWindow.style.display = 'none';

        const textBox = chatnest.widget.querySelector('.chat-text-box');
        if (textBox && chatnest.config.showTextBox && !chatnest._textBoxManuallyClosed) {
            textBox.style.display = 'block';
            textBox.style.opacity = '1';
            textBox.style.transform = 'translateY(0)';
        }

        chatnest.enableToggleButtonAnimation();
    }, 300);
}
