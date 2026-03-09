
/**
 * Load chat widget styles
 * @param {Chatnest} chatnest - Chatnest instance
 */
export function loadStyles(chatnest) {
        chatnest.applyTheme();

        // Inject Google Fonts via <link> — @import inside a dynamically-injected
        // <style> tag is unreliable in Safari and other browsers.
        const FONT_LINK_ID = 'chat-widget-font';
        if (!document.getElementById(FONT_LINK_ID)) {
            const link = document.createElement('link');
            link.id = FONT_LINK_ID;
            link.rel = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&display=swap';
            document.head.appendChild(link);
        }

        const style = document.createElement('style');
        style.textContent = `
            :root {
                --chat-primary-color: ${chatnest.config.primaryColor};
                --chat-primary-color-gradient: ${chatnest.config.primaryColor};
                --chat-message-font-size: ${chatnest.config.fontSize};
                --chat-width: ${chatnest.config.width};
                --chat-height: ${chatnest.config.height};
                --chat-toggle-size: ${chatnest.config.toggleButtonSize}px;
                --chat-toggle-bottom-margin: ${chatnest.config.toggleButtonBottomMargin}px;
                --chat-toggle-right-margin: ${chatnest.config.toggleButtonRightMargin}px;
                --website-bottom-spacing: ${chatnest.config.websiteBottomSpacing}px;
                --text-box-spacing-from-toggle: ${chatnest.config.textBoxSpacingFromToggle}px;
                --text-box-text-color: ${chatnest.config.textBoxTextColor === 'primary' ? chatnest.config.primaryColor : (chatnest.config.textBoxTextColor === 'default' ? '#374151' : chatnest.config.textBoxTextColor)};
                --text-box-submessage-color: ${chatnest.config.textBoxTextColor === 'primary' ? chatnest.config.primaryColor : (chatnest.config.textBoxTextColor === 'default' ? '#6b7280' : chatnest.config.textBoxTextColor)};
                --text-box-submessage-opacity: ${chatnest.config.textBoxTextColor === 'primary' ? '0.8' : '1'};
                --text-box-is-gradient: ${chatnest.config.textBoxTextColor === 'primary' && chatnest.isGradient(chatnest.config.primaryColor) ? 'true' : 'false'};
                --chat-border-radius: 20px;
                --chat-shadow: 0 25px 50px -12px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.04);
                --chat-shadow-elevated: 0 32px 64px -12px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.06);
                --typing-dot-color: ${chatnest.config.typingIndicatorColor};
                --chat-primary-color-rgb: ${chatnest.hexToRgb(chatnest.config.primaryColor)};
                --send-button-icon-size: ${chatnest.config.sendButtonIconSize}px;
                
                /* Theme variables */
                --chat-bg-color: ${chatnest.getThemeColor('bg')};
                --chat-text-color: ${chatnest.getThemeColor('text')};
                --chat-border-color: ${chatnest.getThemeColor('border')};
                --chat-input-bg: ${chatnest.getThemeColor('inputBg')};
                --chat-message-bg: ${chatnest.getThemeColor('messageBg')};
                --chat-header-bg: ${chatnest.getThemeColor('headerBg')};
                --chat-header-text: ${chatnest.getThemeColor('headerText')};
            }

            /* Scope reset strictly to the widget — never touch the host page */
            .chat-widget,
            .chat-widget * {
                box-sizing: border-box;
                font-family: "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif;
            }

            /* Chat Widget Container */
            .chat-widget {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 2147483647;
            }

            .chat-widget.left .chat-toggle {
                left: 20px;
                right: auto;
            }

            .chat-widget.left .chat-window {
                left: 20px;
                right: auto;
            }

            /* Chat Toggle Button - Modern floating pill with glow */
            .chat-toggle {
                width: var(--chat-toggle-size);
                height: var(--chat-toggle-size);
                min-width: 44px;
                min-height: 44px;
                border: none;
                padding: 0;
                font: inherit;
                border-radius: 50%;
                background: var(--chat-primary-color-gradient);
                box-shadow: 0 8px 32px rgba(var(--chat-primary-color-rgb, 26, 115, 232), 0.35), 0 0 0 1px rgba(255,255,255,0.2) inset;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease;
                z-index: 2147483650;
                position: fixed;
                text-align: center;
            }

            .chat-toggle:hover {
                transform: scale(1.1);
                box-shadow: 0 12px 40px rgba(var(--chat-primary-color-rgb, 26, 115, 232), 0.45), 0 0 0 1px rgba(255,255,255,0.3) inset;
            }

            .chat-toggle:active {
                transform: scale(1.02);
            }

            .chat-toggle:focus-visible {
                outline: 2px solid currentColor;
                outline-offset: 2px;
            }

            @media (prefers-reduced-motion: reduce) {
                .chat-toggle,
                .chat-toggle:hover {
                    transition: none;
                    transform: none;
                }
                .chat-toggle.animation-1,
                .chat-toggle.animation-2,
                .chat-toggle.animation-3,
                .chat-toggle.animation-4,
                .chat-toggle.animation-5 {
                    animation: none !important;
                }
            }

            .chat-toggle img {
                width: 30px;
                height: 30px;
                display: block;
                margin: 0 auto;
            }

            .chat-toggle span {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: 100%;
                font-size: 24px;
                line-height: 1;
            }

            /* Toggle Button Animations - Enhanced for production compatibility */
            .chat-toggle.animation-1 {
                animation: pulseAnimation 2s infinite !important;
                -webkit-animation: pulseAnimation 2s infinite !important;
            }

            .chat-toggle.animation-2 {
                animation: bounceAnimation 2s infinite !important;
                -webkit-animation: bounceAnimation 2s infinite !important;
            }

            .chat-toggle.animation-3 {
                animation: shakeAnimation 3s infinite !important;
                -webkit-animation: shakeAnimation 3s infinite !important;
            }

            .chat-toggle.animation-4 {
                animation: infinityAnimation 3s infinite !important;
                -webkit-animation: infinityAnimation 3s infinite !important;
            }

            .chat-toggle.animation-5 {
                animation: rotateAnimation 4s infinite linear !important;
                -webkit-animation: rotateAnimation 4s infinite linear !important;
            }

            /* Keyframe Animations - Enhanced with vendor prefixes for production compatibility */
            @keyframes pulseAnimation {
                0%, 100% { 
                    transform: scale(1); 
                    -webkit-transform: scale(1);
                }
                50% { 
                    transform: scale(1.15); 
                    -webkit-transform: scale(1.15);
                }
            }

            @-webkit-keyframes pulseAnimation {
                0%, 100% { -webkit-transform: scale(1); }
                50% { -webkit-transform: scale(1.15); }
            }

            @keyframes bounceAnimation {
                0%, 20%, 50%, 80%, 100% { 
                    transform: translateY(0); 
                    -webkit-transform: translateY(0);
                }
                40% { 
                    transform: translateY(-10px); 
                    -webkit-transform: translateY(-10px);
                }
                60% { 
                    transform: translateY(-5px); 
                    -webkit-transform: translateY(-5px);
                }
            }

            @-webkit-keyframes bounceAnimation {
                0%, 20%, 50%, 80%, 100% { -webkit-transform: translateY(0); }
                40% { -webkit-transform: translateY(-10px); }
                60% { -webkit-transform: translateY(-5px); }
            }

            @keyframes shakeAnimation {
                0%, 100% { 
                    transform: translateX(0); 
                    -webkit-transform: translateX(0);
                }
                10%, 30%, 50%, 70%, 90% { 
                    transform: translateX(-5px); 
                    -webkit-transform: translateX(-5px);
                }
                20%, 40%, 60%, 80% { 
                    transform: translateX(5px); 
                    -webkit-transform: translateX(5px);
                }
            }

            @-webkit-keyframes shakeAnimation {
                0%, 100% { -webkit-transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { -webkit-transform: translateX(-5px); }
                20%, 40%, 60%, 80% { -webkit-transform: translateX(5px); }
            }

            @keyframes infinityAnimation {
                0%, 100% { 
                    transform: scale(1); 
                    -webkit-transform: scale(1);
                }
                25% { 
                    transform: scale(1.2); 
                    -webkit-transform: scale(1.2);
                }
                50% { 
                    transform: scale(1); 
                    -webkit-transform: scale(1);
                }
                75% { 
                    transform: scale(1.2); 
                    -webkit-transform: scale(1.2);
                }
            }

            @-webkit-keyframes infinityAnimation {
                0%, 100% { -webkit-transform: scale(1); }
                25% { -webkit-transform: scale(1.2); }
                50% { -webkit-transform: scale(1); }
                75% { -webkit-transform: scale(1.2); }
            }

            @keyframes rotateAnimation {
                from { 
                    transform: rotate(0deg); 
                    -webkit-transform: rotate(0deg);
                }
                to { 
                    transform: rotate(360deg); 
                    -webkit-transform: rotate(360deg);
                }
            }

            @-webkit-keyframes rotateAnimation {
                from { -webkit-transform: rotate(0deg); }
                to { -webkit-transform: rotate(360deg); }
            }

            /* Text Box Styles - Positioned below chat window for better visibility */
            .chat-text-box {
                z-index: 2147483640; /* Lower than chat window (2147483647) to not block branding */
                max-width: min(280px, calc(100vw - 40px)); /* Responsive max-width with proper margins */
                pointer-events: auto;
                box-sizing: border-box;
                position: fixed; /* Ensure proper stacking context */
                opacity: 1;
                /* No transitions for direct show/hide */
                /* Spacing is now handled by CSS variables in position-specific rules */
            }

            .chat-text-box-content {
                background: white;
                border-radius: 12px;
                padding: 16px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                border: 1px solid #e5e7eb;
                position: relative;
                animation: slideInUp 0.3s ease-out;
            }

            .chat-text-box-close {
                position: absolute;
                top: 10px;
                right: 10px;
                background: var(--chat-primary-color-gradient);
                border: none;
                cursor: pointer;
                padding: 8px;
                border-radius: 50%;
                color: white;
                width: 34px;
                height: 34px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                z-index: 10;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            }

            .chat-text-box-close:hover {
                filter: brightness(0.9);
                transform: scale(1.15) rotate(90deg);
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            }

            .chat-text-box-close svg {
                width: 18px;
                height: 18px;
                stroke-width: 2.5;
            }

            .chat-text-box-message {
                font-size: 16px;
                line-height: 1.5;
                margin-bottom: 14px;
                font-weight: 600;
                padding-right: 35px;
            }
            
            /* Gradient text support for text box message */
            .chat-text-box-message {
                background: var(--text-box-text-color);
                background-clip: text;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                color: var(--text-box-text-color); /* Fallback for non-webkit browsers */
            }
            
            /* Non-gradient text fallback */
            .chat-text-box-message:not([data-gradient="true"]) {
                background: none;
                background-clip: unset;
                -webkit-background-clip: unset;
                -webkit-text-fill-color: unset;
                color: var(--text-box-text-color);
            }

            .chat-text-box-separator {
                height: 1px;
                background: #e5e7eb;
                margin: 0 -4px 14px -4px;
            }

            .chat-text-box-submessage {
                font-size: 15px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 8px;
                opacity: var(--text-box-submessage-opacity);
            }
            
            /* Gradient text support for text box submessage */
            .chat-text-box-submessage {
                background: var(--text-box-submessage-color);
                background-clip: text;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                color: var(--text-box-submessage-color); /* Fallback for non-webkit browsers */
            }
            
            /* Non-gradient text fallback */
            .chat-text-box-submessage:not([data-gradient="true"]) {
                background: none;
                background-clip: unset;
                -webkit-background-clip: unset;
                -webkit-text-fill-color: unset;
                color: var(--text-box-submessage-color);
            }

            .chat-text-box-submessage::before {
                content: '';
                width: 8px;
                height: 8px;
                background: #10b981;
                border-radius: 50%;
                flex-shrink: 0;
            }

            /* Text Box Animation */
            @keyframes slideInUp {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            @keyframes slideOutDown {
                from {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
                to {
                    opacity: 0;
                    transform: translateY(-10px) scale(0.95);
                }
            }

            /* Dark theme styles for text box */
            .chat-widget.dark .chat-text-box-content {
                background: #374151;
                border-color: #4b5563;
            }

            .chat-widget.dark .chat-text-box-message {
                color: var(--text-box-text-color);
            }

            .chat-widget.dark .chat-text-box-submessage {
                color: var(--text-box-submessage-color);
                opacity: var(--text-box-submessage-opacity);
            }

            .chat-widget.dark .chat-text-box-separator {
                background: #4b5563;
            }

            .chat-widget.dark .chat-text-box-close {
                color: #9ca3af;
            }

            .chat-widget.dark .chat-text-box-close:hover {
                background: #4b5563;
                color: #d1d5db;
            }

            /* Chat Window - Modern glass-inspired panel */
            .chat-window {
                position: fixed;
                bottom: 100px;
                right: 20px;
                width: var(--chat-width);
                height: var(--chat-height);
                background: var(--chat-bg-color);
                border-radius: var(--chat-border-radius);
                box-shadow: var(--chat-shadow);
                display: none;
                flex-direction: column;
                overflow: hidden;
                transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease, box-shadow 0.35s ease;
                transform: translateY(24px) scale(0.96);
                opacity: 0;
                font-size: var(--chat-font-size);
                min-width: 300px;
                max-width: 600px;
                min-height: 400px;
                max-height: 800px;
                padding: 0;
                box-sizing: border-box;
                overscroll-behavior: contain;
                -webkit-overflow-scrolling: touch;
                border: 1px solid rgba(255,255,255,0.6);
            }

            .chat-window.active {
                display: flex;
                transform: translateY(0) scale(1);
                opacity: 1;
                border-radius: var(--chat-border-radius);
                overflow: hidden;
                box-shadow: var(--chat-shadow-elevated);
            }

            /* Chat Header - Refined gradient with subtle depth */
            .chat-header {
                background: var(--chat-primary-color-gradient);
                color: white;
                padding: 1rem 1.25rem;
                display: flex;
                align-items: center;
                justify-content: space-between;
                width: 100%;
                box-sizing: border-box;
                position: relative;
                margin: 0;
                border-top-left-radius: inherit;
                border-top-right-radius: inherit;
                border-bottom: 1px solid rgba(255, 255, 255, 0.12);
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            }

            /* Fix for header background extending to edges */
            .chat-header::before {
                content: '';
                position: absolute;
                top: 0;
                left: -1px;
                right: -1px;
                bottom: 0;
                background: var(--chat-primary-color-gradient);
                z-index: -1;
                border-top-left-radius: inherit;
                border-top-right-radius: inherit;
            }

            .chat-header-title {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                position: relative;
                z-index: 1;
            }
            
            .chat-header-text {
                display: flex;
                flex-direction: column;
                gap: 0.1rem;
            }
            
            .chat-header-subname {
                font-size: 0.8em;
                opacity: 0.8;
                font-weight: 400;
                line-height: 1.2;
            }

            .chat-header-avatar {
                width: 44px;
                height: 44px;
                border-radius: 12px;
                background: rgba(255, 255, 255, 0.25);
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                overflow: hidden;
                border: 1px solid rgba(255,255,255,0.3);
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }

            .chat-header-avatar img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                border-radius: 11px;
            }

            .chat-header-actions {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                position: relative;
                z-index: 1;
            }

            .erase-chat, .close-chat {
                background: rgba(255, 255, 255, 0.12);
                border: none;
                color: white;
                cursor: pointer;
                padding: 0.5rem;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 10px;
                transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
                width: 38px;
                height: 38px;
            }

            .erase-chat:hover, .close-chat:hover {
                background: rgba(255, 255, 255, 0.22);
                transform: scale(1.06);
            }

            .erase-chat:active, .close-chat:active {
                background: rgba(255, 255, 255, 0.15) !important;
                transform: scale(0.96);
            }

            /* Enhanced mobile touch support for header buttons */
            @media (max-width: 768px) {
                .erase-chat, .close-chat {
                    width: 44px;
                    height: 44px;
                    -webkit-tap-highlight-color: transparent;
                    touch-action: manipulation;
                }
                
                .erase-chat:active, .close-chat:active {
                    background: var(--chat-primary-color) !important;
                    transform: scale(0.9);
                }
            }

            .erase-chat img, .close-chat img {
                width: 20px;
                height: 20px;
                pointer-events: none;
            }

            /* Chat Messages - Soft gradient background */
            .chat-messages {
                flex: 1;
                overflow-y: auto;
                padding: 1.25rem 1.25rem;
                display: flex;
                flex-direction: column;
                gap: 1rem;
                overscroll-behavior: contain;
                -webkit-overflow-scrolling: touch;
                scroll-behavior: smooth;
                scrollbar-width: thin;
                scrollbar-color: rgba(15, 23, 42, 0.2) transparent;
                background: var(--chat-message-bg);
                ${chatnest.config.chatBackgroundImage ? `
                background-image: url('${chatnest.config.chatBackgroundImage}');
                background-size: cover;
                background-position: center;
                background-repeat: no-repeat;
                background-attachment: fixed;
                ` : `
                background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
                `}
            }

            .chat-messages::-webkit-scrollbar {
                width: 8px;
            }

            .chat-messages::-webkit-scrollbar-track {
                background: transparent;
            }

            .chat-messages::-webkit-scrollbar-thumb {
                background-color: rgba(15, 23, 42, 0.15);
                border-radius: 4px;
            }

            .chat-messages::-webkit-scrollbar-thumb:hover {
                background-color: rgba(15, 23, 42, 0.25);
            }

            /* Prevent iOS rubber-band effect */
            @supports (-webkit-touch-callout: none) {
                .chat-window {
                    height: -webkit-fill-available;
                }
                
                .chat-messages {
                    height: -webkit-fill-available;
                }
            }

            /* Dark theme styles */
            .chat-widget.dark-theme .chat-window {
                background: var(--chat-bg-color);
                border: 1px solid var(--chat-border-color);
            }

            .chat-widget.dark-theme .chat-header {
                background: var(--chat-primary-color);
                color: white;
            }

            .chat-widget.dark-theme .chat-input input,
            .chat-widget.dark-theme .chat-input .chat-textarea {
                background: var(--chat-input-bg);
                color: var(--chat-text-color);
                border-color: var(--chat-border-color);
            }

            .chat-widget.dark-theme .chat-input input::placeholder,
            .chat-widget.dark-theme .chat-input .chat-textarea::placeholder {
                color: #888888;
            }

            .chat-widget.dark-theme .bot-message {
                background: var(--chat-message-bg);
                color: var(--chat-text-color);
                border: 1px solid var(--chat-border-color);
            }

            .chat-widget.dark-theme .user-message {
                background: var(--chat-primary-color);
                color: white;
            }

            .chat-widget.dark-theme .typing-indicator {
                background: var(--chat-message-bg);
                border: 1px solid var(--chat-border-color);
            }

            .chat-widget.dark-theme .chip {
                background: var(--chat-message-bg);
                color: var(--chat-text-color);
                border: 1px solid var(--chat-border-color);
            }

            .chat-widget.dark-theme .chip:hover {
                background: var(--chat-border-color);
            }

            .message {
                max-width: 80%;
                padding: 0.8rem 1rem;
                border-radius: 1rem;
                margin: 0.25rem 0;
                font-size: calc(var(--chat-font-size) * 0.8);
                transition: max-width 0.3s ease, padding 0.3s ease;
            }

            .message-row {
                display: flex;
                align-items: flex-start;
                gap: 0.5rem;
                overflow: visible !important;
            }

            /* Chat spacer to ensure new messages and responses are visible */
            .chat-spacer {
                height: 20px;
                min-height: 20px;
                flex-shrink: 0;
                pointer-events: none;
            }

            /* Bot Message Styling - Modern soft card */
            .bot-message {
                max-width: 80%;
                padding: 1rem 1.25rem;
                background: #ffffff;
                border-radius: 18px;
                border-top-left-radius: 6px;
                font-size: 14px;
                line-height: 1.6;
                color: #1e293b;
                box-shadow: 0 2px 12px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.04);
                border: 1px solid rgba(15, 23, 42, 0.06);
                ${chatnest.config.chatBackgroundImage ? `
                background: rgba(255, 255, 255, 0.95) !important;
                backdrop-filter: blur(8px);
                ` : ''}
            }
            
            /* Ensure bot message consistency */
            .chat-widget .bot-message,
            .chat-widget .ai-message {
                background: #ffffff !important;
                color: #1e293b !important;
            }

            /* Error message styling - distinct visual feedback */
            .bot-message.error-message {
                background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%) !important;
                border-left: 4px solid #ef4444 !important;
                color: #991b1b !important;
                box-shadow: 0 2px 12px rgba(239, 68, 68, 0.12) !important;
            }

            .chat-widget.dark-theme .bot-message.error-message {
                background: rgba(220, 38, 38, 0.15) !important;
                border-left-color: #ef4444 !important;
                color: #fca5a5 !important;
            }

            .bot-message img {
                max-width: 100%;
                height: auto;
                border-radius: 8px;
                margin: 8px 0;
                transition: min-height 0.3s ease;
            }

            .bot-message img[src=""] {
                display: none;
            }

            .bot-message a {
                color: #0084ff;
                text-decoration: none;
            }

            .bot-message a:hover {
                text-decoration: underline;
            }

            /* User Message - Premium bubble */
            .user-message {
                margin-left: auto;
                background: var(--chat-primary-color-gradient);
                color: white;
                border-radius: 18px;
                border-top-right-radius: 6px;
                text-align: left;
                box-shadow: 0 4px 16px rgba(var(--chat-primary-color-rgb, 26, 115, 232), 0.25), 0 0 0 1px rgba(255,255,255,0.15) inset;
                ${chatnest.config.chatBackgroundImage ? `
                background: var(--chat-primary-color-gradient) !important;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12) !important;
                ` : ''}
            }

            .user-message-content {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .user-message-text {
                display: block;
            }

            .user-message-attachments {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
                margin-top: 4px;
            }

            .user-message-attachment-img {
                max-width: 120px;
                max-height: 120px;
                width: auto;
                height: auto;
                object-fit: cover;
                border-radius: 8px;
                border: 1px solid rgba(255,255,255,0.2);
            }

            /* Product Carousel - Klyra API */
            .chatnest-product-carousel {
                margin-top: 16px;
                width: 100%;
                display: flex;
                flex-direction: column;
                gap: 10px;
                position: relative;
            }

            .chatnest-carousel-nav {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
            }

            .chatnest-carousel-prev,
            .chatnest-carousel-next {
                flex-shrink: 0;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                border: 1px solid rgba(15, 23, 42, 0.12);
                background: #ffffff;
                color: #475569;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
            }

            .chatnest-carousel-prev:hover:not(.disabled),
            .chatnest-carousel-next:hover:not(.disabled) {
                background: var(--chat-primary-color);
                color: white;
                border-color: transparent;
                transform: scale(1.05);
            }

            .chatnest-carousel-prev.disabled,
            .chatnest-carousel-next.disabled {
                opacity: 0.4;
                cursor: not-allowed;
                pointer-events: none;
            }

            .chatnest-carousel-prev svg,
            .chatnest-carousel-next svg {
                width: 20px;
                height: 20px;
            }

            .chatnest-product-carousel-viewport {
                width: 100%;
                overflow-x: auto;
                overflow-y: hidden;
                scroll-snap-type: x mandatory;
                -webkit-overflow-scrolling: touch;
                scrollbar-width: thin;
            }

            .chatnest-product-carousel-viewport::-webkit-scrollbar {
                height: 6px;
            }

            .chatnest-product-carousel-viewport::-webkit-scrollbar-thumb {
                background: rgba(15, 23, 42, 0.2);
                border-radius: 3px;
            }

            .chatnest-product-carousel-inner {
                display: flex;
                gap: 12px;
                padding: 4px 0 12px 0;
                min-width: min-content;
            }

            .message-content-part {
                margin-bottom: 0.5em;
            }

            .message-content-part:last-child {
                margin-bottom: 0;
            }

            .chatnest-product-card {
                flex: 0 0 200px;
                width: 200px;
                scroll-snap-align: start;
                scroll-snap-stop: always;
                display: flex;
                flex-direction: column;
                background: #ffffff;
                border-radius: 14px;
                overflow: hidden;
                border: 1px solid rgba(15, 23, 42, 0.06);
                box-shadow: 0 4px 20px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(15, 23, 42, 0.04);
                transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.2s ease;
            }

            .chatnest-product-card:hover {
                transform: translateY(-3px);
                box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12), 0 4px 12px rgba(15, 23, 42, 0.06);
                border-color: rgba(15, 23, 42, 0.1);
            }

            .chatnest-product-card-image {
                position: relative;
                width: 100%;
                height: 180px;
                min-height: 180px;
                background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
            }

            .chatnest-product-card-image img {
                width: 100%;
                height: 100%;
                object-fit: contain;
                object-position: center;
                padding: 12px;
                display: block;
            }

            .chatnest-product-card-image-placeholder {
                display: none;
                position: absolute;
                inset: 0;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                color: #94a3b8;
                background: #f1f5f9;
            }

            .chatnest-product-card-image-placeholder.visible {
                display: flex;
            }

            .chatnest-product-card-body {
                padding: 14px;
                display: flex;
                flex-direction: column;
                gap: 8px;
                flex: 1;
            }

            .chatnest-product-card-name {
                font-size: 14px;
                font-weight: 600;
                color: #1e293b;
                margin: 0;
                line-height: 1.35;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }

            .chatnest-product-card-highlights {
                font-size: 12px;
                color: #64748b;
                margin: 0;
                line-height: 1.4;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }

            .chatnest-product-card-price {
                font-size: 15px;
                font-weight: 700;
                color: var(--chat-primary-color);
                margin-top: 2px;
            }

            .chatnest-product-card-btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                margin-top: 6px;
                padding: 10px 16px;
                font-size: 13px;
                font-weight: 600;
                color: #ffffff;
                background: var(--chat-primary-color-gradient);
                border: none;
                border-radius: 10px;
                text-decoration: none;
                cursor: pointer;
                transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
                box-shadow: 0 2px 8px rgba(var(--chat-primary-color-rgb, 26, 115, 232), 0.3);
            }

            .chatnest-product-card-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(var(--chat-primary-color-rgb, 26, 115, 232), 0.4);
                opacity: 0.95;
            }

            .chatnest-product-card-btn:active {
                transform: translateY(0);
            }

            /* Markdown Content Styles */
            .bot-message h1, .bot-message h2, .bot-message h3 {
                margin: 16px 0 8px 0;
            }

            .bot-message p {
                margin: 8px 0;
            }

            .bot-message ul, .bot-message ol {
                margin: 8px 0;
                padding-left: 20px;
            }

            .bot-message code {
                background: rgba(0, 0, 0, 0.05);
                padding: 2px 4px;
                border-radius: 4px;
                font-family: monospace;
            }

            .bot-message pre {
                background: rgba(0, 0, 0, 0.05);
                padding: 12px;
                border-radius: 4px;
                overflow-x: auto;
            }

            .bot-message blockquote {
                border-left: 4px solid #0084ff;
                margin: 8px 0;
                padding-left: 12px;
                color: #666;
            }
            
            /* COMPREHENSIVE GREETING WIDTH FIX - Force identical width to other AI responses */
            #greeting-row {
                display: flex !important;
                align-items: flex-start !important;
                gap: 0.5rem !important;
                width: 100% !important;
                max-width: 100% !important;
            }
            
            #greeting-row .bot-message-container {
                display: flex !important;
                flex-direction: column !important;
                align-items: flex-start !important;
                margin-bottom: 1rem !important;
                max-width: 80% !important;
                width: 80% !important;
                min-width: 60px !important;
            }
            
            #greeting-row .bot-message {
                max-width: 100% !important;
                width: 100% !important;
                min-width: 100% !important;
                padding: 1rem 1.25rem !important;
                background: #ffffff !important;
                border-radius: 18px !important;
                border-top-left-radius: 6px !important;
                font-size: 14px !important;
                line-height: 1.6 !important;
                color: #1e293b !important;
                box-sizing: border-box !important;
                box-shadow: 0 2px 12px rgba(15, 23, 42, 0.06) !important;
                border: 1px solid rgba(15, 23, 42, 0.06) !important;
            }
            
            #greeting-row .message-content {
                margin-top: 0.5rem !important;
                width: 100% !important;
                max-width: 100% !important;
                word-wrap: break-word !important;
                overflow-wrap: break-word !important;
            }
            
            /* Mobile responsive width for greeting */
            @media screen and (max-width: 480px) {
                #greeting-row .bot-message-container {
                    max-width: 85% !important;
                    width: 85% !important;
                }
                
                #greeting-row .bot-message {
                    max-width: 100% !important;
                    width: 100% !important;
                }
            }
            
            /* Remove greeting message shadow */
            #greeting-row .bot-message {
                box-shadow: none !important;
            }
            
            /* AI Avatar Styling */
            .bot-message-container {
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                margin-bottom: 1rem;
                position: relative;
                overflow: visible;
            }

            /* Reduce spacing between multiple responses from same query (Parlant) */
            .bot-message-container[data-query-id] + .bot-message-container[data-query-id] {
                margin-top: 0.25rem;
                margin-bottom: 0.5rem;
            }
            
            /* Add larger spacing between different queries */
            .message-row[data-query-id] {
                margin-bottom: 0.5rem;
            }
            
            /* When moving from one query to another (query-id changes), add more spacing */
            .message-row[data-query-id] + .message-row:not([data-query-id]),
            .message-row:not([data-query-id]) + .message-row[data-query-id] {
                margin-top: 1rem;
            }

            .bot-message {
                position: relative;
            }
            
            .ai-avatar {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-bottom: 0.8rem;
                font-size: 0.9em;
            }
            
            .ai-avatar-icon {
                width: 28px;
                height: 28px;
                border-radius: 50%;
                background: var(--chat-primary-color, #0084ff);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                color: white;
                flex-shrink: 0;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                overflow: hidden;
                position: relative;
            }
            
            /* Enhanced avatar type styles with fallback colors */
            .ai-avatar-icon.emoji-avatar {
                background: transparent !important;
                font-size: 18px;
                color: inherit;
                box-shadow: none;
            }
            
            .ai-avatar-icon.text-avatar {
                background: var(--chat-primary-color, ${chatnest.config.primaryColor || '#0084ff'}) !important;
                font-size: 14px;
                font-weight: 600;
                color: white;
            }
            
            .ai-avatar-icon.image-avatar {
                background: transparent !important;
                padding: 0;
            }
            
            .ai-avatar-icon.svg-avatar {
                background: var(--chat-primary-color, ${chatnest.config.primaryColor || '#0084ff'}) !important;
                padding: 4px;
            }
            
            /* Fallback for when CSS variables don't load properly */
            .chat-widget .ai-avatar-icon:not(.emoji-avatar):not(.image-avatar) {
                background-color: ${chatnest.config.primaryColor || '#0084ff'} !important;
            }
            
            .ai-avatar-icon img {
                width: 100%;
                height: 100%;
                border-radius: 50%;
                object-fit: cover;
                display: block;
            }
            
            .ai-avatar-icon svg {
                width: 18px;
                height: 18px;
                fill: currentColor;
                color: white;
            }
            
            .ai-avatar-icon.svg-avatar svg {
                fill: white;
                color: white;
            }
            
            .ai-name {
                font-weight: 600;
                color: var(--chat-primary-color, #0084ff);
                font-size: 0.9em;
                line-height: 1.2;
            }
            
            .message-content {
                margin-top: 0.5rem;
            }

            /* Chat Input Container */
            .chat-input-container {
                padding: 1rem 1.25rem;
                border-top: 1px solid rgba(15, 23, 42, 0.08);
                background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
            }

            /* Chat Branding */
            .chat-branding {
                padding: 0.625rem 1rem;
                background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
                text-align: center;
                border-bottom-left-radius: inherit;
                border-bottom-right-radius: inherit;
                font-size: 11px;
                color: #64748b;
                font-weight: 500;
                letter-spacing: 0.02em;
            }

            .chat-branding a {
                color: inherit;
                text-decoration: none;
                font-size: inherit;
                font-weight: 600;
                transition: color 0.2s ease;
            }

            .chat-branding a:hover {
                color: var(--chat-primary-color);
                text-decoration: none;
            }

            .chat-branding strong {
                font-weight: 600;
                font-size: inherit;
                color: #334155;
            }

            .chat-widget.dark .chat-branding {
                color: #a0aec0;
            }

            .chat-widget.dark .chat-branding a:hover {
                color: var(--chat-primary-color);
            }

            .chat-widget.dark .chat-branding strong {
                color: #e2e8f0;
                font-size: inherit;
            }

            .chat-widget.dark .chat-branding a:hover strong {
                color: var(--chat-primary-color);
            }

            /* Suggestion Chips */
            .suggestion-chips {
                padding: 0.5rem;
                display: flex;
                gap: 0.5rem;
                overflow-x: auto;
                white-space: nowrap;
                -webkit-overflow-scrolling: touch;
                scroll-behavior: smooth;
                scrollbar-width: auto;
                scrollbar-color: var(--chat-primary-color) #f0f2f5;
            }

            .suggestion-chips::-webkit-scrollbar {
                height: 6px;
            }

            .suggestion-chips::-webkit-scrollbar-track {
                background: #f0f2f5;
                border-radius: 3px;
            }

            .suggestion-chips::-webkit-scrollbar-thumb {
                background: var(--chat-primary-color);
                border-radius: 3px;
                transition: background 0.2s ease;
            }

            .suggestion-chips::-webkit-scrollbar-thumb:hover {
                background: var(--chat-primary-color);
                opacity: 0.8;
            }

            .chat-input input {
                -webkit-user-select: text !important; /* Allow text selection on Safari */
                user-select: text !important;        /* Ensure text selection works */
                -webkit-tap-highlight-color: transparent !important; /* Remove tap highlight on iOS/Android */
                cursor: text !important;             /* Ensure text cursor appears */
            }

            /* Avoid global bright blue outline rules (we use ash focus styling above) */
            .chat-input input:focus {
                outline: none !important;
            }

            /* Ensure active inputs remain functional */
            .chat-input input.active {
                user-select: text !important;        /* Ensure text selection */
                -webkit-user-select: text !important; /* Support for Safari */
            }

            /* Keep inactive inputs styled properly */
            .chat-input input:not(.active):focus {
                outline: none !important;            /* Remove focus outline */
                border-color: #e4e6eb !important;    /* Keep the border color default */
            }

            /* Prevent issues with z-index or visibility */
            .chat-input input,
            .chat-input .chat-textarea {
                z-index: 1 !important;
                visibility: visible !important;
                pointer-events: auto !important;
            }


            .chip {
                border: 1px solid rgba(15, 23, 42, 0.08);
                padding: 0.625rem 1.25rem;
                min-height: 44px;
                font: inherit;
                font-size: 14px;
                font-weight: 500;
                background: #ffffff;
                border-radius: 12px;
                white-space: nowrap;
                cursor: pointer;
                transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
                color: #475569;
                box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
            }

            .chip:hover {
                background: linear-gradient(135deg, rgba(var(--chat-primary-color-rgb, 26, 115, 232), 0.08) 0%, rgba(var(--chat-primary-color-rgb, 26, 115, 232), 0.04) 100%);
                color: var(--chat-primary-color);
                border-color: rgba(var(--chat-primary-color-rgb, 26, 115, 232), 0.2);
                box-shadow: 0 4px 12px rgba(var(--chat-primary-color-rgb, 26, 115, 232), 0.12);
                transform: translateY(-2px);
            }

            .chip:active {
                transform: translateY(0);
            }

            .chip:focus-visible {
                outline: 2px solid var(--chat-primary-color);
                outline-offset: 2px;
            }

            /* Optimized Chat Input - Desktop */
            .chat-input {
                display: flex;
                gap: 8px;
                margin-top: 8px;
                margin-bottom: 0;
                padding: 0;
                position: relative;
            }

            .chat-input input,
            .chat-input .chat-textarea {
                flex: 1;
                padding: 12px 16px;
                border: 1.5px solid rgba(15, 23, 42, 0.1);
                border-radius: 14px;
                outline: none;
                font-size: 15px;
                background-color: #ffffff;
                cursor: text;
                transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
                min-height: 48px;
                height: 48px;
                line-height: 1.5;
                box-sizing: border-box;
                color: #1f2937;
            }

            .chat-input input::placeholder,
            .chat-input .chat-textarea::placeholder {
                color: #9ca3af;
            }

            /* Multiline textarea specifics */
            .chat-input .chat-textarea {
                resize: none;
                overflow: hidden;
                height: auto;
                max-height: 140px;
                padding: 12px 48px 12px 16px; /* space for send button */
            }
            
            .chat-input input:focus,
            .chat-input .chat-textarea:focus {
                border-color: var(--chat-primary-color);
                border-width: 2px;
                box-shadow: 0 0 0 3px rgba(var(--chat-primary-color-rgb, 26, 115, 232), 0.15);
                outline: none;
                background-color: white;
                padding: 11px 47px 11px 15px; /* Adjust for thicker border + send icon space */
            }

            .chat-input input.cursor-active,
            .chat-input .chat-textarea.cursor-active {
                cursor: text !important;
                caret-color: auto !important;
            }

            .chat-input input:focus,
            .chat-input .chat-textarea:focus {
                cursor: text !important;
                caret-color: auto !important;
                outline: none;
            }

            /* Perfect mobile input design with send button inside */
            @media (max-width: 768px) {
                .chat-input {
                    padding: 4px 8px !important;
                    position: sticky !important;
                    bottom: 0 !important;
                    background: var(--chat-input-bg) !important;
                    border-top: 1px solid #e4e6eb !important;
                    z-index: 1000 !important;
                    display: flex !important;
                    align-items: flex-end !important;
                    gap: 10px !important;
                    /* Minimal design */
                    min-height: auto !important;
                    touch-action: manipulation !important;
                    position: relative !important;
                    margin: 0 !important;
                }
                
                .chat-input input,
                .chat-input .chat-textarea {
                    font-size: 16px !important; /* Prevent iOS zoom */
                    -webkit-user-select: text !important;
                    user-select: text !important;
                    -webkit-touch-callout: default !important;
                    cursor: text !important;
                    /* Perfect size */
                    min-height: 48px !important;
                    height: auto !important;
                    line-height: 20px !important;
                    touch-action: manipulation !important;
                    -webkit-appearance: none !important;
                    appearance: none !important;
                    border-radius: 14px !important;
                    /* Send button is outside on mobile now */
                    padding: 12px 14px !important;
                    border: 1.5px solid #e4e6eb !important;
                    background: #ffffff !important;
                    transition: all 0.25s ease !important;
                    outline: none !important;
                    z-index: 100 !important;
                    position: relative !important;
                    width: 100% !important;
                    flex: 1 !important;
                    /* Ensure full clickability */
                    pointer-events: auto !important;
                    -webkit-tap-highlight-color: rgba(0,0,0,0.1) !important;
                    box-sizing: border-box !important;
                    /* Subtle shadow */
                    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08) !important;
                    margin: 0 !important;
                }
                
                .chat-input input::placeholder {
                    color: #9ca3af !important;
                    font-size: 15px !important;
                    pointer-events: none !important;
                    user-select: none !important;
                    -webkit-user-select: none !important;
                }
                
                .chat-input input:focus,
                .chat-input input.mobile-focused {
                    border-color: var(--chat-primary-color) !important;
                    border-width: 2px !important;
                    box-shadow: 0 0 0 3px rgba(var(--chat-primary-rgb), 0.15) !important;
                    background: #ffffff !important;
                    caret-color: var(--chat-primary-color) !important;
                    transform: none !important;
                    padding: 0 47px 0 17px !important; /* Adjust for thicker border and smaller button */
                }
                
                .chat-input input:active {
                    background: #ffffff !important;
                    border-color: var(--chat-primary-color) !important;
                }
                
                                /* Mobile send button (rectangular, inside input) */
            .send-button {
                    position: relative !important;
                    right: auto !important;
                    bottom: auto !important;
                    top: auto !important;
                    left: auto !important;
                    transform: none !important;
                    min-width: 48px !important;
                    min-height: 48px !important;
                    width: 48px !important;
                    height: 48px !important;
                    touch-action: manipulation !important;
                    /* Rectangular (mobile) */
                    border-radius: 12px !important;
                    margin: 0 !important;
                    flex-shrink: 0 !important;
                    -webkit-tap-highlight-color: rgba(0,0,0,0.05) !important;
                    z-index: 200 !important;
                    /* Use primary color on mobile like your screenshot */
                    background: var(--chat-primary-color-gradient) !important;
                    border: none !important;
                    cursor: pointer !important;
                    box-shadow: none !important;
                    transition: all 0.2s ease !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    padding: 0 !important;
                    pointer-events: auto !important;
                    -webkit-user-select: none !important;
                    user-select: none !important;
                    opacity: 1 !important;
            }

            .send-button:hover {
                    transform: scale(1.06) !important;
                    background: rgba(0,0,0,0.06) !important;
                }
                
                .send-button:active {
                    transform: scale(0.94) !important;
                    background: rgba(0,0,0,0.08) !important;
            }
            
            .send-button:disabled {
                    opacity: 1 !important;
                    pointer-events: auto !important;
                    cursor: pointer !important;
            }

            .send-button img {
                    width: 22px !important;
                    height: 22px !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    object-fit: contain !important;
                    /* Ensure icon is visible on primary background */
                    filter: brightness(0) invert(1) !important;
                    pointer-events: none !important;
                }
                
                /* Mobile typing indicator: Thinking + animated ellipsis (no 3-dot bubbles) */
                .chat-widget .typing-indicator {
                    margin: 10px 0 !important;
                    margin-left: 0 !important;
                    margin-right: auto !important;
                    padding: 12px 16px !important;
                    max-width: 220px !important;
                    min-width: 110px !important;
                    border-radius: 14px !important;
                    border-top-left-radius: 6px !important;
                    height: auto !important;
                }
                
                .chat-widget .typing-indicator.active {
                    display: inline-flex !important;
                    align-items: center !important;
                    justify-content: flex-start !important;
                }
                
                /* Mobile chat window adjustments */
                .chat-window {
                    overflow: hidden !important;
                }
                
                .chat-messages {
                    overflow-y: auto !important;
                    -webkit-overflow-scrolling: touch !important;
                    overscroll-behavior: contain !important;
                }
            }



            /* Default send button styling (desktop/tablet). Mobile is overridden above in the (max-width: 768px) block. */
            /* Desktop/tablet send button (circular) only when the device supports hover + fine pointer. */
            @media (hover: hover) and (pointer: fine) {
            .send-button {
                background: var(--chat-primary-color-gradient) !important;
                color: white !important;
                border: none !important;
                border-radius: 50% !important;
                width: 48px !important;
                height: 48px !important;
                cursor: pointer !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                transition: all 0.25s ease !important;
                margin: 0 !important;
                min-width: 48px !important;
                min-height: 48px !important;
                flex-shrink: 0 !important;
                box-shadow: 0 1px 4px rgba(var(--chat-primary-color-rgb), 0.25) !important;
            }

            .send-button:hover {
                background: var(--chat-primary-color-gradient) !important;
                transform: scale(1.02) !important;
                box-shadow: 0 2px 8px rgba(var(--chat-primary-color-rgb), 0.35) !important;
            }

            .send-button:active {
                transform: scale(0.98) !important;
            }

            .send-button img {
                width: var(--send-button-icon-size, ${chatnest.config.sendButtonIconSize}px) !important;
                height: var(--send-button-icon-size, ${chatnest.config.sendButtonIconSize}px) !important;
                min-width: var(--send-button-icon-size, ${chatnest.config.sendButtonIconSize}px) !important;
                min-height: var(--send-button-icon-size, ${chatnest.config.sendButtonIconSize}px) !important;
                max-width: var(--send-button-icon-size, ${chatnest.config.sendButtonIconSize}px) !important;
                max-height: var(--send-button-icon-size, ${chatnest.config.sendButtonIconSize}px) !important;
                object-fit: contain !important;
                display: block !important;
                flex-shrink: 0 !important;
                filter: brightness(0) invert(1) !important;
                pointer-events: none !important;
            }
            }

            /* HARD OVERRIDE: touch devices must keep the mobile rectangular send button */
            @media (pointer: coarse) {
                .chat-input .send-button {
                    border-radius: 12px !important;
                    background: var(--chat-primary-color-gradient) !important;
                    opacity: 1 !important;
                }
            }

            /* Typing indicator: "Thinking…" text with animated ellipsis (no 3-dot bubbles) */
            .chat-widget .typing-indicator {
                display: none !important;
                padding: 12px 18px !important;
                background: #ffffff !important;
                border-radius: 18px !important;
                border-top-left-radius: 6px !important;
                box-shadow: 0 2px 12px rgba(15, 23, 42, 0.06) !important;
                border: 1px solid rgba(15, 23, 42, 0.06) !important;
                align-self: flex-start !important;
                margin: 12px 0 !important;
                margin-left: 0 !important;
                margin-right: auto !important;
                box-shadow: none !important;
                border: 1px solid rgba(0, 0, 0, 0.06) !important;
                position: relative !important;
                width: fit-content !important;
                max-width: 220px !important;
                animation: fadeInUp 0.4s ease-out !important;
                -webkit-animation: fadeInUp 0.4s ease-out !important;
            }
            
            .typing-indicator.active {
                display: inline-flex !important;
                align-items: center !important;
                justify-content: flex-start !important;
            }

            .typing-text {
                display: inline-flex !important;
                align-items: center !important;
                gap: 6px !important;
                font-size: 13px !important;
                color: #6b7280 !important;
                font-weight: 600 !important;
                line-height: 1 !important;
                white-space: nowrap !important;
            }

            .typing-spinner {
                display: inline-block !important;
                width: 16px;
                height: 16px;
                box-sizing: border-box;
                border-radius: 999px;
                border: 2px solid rgba(107, 114, 128, 0.25);
                border-top-color: var(--chat-primary-color);
                animation: typingSpin 0.8s linear infinite;
            }
            @keyframes typingSpin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }

            /* Safety: if an old cached build still renders dot <span>s, hide them */
            .typing-indicator span {
                display: none !important;
            }

            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(15px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            @keyframes shimmer {
                0% { left: -100%; }
                100% { left: 100%; }
            }

            /* Dark theme typing indicator */
            .chat-widget.dark .typing-indicator {
                background: #1f2937 !important;
                border: 1px solid rgba(255, 255, 255, 0.12) !important;
            }
            .chat-widget.dark .typing-text {
                color: #cbd5e1 !important;
            }

            /* Typing Text Styles (only when showTypingText is true) */
            .typing-text {
                font-size: 11px;
                color: #6c757d;
                margin-top: 4px;
                text-align: center;
                font-weight: 400;
                opacity: 0.7;
                animation: pulse 2s infinite;
            }

            @keyframes pulse {
                0%, 100% { opacity: 0.6; }
                50% { opacity: 1; }
            }

            .chat-widget.dark .typing-text {
                color: #a0aec0;
            }

            /* File Upload Styles */
            .file-button {
                background: none;
                border: none;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                margin-right: 8px;
            }

            .file-button:hover {
                background: rgba(0, 0, 0, 0.05);
                transform: scale(1.05);
            }

            .file-button img {
                width: 20px;
                height: 20px;
                opacity: 0.7;
                transition: opacity 0.2s ease;
            }

            .file-button:hover img {
                opacity: 1;
            }

            .file-preview {
                margin-top: 8px;
                padding: 8px;
                background: #f8f9fa;
                border-radius: 8px;
                border: 1px solid #e9ecef;
            }

            .file-preview-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 6px 10px;
                margin: 4px 0;
                background: white;
                border-radius: 10px;
                border: 1px solid rgba(15, 23, 42, 0.1);
                gap: 10px;
            }

            .file-preview-item .file-preview-thumb {
                width: 40px;
                height: 40px;
                object-fit: cover;
                border-radius: 8px;
                flex-shrink: 0;
            }

            .file-preview-item .file-info {
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                gap: 2px;
                flex: 1;
                min-width: 0;
            }

            .file-preview-item .file-name {
                font-size: 12px;
                color: #495057;
                max-width: 150px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .file-preview-item .file-size {
                font-size: 10px;
                color: #6c757d;
            }

            .file-preview-item .remove-file {
                background: none;
                border: none;
                color: #dc3545;
                cursor: pointer;
                padding: 2px;
                border-radius: 2px;
                font-size: 12px;
            }

            .file-preview-item .remove-file:hover {
                background: #dc3545;
                color: white;
            }

            .chat-widget.dark .file-preview {
                background: #2d3748;
                border-color: #4a5568;
            }

            .chat-widget.dark .file-preview-item {
                background: #1a202c;
                border-color: #4a5568;
            }

            .chat-widget.dark .file-preview-item .file-name {
                color: #e2e8f0;
            }

            .chat-widget.dark .file-preview-item .file-size {
                color: #a0aec0;
            }

            /* Output Styles */
            #output {
                white-space: pre-wrap;
                font-family: Arial, sans-serif;
                line-height: 1.5;
            }

            #output img {
                max-width: 100%;
                height: auto;
            }

            #output code {
                background-color: #f4f4f4;
                padding: 2px 4px;
                border-radius: 3px;
            }

            /* Dark Theme */
            .chat-widget.dark {
                --chat-bg-color: #1a1a1a;
                --chat-text-color: #ffffff;
                --chat-message-bg: #2d2d2d;
                --chat-bot-message-bg: #383838;
                --chat-input-bg: #2d2d2d;
                --chat-input-border: #404040;
            }

            .chat-widget.dark .chat-window {
                background: var(--chat-bg-color);
                color: var(--chat-text-color);
            }

            .chat-widget.dark .message {
                background: var(--chat-message-bg);
                color: var(--chat-text-color);
            }

            .chat-widget.dark .bot-message {
                background: #2d2d2d;
                color: #ffffff;
                box-shadow: none !important;
            }

            .chat-widget.dark .chat-input input {
                background: var(--chat-input-bg);
                color: var(--chat-text-color);
                border-color: var(--chat-input-border);
            }

            /* Initial greeting message style - removed to match other AI responses */

            /* Responsive Design */
            /* Mobile Portrait */
            @media screen and (max-width: 480px) {
                :root {
                --chat-toggle-size: 50px;
                }

                .chat-input input {
                    -webkit-user-select: text !important; /* Allow text selection on Safari */
                    user-select: text !important;        /* Ensure text selection works */
                    -webkit-tap-highlight-color: transparent !important; /* Remove tap highlight on iOS/Android */
                    cursor: text !important;             /* Ensure text cursor appears */
                }

                .chat-input input:focus {
                    outline: none !important;
                }

                /* Ensure active inputs remain functional */
                .chat-input input.active {
                    user-select: text !important;        /* Ensure text selection */
                    -webkit-user-select: text !important; /* Support for Safari */
                }

                /* Keep inactive inputs styled properly */
                .chat-input input:not(.active):focus {
                    outline: none !important;            /* Remove focus outline */
                    border-color: #e4e6eb !important;    /* Keep the border color default */
                }

                /* Prevent issues with z-index or visibility */
                .chat-input input {
                    z-index: 1 !important;
                    visibility: visible !important;
                    pointer-events: auto !important;
                }

            
                .chat-window {
                    position: fixed !important;
                    bottom: 0 !important;
                    right: 0 !important;
                    left: 0 !important;
                    top: 0 !important;
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
                    transform: translateY(100%) !important;
                    transition: transform 0.3s ease-in-out !important;
                    z-index: 999999 !important;
                    background: white !important;
                    overflow: hidden !important;
                    display: flex !important;
                    flex-direction: column !important;
                }

                .chat-window.active {
                    transform: translateY(0) !important;
                }
                
                /* Extra aggressive fullscreen for npm/CDN */
                .chat-widget .chat-window.active {
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
                    z-index: 999999 !important;
                    background: white !important;
                    overflow: hidden !important;
                    transform: translateY(0) !important;
                    display: flex !important;
                    flex-direction: column !important;
                }
            
                .chat-toggle {
                    position: fixed !important;
                    bottom: 20px !important;
                    right: 20px !important;
                    z-index: 2147483650 !important;
                    transform: none;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    visibility: visible !important;
                }

                .chat-toggle img {
                    width: 24px !important;
                    height: 24px !important;
                    display: block !important;
                    margin: 0 auto !important;
                }

                .chat-toggle span {
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    width: 100% !important;
                    height: 100% !important;
                    font-size: 24px !important;
                    line-height: 1 !important;
                }

                /* Hide toggle when chat is active on mobile */
                .chat-widget .chat-window.active ~ .chat-toggle {
                    display: none !important;
                }
            
                .chat-header {
                padding: 0.8rem;
                }
            
                .chat-messages {
                padding: 0.8rem;
                }
            
                .chat-input-container {
                padding: 0.8rem;
                padding-bottom: max(0.8rem, env(safe-area-inset-bottom));
                border-top: none;
                position: sticky !important;
                bottom: 0 !important;
                z-index: 9999 !important;
                background: var(--chat-input-bg) !important;
                }
            
                .message {
                max-width: 85%;
                padding: 0.7rem;
                }
            
                .suggestion-chips {
                padding: 0.5rem 0;
                }
            
                .chip {
                padding: 0.4rem 0.8rem;
                font-size: 0.9rem;
                }
            }
            
            /* Mobile Landscape */
            @media screen and (max-height: 500px) and (orientation: landscape) {
                .chat-window {
                height: 100vh;
                max-height: calc(100vh - 20px);
                }

                .chat-input input {
                    -webkit-user-select: text !important; /* Allow text selection on Safari */
                    user-select: text !important;        /* Ensure text selection works */
                    -webkit-tap-highlight-color: transparent !important; /* Remove tap highlight on iOS/Android */
                    cursor: text !important;             /* Ensure text cursor appears */
                }

                .chat-input input:focus {
                    outline: none !important;
                }

                /* Ensure active inputs remain functional */
                .chat-input input.active {
                    user-select: text !important;        /* Ensure text selection */
                    -webkit-user-select: text !important; /* Support for Safari */
                }

                /* Keep inactive inputs styled properly */
                .chat-input input:not(.active):focus {
                    outline: none !important;            /* Remove focus outline */
                    border-color: #e4e6eb !important;    /* Keep the border color default */
                }

                /* Prevent issues with z-index or visibility */
                .chat-input input {
                    z-index: 1 !important;
                    visibility: visible !important;
                    pointer-events: auto !important;
                }

            
                .chat-messages {
                flex: 1;
                max-height: calc(100vh - 180px);
                }
            
                .suggestion-chips {
                padding: 0.3rem 0;
                }
            
                .chip {
                padding: 0.3rem 0.6rem;
                }
            
                .chat-input-container {
                padding: 0.5rem;
                border-top: none;
                }
                .chat-input input {
                    -webkit-user-select: none; /* For Safari */
                    -webkit-tap-highlight-color: transparent; /* Remove tap highlight on iOS */
                }

                .chat-input input.active {
                    user-select: text; /* Allow text selection when active */
                    -webkit-user-select: text; /* For Safari */
                }

                /* Prevent any focus styling until activated */
                .chat-input input:not(.active):focus {
                    outline: none;
                    border-color: #e4e6eb; /* Keep default border */
                }
            }
            
            /* Tablet Portrait */
            @media screen and (min-width: 481px) and (max-width: 768px) {
                .chat-window {
                width: 380px;
                height: 520px;
                bottom: 80px;
                right: 10px;
                }
            
                .chat-toggle {
                bottom: 15px;
                right: 15px;
                }
                .chat-input input {
                    user-select: text;
                    -webkit-user-select: text;
                }
            }
            
            /* Tablet Landscape */
            @media screen and (min-width: 769px) and (max-width: 1024px) {
                .chat-window {
                width: 420px;
                height: 580px;
                }
            }
            
            /* Desktop */
            @media screen and (min-width: 1025px) and (max-width: 1919px) {
                .chat-window {
                width: 425px;
                height: 600px;
                }
            }
            
            /* Large Desktop (1920px and above) */
            @media screen and (min-width: 1920px) {
                .chat-window {
                width: 500px;
                height: 700px;
                }
                
                .chat-messages {
                font-size: 1.1em;
                }
                
                .chat-input input {
                font-size: 1em;
                padding: 1rem 1.2rem;
                }
                
                .send-button {
                width: 48px !important;
                height: 48px !important;
                min-width: 48px !important;
                min-height: 48px !important;
                }
                
                .send-button img {
                width: ${Math.round(chatnest.config.sendButtonIconSize * 1.17)}px !important;
                height: ${Math.round(chatnest.config.sendButtonIconSize * 1.17)}px !important;
                min-width: ${Math.round(chatnest.config.sendButtonIconSize * 1.17)}px !important;
                min-height: ${Math.round(chatnest.config.sendButtonIconSize * 1.17)}px !important;
                max-width: ${Math.round(chatnest.config.sendButtonIconSize * 1.17)}px !important;
                max-height: ${Math.round(chatnest.config.sendButtonIconSize * 1.17)}px !important;
                }
                
                .chat-header {
                padding: 1.2rem;
                }
            }
            
            /* 4K Displays */
            @media screen and (min-width: 2560px) {
                .chat-window {
                width: 600px;
                height: 800px;
                }
                
                .chat-messages {
                font-size: 1.2em;
                }
                
                .chat-input input {
                font-size: 1.1em;
                padding: 1.2rem 1.4rem;
                }
                
                .send-button {
                width: 52px !important;
                height: 52px !important;
                min-width: 52px !important;
                min-height: 52px !important;
                }
                
                .send-button img {
                width: ${Math.round(chatnest.config.sendButtonIconSize * 1.25)}px !important;
                height: ${Math.round(chatnest.config.sendButtonIconSize * 1.25)}px !important;
                min-width: ${Math.round(chatnest.config.sendButtonIconSize * 1.25)}px !important;
                min-height: ${Math.round(chatnest.config.sendButtonIconSize * 1.25)}px !important;
                max-width: ${Math.round(chatnest.config.sendButtonIconSize * 1.25)}px !important;
                max-height: ${Math.round(chatnest.config.sendButtonIconSize * 1.25)}px !important;
                }
                
                .chat-header {
                padding: 1.4rem;
                }
            }

            @media screen and (min-width: 1930px) {
                .chat-window {
                width: 450px;
                height: 600px;
                }
            }

            .hubspot-form-container {
                transition: opacity 0.3s ease, transform 0.3s ease;
            }

            .chat-input-container.disabled {
                opacity: 0.7;
                pointer-events: none;
            }

            .chat-input-container.disabled::after {
                content: 'Please complete the form above';
                position: absolute;
                top: -20px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 12px;
                color: var(--chat-primary-color);
                opacity: 0.8;
            }

            .hubspot-form-success {
                transition: opacity 0.3s ease, transform 0.3s ease;
                padding: 20px;
                background: #d4edda;
                border-radius: 8px;
                text-align: center;
            }

            .chip {
                transition: opacity 0.3s ease, pointer-events 0.3s ease;
            }

            .chat-input input,
            .send-button {
                transition: opacity 0.3s ease, background-color 0.3s ease;
            }

            /* Safe Area Insets for Modern Mobile Devices */
            @supports (padding: max(0px)) {
                .chat-window {
                    padding-bottom: max(1rem, env(safe-area-inset-bottom));
                }

                .chat-input-container {
                    padding-bottom: max(1rem, env(safe-area-inset-bottom));
                }
            }

            /* High Contrast Mode */
            @media (prefers-contrast: high) {
                .chat-widget {
                    --chat-primary-color: #000000;
                    --chat-secondary-color: #ffffff;
                }

                .message {
                    border: 2px solid #000000;
                }
            }

            /* Reduced Motion */
            @media (prefers-reduced-motion: reduce) {
                .chat-toggle,
                .chat-window {
                    transition: none;
                }
            }

            /* Print Styles */
            @media print {
                .chat-widget {
                    display: none;
                }
            }
            ${typeof chatnest.config.customStyles === 'string' ? chatnest.config.customStyles : (typeof chatnest.config.customStyles === 'object' && chatnest.config.customStyles ? Object.entries(chatnest.config.customStyles).map(([sel, val]) => typeof val === 'string' ? `${sel}{${val}}` : '').filter(Boolean).join('') : '')}

            /* Image Preview Styles */
            .image-container {
                position: relative;
                margin: 8px 0;
                border-radius: 8px;
            }

            .image-container img {
                max-width: 100%;
                height: auto;
                display: block;
                border-radius: 8px;
            }

            .image-container svg {
                opacity: 0.7;
            }

            .fullscreen-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2147483647;
                padding: 20px;
            }

            .preview-container {
                position: relative;
                max-width: 90vw;
                max-height: 90vh;
            }

            .preview-image {
                max-width: 100%;
                max-height: 90vh;
                object-fit: contain;
            }

            .close-preview {
                position: absolute;
                top: -40px;
                right: -40px;
                background: none;
                border: none;
                color: white;
                font-size: 32px;
                cursor: pointer;
                padding: 10px;
                line-height: 1;
            }

            .close-preview:hover {
                color: #ddd;
            }

            @media (max-width: 768px) {
                .close-preview {
                    top: -40px;
                    right: 0;
                }
            }

            /* Amazon Product Link Styles */
            .amazon-product-link {
                margin: 10px 0;
            }

            .amazon-button {
                display: inline-flex;
                align-items: center;
                gap: 5px;
                padding: 5px 10px;
                border: 1px solid #007bff;
                border-radius: 5px;
                color: #007bff;
                text-decoration: none;
                transition: background-color 0.3s ease;
            }

            .amazon-button:hover {
                background-color: #007bff;
                color: #ffffff;
            }

            .amazon-icon {
                width: 20px;
                height: 20px;
            }

            .chat-input input.waiting {
                background-color: #ffffff !important; /* Keep background white when waiting */
                cursor: text !important; /* Keep text cursor */
            }

            .chat-input input:disabled {
                background-color: #f5f5f5;
                cursor: not-allowed;
            }

            .send-button:disabled {
                cursor: not-allowed;
                opacity: 0.5;
            }

            .chat-input-container.waiting::after {
                content: 'Processing...';
                position: absolute;
                top: -20px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 12px;
                color: var(--chat-primary-color);
                opacity: 0.7;
            }

            /* Keep default font size for chat input */
            .chat-input input {
                font-size: 14px; /* Fixed size */
                padding: 0.8rem 1rem;
                border: 1px solid #e4e6eb;
                border-radius: 20px;
                outline: none;
            }

            /* Apply custom font size only to messages */
            .message.user-message,
            .message.bot-message {
                font-size: var(--chat-message-font-size);
            }

            /* Keep all other elements at their default size */
            .chat-header,
            .chat-header-title h2,
            .chat-input-container,
            .suggestion-chips,
            .chip,
            .send-button,
            .close-chat,
            .erase-chat {
                font-size: 14px; /* Fixed size */
            }

            /* Ensure markdown content inside bot messages uses the custom font size */
            .bot-message p,
            .bot-message ul,
            .bot-message ol,
            .bot-message li {
                font-size: var(--chat-message-font-size);
            }

            /* Keep code blocks slightly smaller than message text */
            .bot-message code {
                font-size: calc(var(--chat-message-font-size) * 0.9);
            }

            /* Keep headers in markdown proportional to message size */
            .bot-message h1 { font-size: calc(var(--chat-message-font-size) * 1.5); }
            .bot-message h2 { font-size: calc(var(--chat-message-font-size) * 1.3); }
            .bot-message h3 { font-size: calc(var(--chat-message-font-size) * 1.1); }

            .message-actions {
                display: none;
                gap: 8px;
                margin-top: 8px;
            }

            .bot-message-container:hover .message-actions,
            .bot-message-container.last .message-actions {
                display: flex;
            }

            .message-action-btn {
                background: none;
                border: 1px solid #e4e6eb;
                border-radius: 4px;
                padding: 4px 8px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 4px;
                transition: all 0.2s ease;
            }

            .message-action-btn:hover {
                background: #f0f2f5;
            }

            .message-action-btn.active {
                background: var(--chat-primary-color);
                color: white;
                border-color: var(--chat-primary-color);
            }

            .message-action-btn img {
                width: 16px;
                height: 16px;
            }

            .bot-message-container {
                display: flex;
                flex-direction: column;
            }

            /* Message Actions Container */
            .message-actions {
                display: none;  /* Hidden by default */
                gap: 8px;
                margin-top: 8px;
                opacity: 0;
                transition: opacity 0.2s ease;
            }

            /* Show actions on container hover */
            .bot-message-container:hover .message-actions {
                display: flex;
                opacity: 1;
            }

            /* Always show actions for last message */
            .bot-message-container.last .message-actions {
                display: flex !important;
                opacity: 1;
            }

            .message-action-btn {
                background: #ffffff;
                border: 1px solid #e4e6eb;
                border-radius: 4px;
                padding: 6px 12px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 4px;
                transition: all 0.2s ease;
                font-size: 12px;
                color: #666;
            }

            .message-action-btn:hover {
                background: #f0f2f5;
                border-color: #d4d4d4;
            }

            .message-action-btn.active {
                background: var(--chat-primary-color);
                color: white;
                border-color: var(--chat-primary-color);
            }

            .message-action-btn.active img {
                filter: brightness(0) invert(1);
            }

            .message-action-btn img {
                width: 16px;
                height: 16px;
                opacity: 0.7;
            }

            .bot-message-container {
                display: flex;
                flex-direction: column;
            }

            /* Reduce spacing between multiple responses from same query (Parlant) */
            .bot-message-container[data-query-id] + .bot-message-container[data-query-id] {
                margin-top: 0.25rem;
                margin-bottom: 0.5rem;
            }
            
            /* Add larger spacing between different queries */
            .message-row[data-query-id] {
                margin-bottom: 0.5rem;
            }
            
            /* When moving from one query to another (query-id changes), add more spacing */
            .message-row[data-query-id] + .message-row:not([data-query-id]),
            .message-row:not([data-query-id]) + .message-row[data-query-id] {
                margin-top: 1rem;
            }

            .bot-message {
                position: relative;
            }

            /* Copied tooltip */
            .copy-btn.copied::after {
                content: 'Copied!';
                position: absolute;
                top: -25px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                pointer-events: none;
            }

            /* Copy button on bot messages (right side) - always visible, outside text container */
            .bot-message-container {
                overflow: visible !important;
            }
            
            .message-copy-btn.bot-copy-btn {
                position: absolute;
                right: -36px;
                top: 50%;
                transform: translateY(-50%);
                background: rgba(255, 255, 255, 0.95);
                border: 1px solid #e4e6eb;
                border-radius: 4px;
                padding: 4px;
                cursor: pointer;
                opacity: 1 !important;
                transition: opacity 0.2s ease, background 0.2s ease;
                width: 24px;
                height: 24px;
                display: flex !important;
                align-items: center;
                justify-content: center;
                z-index: 10;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }

            .bot-message-container:hover .bot-copy-btn,
            .bot-message:hover .bot-copy-btn {
                background: rgba(255, 255, 255, 1);
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
            }

            .bot-copy-btn img {
                width: 14px;
                height: 14px;
            }

            .bot-copy-btn:hover {
                background: #f0f2f5;
            }

            /* Copy button on user messages (left side) - always visible, outside text container */
            .user-message-container {
                overflow: visible !important;
                position: relative;
            }
            
            .message-copy-btn.user-copy-btn {
                position: absolute;
                left: -36px;
                top: 50%;
                transform: translateY(-50%);
                background: rgba(255, 255, 255, 0.95);
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 4px;
                padding: 4px;
                cursor: pointer;
                opacity: 1 !important;
                transition: opacity 0.2s ease, background 0.2s ease;
                width: 24px;
                height: 24px;
                display: flex !important;
                align-items: center;
                justify-content: center;
                z-index: 10;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }

            .user-message {
                position: relative;
            }

            .user-message:hover .user-copy-btn {
                background: rgba(255, 255, 255, 1);
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
            }

            .user-copy-btn img {
                width: 14px;
                height: 14px;
            }

            .user-copy-btn:hover {
                background: rgba(255, 255, 255, 0.2);
            }

            .message-timestamp {
                font-size: 11px;
                color: #9aa0a6;
                margin-top: 4px;
                line-height: 1.2;
            }

            .bot-message-container .message-timestamp {
                align-self: flex-start;
                margin-left: 0.2rem;
            }

            .user-message-container .message-timestamp {
                align-self: flex-end;
                margin-right: 0.2rem;
            }

            .chat-widget.dark-theme .message-timestamp {
                color: #94a3b8;
            }

            .message-actions {
                display: none;
                gap: 4px;
                margin-top: 4px;
                opacity: 0;
                transition: opacity 0.2s ease;
            }

            .bot-message-container:hover .message-actions {
                display: flex;
                opacity: 1;
            }

            .bot-message-container.last .message-actions {
                display: flex !important;
                opacity: 1;
            }

            .message-action-btn {
                background: #ffffff;
                border: 1px solid #e4e6eb;
                border-radius: 4px;
                padding: 4px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                width: 28px;
                height: 28px;
            }

            .message-action-btn:hover {
                background: #f0f2f5;
                border-color: #d4d4d4;
            }

            .message-action-btn img {
                width: 16px;
                height: 16px;
                opacity: 0.7;
            }

            .message-action-btn.active {
                background: var(--chat-primary-color) !important;
                border-color: var(--chat-primary-color) !important;
                color: white !important;
            }

            .message-action-btn.active img {
                opacity: 1;
                filter: brightness(0) invert(1);
            }
            
            /* Specific styling for copy button when active/copied */
            .copy-btn.active,
            .copy-btn.copied {
                background: var(--chat-primary-color) !important;
                border-color: var(--chat-primary-color) !important;
                color: white !important;
            }
            
            .copy-btn.active img,
            .copy-btn.copied img {
                filter: brightness(0) invert(1) !important;
            }

            /* Copied tooltip */
            .copy-btn.copied::after {
                content: 'Copied!';
                position: absolute;
                top: -25px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                pointer-events: none;
            }

            /* Greeting actions specific styles */
            .greeting-actions {
                transition: opacity 0.3s ease, transform 0.3s ease;
            }

            .greeting-actions.hiding {
                opacity: 0;
                transform: translateY(-5px);
            }

            /* Add powered by link styles */
            .powered-by {
                text-align: center;
                padding: 0px;
                font-size: 12px;
                color: #666;
                /* border-top: 1px solid #e4e6eb; */
            }

            .powered-by a {
                color: var(--chat-primary-color);
                text-decoration: none;
                font-weight: 500;
            }

            .powered-by a:hover {
                text-decoration: underline;
            }

            /* Base chat widget positioning */
            .chat-widget {
                position: fixed;
                z-index: 2147483647;
            }

            /* Position-specific styles for toggle and window with advanced spacing */
            .chat-widget.bottom-right .chat-toggle {
                bottom: calc(var(--chat-toggle-bottom-margin) + var(--website-bottom-spacing));
                right: var(--chat-toggle-right-margin);
            }
            .chat-widget.bottom-right .chat-window {
                bottom: calc(var(--chat-toggle-bottom-margin) + var(--website-bottom-spacing) + var(--chat-toggle-size) + 20px);
                right: var(--chat-toggle-right-margin);
            }

            .chat-widget.bottom-left .chat-toggle {
                bottom: calc(var(--chat-toggle-bottom-margin) + var(--website-bottom-spacing));
                left: 20px;
            }
            .chat-widget.bottom-left .chat-window {
                bottom: calc(var(--chat-toggle-bottom-margin) + var(--website-bottom-spacing) + var(--chat-toggle-size) + 20px);
                left: 20px;
            }

            .chat-widget.bottom-center .chat-toggle {
                bottom: calc(var(--chat-toggle-bottom-margin) + var(--website-bottom-spacing));
                left: 50%;
                transform: translateX(-50%)
            }
            .chat-widget.bottom-center .chat-window {
                bottom: calc(var(--chat-toggle-bottom-margin) + var(--website-bottom-spacing) + var(--chat-toggle-size) + 20px);
                left: 50%;
                transform: translateX(-50%)
            }

            .chat-widget.top .chat-toggle {
                top: 20px;
                left: 50%;
                transform: translateX(-50%)
            }
            .chat-widget.top .chat-window {
                top: 100px;
                left: 50%;
                transform: translateX(-50%)
            }

            .chat-widget.left .chat-toggle {
                left: 20px;
                top: 50%;
                transform: translateY(-50%)
            }
            .chat-widget.left .chat-window {
                left: 20px;
                top: 50%;
                transform: translateY(-50%)
            }

            .chat-widget.right .chat-toggle {
                right: 20px;
                top: 50%;
                transform: translateY(-50%)
            }
            .chat-widget.right .chat-window {
                right: 20px;
                top: 50%;
                transform: translateY(-50%)
            }

            .chat-widget.top-right .chat-toggle {
                top: 20px;
                right: 20px;
            }
            .chat-widget.top-right .chat-window {
                top: 100px;
                right: 20px;
            }

            .chat-widget.top-left .chat-toggle {
                top: 20px;
                left: 20px;
            }
            .chat-widget.top-left .chat-window {
                top: 100px;
                left: 20px;
            }

            /* Position-specific styles for text box - positioned close to toggle button */
            .chat-widget.bottom-right .chat-text-box {
                bottom: calc(var(--chat-toggle-bottom-margin) + var(--website-bottom-spacing) + var(--chat-toggle-size) + var(--text-box-spacing-from-toggle));
                right: var(--chat-toggle-right-margin);
                left: auto;
                transform: none;
                max-width: min(280px, calc(100vw - 40px));
            }

            .chat-widget.bottom-left .chat-text-box {
                bottom: calc(var(--chat-toggle-bottom-margin) + var(--website-bottom-spacing) + var(--chat-toggle-size) + var(--text-box-spacing-from-toggle));
                left: 20px;
                right: auto;
                transform: none;
                max-width: min(280px, calc(100vw - 40px));
            }

            .chat-widget.bottom-center .chat-text-box {
                bottom: calc(var(--chat-toggle-bottom-margin) + var(--website-bottom-spacing) + var(--chat-toggle-size) + var(--text-box-spacing-from-toggle));
                left: 50%;
                right: auto;
                transform: translateX(-50%);
                max-width: min(280px, calc(100vw - 40px));
            }

            .chat-widget.top .chat-text-box {
                top: 90px;
                left: 50%;
                right: auto;
                transform: translateX(-50%);
                max-width: min(280px, calc(100vw - 40px));
            }

            .chat-widget.left .chat-text-box {
                left: 90px;
                right: auto;
                top: 50%;
                transform: translateY(-50%);
                max-width: min(280px, calc(100vw - 130px)); /* Account for left positioning */
            }

            .chat-widget.right .chat-text-box {
                right: 20px;
                left: auto;
                top: 50%;
                transform: translateY(-50%);
                max-width: min(280px, calc(100vw - 40px));
            }

            .chat-widget.top-right .chat-text-box {
                top: 90px;
                right: 20px;
                left: auto;
                transform: none;
                max-width: min(280px, calc(100vw - 40px));
            }

            .chat-widget.top-left .chat-text-box {
                top: 90px;
                left: 20px;
                right: auto;
                transform: none;
                max-width: min(280px, calc(100vw - 40px));
            }

            /* Mobile adjustments */
            @media screen and (max-width: 480px) {
                .chat-widget .chat-window {
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
                    transform: translateY(100%) !important;
                    transition: transform 0.3s ease-in-out !important;
                    z-index: 2147483647 !important;
                    background: white !important;
                    overflow: hidden !important;
                }

                .chat-widget .chat-window.active {
                    transform: translateY(0) !important;
                }

                .chat-toggle {
                    position: fixed !important;
                    bottom: 20px !important;
                    right: 20px !important;
                    z-index: 2147483650 !important;
                    transform: none;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    visibility: visible !important;
                }

                .chat-toggle img {
                    width: 24px !important;
                    height: 24px !important;
                    display: block !important;
                    margin: 0 auto !important;
                }

                .chat-toggle span {
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    width: 100% !important;
                    height: 100% !important;
                    font-size: 24px !important;
                    line-height: 1 !important;
                }

                .chat-widget.left .chat-toggle {
                    left: 20px !important;
                    right: auto !important;
                }

                /* Hide toggle when chat is active on mobile */
                .chat-widget .chat-window.active ~ .chat-toggle {
                    display: none !important;
                }

                .chat-text-box {
                    max-width: calc(100vw - 30px) !important;
                    margin-left: 15px !important;
                    margin-right: 15px !important;
                    font-size: 14px !important;
                }

                .chat-text-box-content {
                    padding: 12px !important;
                }

                .chat-text-box-message {
                    font-size: 14px !important;
                    padding-right: 30px !important;
                }

                .chat-text-box-submessage {
                    font-size: 13px !important;
                }

                /* Mobile-specific positioning for text box */
                .chat-widget.bottom-right .chat-text-box,
                .chat-widget.bottom-left .chat-text-box,
                .chat-widget.bottom-center .chat-text-box {
                    right: 15px !important;
                    left: auto !important;
                    transform: none !important;
                    max-width: calc(100vw - 30px) !important;
                }
            }

            /* Tablet and large mobile adjustments */
            @media screen and (max-width: 768px) and (min-width: 481px) {
                .chat-text-box {
                    max-width: min(300px, calc(100vw - 60px)) !important;
                    margin-left: 30px !important;
                    margin-right: 30px !important;
                }

                .chat-widget.bottom-right .chat-text-box,
                .chat-widget.top-right .chat-text-box {
                    right: 30px !important;
                }

                .chat-widget.bottom-left .chat-text-box,
                .chat-widget.top-left .chat-text-box {
                    left: 30px !important;
                }
            }

            /* Ensure text box never goes beyond viewport bounds */
            @media screen and (max-width: 320px) {
                .chat-text-box {
                    max-width: calc(100vw - 20px) !important;
                    margin-left: 10px !important;
                    margin-right: 10px !important;
                }

                .chat-text-box-content {
                    padding: 10px !important;
                }

                .chat-text-box-message {
                    font-size: 13px !important;
                }

                .chat-text-box-submessage {
                    font-size: 12px !important;
                }
            }

            /* Only show cursor when input is specifically activated */
            .chat-input input.cursor-active {
                user-select: text;
                -webkit-user-select: text;
            }

            /* --- Refined UI overrides (modern premium) --- */
            .chat-widget,
            .chat-widget * {
                font-family: "Plus Jakarta Sans", "Segoe UI", sans-serif;
            }

            .chat-window {
                background: #ffffff;
                border: 1px solid rgba(15, 23, 42, 0.06);
                box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.2);
            }

            .chat-header {
                background: var(--chat-primary-color-gradient);
            }

            .chat-header-title h2 {
                font-size: 18px;
                font-weight: 700;
                letter-spacing: -0.02em;
            }

            .chat-header-subname {
                font-size: 12px;
                opacity: 0.9;
                font-weight: 500;
            }


            .chat-messages {
                background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
                padding: 20px;
                gap: 12px;
            }

            .message-row {
                gap: 10px;
                width: 100%;
                justify-content: flex-start;
            }

            .message-row.user-row {
                justify-content: flex-end;
            }

            .message-row.bot-row {
                justify-content: flex-start;
            }

            .message-row[data-query-id] {
                margin-bottom: 0.25rem;
            }

            .message-row[data-query-id] + .message-row[data-query-id] {
                margin-top: 0.2rem;
            }

            .bot-message-container,
            .user-message-container {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }

            .bot-message-container {
                margin-bottom: 0.4rem;
                max-width: 80%;
            }

            .bot-message-container[data-query-id] + .bot-message-container[data-query-id] {
                margin-top: 0.2rem;
                margin-bottom: 0.3rem;
            }

            .user-message-container {
                max-width: 80%;
            }

            .chat-widget.parlant-mode .bot-message-container:hover .message-actions {
                display: none !important;
                opacity: 0 !important;
            }

            .chat-widget.parlant-mode .bot-message-container.last .message-actions {
                display: flex !important;
                opacity: 1 !important;
            }

            .chat-widget.parlant-mode .message-row[data-query-id] {
                margin-bottom: 0.2rem !important;
            }

            .chat-widget.parlant-mode .message-row[data-query-id] + .message-row[data-query-id] {
                margin-top: 0.1rem !important;
            }

            .chat-widget.parlant-mode .bot-message-container[data-query-id] + .bot-message-container[data-query-id] {
                margin-top: 0.1rem !important;
                margin-bottom: 0.2rem !important;
            }

            .user-message-container {
                align-items: flex-end;
            }

            .message-line {
                display: flex;
                align-items: center;
                gap: 8px;
                max-width: 100%;
            }

            .user-message-line {
                justify-content: flex-end;
            }

            .bot-message {
                background: #ffffff !important;
                border: 1px solid rgba(15, 23, 42, 0.06);
                border-radius: 18px;
                border-top-left-radius: 6px;
                box-shadow: 0 2px 12px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.04);
                color: #1e293b;
            }

            .user-message {
                background: var(--chat-primary-color-gradient);
                border-radius: 18px;
                border-top-right-radius: 6px;
                color: #ffffff;
                box-shadow: 0 4px 16px rgba(var(--chat-primary-color-rgb, 26, 115, 232), 0.25);
            }

            .user-message-line .user-message {
                margin-left: 0;
            }

            .message-content {
                font-size: var(--chat-message-font-size);
                line-height: 1.5;
            }

            .message-copy-btn {
                position: relative !important;
                transform: none !important;
                top: auto !important;
                right: auto !important;
                left: auto !important;
                width: 28px;
                height: 28px;
                border-radius: 8px;
                border: 1px solid rgba(15, 23, 42, 0.12);
                background: #ffffff;
                box-shadow: 0 4px 10px rgba(15, 23, 42, 0.08);
                transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
            }

            .message-copy-btn img {
                width: 14px;
                height: 14px;
                opacity: 0.75;
            }

            .user-message-line .message-copy-btn {
                background: rgba(255, 255, 255, 0.9);
                border-color: rgba(255, 255, 255, 0.4);
            }

            .message-copy-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 6px 14px rgba(15, 23, 42, 0.12);
            }

            .message-copy-btn.active,
            .message-copy-btn.copied {
                background: var(--chat-primary-color-gradient);
                border-color: transparent;
                overflow: visible;
            }

            .message-copy-btn.active img,
            .message-copy-btn.copied img {
                filter: brightness(0) invert(1);
                opacity: 1;
            }

            .message-copy-btn.copied::after {
                content: "Copied!";
                position: absolute;
                top: -32px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(15, 23, 42, 0.95);
                color: #ffffff;
                padding: 6px 10px;
                border-radius: 8px;
                font-size: 11px;
                font-weight: 600;
                pointer-events: none;
                white-space: nowrap;
                z-index: 100;
                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            }

            @media (prefers-reduced-motion: reduce) {
                .chat-widget .chip,
                .chat-widget .chip:hover {
                    transform: none !important;
                }
                .chat-widget .chip,
                .chat-widget .typing-spinner,
                .chat-widget .typing-indicator {
                    transition: none !important;
                    animation: none !important;
                }
            }
        `;
        
        // Remove any existing chat widget styles
        const existingStyle = document.getElementById('chat-widget-styles');
        if (existingStyle) {
            existingStyle.remove();
        }
        
        style.id = 'chat-widget-styles';
        document.head.appendChild(style);
    }
