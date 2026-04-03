// @ts-nocheck
/**
 * Setup all event listeners for the chat widget
 * @param {Chatnest} chatnest - Chatnest instance
 */
export function setupEventListeners(chatnest) {
    const chatToggle = chatnest.widget.querySelector('.chat-toggle');
    const chatWindow = chatnest.widget.querySelector('.chat-window');
    const closeChat = chatnest.widget.querySelector('.close-chat');
    const chatMessages = chatnest.widget.querySelector('.chat-messages');
    const chatInput = chatnest.widget.querySelector('.chat-input .chat-textarea');
    const sendButton = chatnest.widget.querySelector('.send-button');
    const fileButton = chatnest.widget.querySelector('.file-button');
    const fileInput = chatnest.widget.querySelector('.file-input');
    const filePreview = chatnest.widget.querySelector('.file-preview');

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

    // Remove stale global listeners before re-registering (guards against updateConfig re-runs)
    if (chatnest._keydownHandler) document.removeEventListener('keydown', chatnest._keydownHandler);

    // Focus trap helper: returns all focusable elements inside the dialog
    const getFocusable = () => {
        const win = chatnest.widget?.querySelector('.chat-window');
        if (!win) return [];
        return Array.from(win.querySelectorAll(
            'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )).filter(el => !el.closest('[style*="display: none"]') && !el.closest('[hidden]'));
    };

    chatnest._keydownHandler = (e) => {
        const win = chatnest.widget?.querySelector('.chat-window');
        const isOpen = win?.classList.contains('active');

        if (!isOpen) return;

        if (e.key === 'Escape') {
            chatnest.closeChat();
            return;
        }

        // Focus trap on Tab
        if (e.key === 'Tab') {
            const focusable = getFocusable();
            if (focusable.length === 0) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey) {
                if (document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                if (document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        }
    };
    document.addEventListener('keydown', chatnest._keydownHandler);

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

        // Native form — trigger: 'onFirstMessage'
        if (
            chatnest.config.nativeForm?.enabled &&
            chatnest.config.nativeForm?.trigger === 'onFirstMessage' &&
            !chatnest.nativeFormManager?.hasSubmitted()
        ) {
            chatnest.showNativeForm();
            return; // block send until form is submitted
        }

        if (chatInput) {
            chatInput.value = '';
            try {
                chatInput.style.height = 'auto';
            } catch {
                // style update not supported
            }
        }

        // Check HubSpot keyword triggers before dispatching
        if (
            chatnest.config.hubspot?.enabled &&
            !chatnest.userManager.hasSubmittedForm() &&
            rawMessage.trim()
        ) {
            const triggered = chatnest.checkForTriggerWords(rawMessage);
            if (triggered) {
                setTimeout(() => chatnest.showHubSpotForm(), 200);
            }
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
        } catch {
            // style update not supported
        }
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
            } catch {
                // style update not supported
            }
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

    if (chatMessages) {
        chatnest._userHasScrolledUp = false;
        if (chatnest._chatScrollHandler) chatMessages.removeEventListener('scroll', chatnest._chatScrollHandler);
        chatnest._chatScrollHandler = () => {
            const maxScroll = Math.max(0, chatMessages.scrollHeight - chatMessages.clientHeight);
            const currentScroll = chatMessages.scrollTop;
            const isNearBottom = maxScroll - currentScroll < 80;
            chatnest._userHasScrolledUp = !isNearBottom && maxScroll > 100;
        };
        chatMessages.addEventListener('scroll', chatnest._chatScrollHandler);
    }

    const getMobileViewportHeight = () => {
        try {
            const vv = window.visualViewport;
            return vv && vv.height ? vv.height : window.innerHeight;
        } catch {
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

    // Remove stale resize / orientation listeners
    if (chatnest._resizeHandler) window.removeEventListener('resize', chatnest._resizeHandler);
    if (chatnest._orientationHandler) window.removeEventListener('orientationchange', chatnest._orientationHandler);
    if (chatnest._vpResizeHandler && window.visualViewport) {
        window.visualViewport.removeEventListener('resize', chatnest._vpResizeHandler);
        window.visualViewport.removeEventListener('scroll', chatnest._vpResizeHandler);
    }

    chatnest._resizeHandler = applyMobileHeight;
    chatnest._orientationHandler = () => {
        setTimeout(() => {
            applyMobileHeight();
            const msgs = chatnest.widget?.querySelector('.chat-messages');
            if (msgs) msgs.scrollTop = msgs.scrollHeight;
        }, 150);
    };
    chatnest._vpResizeHandler = applyMobileHeight;

    window.addEventListener('resize', chatnest._resizeHandler);
    window.addEventListener('orientationchange', chatnest._orientationHandler);
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', chatnest._vpResizeHandler);
        window.visualViewport.addEventListener('scroll', chatnest._vpResizeHandler);
    }

    applyMobileHeight();

    // Inject input-state styles once (guarded by ID)
    if (!document.getElementById('chat-widget-input-styles')) {
        const style = document.createElement('style');
        style.id = 'chat-widget-input-styles';
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

            /* Send status badge (Sending… / Failed) */
            .cn-send-status {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 11px;
                font-weight: 500;
                padding: 2px 8px 4px;
                color: #6b7280;
                letter-spacing: 0.01em;
            }
            .chat-input-container.sending .cn-send-status {
                color: #6b7280;
            }
            .chat-input-container.send-failed .cn-send-status {
                color: #dc2626;
            }
            .cn-send-status-text {
                flex-shrink: 0;
            }
            .cn-retry-btn {
                background: none;
                border: 1px solid currentColor;
                border-radius: 4px;
                color: inherit;
                cursor: pointer;
                font-size: 11px;
                font-weight: 600;
                padding: 1px 7px;
                line-height: 1.4;
                transition: background 0.15s, color 0.15s;
            }
            .cn-retry-btn:hover {
                background: #dc2626;
                border-color: #dc2626;
                color: #fff;
            }
            .cn-retry-btn:focus-visible {
                outline: 2px solid #dc2626;
                outline-offset: 2px;
            }
        `;
        document.head.appendChild(style);
    }
}
