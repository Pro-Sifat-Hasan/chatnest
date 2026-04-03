/**
 * Setup responsive handling for chat window
 * @param {Chatnest} chatnest - Chatnest instance
 */
import { togglePositions, debounce } from '../../constants.js';

export function setupResponsiveHandling(chatnest: any) {
    const calculateOptimalSize = () => {
        const vh = window.innerHeight;
        const vw = window.innerWidth;

        let width = Math.min(Math.max(vw * 0.3, 320), 600);
        let height = Math.min(Math.max(vh * 0.7, 400), 800);

        if (vw <= 480) {
            width = vw;
            height = vh;
            const safeAreaBottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sab') || '0', 10);
            height = vh - safeAreaBottom;
        } else if (vw <= 768) {
            width = Math.min(vw * 0.8, 400);
            height = Math.min(vh * 0.8, 600);
        } else if (vw <= 1024) {
            width = Math.min(vw * 0.35, 420);
            height = Math.min(vh * 0.7, 580);
        } else if (vw <= 1366) {
            width = Math.min(vw * 0.3, 450);
            height = Math.min(vh * 0.75, 600);
        } else if (vw <= 1920) {
            width = Math.min(vw * 0.25, 500);
            height = Math.min(vh * 0.8, 700);
        } else {
            width = Math.min(vw * 0.2, 600);
            height = Math.min(vh * 0.8, 800);
        }

        width = Math.max(width, 320);
        height = Math.max(height, 400);

        const maxHeight = vh - (vw <= 480 ? 0 : 120);
        height = Math.min(height, maxHeight);

        return { width, height };
    };

    const resizeWindow = () => {
        const chatWindow = chatnest.widget.querySelector('.chat-window');
        const chatToggle = chatnest.widget.querySelector('.chat-toggle');
        if (!chatWindow || !chatToggle) return;

        const { width, height } = calculateOptimalSize();
        const vw = window.innerWidth;

        chatWindow.style.width = `${width}px`;
        chatWindow.style.height = `${height}px`;

        if (vw <= 480) {
            chatWindow.style.bottom = '0';
            chatWindow.style.right = '0';
            chatWindow.style.left = '0';
            chatWindow.style.top = '0';
            chatWindow.style.width = '100%';
            chatWindow.style.height = '100%';
            chatWindow.style.borderRadius = '0';
            chatWindow.style.maxHeight = '100%';
            chatWindow.style.transform = 'none';
        } else {
            const positionStyle = (togglePositions as Record<string, any>)[chatnest.config.position];
            Object.entries(positionStyle.window).forEach(([key, value]) => {
                chatWindow.style[key] = value;
            });
        }

        const baseFontSize = Math.min(Math.max(width * 0.04, 14), 16);
        chatWindow.style.fontSize = `${baseFontSize}px`;

        const messageContainer = chatWindow.querySelector('.chat-messages');
        const inputContainer = chatWindow.querySelector('.chat-input-container');

        if (messageContainer) {
            const padding = Math.min(Math.max(width * 0.03, 8), 16);
            messageContainer.style.padding = `${padding}px`;

            const headerHeight = chatWindow.querySelector('.chat-header').offsetHeight;
            const inputHeight = inputContainer ? inputContainer.offsetHeight : 0;
            messageContainer.style.height = `calc(100% - ${headerHeight + inputHeight}px)`;
        }

        if (inputContainer) {
            const padding = Math.min(Math.max(width * 0.03, 8), 16);
            inputContainer.style.padding = `${padding}px`;
        }
    };

    const addSafeAreaVariables = () => {
        const style = document.createElement('style');
        style.innerHTML = `
            :root {
                --sab: env(safe-area-inset-bottom);
                --sat: env(safe-area-inset-top);
                --sal: env(safe-area-inset-left);
                --sar: env(safe-area-inset-right);
            }
        `;
        document.head.appendChild(style);
    };

    addSafeAreaVariables();
    resizeWindow();

    window.addEventListener('resize', debounce(resizeWindow, 250));
    window.addEventListener('orientationchange', () => {
        setTimeout(resizeWindow, 100);
    });

    const resizeObserver = new ResizeObserver(debounce(() => {
        const chatMessages = chatnest.widget.querySelector('.chat-messages');
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }, 100));

    const chatWindow = chatnest.widget.querySelector('.chat-window');
    if (chatWindow) {
        resizeObserver.observe(chatWindow);
    }
}
