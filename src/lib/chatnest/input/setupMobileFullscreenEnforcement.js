/**
 * Setup mobile fullscreen enforcement for chat window
 * @param {Chatnest} chatnest - Chatnest instance
 */
export function setupMobileFullscreenEnforcement(chatnest) {
    const handleResize = () => {
        const chatWindow = chatnest.widget?.querySelector('.chat-window');
        if (chatWindow && chatWindow.classList.contains('active') && window.innerWidth <= 480) {
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
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    chatnest._mobileFullscreenCleanup = () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleResize);
    };
}
