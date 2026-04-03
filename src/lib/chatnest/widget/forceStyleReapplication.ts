/**
 * Force reapplication of critical styles for npm/CDN builds
 * @param {Chatnest} chatnest - Chatnest instance
 */
export function forceStyleReapplication(chatnest: any) {
    const avatarIcons = chatnest.widget.querySelectorAll('.ai-avatar-icon:not(.emoji-avatar):not(.image-avatar)');
    avatarIcons.forEach((icon: any) => {
        if (!icon.style.backgroundColor) {
            icon.style.setProperty('background-color', chatnest.config.primaryColor || '#0084ff', 'important');
        }
    });

    const greetingAvatars = chatnest.widget.querySelectorAll('#greeting-row .ai-avatar-icon:not(.emoji-avatar):not(.image-avatar)');
    greetingAvatars.forEach((icon: any) => {
        icon.style.setProperty('background-color', chatnest.config.primaryColor || '#0084ff', 'important');
    });

    const typingDots = chatnest.widget.querySelectorAll('.typing-indicator span');
    typingDots.forEach((dot: any) => {
        dot.style.setProperty('background', '#666', 'important');
        dot.style.setProperty('background-color', '#666', 'important');
        dot.style.setProperty('display', 'inline-block', 'important');
        dot.style.setProperty('visibility', 'visible', 'important');
        dot.style.setProperty('width', '10px', 'important');
        dot.style.setProperty('height', '10px', 'important');
        dot.style.setProperty('border-radius', '50%', 'important');
        dot.style.setProperty('margin', '0 3px', 'important');
        dot.style.setProperty('box-shadow', 'none', 'important');
        dot.style.animation = 'none';
        dot.style.webkitAnimation = 'none';
    });

    setTimeout(() => {
        chatnest.startJavaScriptTypingAnimation();
    }, 100);

    const typingIndicator = chatnest.widget.querySelector('.typing-indicator');
    if (typingIndicator) {
        typingIndicator.style.setProperty('padding', '16px 20px', 'important');
        typingIndicator.style.setProperty('height', '50px', 'important');
        typingIndicator.style.setProperty('min-width', '85px', 'important');
        typingIndicator.style.setProperty('max-width', '100px', 'important');
        typingIndicator.style.setProperty('border-radius', '24px', 'important');
        typingIndicator.style.setProperty('background', '#f0f2f5', 'important');
        typingIndicator.style.setProperty('box-shadow', 'none', 'important');
    }

    const botMessages = chatnest.widget.querySelectorAll('.bot-message, .ai-message');
    botMessages.forEach((message: any) => {
        message.style.setProperty('box-shadow', 'none', 'important');
    });

    if (window.innerWidth <= 480) {
        const chatWindow = chatnest.widget.querySelector('.chat-window');
        if (chatWindow && chatWindow.classList.contains('active')) {
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
        }
    }
}
