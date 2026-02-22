/**
 * Setup all event listeners for the chat widget
 * @param {Chatnest} chatnest - Chatnest instance
 */
export function setupEventListeners(chatnest) {
    const chatToggle = chatnest.widget.querySelector('.chat-toggle');
    const chatWindow = chatnest.widget.querySelector('.chat-window');
    const closeChat = chatnest.widget.querySelector('.close-chat');
    const eraseChat = chatnest.widget.querySelector('.erase-chat');
    const chatMessages = chatnest.widget.querySelector('.chat-messages');
    const chatInput = chatnest.widget.querySelector('.chat-input .chat-textarea');
    const sendButton = chatnest.widget.querySelector('.send-button');
    const fileButton = chatnest.widget.querySelector('.file-button');
    const fileInput = chatnest.widget.querySelector('.file-input');
    const filePreview = chatnest.widget.querySelector('.file-preview');
    const typingIndicator = chatnest.widget.querySelector('.typing-indicator');

    chatnest.setupMobileFullscreenEnforcement();

    let selectedFiles = [];

    if (chatnest.config.enableFileUpload && fileButton && fileInput && filePreview) {
        fileButton.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            const maxFiles = chatnest.config.maxFiles;
            if (maxFiles === 1) {
                selectedFiles = files.length > 0 ? [files[0]] : [];
            } else {
                selectedFiles = selectedFiles.concat(files);
            }
            chatnest.updateFilePreview(selectedFiles, filePreview);
        });

        filePreview.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-file')) {
                const index = parseInt(e.target.dataset.index, 10);
                selectedFiles.splice(index, 1);
                chatnest.updateFilePreview(selectedFiles, filePreview);
            }
        });
    }

    if (chatToggle) {
        chatToggle.addEventListener('click', () => {
            chatnest.toggleChat();
        });
    }

    if (closeChat) {
        closeChat.addEventListener('click', () => {
            chatnest.closeChat();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && chatWindow && chatWindow.classList.contains('active')) {
            chatnest.closeChat();
        }
    });

    if (sendButton) {
        sendButton.disabled = false;
        sendButton.style.opacity = '1';
        sendButton.style.pointerEvents = 'auto';
    }

    const sendMessageHandler = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        const rawMessage = (chatInput ? chatInput.value : '').replace(/\r\n/g, '\n');
        const hasText = rawMessage.trim().length > 0;

        if (!hasText && (!chatnest.config.enableFileUpload || selectedFiles.length === 0)) {
            if (chatInput) chatInput.focus();
            return;
        }

        if (chatnest.isWaitingForResponse || chatnest.isTypewriterActive) {
            return;
        }

        if (chatInput) {
            chatInput.value = '';
            try {
                chatInput.style.height = 'auto';
            } catch (_) {}
        }

        if (chatnest.config.enableFileUpload && selectedFiles.length > 0) {
            chatnest.sendMessageWithFiles(rawMessage, selectedFiles);
            selectedFiles = [];
            if (filePreview) {
                chatnest.updateFilePreview(selectedFiles, filePreview);
            }
            if (fileInput) {
                fileInput.value = '';
            }
        } else {
            chatnest.sendMessage(rawMessage);
        }
    };

    if (sendButton) {
        try {
            sendButton.style.touchAction = 'manipulation';
        } catch (_) {}
    }

    let ignoreNextClick = false;

    if (sendButton) {
        sendButton.addEventListener('pointerdown', (e) => {
            if (e) e.stopPropagation();
            sendButton.classList.add('is-pressing');
        }, { passive: true });

        sendButton.addEventListener('pointerup', (e) => {
            sendButton.classList.remove('is-pressing');
            if (e) e.stopPropagation();
            if (e && e.pointerType && e.pointerType !== 'mouse') {
                ignoreNextClick = true;
                setTimeout(() => { ignoreNextClick = false; }, 400);
                sendMessageHandler(e);
            }
        }, { passive: false });

        sendButton.addEventListener('pointercancel', () => {
            sendButton.classList.remove('is-pressing');
        }, { passive: true });

        sendButton.addEventListener('click', (e) => {
            if (e) e.stopPropagation();
            if (ignoreNextClick) {
                if (e) e.preventDefault();
                return;
            }
            sendMessageHandler(e);
        });
    }

    if (chatInput) {
        chatInput.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter') return;
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                sendMessageHandler(e);
                return;
            }
            if (chatnest.isMobileBrowser()) {
                return;
            }
            if (!e.shiftKey) {
                e.preventDefault();
                sendMessageHandler(e);
            }
        });

        chatInput.addEventListener('input', () => {
            if (chatnest.isMobileBrowser()) {
                if (sendButton) sendButton.style.opacity = '1';
                return;
            }
            const isEmpty = !chatInput.value.trim() && (!chatnest.config.enableFileUpload || selectedFiles.length === 0);
            const isProcessing = chatnest.isWaitingForResponse || chatnest.isTypewriterActive;
            if (sendButton) {
                sendButton.style.opacity = isProcessing ? '0.6' : (isEmpty ? '0.7' : '1');
            }
        });

        const autosize = () => {
            try {
                chatInput.style.height = 'auto';
                const max = 140;
                const next = Math.min(chatInput.scrollHeight, max);
                chatInput.style.height = `${next}px`;
            } catch (_) {}
        };
        autosize();
        chatInput.addEventListener('input', autosize);

        if (chatnest.isMobileBrowser() && chatnest.config.enableEnhancedMobileInput) {
            chatnest.setupCleanMobileInput(chatInput);
        } else {
            chatnest.setupDesktopInput(chatInput);
        }
    }

    if (chatWindow) {
        chatWindow.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    if ('ontouchstart' in window && chatMessages) {
        chatMessages.style.webkitOverflowScrolling = 'touch';
        chatMessages.style.overscrollBehavior = 'contain';
    }

    const getMobileViewportHeight = () => {
        try {
            const vv = window.visualViewport;
            return vv && vv.height ? vv.height : window.innerHeight;
        } catch (_) {
            return window.innerHeight;
        }
    };

    const applyMobileHeight = () => {
        if (!chatWindow) return;
        if (window.innerWidth <= 480) {
            chatWindow.style.setProperty('--chat-mobile-vh', `${Math.round(getMobileViewportHeight())}px`);
        } else {
            chatWindow.style.removeProperty('--chat-mobile-vh');
        }
    };

    window.addEventListener('resize', applyMobileHeight);
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', applyMobileHeight);
        window.visualViewport.addEventListener('scroll', applyMobileHeight);
    }

    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            applyMobileHeight();
            if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 150);
    });

    applyMobileHeight();

    const style = document.createElement('style');
    style.textContent = `
        .chat-input input:disabled,
        .chat-input .chat-textarea:disabled {
            background-color: #f3f4f6;
            cursor: not-allowed;
            opacity: 0.8;
        }

        .send-button:disabled {
            cursor: not-allowed;
            opacity: 0.5;
            filter: grayscale(0.3);
        }

        .chat-input-container.waiting {
            position: relative;
        }

        .chat-input-container.waiting::after {
            content: 'Waiting for response...';
            position: absolute;
            top: -22px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 12px;
            font-weight: 500;
            color: #6b7280;
            white-space: nowrap;
        }
    `;
    document.head.appendChild(style);
}
