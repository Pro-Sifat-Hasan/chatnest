/* jshint esversion: 11, asi: true */
// EasyChatWidget.js
class EasyChatWidget {
    constructor(config = {}) {
        this.isWaitingForResponse = false;
        this.initConfig(config);
        this.userManager = new ChatUserManager(this.config);
        this.storageManager = new ChatStorageManager(this.userManager, this.config);
        
        this.ensureDependencies().then(() => {
            this.initializeWidget();
            this.setupEventListeners();
            this.storageManager.setWidget(this);
            this.loadChatHistory();
            this.setupEraseButton();
        });
        this.activeForm = null; // Add this to track active form
        // Validate position
        if (!togglePositions[this.config.position]) {
            console.warn(`Invalid position "${this.config.position}". Falling back to bottom-right.`);
            this.config.position = 'bottom-right';
        }
    }

    initConfig(config) {
        // Helper function to clamp dimensions
        const clampDimension = (value, min, max) => {
            const numValue = parseInt(value);
            return `${Math.min(Math.max(numValue, min), max)}px`;
        };
        
        // Clamp font size function
        const clampFontSize = (size) => {
            // Convert any font size input to a number
            let numSize;
            if (typeof size === 'string') {
                numSize = parseInt(size.replace('px', ''));
            } else if (typeof size === 'number') {
                numSize = size;
            } else {
                numSize = 14; // default if invalid input
            }
            
            // Clamp between 14 and 25
            const clampedSize = Math.min(Math.max(14, numSize), 25);
            return `${clampedSize}px`;
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
            fontSize: clampFontSize(config.fontSize || 14),
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
            enableBackendHistory: config.enableBackendHistory !== false,
            backendHistoryEndpoint: formatApiEndpoint(config.backendHistoryEndpoint),
            deleteEndpoint: formatApiEndpoint(config.deleteEndpoint) || `${formatApiEndpoint(config.apiEndpoint).replace(/\/chat$/, '')}/delete-history`,
            separateSubpageHistory: config.separateSubpageHistory || false, // Default is false
            feedbackEndpoint: formatApiEndpoint(config.feedbackEndpoint) || `${this.config.apiEndpoint}/feedback`,
            // Add HubSpot configuration
            hubspot: {
                enabled: config.hubspot?.enabled || false,
                portalId: config.hubspot?.portalId || '',
                formGuid: config.hubspot?.formGuid || '',
                triggerKeywords: config.hubspot?.triggerKeywords || ['pricing', 'demo', 'contact', 'quote', 'help', 'support'],
                formShownToUsers: new Set(),
                formSubmittedUsers: new Set() // Track users who've submitted the form
            },
            position: config.position || 'bottom-right',
            enableServerHistoryDelete: true, // New option to control backend history deletion
        };
    }

    // Update the font size update method to include clamping
    updateFontSize(newSize) {
        // Ensure the new size is within bounds
        const numSize = parseInt(newSize);
        const clampedSize = `${Math.min(Math.max(numSize, 14), 25)}px`;
        
        this.config.fontSize = clampedSize;
        document.documentElement.style.setProperty('--chat-message-font-size', clampedSize);
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
        style.textContent = `
            :root {
                --chat-primary-color: ${this.config.primaryColor};
                --chat-message-font-size: ${this.config.fontSize};
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
                overscroll-behavior: contain;
                -webkit-overflow-scrolling: touch;
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
                overscroll-behavior: contain;
                -webkit-overflow-scrolling: touch;
                scroll-behavior: smooth;
                scrollbar-width: thin;
                scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
            }

            .chat-messages::-webkit-scrollbar {
                width: 6px;
            }

            .chat-messages::-webkit-scrollbar-track {
                background: transparent;
            }

            .chat-messages::-webkit-scrollbar-thumb {
                background-color: rgba(0, 0, 0, 0.2);
                border-radius: 3px;
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

            .chat-input input {
                -webkit-user-select: text !important; /* Allow text selection on Safari */
                user-select: text !important;        /* Ensure text selection works */
                -webkit-tap-highlight-color: transparent !important; /* Remove tap highlight on iOS/Android */
                cursor: text !important;             /* Ensure text cursor appears */
            }

            .chat-input input:focus {
                outline: 2px solid #007bff !important; /* Add a clear focus outline */
                border-color: #007bff !important;     /* Change border color on focus */
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
                font-size: 14px;
                background-color: white;
                cursor: pointer;
            }

            .chat-input input.cursor-active {
                cursor: text;
                user-select: text;
                -webkit-user-select: text;
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

                .chat-input input {
                    -webkit-user-select: text !important; /* Allow text selection on Safari */
                    user-select: text !important;        /* Ensure text selection works */
                    -webkit-tap-highlight-color: transparent !important; /* Remove tap highlight on iOS/Android */
                    cursor: text !important;             /* Ensure text cursor appears */
                }

                .chat-input input:focus {
                    outline: 2px solid #007bff !important; /* Add a clear focus outline */
                    border-color: #007bff !important;     /* Change border color on focus */
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

                .chat-input input {
                    -webkit-user-select: text !important; /* Allow text selection on Safari */
                    user-select: text !important;        /* Ensure text selection works */
                    -webkit-tap-highlight-color: transparent !important; /* Remove tap highlight on iOS/Android */
                    cursor: text !important;             /* Ensure text cursor appears */
                }

                .chat-input input:focus {
                    outline: 2px solid #007bff !important; /* Add a clear focus outline */
                    border-color: #007bff !important;     /* Change border color on focus */
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
                background: var(--chat-primary-color);
                border-color: var(--chat-primary-color);
            }

            .message-action-btn.active img {
                opacity: 1;
                filter: brightness(0) invert(1);
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

            /* Add powered by link styles */
            .powered-by {
                text-align: center;
                padding: 0px;
                font-size: 12px;
                color: #666;
                // border-top: 1px solid #e4e6eb;
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

            /* Position-specific styles for toggle and window */
            .chat-widget.bottom-right .chat-toggle {
                bottom: 20px;
                right: 20px;
            }
            .chat-widget.bottom-right .chat-window {
                bottom: 100px;
                right: 20px;
            }

            .chat-widget.bottom-left .chat-toggle {
                bottom: 20px;
                left: 20px;
            }
            .chat-widget.bottom-left .chat-window {
                bottom: 100px;
                left: 20px;
            }

            .chat-widget.bottom-center .chat-toggle {
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%)
            }
            .chat-widget.bottom-center .chat-window {
                bottom: 100px;
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

            /* Mobile adjustments */
            @media screen and (max-width: 480px) {
                .chat-widget .chat-window {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    width: 100% !important;
                    height: 100% !important;
                    transform: none !important;
                }
            }

            /* Only show cursor when input is specifically activated */
            .chat-input input.cursor-active {
                user-select: text;
                -webkit-user-select: text;
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
        
        // Get position styles
        const positionStyle = togglePositions[this.config.position];
        
        // Create toggle button with explicit positioning
        const toggleStyle = Object.entries(positionStyle.toggle)
            .map(([key, value]) => `${key}: ${value};`)
            .join(' ');
        
        const toggleButtonHtml = `
            <div class="chat-toggle" style="position: fixed; ${toggleStyle}">
                <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z'/%3E%3C/svg%3E" alt="Chat">
            </div>
        `;

        // Create chat window with explicit positioning
        const windowStyle = Object.entries(positionStyle.window)
            .map(([key, value]) => `${key}: ${value};`)
            .join(' ');
        
        const chatWindowHtml = `
            <div class="chat-window" style="position: fixed; ${windowStyle}">
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
                <!--<div class="powered-by">
                   Powered by <a href="https://neurobrains.co" target="_blank">NeuroBrain</a>
                </div> -->
            </div>
        `;

        widget.innerHTML = toggleButtonHtml + chatWindowHtml;
        document.body.appendChild(widget);
        this.widget = widget;
    }
    initializeWidget() {
        this.createWidget();
        this.setupSuggestionChips();
        this.setupResponsiveHandling();
        this.setupScrollContainment();
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
        
        // Helper function to update toggle icon
        const updateToggleIcon = (isOpen) => {
            chatToggle.innerHTML = isOpen 
                ? `<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z'/%3E%3C/svg%3E" alt="Close">`
                : `<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z'/%3E%3C/svg%3E" alt="Chat">`;
        };

