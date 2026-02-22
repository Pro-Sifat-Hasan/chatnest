/**
 * Chatnest constants and utility functions
 */

export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

export const togglePositions = {
    'bottom-right': {
        toggle: { bottom: '20px', right: '20px', left: 'auto', transform: 'none' },
        window: { bottom: '100px', right: '20px', left: 'auto', transform: 'none' }
    },
    'bottom-left': {
        toggle: { bottom: '20px', left: '20px', right: 'auto', transform: 'none' },
        window: { bottom: '100px', left: '20px', right: 'auto', transform: 'none' }
    },
    'bottom-center': {
        toggle: { bottom: '20px', left: '50%', right: 'auto', transform: 'translateX(-50%)' },
        window: { bottom: '100px', left: '50%', right: 'auto', transform: 'translateX(-50%)' }
    }
};

export const additionalStyles = `
    .chat-window {
        transition: width 0.3s ease, height 0.3s ease, bottom 0.3s ease, right 0.3s ease;
        position: fixed;
        z-index: 2147483647;
    }
    .chat-toggle {
        position: fixed;
        z-index: 2147483649;
        transition: bottom 0.3s ease, right 0.3s ease;
    }
    .chat-messages {
        transition: padding 0.3s ease, height 0.3s ease;
        scroll-behavior: smooth;
        overflow-y: auto;
        flex: 1;
    }
    .message {
        transition: max-width 0.3s ease, padding 0.3s ease;
    }
    @media screen and (max-width: 480px) {
        .chat-window.active {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100vw !important;
            height: var(--chat-mobile-vh, 100dvh) !important;
            min-width: 100vw !important;
            max-width: 100vw !important;
            min-height: var(--chat-mobile-vh, 100dvh) !important;
            max-height: var(--chat-mobile-vh, 100dvh) !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            border-radius: 0 !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
            z-index: 2147483647 !important;
            background: white !important;
            overflow: hidden !important;
        }
        .chat-input-container {
            padding-bottom: max(8px, env(safe-area-inset-bottom));
        }
    }
    @media (prefers-reduced-motion: reduce) {
        .chat-window, .chat-toggle, .chat-messages, .message {
            transition: none;
        }
    }
    @supports (-webkit-touch-callout: none) {
        .chat-window {
            padding-bottom: max(env(safe-area-inset-bottom), 20px);
        }
    }
`;
