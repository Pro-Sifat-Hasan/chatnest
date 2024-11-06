// EasyChatWidget.js
class EasyChatWidget {
    constructor(config = {}) {
        this.isWaitingForResponse = false;
        this.initConfig(config);
        this.userManager = new ChatUserManager();
        this.storageManager = new ChatStorageManager(this.userManager);
        
        this.ensureDependencies().then(() => {
            this.initializeWidget();
            this.setupEventListeners();
            this.storageManager.setWidget(this);
            this.loadChatHistory();
        });
    }

    initConfig(config) {
        // Helper function to clamp dimensions
        const clampDimension = (value, min, max) => {
            const numValue = parseInt(value);
            return `${Math.min(Math.max(numValue, min), max)}px`;
        };

        // Helper function to ensure proper API endpoint format
        const formatApiEndpoint = (endpoint) => {
            if (!endpoint) return 'http://localhost:7000/chat';
            
            // If endpoint starts with just '//', add the current protocol
            if (endpoint.startsWith('//')) {
                return `${window.location.protocol}${endpoint}`;
            }
            
            // If endpoint starts with '/', add the current origin
            if (endpoint.startsWith('/')) {
                return `${window.location.origin}${endpoint}`;
            }
            
            // If endpoint doesn't start with http(s), assume http
            if (!endpoint.startsWith('http')) {
                return `http://${endpoint}`;
            }
            
            return endpoint;
        };

        this.config = {
            botName: config.botName || 'Chat Assistant',
            botImage: config.botImage || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"%3E%3Cpath fill="%23fff" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"%3E%3C/path%3E%3C/svg%3E',
            greeting: config.greeting || 'Hello! How can I help you today?',
            placeholder: config.placeholder || 'Type your message here...',
            primaryColor: config.primaryColor || '#0084ff',
            fontSize: config.fontSize || '14px',
            width: clampDimension(config.width || '400px', 300, 600),
            height: clampDimension(config.height || '600px', 400, 800),
            showTimestamp: config.showTimestamp || false,
            enableTypingIndicator: config.enableTypingIndicator !== false,
            enableMarkdown: config.enableMarkdown !== false,
            enableHistory: config.enableHistory !== false,
            maxHistoryLength: config.maxHistoryLength || 100,
            enableTypewriter: config.enableTypewriter !== false,
            typewriterSpeed: config.typewriterSpeed || { min: 30, max: 70 },
            chips: config.chips || [],
            customStyles: config.customStyles || {},
            onInit: config.onInit || null,
            onMessage: config.onMessage || null,
            onError: config.onError || null,
            apiEndpoint: formatApiEndpoint(config.apiEndpoint),
            apiKey: config.apiKey || '',
            apiHeaders: config.apiHeaders || {
                'Content-Type': 'application/json'
            },
            apiRequestFormat: config.apiRequestFormat || {
                query: 'query',
                userId: 'userId',
                domain: 'domain'
            },
            apiResponseFormat: config.apiResponseFormat || {
                response: 'response'
            },
            apiMethod: config.apiMethod || 'POST',
            apiTimeout: config.apiTimeout || 30000, // 30 seconds default
        };
    }