        // Toggle button click handler
        chatToggle.addEventListener('click', () => {
            const isActive = chatWindow.classList.contains('active');
            
            if (isActive) {
                chatWindow.classList.remove('active');
                updateToggleIcon(false);
                setTimeout(() => {
                    chatWindow.style.display = 'none';
                }, 300);
            } else {
                chatWindow.style.display = 'flex';
                updateToggleIcon(true);
                requestAnimationFrame(() => {
                    chatWindow.classList.add('active');
                    // Enhanced mobile input focus
                    if (window.innerWidth <= 480) {
                        setTimeout(() => {
                            chatInput.click();
                            // Remove readonly attribute
                            chatInput.removeAttribute('readonly');
                            // Trigger click event
                            const clickEvent = new MouseEvent('click', {
                                view: window,
                                bubbles: true,
                                cancelable: true
                            });
                            chatInput.dispatchEvent(clickEvent);
                            
                            // For iOS devices
                            if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                                //pass
                            }
                        }, 500); // Increased delay for better reliability
                    }
                });
            }
        });

        // Close button handler
        closeChat.addEventListener('click', () => {
            chatWindow.classList.remove('active');
            updateToggleIcon(false);
            setTimeout(() => {
                chatWindow.style.display = 'none';
            }, 300);
        });

        // Send message handlers with enhanced checks
        const sendMessageHandler = () => {
            const message = chatInput.value.trim();
            if (message && !this.isWaitingForResponse && !this.isTypewriterActive) {
                this.sendMessage(message);
            }
        };

        sendButton.addEventListener('click', sendMessageHandler);
        
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessageHandler();
            }
        });

        // Add input validation and visual feedback
        chatInput.addEventListener('input', () => {
            const isEmpty = !chatInput.value.trim();
            const isDisabled = this.isWaitingForResponse || this.isTypewriterActive;
            sendButton.disabled = isEmpty || isDisabled;
            sendButton.style.opacity = sendButton.disabled ? '0.5' : '1';
        });

        // Outside click handler
        document.addEventListener('click', (e) => {
            if (!chatWindow.contains(e.target) && !chatToggle.contains(e.target)) {
                if (chatWindow.classList.contains('active')) {
                    chatWindow.classList.remove('active');
                    updateToggleIcon(false);
                    setTimeout(() => {
                        chatWindow.style.display = 'none';
                    }, 300);
                }
            }
        });

        // Prevent chat window from closing when clicking inside
        chatWindow.addEventListener('click', (e) => {
            e.stopPropagation();
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

    // Add mobile input handling
    if (window.innerWidth <= 480) {
        const chatInput = this.widget.querySelector('.chat-input input');
        const inputContainer = this.widget.querySelector('.chat-input');

        // Function to activate cursor (now requires explicit action)
        const activateCursor = () => {
            if (!this.isWaitingForResponse && !this.isTypewriterActive) {
                chatInput.classList.add('cursor-active');
                chatInput.removeAttribute('readonly'); // Allow focus
            }
        };

        // Function to deactivate cursor
        const deactivateCursor = () => {
            chatInput.classList.remove('cursor-active');
            chatInput.setAttribute('readonly', 'true'); // Prevent focus
        };

        // Handle input container clicks
        inputContainer.addEventListener('click', (e) => {
            if (e.target === inputContainer || e.target === chatInput) {
                e.preventDefault();
                activateCursor();
            }
        });

        // Prevent default touch behavior
        chatInput.addEventListener('touchstart', (e) => {
            if (!chatInput.classList.contains('cursor-active')) {
                e.preventDefault();
            }
        });

        // Handle focus events
        chatInput.addEventListener('focus', (e) => {
            if (!chatInput.classList.contains('cursor-active')) {
                e.preventDefault();
                deactivateCursor();
            }
        });

        // Deactivate cursor when input loses focus
        chatInput.addEventListener('blur', () => {
            if (!chatInput.value) {
                deactivateCursor();
            }
        });

        // Ensure input starts in a readonly state
        chatInput.setAttribute('readonly', 'true');
    }

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

        // Track user scroll interaction within chat container only
        let userScrolled = false;
        let lastScrollTop = 0;
        const chatMessages = this.widget.querySelector('.chat-messages');
        
        // Add scroll listener to chat messages container only
        const scrollHandler = () => {
            if (chatMessages.scrollTop < lastScrollTop) {
                userScrolled = true;
            }
            lastScrollTop = chatMessages.scrollTop;
        };
        chatMessages.addEventListener('scroll', scrollHandler);

        // Enhanced scroll to bottom function that only affects chat container
        function scrollToBottom() {
            if (userScrolled) return; // Don't scroll if user has scrolled up

            // Calculate if we're near the bottom of the chat container
            const isNearBottom = chatMessages.scrollHeight - chatMessages.scrollTop - chatMessages.clientHeight < 100;
            
            if (isNearBottom) {
                // Scroll only the chat messages container
                chatMessages.scrollTop = chatMessages.scrollHeight;
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

        // Type next token with contained scrolling
        function typeNextToken() {
            if (tokenIndex >= tokens.length) {
                chatMessages.removeEventListener('scroll', scrollHandler);
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
            
            // Prevent page scroll by stopping event propagation
            requestAnimationFrame(() => {
                scrollToBottom();
                // Prevent any scroll events from bubbling up
                event?.preventDefault?.();
                event?.stopPropagation?.();
            });
            
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
        
        // Don't disable the input box, only make it read-only
        chatInput.readOnly = false;
        
        // Disable send button and chips
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
        
        // Enable everything back
        chatInput.readOnly = false;
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
        
        if (sender === 'bot') {
            const botMessageContainer = document.createElement('div');
            botMessageContainer.className = 'bot-message-container';
            
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${sender}-message`;
            
            // Create actions container but don't show it until typewriter is done
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'message-actions';
            actionsDiv.style.display = 'none'; // Hide initially
            actionsDiv.innerHTML = `
                <button class="message-action-btn copy-btn" title="Copy to clipboard">
                    <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3E%3Cpath d='M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z'/%3E%3C/svg%3E" alt="Copy">
                </button>
                <button class="message-action-btn like-btn" title="Helpful">
                    <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3E%3Cpath d='M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z'/%3E%3C/svg%3E" alt="Like">
                </button>
                <button class="message-action-btn dislike-btn" title="Not helpful">
                    <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3E%3Cpath d='M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z'/%3E%3C/svg%3E" alt="Dislike">
                </button>
                <button class="message-action-btn regenerate-btn" title="Regenerate response">
                    <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3E%3Cpath d='M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z'/%3E%3C/svg%3E" alt="Regenerate">
                </button>
            `;

            // Add content to message
            if (this.config.enableMarkdown && sender === 'bot') {
                if (useTypewriter && this.config.enableTypewriter) {
                    messageDiv.innerHTML = '';
                    this.typeWriter(messageDiv, marked.parse(text), () => {
                        // Show actions after typewriter is done
                        actionsDiv.style.display = 'flex';
                        this.setupMessageLinks(messageDiv);
                        this.scrollToTypingIndicator();
                        this.updateLastBotMessage();
                        
                        // Check for trigger words after typewriter finishes
                        if (this.checkForTriggerWords(text)) {
                            setTimeout(() => {
                                this.showHubSpotForm();
                            }, 500); // Small delay after typewriter
                        }
                    });
                } else {
                    messageDiv.innerHTML = marked.parse(text);
                    actionsDiv.style.display = 'flex';
                    this.setupMessageLinks(messageDiv);
                    
                    // Check for trigger words immediately if no typewriter
                    if (this.checkForTriggerWords(text)) {
                        this.showHubSpotForm();
                    }
                }
            } else {
                messageDiv.textContent = text;
                actionsDiv.style.display = 'flex';
            }

            botMessageContainer.appendChild(messageDiv);
            botMessageContainer.appendChild(actionsDiv);
            messageRow.appendChild(botMessageContainer);

            // Setup action buttons
            this.setupMessageActions(botMessageContainer, text);

            // Add new method to check for trigger words
            if (this.checkForTriggerWords(text)) {
                // Wait for typewriter to complete if enabled
                if (useTypewriter && this.config.enableTypewriter) {
                    this.typeWriter(messageDiv, marked.parse(text), () => {
                        this.showHubSpotForm();
                    });
                } else {
                    this.showHubSpotForm();
                }
            }
        } else {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${sender}-message`;
            messageDiv.textContent = text;
            messageRow.appendChild(messageDiv);
        }

        chatMessages.insertBefore(messageRow, typingIndicator);
        this.updateLastBotMessage();
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

    async sendMessage(message, isRegeneration = false) {
        // Early exit conditions
        if (this.isWaitingForResponse || this.isTypewriterActive) {
            return;
        }
    
        // Get DOM elements
        const chatInput = this.widget.querySelector('.chat-input input');
        const typingIndicator = this.widget.querySelector('.typing-indicator');
        const chatWindow = this.widget.querySelector('.chat-window');
    
        // Comprehensive input reset and interaction management
        const resetInputState = () => {
            // Reset input state
            chatInput.value = '';
            chatInput.setAttribute('readonly', 'true');
            chatInput.classList.remove('cursor-active');
    
            // Mobile-specific handling
            if (this.isMobileBrowser()) {
                setTimeout(() => {
                    this.enableMobileInputInteraction(chatInput);
                }, 100);
            } else {
                chatInput.focus();
            }
        };
    
        // Disable sending functionality
        const disableSending = () => {
            this.isWaitingForResponse = true;
            this.disableSendingFunctionality();
            typingIndicator.style.display = 'block';
        };
    
        // Enable sending functionality
        const enableSending = () => {
            this.isWaitingForResponse = false;
            this.enableSendingFunctionality();
            typingIndicator.style.display = 'none';
        };
    
        try {
            // Disable sending and show typing indicator
            disableSending();
    
            // Scroll to typing indicator
            this.scrollToTypingIndicator();
    
            // Add user message if not a regeneration
            if (!isRegeneration) {
                this.addMessage(message, 'user');
                this.storageManager.saveMessage(message, 'user');
            }
    
            // Make API call
            const requestData = this.formatRequestData(message);
            const response = await this.makeApiCall(requestData);
    
            // Process response
            const responseText = this.config.transformResponse 
                ? this.config.transformResponse(response)
                : response[this.config.apiResponseFormat.response];
    
            // Add bot response
            this.addMessage(responseText, 'bot', true);
            this.storageManager.saveMessage(responseText, 'bot', isRegeneration);
    
        } catch (error) {
            console.error('API Error:', error);
            this.addMessage('Sorry, there was an error processing your request.', 'bot', false);
        } finally {
            // Always enable sending and reset input
            enableSending();
            resetInputState();
        }
    }
    
    // Mobile browser detection method
    isMobileBrowser() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    // Enhanced mobile input interaction method
    enableMobileInputInteraction(inputElement) {
        // Comprehensive mobile input activation
        const activateInput = () => {
            inputElement.removeAttribute('readonly');
            inputElement.classList.add('cursor-active');
            
            // Delayed focus for better keyboard handling
            setTimeout(() => {
                inputElement.focus();
                
                // iOS-specific cursor placement
                if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                    inputElement.setSelectionRange(
                        inputElement.value.length, 
                        inputElement.value.length
                    );
                }
            }, 100);
        };
    
        // Add touch and click listeners
        const setupInputListeners = () => {
            const handleInputInteraction = (event) => {
                event.preventDefault();
                activateInput();
            };
    
            inputElement.addEventListener('touchstart', handleInputInteraction, { passive: false });
            inputElement.addEventListener('click', handleInputInteraction);
        };
    
        // Apply mobile-specific styles
        const addMobileStyles = () => {
            const style = document.createElement('style');
            style.textContent = `
                @media (max-width: 480px) {
                    .chat-input input {
                        -webkit-user-select: text !important;
                        user-select: text !important;
                        -webkit-touch-callout: default !important;
                        cursor: text !important;
                        caret-color: auto !important;
                        font-size: 16px !important;
                    }
                    
                    .chat-input input.cursor-active {
                        pointer-events: auto !important;
                        user-select: text !important;
                        -webkit-user-select: text !important;
                    }
                    
                    .chat-input input[readonly] {
                        cursor: pointer !important;
                        user-select: none;
                        -webkit-user-select: none;
                    }
                    
                    .chat-input input:focus {
                        outline: none;
                        caret-color: auto !important;
                    }
                }
            `;
            document.head.appendChild(style);
        };
    
        // Initialize mobile input handling
        addMobileStyles();
        setupInputListeners();
        activateInput();
    }
    
    // Enhanced scroll method to ensure visibility
    scrollToTypingIndicator() {
        const chatMessages = this.widget.querySelector('.chat-messages');
        const typingIndicator = this.widget.querySelector('.typing-indicator');
        
        if (chatMessages && typingIndicator) {
            requestAnimationFrame(() => {
                // Smooth scroll to bottom
                chatMessages.scrollTo({
                    top: chatMessages.scrollHeight,
                    behavior: 'smooth'
                });
                
                // Ensure typing indicator is visible
                typingIndicator.scrollIntoView({
                    behavior: 'smooth',
                    block: 'end'
                });
            });
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

        // Ensure chat window stays open and active
        const chatWindow = this.widget.querySelector('.chat-window');
        chatWindow.classList.add('active');
        
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
        if (!this.widget) return;

        const chatMessages = this.widget.querySelector('.chat-messages');
        const messages = chatMessages.querySelectorAll('.message-row');
        const greetingRow = chatMessages.querySelector('#greeting-row');
        
        // Clear existing messages except greeting
        messages.forEach(message => {
            if (message !== greetingRow) {
                message.remove();
            }
        });

        const chatHistory = this.storageManager.getChatHistory();
        
        // Filter out old regenerated responses
        const filteredHistory = chatHistory.reduce((acc, item) => {
            if (item.sender === 'user') {
                // Always keep user messages
                acc.push(item);
            } else if (item.sender === 'bot') {
                // For bot messages, check if it's the latest response for the previous user message
                const lastUserIndex = acc.findLastIndex(msg => msg.sender === 'user');
                if (lastUserIndex !== -1) {
                    // Remove any existing bot responses after the last user message
                    acc = acc.filter((msg, index) => 
                        index <= lastUserIndex || msg.sender === 'user'
                    );
                }
                acc.push(item);
            }
            return acc;
        }, []);

        // Add filtered messages to UI
        filteredHistory.forEach(item => {
            this.addMessage(item.message, item.sender, false);
        });
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
        this.removeActiveForm();
        // Clean up logic would go here
        // Remove event listeners and DOM elements
    }

    setupEraseButton() {
        const eraseButton = this.widget.querySelector('.erase-chat');
        if (eraseButton) {
            // Remove any existing listeners first
            eraseButton.removeEventListener('click', this.eraseChat.bind(this));
            // Add new click listener with proper binding
            eraseButton.addEventListener('click', this.eraseChat.bind(this));
        }
    }

    eraseChat() {
        if (!confirm('Are you sure you want to clear the chat history? This action cannot be undone.')) {
            return;
        }

        // Show loading state
        const eraseButton = this.widget.querySelector('.erase-chat');
        eraseButton.style.opacity = '0.5';
        eraseButton.disabled = true;

        try {
            // Clear frontend messages
            const chatMessages = this.widget.querySelector('.chat-messages');
            const messages = chatMessages.querySelectorAll('.message-row');
            const greetingRow = chatMessages.querySelector('#greeting-row');
            
            messages.forEach(message => {
                if (message.id !== 'greeting-row') {
                    message.remove();
                }
            });

            // Clear local storage
            this.storageManager.clearHistory();

            // Only delete backend history if explicitly enabled AND endpoint exists
            if (this.config.enableServerHistoryDelete === true && this.config.deleteEndpoint) {
                console.log('Attempting to delete server history...');
                this.deleteBackendHistory()
                    .then(() => {
                        console.log('Backend history deleted successfully');
                    })
                    .catch(error => {
                        console.error('Failed to delete backend history:', error);
                    });
            } else {
                console.log('Server history deletion skipped:', {
                    enabled: this.config.enableServerHistoryDelete,
                    hasEndpoint: Boolean(this.config.deleteEndpoint)
                });
            }

            // Ensure greeting message exists
            if (!chatMessages.querySelector('#greeting-row')) {
                this.addGreetingMessage();
            }

            // Clear input
            const chatInput = this.widget.querySelector('.chat-input input');
            if (chatInput) {
                chatInput.value = '';
            }

            console.log('Chat history cleared successfully');

        } catch (error) {
            console.error('Error during chat erasure:', error);
            this.addMessage('Failed to clear chat history. Please try again.', 'bot', false);
        } finally {
            // Reset erase button state
            eraseButton.style.opacity = '1';
            eraseButton.disabled = false;
        }
    }

    addGreetingMessage() {
        const chatMessages = this.widget.querySelector('.chat-messages');
        const existingGreeting = chatMessages.querySelector('#greeting-row');
        
        if (!existingGreeting) {
            const newGreeting = document.createElement('div');
            newGreeting.className = 'message-row';
            newGreeting.id = 'greeting-row';
            
            const greetingMessage = document.createElement('div');
            greetingMessage.className = 'message bot-message greeting-message';
            greetingMessage.textContent = this.config.greeting;
            
            newGreeting.appendChild(greetingMessage);
            chatMessages.insertBefore(newGreeting, chatMessages.firstChild);
        }
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

            // Position adjustments for mobile
            if (vw <= 480) {
                // Full screen positioning for mobile
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
                // Reset to position-specific styles for desktop
                const positionStyle = togglePositions[this.config.position];
                Object.entries(positionStyle.window).forEach(([key, value]) => {
                    chatWindow.style[key] = value;
                });
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

    // Add new method for controlled scrolling
    scrollChatToBottom() {
        const chatMessages = this.widget.querySelector('.chat-messages');
        if (!chatMessages) return;

        // Get the current scroll position and the maximum scroll
        const currentScroll = chatMessages.scrollTop;
        const maxScroll = chatMessages.scrollHeight - chatMessages.clientHeight;
        
        // Only scroll if user is already near bottom (within 100px)
        const isNearBottom = maxScroll - currentScroll < 100;
        
        if (isNearBottom) {
            // Use requestAnimationFrame for smooth scrolling
            requestAnimationFrame(() => {
                chatMessages.scrollTo({
                    top: chatMessages.scrollHeight,
                    behavior: 'smooth'
                });
            });
            
            // Prevent page scroll
            event?.preventDefault?.();
            
            // Stop propagation to prevent website scroll
            event?.stopPropagation?.();
        }
    }

    // Add new method to handle scroll containment
    setupScrollContainment() {
        const chatMessages = this.widget.querySelector('.chat-messages');
        if (!chatMessages) return;
        
        // Prevent scroll propagation
        chatMessages.addEventListener('wheel', (e) => {
            const isScrollable = chatMessages.scrollHeight > chatMessages.clientHeight;
            if (!isScrollable) return;
            
            e.stopPropagation();
            
            // Check if trying to scroll past boundaries
            const isScrollingUp = e.deltaY < 0;
            const isScrollingDown = e.deltaY > 0;
            const isAtTop = chatMessages.scrollTop === 0;
            const isAtBottom = chatMessages.scrollTop + chatMessages.clientHeight >= chatMessages.scrollHeight;
            
            if ((isScrollingUp && isAtTop) || (isScrollingDown && isAtBottom)) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Handle touch events
        let touchStartY = 0;
        chatMessages.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
        }, { passive: true });
        
        chatMessages.addEventListener('touchmove', (e) => {
            const touchY = e.touches[0].clientY;
            const isScrollingUp = touchY > touchStartY;
            const isAtTop = chatMessages.scrollTop <= 0;
            const isAtBottom = chatMessages.scrollTop + chatMessages.clientHeight >= chatMessages.scrollHeight;
            
            if ((isScrollingUp && isAtTop) || (!isScrollingUp && isAtBottom)) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    deleteBackendHistory() {
        const userId = this.userManager.currentUser;
        const domain = this.userManager.domain;
        
        return fetch(this.config.deleteEndpoint, {
            method: 'DELETE',
            headers: {
                ...this.config.apiHeaders,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: userId,
                domain: domain
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        });
    }

    // Add new method to scroll to typing indicator
    scrollToTypingIndicator() {
        const chatMessages = this.widget.querySelector('.chat-messages');
        const typingIndicator = this.widget.querySelector('.typing-indicator');
        
        if (chatMessages && typingIndicator) {
            requestAnimationFrame(() => {
                const scrollOptions = {
                    top: chatMessages.scrollHeight,
                    behavior: 'smooth'
                };
                
                chatMessages.scrollTo(scrollOptions);
                
                // Ensure indicator is visible even with new messages
                typingIndicator.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'end' 
                });
            });
        }
    }

    // Add method to update font size dynamically
    updateFontSize(newSize) {
        this.config.fontSize = newSize;
        document.documentElement.style.setProperty('--chat-message-font-size', newSize);
    }

    setupMessageActions(container, originalText) {
        const copyBtn = container.querySelector('.copy-btn');
        const likeBtn = container.querySelector('.like-btn');
        const dislikeBtn = container.querySelector('.dislike-btn');
        const regenerateBtn = container.querySelector('.regenerate-btn');
        const messageDiv = container.querySelector('.bot-message');

        // Copy button with check mark only
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(messageDiv.textContent).then(() => {
                copyBtn.classList.add('copied');
                copyBtn.innerHTML = `
                    <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3E%3Cpath d='M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z'/%3E%3C/svg%3E" alt="✓">
                `;
                setTimeout(() => {
                    copyBtn.classList.remove('copied');
                    copyBtn.innerHTML = `
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3E%3Cpath d='M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z'/%3E%3C/svg%3E" alt="Copy">
                    `;
                }, 2000);
            });
        });

        // Updated like button with toggle functionality
        likeBtn.addEventListener('click', () => {
            const isCurrentlyLiked = likeBtn.classList.contains('active');
            
            // Remove active state from both buttons first
            likeBtn.classList.remove('active');
            dislikeBtn.classList.remove('active');
            
            if (!isCurrentlyLiked) {
                likeBtn.classList.add('active');
                this.sendFeedback('like', originalText);
            } else {
                this.sendFeedback('remove', originalText);
            }
        });

        // Updated dislike button with toggle functionality
        dislikeBtn.addEventListener('click', () => {
            const isCurrentlyDisliked = dislikeBtn.classList.contains('active');
            
            // Remove active state from both buttons first
            likeBtn.classList.remove('active');
            dislikeBtn.classList.remove('active');
            
            if (!isCurrentlyDisliked) {
                dislikeBtn.classList.add('active');
                this.sendFeedback('dislike', originalText);
            } else {
                this.sendFeedback('remove', originalText);
            }
        });

        // Updated regenerate button handler
        regenerateBtn.addEventListener('click', async () => {
            if (!this.isWaitingForResponse) {
                // Find the last user message and its corresponding bot response
                const messageRows = Array.from(this.widget.querySelectorAll('.message-row'));
                const currentMessageIndex = messageRows.findIndex(row => row.contains(container));
                let userMessage = '';
                let lastUserMessageIndex = -1;
                
                // Search backwards from current message to find the last user message
                for (let i = currentMessageIndex - 1; i >= 0; i--) {
                    const userMessageElement = messageRows[i].querySelector('.user-message');
                    if (userMessageElement) {
                        userMessage = userMessageElement.textContent;
                        lastUserMessageIndex = i;
                        break;
                    }
                }
                
                if (userMessage && lastUserMessageIndex !== -1) {
                    // Remove all messages after the user message
                    for (let i = messageRows.length - 1; i > lastUserMessageIndex; i--) {
                        messageRows[i].remove();
                    }

                    // Update storage to remove deleted messages and mark as regenerated
                    await this.updateStorageAfterRegeneration(lastUserMessageIndex, userMessage);

                    // Send the message again
                    await this.sendMessage(userMessage, true);
                }
            }
        });
    }

    updateLastBotMessage() {
        const botMessages = this.widget.querySelectorAll('.bot-message-container');
        botMessages.forEach((container, index) => {
            container.classList.remove('last');
            if (index === botMessages.length - 1) {
                container.classList.add('last');
            }
        });
    }

    // Add new method to update storage after regeneration
    async updateStorageAfterRegeneration(lastUserMessageIndex, userMessage) {
        const historyKey = this.userManager.getHistoryKey();
        let chatHistory = this.storageManager.getChatHistory();
        
        // Find the corresponding index in the storage
        let storageIndex = -1;
        let userMessageCount = -1;
        
        for (let i = 0; i < chatHistory.length; i++) {
            if (chatHistory[i].sender === 'user') {
                userMessageCount++;
                if (userMessageCount === lastUserMessageIndex) {
                    storageIndex = i;
                    break;
                }
            }
        }

        if (storageIndex !== -1) {
            // Keep only messages up to the user message
            chatHistory = chatHistory.slice(0, storageIndex + 1);
            
            // Add regeneration marker
            chatHistory[storageIndex].regenerated = true;
            
            // Save updated history
            localStorage.setItem(historyKey, JSON.stringify(chatHistory));
        }
    }

    // Updated method to handle storage cleanup and regeneration marking
    async updateStorageAfterRegeneration(lastUserMessageIndex, userMessage) {
        const historyKey = this.userManager.getHistoryKey();
        let chatHistory = this.storageManager.getChatHistory();
        
        // Find the corresponding index in the storage
        let storageIndex = -1;
        let userMessageCount = -1;
        
        for (let i = 0; i < chatHistory.length; i++) {
            if (chatHistory[i].sender === 'user') {
                userMessageCount++;
                if (userMessageCount === lastUserMessageIndex) {
                    storageIndex = i;
                    break;
                }
            }
        }

        if (storageIndex !== -1) {
            // Keep only messages up to the user message
            chatHistory = chatHistory.slice(0, storageIndex + 1);
            
            // Add regeneration marker
            chatHistory[storageIndex].regenerated = true;
            
            // Save updated history
            localStorage.setItem(historyKey, JSON.stringify(chatHistory));
        }
    }

    // Updated sendFeedback method
    async sendFeedback(type, response) {
        try {
            const feedback = {
                type: type, // 'like', 'dislike', or 'remove'
                response: response,
                feedback: null,
                timestamp: new Date().toISOString(),
                userId: this.userManager.currentUser,
                domain: this.userManager.domain
            };

            const res = await fetch(this.config.feedbackEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.config.apiHeaders
                },
                body: JSON.stringify(feedback)
            });

            if (!res.ok) {
                throw new Error('Failed to send feedback');
            }

            // Save feedback state in local storage
            this.saveFeedbackState(response, type);

        } catch (error) {
            console.error('Error sending feedback:', error);
        }
    }

    // Add new method to save feedback state
    saveFeedbackState(response, type) {
        const feedbackKey = `feedback_${this.userManager.currentUser}`;
        let feedbackState = JSON.parse(localStorage.getItem(feedbackKey) || '{}');
        
        if (type === 'remove') {
            delete feedbackState[response];
        } else {
            feedbackState[response] = type;
        }
        
        localStorage.setItem(feedbackKey, JSON.stringify(feedbackState));
    }

    // Add new method to restore feedback state
    restoreFeedbackState(container, response) {
        const feedbackKey = `feedback_${this.userManager.currentUser}`;
        const feedbackState = JSON.parse(localStorage.getItem(feedbackKey) || '{}');
        const state = feedbackState[response];
        
        if (state) {
            const likeBtn = container.querySelector('.like-btn');
            const dislikeBtn = container.querySelector('.dislike-btn');
            
            if (state === 'like') {
                likeBtn.classList.add('active');
                dislikeBtn.classList.remove('active');
            } else if (state === 'dislike') {
                dislikeBtn.classList.add('active');
                likeBtn.classList.remove('active');
            }
        }
    }

    // Add new method to check for trigger words
    checkForTriggerWords(message) {
        if (!this.config.hubspot?.enabled) return false;
        if (this.userManager.hasSubmittedForm()) return false;
        if (this.isFormActive()) return false; // Don't show form if one is already active
        
        const words = message.toLowerCase().split(/\s+/);
        return this.config.hubspot.triggerKeywords.some(trigger => 
            words.includes(trigger.toLowerCase())
        );
    }

    // Add new method to check if form is already showing
    isFormActive() {
        return !!this.activeForm || !!this.widget.querySelector('.hubspot-form-container');
    }

    // Add method to create and show HubSpot form
    showHubSpotForm() {
        if (!this.config.hubspot?.enabled) return;
        if (this.userManager.hasSubmittedForm()) return;
        if (this.isFormActive()) return; // Prevent multiple forms

        // Disable chat functionality
        this.disableChatFunctionality();

        // Remove any existing forms first (cleanup)
        const existingForms = this.widget.querySelectorAll('.hubspot-form-row');
        existingForms.forEach(form => form.remove());

        const formHtml = `
            <div class="hubspot-form-container" style="opacity: 0; transform: translateY(20px);">
                <div class="form-header">
                    <h3>Contact Us</h3>
                    <p>Please fill out the form below and we'll get back to you shortly.</p>
                </div>
                <form id="hubspotForm" class="hubspot-form">
                    <div class="form-group">
                        <label for="fullname">Full Name *</label>
                        <input type="text" id="fullname" name="fullname" required 
                               placeholder="Enter your full name">
                        <div id="fullname-error" class="error-message"></div>
                    </div>
                    <div class="form-group">
                        <label for="email">Email Address *</label>
                        <input type="email" id="email" name="email" required 
                               placeholder="Enter your email">
                        <div id="email-error" class="error-message"></div>
                    </div>
                    <div class="form-group">
                        <label for="phone">Phone Number *</label>
                        <input type="tel" id="phone" name="phone" required 
                               placeholder="Enter your phone number">
                        <div id="phone-error" class="error-message"></div>
                    </div>
                    <button type="submit" id="submitButton">Submit</button>
                </form>
            </div>
        `;

        const messageRow = document.createElement('div');
        messageRow.className = 'message-row hubspot-form-row';
        messageRow.innerHTML = formHtml;
        
        const chatMessages = this.widget.querySelector('.chat-messages');
        const typingIndicator = this.widget.querySelector('.typing-indicator');
        chatMessages.insertBefore(messageRow, typingIndicator);

        // Store reference to active form
        this.activeForm = messageRow;

        // Add enhanced form styles
        const formStyles = document.createElement('style');
        formStyles.textContent = `
            .hubspot-form-container {
                background: #fff;
                padding: 20px;
                border-radius: 12px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                margin: 15px 0;
                max-width: 100%;
                border: 1px solid #e4e6eb;
            }
            
            .form-header {
                margin-bottom: 20px;
                text-align: center;
            }
            
            .form-header h3 {
                margin: 0 0 8px 0;
                color: #333;
                font-size: 18px;
            }
            
            .form-header p {
                margin: 0;
                color: #666;
                font-size: 14px;
            }
            
            .hubspot-form .form-group {
                margin-bottom: 20px;
            }
            
            .hubspot-form label {
                display: block;
                margin-bottom: 8px;
                font-weight: 500;
                color: #333;
                font-size: 14px;
            }
            
            .hubspot-form input {
                width: 100%;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 6px;
                font-size: 14px;
                transition: border-color 0.3s ease;
            }
            
            .hubspot-form input:focus {
                outline: none;
                border-color: var(--chat-primary-color);
                box-shadow: 0 0 0 2px rgba(var(--chat-primary-color-rgb), 0.1);
            }
            
            .hubspot-form input::placeholder {
                color: #999;
            }
            
            .hubspot-form .error-message {
                color: #dc3545;
                font-size: 12px;
                margin-top: 4px;
                min-height: 20px;
            }
            
            .hubspot-form button {
                background: var(--chat-primary-color);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 16px;
                font-weight: 500;
                width: 100%;
                transition: all 0.3s ease;
            }
            
            .hubspot-form button:hover {
                opacity: 0.9;
                transform: translateY(-1px);
            }
            
            .hubspot-form button:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                transform: none;
            }
            
            .hubspot-form-success {
                text-align: center;
                padding: 20px;
                background: #d4edda;
                border-radius: 8px;
                color: #155724;
                margin: 10px 0;
            }
        `;
        document.head.appendChild(formStyles);

        // Animate form entrance
        requestAnimationFrame(() => {
            const formContainer = messageRow.querySelector('.hubspot-form-container');
            formContainer.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            formContainer.style.opacity = '1';
            formContainer.style.transform = 'translateY(0)';
        });

        // Scroll to form with smooth animation
        setTimeout(() => {
            messageRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);

        // Setup form handlers
        const form = messageRow.querySelector('#hubspotForm');
        this.setupHubSpotFormHandlers(form);
    }

    // Add form validation and submission handlers
    setupHubSpotFormHandlers(form) {
        const validateFullName = (fullname) => {
            const nameRegex = /^[A-Za-z]+\s+[A-Za-z]+(\s+[A-Za-z]+)?$/;
            return nameRegex.test(fullname.trim());
        };

        const validateEmail = (email) => {
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            return emailRegex.test(email.trim());
        };

        const validatePhoneNumber = (phone) => {
            const cleanedPhone = phone.replace(/\D/g, '');
            return cleanedPhone.length >= 7 && cleanedPhone.length <= 20;
        };

        // Real-time validation
        form.querySelector('#fullname').addEventListener('input', function() {
            const error = form.querySelector('#fullname-error');
            error.textContent = validateFullName(this.value) ? '' : 'Please enter your full name';
        });

        form.querySelector('#email').addEventListener('input', function() {
            const error = form.querySelector('#email-error');
            error.textContent = validateEmail(this.value) ? '' : 'Please enter a valid email';
        });

        form.querySelector('#phone').addEventListener('input', function() {
            const error = form.querySelector('#phone-error');
            error.textContent = validatePhoneNumber(this.value) ? '' : 'Please enter a valid phone number';
        });

        // Form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitButton = form.querySelector('#submitButton');
            submitButton.disabled = true;
            submitButton.textContent = 'Submitting...';

            const fullname = form.querySelector('#fullname').value;
            const email = form.querySelector('#email').value;
            const phone = form.querySelector('#phone').value;

            // Validate all fields
            if (!validateFullName(fullname) || !validateEmail(email) || !validatePhoneNumber(phone)) {
                submitButton.disabled = false;
                submitButton.textContent = 'Submit';
                return;
            }

            try {
                const response = await this.submitToHubSpot({
                    firstName: fullname.split(' ')[0],
                    lastName: fullname.split(' ').slice(1).join(' '),
                    email,
                    phone: phone.replace(/\D/g, '')
                });

                if (response.ok) {
                    // Record successful submission
                    this.userManager.recordFormSubmission({
                        firstName: fullname.split(' ')[0],
                        lastName: fullname.split(' ').slice(1).join(' '),
                        email,
                        phone: phone.replace(/\D/g, '')
                    });
                    
                    // Clear active form reference after successful submission
                    this.activeForm = null;
                    
                    // Show success message and cleanup
                    const formContainer = this.widget.querySelector('.hubspot-form-container');
                    if (formContainer) {
                        formContainer.style.transition = 'opacity 0.3s ease';
                        formContainer.style.opacity = '0';
                        
                        setTimeout(() => {
                            formContainer.innerHTML = `
                                <div class="hubspot-form-success" style="opacity: 0; transform: translateY(10px)">
                                    <h3>Thank you for your submission!</h3>
                                    <p>We'll get back to you shortly.</p>
                                </div>
                            `;
                            
                            requestAnimationFrame(() => {
                                const successMessage = formContainer.querySelector('.hubspot-form-success');
                                successMessage.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                                successMessage.style.opacity = '1';
                                successMessage.style.transform = 'translateY(0)';
                            });
                        }, 300);

                        // Re-enable chat and cleanup
                        setTimeout(() => {
                            this.enableChatFunctionality();
                            
                            setTimeout(() => {
                                const messageRow = formContainer.closest('.message-row');
                                if (messageRow) {
                                    messageRow.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                                    messageRow.style.opacity = '0';
                                    messageRow.style.transform = 'translateY(-20px)';
                                    
                                    setTimeout(() => {
                                        messageRow.remove();
                                        this.activeForm = null; // Ensure form reference is cleared
                                    }, 300);
                                }
                            }, 2000);
                        }, 1000);
                    }
                } else {
                    throw new Error('Submission failed');
                }
            } catch (error) {
                console.error('HubSpot submission error:', error);
                submitButton.textContent = 'Error - Try Again';
                submitButton.disabled = false;
                
                // Show error message
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.textContent = 'Failed to submit form. Please try again.';
                form.appendChild(errorDiv);
            }
        });
    }

    // Add method to submit to HubSpot
    async submitToHubSpot(data) {
        const { portalId, formGuid } = this.config.hubspot;
        const url = `https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${formGuid}`;

        const formData = {
            submittedAt: Date.now(),
            fields: [
                { name: 'firstname', value: data.firstName },
                { name: 'lastname', value: data.lastName },
                { name: 'email', value: data.email },
                { name: 'phone', value: data.phone }
            ],
            context: {
                pageUri: window.location.href,
                pageName: document.title
            }
        };

        return fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
    }

    disableChatFunctionality() {
        const chatInput = this.widget.querySelector('.chat-input input');
        const sendButton = this.widget.querySelector('.send-button');
        const chips = this.widget.querySelectorAll('.chip');

        chatInput.disabled = true;
        sendButton.disabled = true;
        chips.forEach(chip => {
            chip.style.opacity = '0.5';
            chip.style.pointerEvents = 'none';
        });

        // Add visual feedback
        const inputContainer = chatInput.closest('.chat-input-container');
        inputContainer.classList.add('disabled');
    }

    enableChatFunctionality() {
        const chatInput = this.widget.querySelector('.chat-input input');
        const sendButton = this.widget.querySelector('.send-button');
        const chips = this.widget.querySelectorAll('.chip');

        // Animate the transition
        const elements = [chatInput, sendButton, ...chips];
        elements.forEach((el, index) => {
            setTimeout(() => {
                el.disabled = false;
                el.style.opacity = '1';
                el.style.pointerEvents = 'auto';
            }, index * 100);
        });

        const inputContainer = chatInput.closest('.chat-input-container');
        inputContainer.classList.remove('disabled');
    }

    // Add cleanup method for form removal
    removeActiveForm() {
        if (this.activeForm) {
            this.activeForm.remove();
            this.activeForm = null;
            this.enableChatFunctionality();
        }
    }
}

class ChatUserManager {
    constructor(config) {
        this.config = config;
        this.domain = this.getCurrentDomain();
        this.path = this.getCurrentPath();
        this.currentUser = this.generateUserId();
        this.initializeUser();
        
        // Add new property to track form submissions
        this.formSubmissionsKey = `chatFormSubmissions_${this.domain}`;
        this.initializeFormSubmissions();
    }

    getCurrentDomain() {
        return window.location.hostname;
    }

    getCurrentPath() {
        return window.location.pathname;
    }

    generateUserId() {
        const storageKey = this.config.separateSubpageHistory 
            ? `currentChatUser_${this.domain}${this.path}`
            : `currentChatUser_${this.domain}`;
        
        const storedId = localStorage.getItem(storageKey);
        
        if (!storedId) {
            const newId = `user_${this.domain}${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            localStorage.setItem(storageKey, newId);
            return newId;
        }
        return storedId;
    }

    getHistoryKey() {
        return this.config.separateSubpageHistory 
            ? `chatHistory_${this.domain}${this.path}`
            : `chatHistory_${this.domain}`;
    }

    initializeUser() {
        const historyKey = this.getHistoryKey();
        if (!localStorage.getItem(historyKey)) {
            localStorage.setItem(historyKey, JSON.stringify([]));
        }
    }

    // Add new method to initialize form submissions storage
    initializeFormSubmissions() {
        if (!localStorage.getItem(this.formSubmissionsKey)) {
            localStorage.setItem(this.formSubmissionsKey, JSON.stringify([]));
        }
    }

    // Add method to check if user has submitted form
    hasSubmittedForm() {
        const submissions = JSON.parse(localStorage.getItem(this.formSubmissionsKey) || '[]');
        return submissions.includes(this.currentUser);
    }

    // Add method to record form submission
    recordFormSubmission(formData) {
        const submissions = JSON.parse(localStorage.getItem(this.formSubmissionsKey) || '[]');
        if (!submissions.includes(this.currentUser)) {
            submissions.push(this.currentUser);
            localStorage.setItem(this.formSubmissionsKey, JSON.stringify(submissions));
            
            // Store the form data
            const formDataKey = `chatFormData_${this.currentUser}`;
            localStorage.setItem(formDataKey, JSON.stringify({
                ...formData,
                submittedAt: new Date().toISOString()
            }));
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
    constructor(userManager, config) {
        this.userManager = userManager;
        this.config = config;
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
        
        if (this.config.separateSubpageHistory) {
            // Filter by both domain and path when separateSubpageHistory is true
            return parsedHistory.filter(item => 
                (!item.domain || item.domain === this.domain) && 
                (!item.path || item.path === this.path)
            );
        } else {
            // Filter by domain only when separateSubpageHistory is false
            return parsedHistory.filter(item => 
                (!item.domain || item.domain === this.domain)
            );
        }
    }

    saveMessage(message, sender, isRegenerated = false) {
        const historyKey = this.userManager.getHistoryKey();
        let chatHistory = this.getChatHistory();
        
        // If this is a regenerated bot response, remove the previous bot response
        if (isRegenerated && sender === 'bot') {
            // Find the last user message
            const lastUserIndex = chatHistory.findLastIndex(msg => msg.sender === 'user');
            if (lastUserIndex !== -1) {
                // Remove all messages after the last user message
                chatHistory = chatHistory.slice(0, lastUserIndex + 1);
            }
        }

        const messageData = {
            message: message,
            sender: sender,
            timestamp: new Date().toISOString(),
            domain: this.domain,
            isRegenerated: isRegenerated
        };

        if (this.config.separateSubpageHistory) {
            messageData.path = this.path;
        }

        chatHistory.push(messageData);

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
        try {
            localStorage.removeItem(historyKey);
            localStorage.setItem(historyKey, JSON.stringify([]));
            console.log('Local storage cleared successfully');
        } catch (error) {
            console.error('Error clearing local storage:', error);
        }
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

const togglePositions = {
    'bottom-right': {
        toggle: {
            bottom: '20px',
            right: '20px',
            left: 'auto',
            transform: 'none'
        },
        window: {
            bottom: '100px',
            right: '20px',
            left: 'auto',
            transform: 'none'
        }
    },
    'bottom-left': {
        toggle: {
            bottom: '20px',
            left: '20px',
            right: 'auto',
            transform: 'none'
        },
        window: {
            bottom: '100px',
            left: '20px',
            right: 'auto',
            transform: 'none'
        }
    },
    'bottom-center': {
        toggle: {
            bottom: '20px',
            left: '50%',
            right: 'auto',
            transform: 'translateX(-50%)'
        },
        window: {
            bottom: '100px',
            left: '50%',
            right: 'auto',
            transform: 'translateX(-50%)'
        }
    }
};

// Add to your existing styles
const additionalMobileStyles = `
    @media screen and (max-width: 480px) {
        .chat-input {
            position: relative;
            z-index: 1000;
        }
        
        .chat-input input {
            font-size: 16px !important;
            -webkit-appearance: none;
            border-radius: 8px;
            padding: 12px;
            margin: 0;
            width: 100%;
            box-sizing: border-box;
            border: 1px solid rgba(0,0,0,0.1);
            background-color: #ffffff !important;
            opacity: 1 !important;
            pointer-events: auto !important;
        }

        .chat-input input::placeholder {
            user-select: none;
            -webkit-user-select: none;
            pointer-events: none; /* Prevent the placeholder from blocking input focus */
        }
        
        .chat-window.active .chat-input {
            position: sticky;
            bottom: 0;
            background-color: #ffffff;
            padding: 10px;
            margin: 0;
            z-index: 1000;
        }
    }
`;

// Add these styles to your document
const style = document.createElement('style');
style.textContent = additionalMobileStyles;
document.head.appendChild(style);