    async ensureDependencies() {
        if (!window.marked && this.config.enableMarkdown) {
            await this.loadScript('https://cdn.jsdelivr.net/npm/marked/marked.min.js');
        }
        this.loadStyles();
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    loadStyles() {
        const style = document.createElement('style');
        style.id = 'chat-widget-styles';
        style.textContent = `
            :root {
                --chat-primary-color: ${this.config.primaryColor};
                --chat-font-size: ${this.config.fontSize};
                --chat-width: ${this.config.width};
                --chat-height: ${this.config.height};
                --chat-toggle-size: 60px;
                --chat-border-radius: 16px;
                --chat-shadow: 0 5px 40px rgba(0,0,0,0.16);
            }

            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }

            body {
                background-color: #f5f5f5;
                min-height: 100vh;
            }

            /* Main Website Content */
            .website-content {
                padding: 2rem;
                max-width: 1200px;
                margin: 0 auto;
            }

            /* Chat Widget Container */
            .chat-widget {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 1000;
            }

            .chat-widget.left .chat-toggle {
                left: 20px;
                right: auto;
            }

            .chat-widget.left .chat-window {
                left: 20px;
                right: auto;
            }

            /* Chat Toggle Button */
            .chat-toggle {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: var(--chat-primary-color);
                box-shadow: 0 2px 12px rgba(0,0,0,0.15);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: transform 0.3s ease;
            }

            .chat-toggle:hover {
                transform: scale(1.1);
            }

            .chat-toggle img {
                width: 30px;
                height: 30px;
            }

            /* Chat Window */
            .chat-window {
                position: fixed;
                bottom: 100px;
                right: 20px;
                width: var(--chat-width);
                height: var(--chat-height);
                background: white;
                border-radius: var(--chat-border-radius);
                box-shadow: var(--chat-shadow);
                display: none;
                flex-direction: column;
                overflow: hidden;
                transition: transform 0.3s ease, opacity 0.3s ease;
                transform: translateY(20px);
                opacity: 0;
                font-size: var(--chat-font-size);
                min-width: 300px;
                max-width: 600px;
                min-height: 400px;
                max-height: 800px;
                padding: 0;
                box-sizing: border-box;
            }

            .chat-window.active {
                display: flex;
                transform: translateY(0);
                opacity: 1;
                border-radius: var(--chat-border-radius);
                overflow: hidden;
            }

            /* Chat Header */
            .chat-header {
                background: var(--chat-primary-color);
                color: white;
                padding: 1rem;
                display: flex;
                align-items: center;
                justify-content: space-between;
                width: 100%;
                box-sizing: border-box;
                position: relative;
                margin: 0;
                border-top-left-radius: inherit;
                border-top-right-radius: inherit;
            }

            /* Fix for header background extending to edges */
            .chat-header::before {
                content: '';
                position: absolute;
                top: 0;
                left: -1px;
                right: -1px;
                bottom: 0;
                background: var(--chat-primary-color);
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

            .chat-header-avatar {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: white;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .chat-header-avatar img {
                width: 33px;
                height: 33px;
                border-radius: 50%;
            }

            .chat-header-actions {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                position: relative;
                z-index: 1;
            }

            .erase-chat, .close-chat {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                padding: 0.5rem;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .erase-chat img, .close-chat img {
                width: 20px;
                height: 20px;
            }

            /* Chat Messages */
            .chat-messages {
                flex: 1;
                overflow-y: auto;
                padding: 1rem;
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }

            .message {
                max-width: 80%;
                padding: 0.8rem 1rem;
                border-radius: 1rem;
                margin: 0.25rem 0;
                font-size: calc(var(--chat-font-size) * 0.8);
            }

            .message-row {
                display: flex;
                align-items: flex-start;
                gap: 0.5rem;
            }

            /* Bot Message Styling */
            .bot-message {
                max-width: 80%;
                padding: 1rem;
                background: #f0f2f5;
                border-radius: 1rem;
                border-top-left-radius: 0;
                font-size: 14px;
                line-height: 1.5;
                color: #000000;
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

            /* User Message */
            .user-message {
                margin-left: auto;
                background: var(--chat-primary-color);
                color: white;
                border-top-right-radius: 0;
                text-align: left;
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

            /* Chat Input Container */
            .chat-input-container {
                padding: 1rem;
                border-top: 1px solid #e4e6eb;
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
                scrollbar-color: #0084ff #f0f2f5;
            }

            .suggestion-chips::-webkit-scrollbar {
                height: 6px;
            }

            .suggestion-chips::-webkit-scrollbar-track {
                background: #f0f2f5;
                border-radius: 3px;
            }

            .suggestion-chips::-webkit-scrollbar-thumb {
                background: #0084ff;
                border-radius: 3px;
            }

            .chip {
                background: #e4e6eb;
                padding: 0.5rem 1rem;
                border-radius: 16px;
                white-space: nowrap;
                cursor: pointer;
                transition: background 0.2s;
            }

            .chip:hover {
                background: #d8dadf;
            }

            /* Chat Input */
            .chat-input {
                display: flex;
                gap: 0.5rem;
                margin-top: 12px;
            }

            .chat-input input {
                flex: 1;
                padding: 0.8rem 1rem;
                border: 1px solid #e4e6eb;
                border-radius: 20px;
                outline: none;
                font-size: calc(var(--chat-font-size) * 0.7);
            }

            .chat-input input:focus {
                border-color: #0084ff;
            }

            .send-button {
                background: var(--chat-primary-color);
                color: white;
                border: none;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.2s;
                margin-top: 3px;
            }

            .send-button:hover {
                background: var(--chat-primary-color);
                opacity: 0.9;
            }

            .send-button img {
                width: 20px;
                height: 20px;
            }

            /* Loading Animation */
            .typing-indicator {
                display: none;
                padding: 0.5rem 1rem;
                background: #f0f2f5;
                border-radius: 1rem;
                align-self: flex-start;
                margin: 0.5rem 0;
            }

            .typing-indicator span {
                width: 8px;
                height: 8px;
                background: #90949c;
                display: inline-block;
                border-radius: 50%;
                margin: 0 2px;
                animation: bounce 1.4s infinite ease-in-out;
            }

            .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
            .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

            @keyframes bounce {
                0%, 80%, 100% { transform: scale(0); }
                40% { transform: scale(1); }
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
            }

            .chat-widget.dark .chat-input input {
                background: var(--chat-input-bg);
                color: var(--chat-text-color);
                border-color: var(--chat-input-border);
            }

            /* Initial greeting message style */
            .greeting-message {
                background: #e3f2fd !important;
                border-left: 3px solid var(--chat-primary-color);
                color: #000000 !important;
            }

            /* Responsive Design */
            /* Mobile Portrait */
            @media screen and (max-width: 480px) {
                :root {
                --chat-toggle-size: 50px;
                }
            
                .chat-window {
                bottom: 0;
                right: 0;
                left: 0;
                width: 100%;
                height: 100vh;
                border-radius: 0;
                max-height: calc(100vh - env(safe-area-inset-bottom));
                }
            
                .chat-toggle {
                bottom: 10px;
                right: 10px;
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
                width: 48px;
                height: 48px;
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
                width: 52px;
                height: 52px;
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

            /* Safe Area Insets for Modern Mobile Devices */
            @supports (padding: max(0px)) {
                .chat-window {
                    padding-bottom: max(1rem, env(safe-area-inset-bottom));
                    // padding-right: max(1rem, env(safe-area-inset-right));
                    // padding-left: max(1rem, env(safe-area-inset-left));
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
            ${this.config.customStyles}

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
                z-index: 10000;
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
        `;
        
        // Remove any existing chat widget styles
        const existingStyle = document.getElementById('chat-widget-styles');
        if (existingStyle) {
            existingStyle.remove();
        }
        
        document.head.appendChild(style);
    }

    createWidget() {
        const widget = document.createElement('div');
        widget.className = `chat-widget ${this.config.theme} ${this.config.position}`;
        widget.innerHTML = `
            <div class="chat-toggle">
                <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z'/%3E%3C/svg%3E" alt="Chat">
            </div>

            <div class="chat-window">
                <div class="chat-header">
                    <div class="chat-header-title">
                        <div class="chat-header-avatar">
                            <img src="${this.config.botImage}" alt="${this.config.botName}" class="bot-avatar">
                        </div>
                        <h2 style="font-weight: bold; font-size: 20px;">${this.config.botName}</h2>
                    </div>
                    <div class="chat-header-actions">
                        <button class="erase-chat">
                            <img src="https://i.ibb.co.com/9YP3swm/erase.png" alt="Erase" title="Clear chat history">
                        </button>
                        <button class="close-chat">
                            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z'/%3E%3C/svg%3E" alt="Close" title="Close chat">
                        </button>
                    </div>
                </div>

                <div class="chat-messages">
                    <div class="message-row" id="greeting-row">
                        <div class="message bot-message greeting-message">
                            ${this.config.greeting}
                        </div>
                    </div>
                    <div class="typing-indicator">
                        <span>●</span><span>●</span><span>●</span>
                    </div>
                </div>

                ${this.config.chips.length > 0 ? `
                    <div class="suggestion-chips">
                        ${this.config.chips.map(chip => `
                            <div class="chip">${chip}</div>
                        `).join('')}
                    </div>
                ` : ''}

                <div class="chat-input-container">
                    <div class="chat-input">
                        <input type="text" placeholder="${this.config.placeholder}" aria-label="Chat input">
                        <button class="send-button">
                            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M2.01 21L23 12 2.01 3 2 10l15 2-15 2z'/%3E%3C/svg%3E" alt="Send">
                        </button>
                    </div>
                </div>
            </div>

        `;

        document.body.appendChild(widget);
        this.widget = widget;
    }
    initializeWidget() {
        this.createWidget();
        this.setupSuggestionChips();
        this.setupResponsiveHandling();
        console.log("Chat widget initialized.");
    }
    
    setupEventListeners() {
        const chatToggle = this.widget.querySelector('.chat-toggle');
        const chatWindow = this.widget.querySelector('.chat-window');
        const closeChat = this.widget.querySelector('.close-chat');
        const eraseChat = this.widget.querySelector('.erase-chat');
        const chatMessages = this.widget.querySelector('.chat-messages');
        const chatInput = this.widget.querySelector('.chat-input input');
        const sendButton = this.widget.querySelector('.send-button');
        const typingIndicator = this.widget.querySelector('.typing-indicator');
        
        // Remove the old chips event listeners if they exist
        // Add the new setupSuggestionChips method instead

        // Chat toggle
        chatToggle.addEventListener('click', () => {
            chatWindow.classList.add('active');
        });

        // Close chat
        closeChat.addEventListener('click', () => {
            chatWindow.classList.remove('active');
        });

        // Erase chat history
        eraseChat.addEventListener('click', () => this.eraseChat());

        // Send message handlers
        sendButton.addEventListener('click', () => {
            const message = chatInput.value.trim();
            if (message && !this.isWaitingForResponse && !this.isTypewriterActive) {
                this.sendMessage(message);
            }
        });

        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const message = chatInput.value.trim();
                if (message && !this.isWaitingForResponse && !this.isTypewriterActive) {
                    this.sendMessage(message);
                }
            }
        });

        // Add input validation
        chatInput.addEventListener('input', () => {
            sendButton.disabled = this.isWaitingForResponse || 
                                this.isTypewriterActive || 
                                !chatInput.value.trim();
            sendButton.style.opacity = (this.isWaitingForResponse || 
                                      this.isTypewriterActive || 
                                      !chatInput.value.trim()) ? '0.5' : '1';
        });

        // Mobile-specific handlers
        if ('ontouchstart' in window) {
            let touchStartY = 0;
            let touchEndY = 0;

            chatMessages.addEventListener('touchstart', (e) => {
                touchStartY = e.touches[0].clientY;
            });

            chatMessages.addEventListener('touchmove', (e) => {
                touchEndY = e.touches[0].clientY;
                const scrollTop = chatMessages.scrollTop;
                const scrollHeight = chatMessages.scrollHeight;
                const clientHeight = chatMessages.clientHeight;

                if (scrollTop === 0 && touchEndY > touchStartY) {
                    e.preventDefault();
                }

                if (scrollTop + clientHeight >= scrollHeight && touchEndY < touchStartY) {
                    e.preventDefault();
                }
            }, { passive: false });
        }

        // Responsive handlers
        window.addEventListener('resize', () => {
            if (window.innerWidth <= 480) {
                chatWindow.style.height = `${window.innerHeight}px`;
            } else {
                chatWindow.style.height = '';
            }
        });

        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                if (window.innerWidth <= 480) {
                    chatWindow.style.height = `${window.innerHeight}px`;
                }
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }, 100);
        });

        // Add visual feedback for disabled state
        const style = document.createElement('style');
        style.textContent = `
            .chat-input input:disabled {
                background-color: #f5f5f5;
                cursor: not-allowed;
            }
            
            .send-button:disabled {
                cursor: not-allowed;
            }
            
            .chat-input-container.waiting {
                position: relative;
            }
            
            .chat-input-container.waiting::after {
                content: 'Waiting for response...';
                position: absolute;
                top: -20px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 12px;
                color: #666;
            }
        `;
        document.head.appendChild(style);
    }

    setupSuggestionChips() {
        const chips = this.widget.querySelectorAll('.chip');
        chips.forEach(chip => {
            chip.addEventListener('click', () => {
                // Only process chip click if not waiting for response
                if (!this.isWaitingForResponse) {
                    const message = chip.textContent;
                    this.sendMessage(message);
                    
                    // Optionally disable all chips while waiting
                    this.disableChips();
                }
            });
        });

        // Add styles for disabled state
        const style = document.createElement('style');
        style.textContent = `
            .chip {
                transition: opacity 0.3s ease, background-color 0.3s ease;
            }
            
            .chip.disabled {
                opacity: 0.5;
                cursor: not-allowed;
                pointer-events: none;
                background-color: #e0e0e0;
            }
        `;
        document.head.appendChild(style);
    }

    // Add new methods to handle chip states
    disableChips() {
        const chips = this.widget.querySelectorAll('.chip');
        chips.forEach(chip => {
            chip.classList.add('disabled');
        });
    }

    enableChips() {
        const chips = this.widget.querySelectorAll('.chip');
        chips.forEach(chip => {
            chip.classList.remove('disabled');
        });
    }

    typeWriter(element, text, callback) {
        this.isTypewriterActive = true;
        this.disableSendingFunctionality();

        // Track user scroll interaction
        let userScrolled = false;
        let lastScrollTop = 0;
        
        // Add scroll listener to detect user interaction
        const scrollHandler = () => {
            if (element.scrollTop < lastScrollTop) {
                userScrolled = true;
            }
            lastScrollTop = element.scrollTop;
        };
        element.addEventListener('scroll', scrollHandler);
        window.addEventListener('scroll', () => {
            if (window.scrollY < document.body.scrollHeight - window.innerHeight) {
                userScrolled = true;
            }
        });

        // Enhanced scroll to bottom function
        function scrollToBottom() {
            if (userScrolled) return; // Don't scroll if user has scrolled up

            // Calculate if we're near the bottom
            const isNearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 100;
            
            if (isNearBottom) {
                // Scroll the element
                element.scrollTop = element.scrollHeight;
                
                // Find all scrollable parents
                let parent = element.parentElement;
                while (parent) {
                    if (parent.scrollHeight > parent.clientHeight) {
                        parent.scrollTop = parent.scrollHeight;
                    }
                    parent = parent.parentElement;
                }
            }
        }

        // Tokenize content while preserving markdown and HTML
        function tokenizeContent(text) {
            let tokens = [];
            let currentToken = '';
            let inTag = false;
            let inMarkdown = false;
            
            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                
                if (char === '<' && !inMarkdown) {
                    if (currentToken) tokens.push(currentToken);
                    currentToken = char;
                    inTag = true;
                } else if (char === '>' && inTag) {
                    currentToken += char;
                    tokens.push(currentToken);
                    currentToken = '';
                    inTag = false;
                } else if (inTag) {
                    currentToken += char;
                } else if (char === '*' && text[i + 1] === '*') {
                    if (currentToken) tokens.push(currentToken);
                    tokens.push('**');
                    i++;
                    currentToken = '';
                } else if (char === '[' || (char === '!' && text[i + 1] === '[')) {
                    if (currentToken) tokens.push(currentToken);
                    currentToken = char;
                    inMarkdown = true;
                } else if (inMarkdown && char === ']' && text[i + 1] === '(') {
                    currentToken += char + '(';
                    i++;
                } else if (inMarkdown && char === ')') {
                    currentToken += char;
                    tokens.push(currentToken);
                    currentToken = '';
                    inMarkdown = false;
                } else if (char === ' ' || char === '\n') {
                    if (currentToken) tokens.push(currentToken);
                    tokens.push(char);
                    currentToken = '';
                } else {
                    currentToken += char;
                    if (!inMarkdown && !inTag && (i === text.length - 1 || text[i + 1] === ' ' || text[i + 1] === '\n')) {
                        tokens.push(currentToken);
                        currentToken = '';
                    }
                }
            }
            if (currentToken) tokens.push(currentToken);
            return tokens;
        }

        // Clear and prepare
        element.innerHTML = '';
        let currentText = '';
        const tokens = tokenizeContent(text);
        let tokenIndex = 0;

        // Type next token
        function typeNextToken() {
            if (tokenIndex >= tokens.length) {
                element.removeEventListener('scroll', scrollHandler);
                this.isTypewriterActive = false;
                this.enableSendingFunctionality();
                if (callback) callback();
                return;
            }

            const token = tokens[tokenIndex];
            const isTag = token.startsWith('<') && token.endsWith('>');
            const isMarkdown = token.startsWith('**') || token.startsWith('[') || token.startsWith('![');
            
            currentText += token;
            element.innerHTML = currentText;
            scrollToBottom();
            
            tokenIndex++;

            // Calculate delay based on token type
            let delay;
            if (isTag || isMarkdown) {
                delay = 0;
            } else if (token === ' ') {
                delay = 20;
            } else if (token === '\n') {
                delay = 50;
            } else {
                // Natural typing speed variation
                delay = Math.random() * 40 + 30;  // 30-70ms delay
            }

            setTimeout(typeNextToken, delay);
        }

        // Bind 'this' context to typeNextToken
        typeNextToken = typeNextToken.bind(this);

        // Start typing
        typeNextToken();
    }

    disableSendingFunctionality() {
        const chatInput = this.widget.querySelector('.chat-input input');
        const sendButton = this.widget.querySelector('.send-button');
        
        sendButton.disabled = true;
        sendButton.style.opacity = '0.5';
        this.disableChips();
        
        // Add visual indication that sending is disabled
        chatInput.classList.add('waiting');
    }

    enableSendingFunctionality() {
        if (this.isWaitingForResponse || this.isTypewriterActive) {
            return; // Don't enable if still waiting for response or typing
        }

        const chatInput = this.widget.querySelector('.chat-input input');
        const sendButton = this.widget.querySelector('.send-button');
        
        sendButton.disabled = false;
        sendButton.style.opacity = '1';
        this.enableChips();
        
        // Remove waiting indication
        chatInput.classList.remove('waiting');
    }

    addMessage(text, sender, useTypewriter = true) {
        const chatMessages = this.widget.querySelector('.chat-messages');
        const typingIndicator = this.widget.querySelector('.typing-indicator');
        
        const messageRow = document.createElement('div');
        messageRow.className = 'message-row';
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        if (this.config.enableMarkdown && sender === 'bot') {
            if (useTypewriter && this.config.enableTypewriter) {
                messageDiv.innerHTML = '';
                this.typeWriter(messageDiv, marked.parse(text), () => {
                    this.setupMessageLinks(messageDiv);
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                });
            } else {
                messageDiv.innerHTML = marked.parse(text);
                this.setupMessageLinks(messageDiv);
            }
        } else {
            messageDiv.textContent = text;
        }
        
        messageRow.appendChild(messageDiv);
        chatMessages.insertBefore(messageRow, typingIndicator);
        
        // Scroll to the new message
        setTimeout(() => {
            messageRow.scrollIntoView({ behavior: 'smooth', block: 'end' });
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 100);
    }

    setupMessageLinks(messageDiv) {
        messageDiv.querySelectorAll('a').forEach(link => {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        });
        
        messageDiv.querySelectorAll('img').forEach(img => {
            const imgContainer = document.createElement('div');
            imgContainer.className = 'image-container';
            
            img.parentNode.insertBefore(imgContainer, img);
            imgContainer.appendChild(img);

            // Simple SVG placeholder for failed images
            const fallbackSvg = `
                <svg width="50" height="50" viewBox="0 0 24 24" fill="#999">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                </svg>`;
            
            img.addEventListener('error', () => {
                imgContainer.innerHTML = fallbackSvg;
                imgContainer.style.padding = '20px';
                imgContainer.style.textAlign = 'center';
            });
        });
    }

    async sendMessage(message) {
        if (this.isWaitingForResponse || this.isTypewriterActive) {
            return;
        }

        const typingIndicator = this.widget.querySelector('.typing-indicator');
        const chatInput = this.widget.querySelector('.chat-input input');
        
        // Show typing indicator and update UI
        this.updateUIForSending(typingIndicator, chatInput);
        
        try {
            // Prepare request data based on custom format
            const requestData = this.formatRequestData(message);
            
            // Make API call with custom configuration
            const response = await this.makeApiCall(requestData);
            
            // Process response
            this.processApiResponse(response, typingIndicator);
            
        } catch (error) {
            this.handleApiError(error, typingIndicator);
        } finally {
            this.resetUIAfterSending(typingIndicator);
        }
    }

    formatRequestData(message) {
        // Create base request object
        const baseRequest = {
            [this.config.apiRequestFormat.query]: message,
            [this.config.apiRequestFormat.userId]: this.userManager.currentUser,
            [this.config.apiRequestFormat.domain]: this.userManager.domain
        };

        // Allow for custom request transformation
        if (this.config.transformRequest) {
            return this.config.transformRequest(baseRequest);
        }

        return baseRequest;
    }

    async makeApiCall(requestData) {
        // Prepare headers
        const headers = {
            ...this.config.apiHeaders
        };

        // Add API key if provided
        if (this.config.apiKey) {
            headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        }

        // Make the API call
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.apiTimeout);

        try {
            const response = await fetch(this.config.apiEndpoint, {
                method: this.config.apiMethod,
                headers: headers,
                body: JSON.stringify(requestData),
                signal: controller.signal
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;

        } finally {
            clearTimeout(timeoutId);
        }
    }

    processApiResponse(data, typingIndicator) {
        typingIndicator.style.display = 'none';
        
        // Extract response using custom format
        const responseText = this.config.transformResponse 
            ? this.config.transformResponse(data)
            : data[this.config.apiResponseFormat.response];

        this.addMessage(responseText, 'bot', true);
        this.storageManager.saveMessage(responseText, 'bot');
    }

    handleApiError(error, typingIndicator) {
        console.error('API Error:', error);
        typingIndicator.style.display = 'none';
        
        let errorMessage = 'Sorry, there was an error processing your request.';
        
        if (error.name === 'AbortError') {
            errorMessage = 'Request timed out. Please try again.';
        } else if (error.message.includes('SSL_PROTOCOL_ERROR')) {
            errorMessage = 'There was a secure connection error. Please ensure the server supports HTTPS.';
        } else if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
        }
        
        this.addMessage(errorMessage, 'bot', true);
        this.storageManager.saveMessage(errorMessage, 'bot');
        
        if (this.config.onError) {
            this.config.onError(error);
        }
    }

    updateUIForSending(typingIndicator, chatInput) {
        this.addMessage(chatInput.value.trim(), 'user');
        this.storageManager.saveMessage(chatInput.value.trim(), 'user');
        chatInput.value = '';
        typingIndicator.style.display = 'block';
        this.isWaitingForResponse = true;
        this.disableSendingFunctionality();
    }

    resetUIAfterSending(typingIndicator) {
        this.isWaitingForResponse = false;
        if (!this.isTypewriterActive) {
            this.enableSendingFunctionality();
        }
        typingIndicator.style.display = 'none';
    }

    loadChatHistory() {
        this.storageManager.loadChatHistory();
    }

    updateConfig(newConfig) {
        this.initConfig({ ...this.config, ...newConfig });
        // Reload the widget with new config
        this.destroy();
        this.createWidget();
        this.setupEventListeners();
        this.loadChatHistory();
    }

    destroy() {
        // Clean up logic would go here
        // Remove event listeners and DOM elements
    }

    eraseChat() {
        if (confirm('Are you sure you want to clear the chat history? This action cannot be undone.')) {
            this.storageManager.clearHistory();
            const messages = this.widget.querySelectorAll('.message-row');
            const greetingRow = this.widget.querySelector('#greeting-row');
            
            messages.forEach(message => {
                if (message !== greetingRow) {
                    message.remove();
                }
            });

            if (!greetingRow) {
                this.addGreetingMessage();
            }

            const chatInput = this.widget.querySelector('.chat-input input');
            chatInput.value = '';
        }
    }

    addGreetingMessage() {
        const chatMessages = this.widget.querySelector('.chat-messages');
        const newGreeting = document.createElement('div');
        newGreeting.className = 'message-row';
        newGreeting.id = 'greeting-row';
        
        const greetingMessage = document.createElement('div');
        greetingMessage.className = 'message bot-message greeting-message';
        greetingMessage.textContent = 'Welcome! How can I assist you with baby fashion today?';
        
        newGreeting.appendChild(greetingMessage);
        chatMessages.insertBefore(newGreeting, chatMessages.firstChild);
    }

    // Add this method to handle window resize
    setupResponsiveHandling() {
        const calculateOptimalSize = () => {
            const vh = window.innerHeight;
            const vw = window.innerWidth;
            
            let width = Math.min(Math.max(vw * 0.3, 320), 600);
            let height = Math.min(Math.max(vh * 0.7, 400), 800);
            
            // Device-specific adjustments
            if (vw <= 480) { // Mobile
                width = vw;
                height = vh;
                // Ensure full height on mobile
                const safeAreaBottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sab') || '0');
                height = vh - safeAreaBottom;
            } else if (vw <= 768) { // Tablet
                width = Math.min(vw * 0.8, 400);
                height = Math.min(vh * 0.8, 600);
            } else if (vw <= 1024) { // Small laptop
                width = Math.min(vw * 0.35, 420);
                height = Math.min(vh * 0.7, 580);
            } else if (vw <= 1366) { // Laptop
                width = Math.min(vw * 0.3, 450);
                height = Math.min(vh * 0.75, 600);
            } else if (vw <= 1920) { // Desktop
                width = Math.min(vw * 0.25, 500);
                height = Math.min(vh * 0.8, 700);
            } else { // Large displays
                width = Math.min(vw * 0.2, 600);
                height = Math.min(vh * 0.8, 800);
            }

            // Ensure minimum sizes
            width = Math.max(width, 320);
            height = Math.max(height, 400);

            // Calculate maximum allowed height
            const maxHeight = vh - (vw <= 480 ? 0 : 120); // No margin on mobile
            height = Math.min(height, maxHeight);

            return { width, height };
        };

        const resizeWindow = () => {
            const chatWindow = this.widget.querySelector('.chat-window');
            const chatToggle = this.widget.querySelector('.chat-toggle');
            if (!chatWindow || !chatToggle) return;

            const { width, height } = calculateOptimalSize();
            const vh = window.innerHeight;
            const vw = window.innerWidth;

            // Apply responsive styles
            chatWindow.style.width = `${width}px`;
            chatWindow.style.height = `${height}px`;

            // Position adjustments
            if (vw <= 480) { // Mobile
                // Full screen positioning
                chatWindow.style.bottom = '0';
                chatWindow.style.right = '0';
                chatWindow.style.left = '0';
                chatWindow.style.top = '0';
                chatWindow.style.width = '100%';
                chatWindow.style.height = '100%';
                chatWindow.style.borderRadius = '0';
                chatWindow.style.maxHeight = '100%';

                // Adjust toggle button position
                chatToggle.style.bottom = '20px';
                chatToggle.style.right = '20px';
            } else {
                // Calculate spacing between toggle and window
                const toggleHeight = chatToggle.offsetHeight;
                const spacing = 20; // Space between toggle and window
                const bottomPosition = toggleHeight + spacing;

                // Desktop/tablet positioning
                chatWindow.style.bottom = `${bottomPosition}px`;
                chatWindow.style.right = `${Math.min(vw * 0.02 + 10, 40)}px`;
                chatWindow.style.left = 'auto';
                chatWindow.style.top = 'auto';
                chatWindow.style.borderRadius = '16px';
                chatWindow.style.maxHeight = `calc(100vh - ${bottomPosition + spacing}px)`;

                // Reset toggle button position
                chatToggle.style.bottom = '20px';
                chatToggle.style.right = '20px';
            }

            // Font size adjustments
            const baseFontSize = Math.min(Math.max(width * 0.04, 14), 16);
            chatWindow.style.fontSize = `${baseFontSize}px`;

            // Container adjustments
            const messageContainer = chatWindow.querySelector('.chat-messages');
            const inputContainer = chatWindow.querySelector('.chat-input-container');
            
            if (messageContainer) {
                const padding = Math.min(Math.max(width * 0.03, 8), 16);
                messageContainer.style.padding = `${padding}px`;
                
                // Adjust message container height
                const headerHeight = chatWindow.querySelector('.chat-header').offsetHeight;
                const inputHeight = inputContainer ? inputContainer.offsetHeight : 0;
                messageContainer.style.height = `calc(100% - ${headerHeight + inputHeight}px)`;
            }

            if (inputContainer) {
                const padding = Math.min(Math.max(width * 0.03, 8), 16);
                inputContainer.style.padding = `${padding}px`;
            }
        };

        // Add CSS variables for safe area insets
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

        // Initialize safe area variables
        addSafeAreaVariables();

        // Initial resize
        resizeWindow();

        // Event listeners
        window.addEventListener('resize', debounce(resizeWindow, 250));
        window.addEventListener('orientationchange', () => {
            setTimeout(resizeWindow, 100);
        });

        // Content change observer
        const resizeObserver = new ResizeObserver(debounce(() => {
            const chatMessages = this.widget.querySelector('.chat-messages');
            if (chatMessages) {
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        }, 100));

        const chatWindow = this.widget.querySelector('.chat-window');
        if (chatWindow) {
            resizeObserver.observe(chatWindow);
        }
    }
}

class ChatUserManager {
    constructor() {
        this.domain = this.getCurrentDomain();
        this.path = this.getCurrentPath();
        this.currentUser = this.generateUserId();
        this.initializeUser();
    }

    getCurrentDomain() {
        return window.location.hostname;
    }

    getCurrentPath() {
        return window.location.pathname;
    }

    generateUserId() {
        const storageKey = `currentChatUser_${this.domain}${this.path}`;
        const storedId = localStorage.getItem(storageKey);
        
        if (!storedId) {
            const newId = `user_${this.domain}${this.path}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            localStorage.setItem(storageKey, newId);
            return newId;
        }
        return storedId;
    }

    getHistoryKey() {
        return `chatHistory_${this.domain}${this.path}`;
    }

    initializeUser() {
        const historyKey = this.getHistoryKey();
        if (!localStorage.getItem(historyKey)) {
            localStorage.setItem(historyKey, JSON.stringify([]));
        }
    }

    loadUserData() {
        const historyKey = this.getHistoryKey();
        return {
            userId: this.currentUser,
            domain: this.domain,
            path: this.path,
            chatHistory: JSON.parse(localStorage.getItem(historyKey)) || []
        };
    }
}

class ChatStorageManager {
    constructor(userManager) {
        this.userManager = userManager;
        this.maxHistoryLength = 100;
        this.widget = null;
        this.domain = userManager.domain;
        this.path = userManager.path;
    }

    setWidget(widget) {
        this.widget = widget;
    }

    getChatHistory() {
        const historyKey = this.userManager.getHistoryKey();
        const history = localStorage.getItem(historyKey);
        const parsedHistory = history ? JSON.parse(history) : [];
        
        return parsedHistory.filter(item => 
            (!item.domain || item.domain === this.domain) && 
            (!item.path || item.path === this.path)
        );
    }

    saveMessage(message, sender) {
        const historyKey = this.userManager.getHistoryKey();
        let chatHistory = this.getChatHistory();
        
        chatHistory.push({
            message: message,
            sender: sender,
            timestamp: new Date().toISOString(),
            domain: this.domain,
            path: this.path
        });

        if (chatHistory.length > this.maxHistoryLength) {
            chatHistory = chatHistory.slice(-this.maxHistoryLength);
        }

        localStorage.setItem(historyKey, JSON.stringify(chatHistory));
    }

    loadChatHistory() {
        if (!this.widget) return;

        const chatMessages = this.widget.widget.querySelector('.chat-messages');
        const messages = chatMessages.querySelectorAll('.message-row');
        const greetingRow = chatMessages.querySelector('#greeting-row');
        
        messages.forEach(message => {
            if (message !== greetingRow) {
                message.remove();
            }
        });

        const chatHistory = this.getChatHistory();
        chatHistory.forEach(item => {
            this.widget.addMessage(item.message, item.sender, false);
        });
    }

    clearHistory() {
        const historyKey = this.userManager.getHistoryKey();
        localStorage.removeItem(historyKey);
        localStorage.setItem(historyKey, JSON.stringify([]));
    }
}

// Export for non-module environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EasyChatWidget;
} else {
    window.EasyChatWidget = EasyChatWidget;
}

// Utility function for debouncing
function debounce(func, wait) {
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

// Add these CSS variables to your existing styles
const additionalStyles = `
    .chat-window {
        transition: width 0.3s ease, height 0.3s ease, bottom 0.3s ease, right 0.3s ease;
        position: fixed;
        z-index: 1000;
    }

    .chat-toggle {
        position: fixed;
        z-index: 999;
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

    /* Mobile-specific styles */
    @media screen and (max-width: 480px) {
        .chat-window.active {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100% !important;
            height: 100% !important;
            margin: 0;
            padding-bottom: var(--sab, 0px);
            border-radius: 0;
            display: flex;
            flex-direction: column;
        }

        .chat-input-container {
            padding-bottom: max(8px, env(safe-area-inset-bottom));
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .chat-window,
        .chat-toggle,
        .chat-messages,
        .message {
            transition: none;
        }
    }

    @supports (-webkit-touch-callout: none) {
        .chat-window {
            padding-bottom: max(env(safe-area-inset-bottom), 20px);
        }
    }
`;
