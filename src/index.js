/* jshint esversion: 11, asi: true */
// EasyChatWidget.js
class EasyChatWidget {
    constructor(config = {}) {
        this.isWaitingForResponse = false;
        this.initConfig(config);
        this.userManager = new ChatUserManager(this.config);
        this.storageManager = new ChatStorageManager(this.userManager, this.config);
        
        // Parlant state management
        if (this.config.parlant.enabled) {
            // Load Parlant session ID from localStorage if exists
            const parlantSessionKey = this.config.separateSubpageHistory 
                ? `parlantSessionId_${this.userManager.domain}${this.userManager.path}`
                : `parlantSessionId_${this.userManager.domain}`;
            this.parlantSessionId = localStorage.getItem(parlantSessionKey) || null;
            
            this.parlantAgentId = null;
            this.parlantLastEventOffset = -1;
            this.parlantPollingInterval = null;
            this.parlantProcessedMessageOffsets = new Set();
            this.parlantWaitingForResponse = false;
            this.parlantIsFirstAgentMessageInSequence = true;
            this.parlantAgentReadyStatusReceived = false;
            this.parlantReadyStatusGracePeriodTimer = null;
            this.parlantConnectionCheckInterval = null;
            this.parlantCurrentQueryId = null; // Track current query for grouping responses
            this.parlantQueryResponses = new Map(); // Map queryId -> array of response messages
            this.parlantTypingIndicatorState = 'thinking'; // 'thinking', 'fetching', 'typing'
            this.parlantTypingIndicatorTimeout = null; // Timeout for delayed typing indicator
        }
        
        this.ensureDependencies().then(() => {
            this.initializeWidget();
            this.setupEventListeners();
            this.storageManager.setWidget(this);
            this.loadChatHistory();
            this.setupEraseButton();
            
            // Initialize Parlant if enabled
            if (this.config.parlant.enabled) {
                this.initializeParlant();
            }
        });
        this.activeForm = null; // Add this to track active form
        
        // Register instance for cleanup
        if (typeof window !== 'undefined') {
            if (!window.chatWidgetInstances) {
                window.chatWidgetInstances = [];
            }
            window.chatWidgetInstances.push(this);
        }
        // Validate position
        if (!togglePositions[this.config.position]) {
            console.warn(`Invalid position "${this.config.position}". Falling back to bottom-right.`);
            this.config.position = 'bottom-right';
        }
    }

    // Helper function to convert hex color to RGB or handle gradients
    hexToRgb(color) {
        if (!color) return '0, 132, 255'; // Default blue
        
        // Check if it's a gradient
        if (color.includes('linear-gradient') || color.includes('radial-gradient')) {
            // For gradients, extract the first color for RGB purposes
            const colorMatch = color.match(/#[a-fA-F0-9]{6}|#[a-fA-F0-9]{3}/);
            if (colorMatch) {
                const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(colorMatch[0]);
                return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0, 132, 255';
            }
            return '0, 132, 255';
        }
        
        // Handle regular hex color
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
        return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0, 132, 255';
    }

    // Helper function to check if color is a gradient
    isGradient(color) {
        return color && (color.includes('linear-gradient') || color.includes('radial-gradient'));
    }

    // Theme detection and application
    getCurrentTheme() {
        if (this.config.theme === 'system') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return this.config.theme;
    }

    getThemeColor(type) {
        const theme = this.getCurrentTheme();
        
        const colors = {
            light: {
                bg: '#ffffff',
                text: '#333333',
                border: '#e1e5e9',
                inputBg: '#ffffff',
                messageBg: '#ffffff',
                headerBg: '#ffffff',
                headerText: '#333333'
            },
            dark: {
                bg: '#1a1a1a',
                text: '#ffffff',
                border: '#404040',
                inputBg: '#2d2d2d',
                messageBg: '#2d2d2d',
                headerBg: '#2d2d2d',
                headerText: '#ffffff'
            }
        };
        
        return colors[theme]?.[type] || colors.light[type];
    }

    applyTheme() {
        const theme = this.getCurrentTheme();
        if (this.widget) {
            const classes = new Set(this.widget.className.split(/\s+/).filter(Boolean));
            [...classes].forEach((name) => {
                if (name.endsWith('-theme')) {
                    classes.delete(name);
                }
            });
            classes.add('chat-widget');
            classes.add(`${theme}-theme`);
            if (this.config.parlant.enabled) {
                classes.add('parlant-mode');
            } else {
                classes.delete('parlant-mode');
            }
            this.widget.className = Array.from(classes).join(' ');
        }
        
        // Listen for system theme changes if using 'system' theme
        if (this.config.theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', () => {
                this.loadStyles();
            });
        }
    }
    
    generateAiAvatar() {
        if (!this.config.showAiAvatar) return '';
        
        const avatar = this.config.aiAvatar;
        
        if (!avatar) {
            // Default AI avatar
            return `
                <div class="ai-avatar">
                    <div class="ai-avatar-icon">🤖</div>
                    <div class="ai-name">${this.config.botName}</div>
                </div>
            `;
        }
        
        // Enhanced emoji detection - support Unicode emoji sequences
        if (this.isEmoji(avatar)) {
            return `
                <div class="ai-avatar">
                    <div class="ai-avatar-icon emoji-avatar">${avatar}</div>
                    <div class="ai-name">${this.config.botName}</div>
                </div>
            `;
        }
        
        // Enhanced URL detection - support various protocols and formats
        if (this.isImageUrl(avatar)) {
            return `
                <div class="ai-avatar">
                    <div class="ai-avatar-icon image-avatar">
                        <img src="${avatar}" alt="${this.config.botName}" 
                             onerror="this.style.display='none'; this.parentNode.innerHTML='🤖';" 
                             onload="this.style.display='block';" />
                    </div>
                    <div class="ai-name">${this.config.botName}</div>
                </div>
            `;
        }
        
        // Enhanced SVG detection and handling
        if (this.isSvg(avatar)) {
            return `
                <div class="ai-avatar">
                    <div class="ai-avatar-icon svg-avatar">
                        ${this.sanitizeSvg(avatar)}
                    </div>
                    <div class="ai-name">${this.config.botName}</div>
                </div>
            `;
        }
        
        // Try as plain text/character - could be special character or icon font
        if (avatar.length <= 10) {
            return `
                <div class="ai-avatar">
                    <div class="ai-avatar-icon text-avatar">${avatar}</div>
                    <div class="ai-name">${this.config.botName}</div>
                </div>
            `;
        }
        
        // Fallback to default
        return `
            <div class="ai-avatar">
                <div class="ai-avatar-icon">🤖</div>
                <div class="ai-name">${this.config.botName}</div>
            </div>
        `;
    }

    // Enhanced emoji detection
    isEmoji(str) {
        if (!str || str.length > 20) return false;
        
        // Unicode emoji ranges and patterns
        const emojiRegex = /^[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]|[\u{238C}-\u{2454}]|[\u{20D0}-\u{20FF}]|[\u{FE0F}]|[\u{200D}]|[\u{E0020}-\u{E007F}]/u;
        
        // Additional check for emoji sequences (like skin tone modifiers, zero-width joiners)
        const hasEmojiSequence = /[\u{1F3FB}-\u{1F3FF}]|[\u{200D}]|[\u{FE0F}]/u.test(str);
        
        return emojiRegex.test(str) || hasEmojiSequence || /\p{Emoji}/u.test(str);
    }

    // Enhanced URL detection
    isImageUrl(str) {
        if (!str || typeof str !== 'string') return false;
        
        // Check for various protocols and formats
        const urlPatterns = [
            /^https?:\/\/.+\.(jpg|jpeg|png|gif|svg|webp|bmp|ico)(\?.*)?$/i,
            /^data:image\/.+;base64,/i,
            /^\/.*\.(jpg|jpeg|png|gif|svg|webp|bmp|ico)(\?.*)?$/i,
            /^\.\.?\/.*\.(jpg|jpeg|png|gif|svg|webp|bmp|ico)(\?.*)?$/i,
        ];
        
        return urlPatterns.some(pattern => pattern.test(str.trim())) || 
               str.startsWith('http') || 
               str.startsWith('data:image') || 
               str.startsWith('/') ||
               str.includes('://');
    }

    // Enhanced SVG detection
    isSvg(str) {
        if (!str || typeof str !== 'string') return false;
        
        const trimmed = str.trim();
        return trimmed.startsWith('<svg') && trimmed.includes('</svg>');
    }

    // SVG sanitization for security
    sanitizeSvg(svg) {
        // Basic sanitization - remove dangerous attributes and scripts
        let sanitized = svg
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/on\w+="[^"]*"/gi, '')
            .replace(/on\w+='[^']*'/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/vbscript:/gi, '')
            .replace(/data:/gi, '');
        
        // Ensure viewBox is set for proper scaling
        if (!sanitized.includes('viewBox') && sanitized.includes('<svg')) {
            sanitized = sanitized.replace('<svg', '<svg viewBox="0 0 24 24"');
        }
        
        return sanitized;
    }

    generateGreetingAvatar() {
        // Always generate avatar for greeting message (ignore showAiAvatar setting)
        const avatar = this.config.aiAvatar;
        
        if (!avatar) {
            // Default AI avatar
            return `
                <div class="ai-avatar">
                    <div class="ai-avatar-icon">🤖</div>
                    <div class="ai-name">${this.config.botName}</div>
                </div>
            `;
        }
        
        // Use enhanced detection methods
        if (this.isEmoji(avatar)) {
            return `
                <div class="ai-avatar">
                    <div class="ai-avatar-icon emoji-avatar">${avatar}</div>
                    <div class="ai-name">${this.config.botName}</div>
                </div>
            `;
        }
        
        if (this.isImageUrl(avatar)) {
            return `
                <div class="ai-avatar">
                    <div class="ai-avatar-icon image-avatar">
                        <img src="${avatar}" alt="${this.config.botName}"
                             onerror="this.style.display='none'; this.parentNode.innerHTML='🤖';" 
                             onload="this.style.display='block';" />
                    </div>
                    <div class="ai-name">${this.config.botName}</div>
                </div>
            `;
        }
        
        if (this.isSvg(avatar)) {
            return `
                <div class="ai-avatar">
                    <div class="ai-avatar-icon svg-avatar">
                        ${this.sanitizeSvg(avatar)}
                    </div>
                    <div class="ai-name">${this.config.botName}</div>
                </div>
            `;
        }
        
        // Try as plain text/character
        if (avatar.length <= 10) {
            return `
                <div class="ai-avatar">
                    <div class="ai-avatar-icon text-avatar">${avatar}</div>
                    <div class="ai-name">${this.config.botName}</div>
                </div>
            `;
        }
        
        // Fallback to default
        return `
            <div class="ai-avatar">
                <div class="ai-avatar-icon">🤖</div>
                <div class="ai-name">${this.config.botName}</div>
            </div>
        `;
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
            
            // If endpoint doesn't start with http, assume http
            if (!endpoint.startsWith('http')) {
                return `http://${endpoint}`;
            }
            
            return endpoint;
        };

        this.config = {
            botName: config.botName || 'Chat Assistant',
            botImage: config.botImage || 'https://cdn-icons-png.flaticon.com/512/1786/1786548.png',
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
            typewritewithscroll: config.typewritewithscroll !== undefined ? config.typewritewithscroll : false, // When true: typewriter with scrolling, when false: typewriter without scrolling
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
            enableServerHistoryDelete: config.enableServerHistoryDelete !== undefined ? config.enableServerHistoryDelete : false, // New option to control backend history deletion
            // New configuration options for file upload and delete buttons
            enableFileUpload: config.enableFileUpload !== false, // Default to true
            enableDeleteButton: config.enableDeleteButton !== false, // Default to true
            // API configuration for proper multipart handling
            useMultipartFormData: config.useMultipartFormData !== false, // Default to true for file uploads
            apiDataFormat: config.apiDataFormat || 'json', // 'json' or 'form-data'
            // Typing indicator configuration
            typingIndicatorColor: config.typingIndicatorColor || '#666', // Color for typing indicator dots
            showTypingText: false, // Disable "AI is thinking..." text for cleaner look
            
            // Toggle button customization
            toggleButtonIcon: config.toggleButtonIcon || null, // Custom icon for toggle button (emoji, image URL, or SVG)
            
            // Chat background customization
            chatBackgroundImage: config.chatBackgroundImage || null, // Custom background image for chat messages section
            chatBackgroundColor: config.chatBackgroundColor || '#ffffff', // Custom background color for chat messages section (default: white)
            
            // Send button customization
            sendButtonIconSize: config.sendButtonIconSize || 24, // Size of send button icon in pixels (default: 24px)
            
            // Mobile input handling
            enableEnhancedMobileInput: config.enableEnhancedMobileInput !== false, // Enhanced mobile input handling (default: true)
            
            // AI Avatar customization
            aiAvatar: config.aiAvatar || null, // AI avatar (emoji, image URL, or SVG) for bot messages
            showAiAvatar: config.showAiAvatar !== false, // Show AI avatar in bot messages (default: true)
            botSubname: config.botSubname || null, // Subname or descriptive text for the bot (displayed under bot name)
            showBotSubname: config.showBotSubname !== false, // Show bot subname (default: true)
            
                        // HubSpot form configuration
            showFormOnStart: config.showFormOnStart !== false, // Show form when chat opens (default: true)
            useEmailAsUserId: config.useEmailAsUserId !== false, // Use email as user ID (default: true)
            
            // Form text customization
            formTitle: config.formTitle || 'Give Your Details', // Form title text
            formSubtitle: config.formSubtitle || 'Please provide your information to start chatting.', // Form subtitle text
            
            // Theme configuration
            theme: config.theme || 'light', // 'light', 'dark', or 'system'
            
            // Branding configuration
            showBranding: config.showBranding !== false, // Show branding section (default: true)
            brandingText: config.brandingText || 'Powered by NeuroBrain', // Branding text
            brandingUrl: config.brandingUrl || 'https://neurobrains.co/', // Branding link URL
            
            // Message actions configuration
            showMessageActions: config.showMessageActions !== false, // Show copy, like, dislike, regenerate buttons (default: true)
            
            // Text box configuration (floating message above toggle button)
            showTextBox: config.showTextBox !== false, // Show floating text box above toggle button (default: true)
            textBoxMessage: config.textBoxMessage || 'Hi there! If you need any assistance, I am always here.', // Main text message in the box
            textBoxSubMessage: config.textBoxSubMessage || '24/7 Live Chat Support', // Sub message in the box (appears after line separator)
            showTextBoxCloseButton: config.showTextBoxCloseButton !== false, // Show close button on text box (default: true)
            
            // Toggle button animation configuration
            toggleButtonAnimation: config.toggleButtonAnimation !== undefined ? Math.max(0, Math.min(5, parseInt(config.toggleButtonAnimation) || 0)) : 4, // Animation type: 0=none, 1=pulse, 2=bounce, 3=shake, 4=infinity(grow-shrink), 5=rotate
            
            // Toggle button size and positioning configuration  
            toggleButtonSize: config.toggleButtonSize ? Math.max(40, Math.min(80, parseInt(config.toggleButtonSize))) : 60, // Toggle button size in pixels (40px - 80px, default: 60px)
            toggleButtonBottomMargin: config.toggleButtonBottomMargin ? Math.max(10, Math.min(50, parseInt(config.toggleButtonBottomMargin))) : 50, // Bottom margin of toggle button in pixels (10px - 50px, default: 50px)
            toggleButtonRightMargin: config.toggleButtonRightMargin ? Math.max(10, Math.min(100, parseInt(config.toggleButtonRightMargin))) : 30, // Right margin of toggle button in pixels (10px - 100px, default: 30px)
            
            // Advanced spacing configuration for website integration
            websiteBottomSpacing: config.websiteBottomSpacing ? Math.max(0, Math.min(100, parseInt(config.websiteBottomSpacing))) : 0, // Additional bottom spacing for website integration (0px - 100px, default: 0px)
            textBoxSpacingFromToggle: config.textBoxSpacingFromToggle !== undefined ? Math.max(0, Math.min(30, parseInt(config.textBoxSpacingFromToggle))) : 0, // Spacing between text box and toggle button (0px - 30px, default: 0px for touching)
            
            // Text box text color configuration
            textBoxTextColor: config.textBoxTextColor || 'primary', // Text color for text box content ('primary' to use primary color, or any CSS color value)
            
            // Parlant configuration
            parlant: {
                enabled: config.parlant?.enabled || false,
                apiBaseUrl: config.parlant?.apiBaseUrl || ''
            }
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

    // ========== Parlant Integration Methods ==========
    
    // Initialize Parlant connection
    async initializeParlant() {
        if (!this.config.parlant.enabled || !this.config.parlant.apiBaseUrl) return;
        
        try {
            await this.checkParlantAPIConnection();
            // Try to get agent ID on load
            try {
                await this.parlantGetAgentId();
            } catch (error) {
                // Silent fail - agent ID will be fetched when needed
            }
        } catch (error) {
            // Silent fail - connection will be checked when needed
        }

    }

    // Check Parlant API connection
    async checkParlantAPIConnection() {
        if (!this.config.parlant.enabled || !this.config.parlant.apiBaseUrl) return false;
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(`${this.config.parlant.apiBaseUrl}/healthz`, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                return true;
            } else {
                throw new Error('Health check failed');
            }
        } catch (error) {
            return false;
        }
    }

    // Get Parlant agent ID
    async parlantGetAgentId() {
        if (this.parlantAgentId) {
            return this.parlantAgentId;
        }
        
        if (!this.config.parlant.apiBaseUrl) {
            throw new Error('Parlant API base URL is not configured');
        }
        
        try {
            const response = await fetch(`${this.config.parlant.apiBaseUrl}/agents`);
            if (response.ok) {
                const agents = await response.json();
                if (agents && agents.length > 0) {
                    this.parlantAgentId = agents[0].id;
                    return this.parlantAgentId;
                } else {
                    throw new Error('No agents found. Please create an agent first.');
                }
            } else {
                throw new Error(`Failed to fetch agents: ${response.status}`);
            }
        } catch (error) {
            throw error;
        }
    }

    // Create a Parlant session
    async parlantCreateSession() {
        if (this.parlantSessionId) {
            return this.parlantSessionId;
        }
        
        if (!this.config.parlant.apiBaseUrl) {
            throw new Error('Parlant API base URL is not configured');
        }
        
        try {
            const agentId = await this.parlantGetAgentId();
            
            const response = await fetch(`${this.config.parlant.apiBaseUrl}/sessions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    agent_id: agentId,
                    mode: 'auto' // Auto mode so agent responds automatically
                }),
            });
            
            if (response.ok) {
                const session = await response.json();
                this.parlantSessionId = session.id;
                return this.parlantSessionId;
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || errorData.message || `Failed to create session: ${response.status}`);
            }
        } catch (error) {
            throw error;
        }
    }

    // Send user message as Parlant event
    async parlantSendUserMessage(message) {
        if (!this.config.parlant.apiBaseUrl) {
            throw new Error('Parlant API base URL is not configured');
        }
        
        try {
            const sessionId = await this.parlantCreateSession();
            
            const response = await fetch(`${this.config.parlant.apiBaseUrl}/sessions/${sessionId}/events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    kind: 'message',
                    source: 'customer',
                    message: message
                }),
            });
            
            if (response.ok) {
                const event = await response.json();
                this.parlantLastEventOffset = event.offset;
                return event;
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || errorData.message || `Failed to send message: ${response.status}`);
            }
        } catch (error) {
            throw error;
        }
    }

    // Poll for Parlant agent responses
    async parlantPollForAgentResponse() {
        if (!this.parlantSessionId || !this.config.parlant.apiBaseUrl) {
            return;
        }
        
        try {
            const pollOffset = this.parlantLastEventOffset + 1;
            const response = await fetch(
                `${this.config.parlant.apiBaseUrl}/sessions/${this.parlantSessionId}/events?offset=${pollOffset}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
            
            if (response.ok) {
                const data = await response.json();
                const events = Array.isArray(data) ? data : (data.items || []);
                
                let receivedNewMessage = false;
                
                for (const event of events) {
                    // Skip events we've already processed
                    if (event.offset <= this.parlantLastEventOffset) {
                        continue;
                    }
                    
                    // Update offset to latest for all events
                    if (event.offset > this.parlantLastEventOffset) {
                        this.parlantLastEventOffset = event.offset;
                    }
                    
                    // Track all agent events
                    if (event.source === 'ai_agent') {
                        window.lastParlantAgentEventTime = Date.now();
                    }
                    
                    // Check for "ready" status - agent has finished responding
                    if (event.kind === 'status' && event.source === 'ai_agent' && 
                        event.data && event.data.status === 'ready') {
                        this.parlantAgentReadyStatusReceived = true;
                        
                        // Clear any existing grace period timer
                        if (this.parlantReadyStatusGracePeriodTimer) {
                            clearTimeout(this.parlantReadyStatusGracePeriodTimer);
                        }
                        
                        // Wait 3 seconds after ready status for any final messages
                        this.parlantReadyStatusGracePeriodTimer = setTimeout(() => {
                            if (this.parlantAgentReadyStatusReceived && this.parlantWaitingForResponse) {
                                if (this.parlantProcessedMessageOffsets.size > 0) {
                                    // Update last bot message to show action buttons on last message of query
                                    this.updateLastBotMessage();
                                    this.parlantStopPolling();
                                    this.parlantWaitingForResponse = false;
                                    this.parlantAgentReadyStatusReceived = false;
                                    // Cancel delayed typing indicator if still pending
                                    if (this.parlantTypingIndicatorTimeout) {
                                        clearTimeout(this.parlantTypingIndicatorTimeout);
                                        this.parlantTypingIndicatorTimeout = null;
                                    }
                                    
                                    // Remove typing indicator (Parlant-specific)
                                    const typingIndicator = this.widget?.querySelector('.typing-indicator');
                                    if (typingIndicator && typingIndicator.classList.contains('active')) {
                                        typingIndicator.classList.remove('active');
                                        this.stopJavaScriptTypingAnimation();
                                    }
                                } else {
                                    // No messages yet - wait another 2 seconds
                                    this.parlantReadyStatusGracePeriodTimer = setTimeout(() => {
                                        if (this.parlantAgentReadyStatusReceived && this.parlantWaitingForResponse && 
                                            this.parlantProcessedMessageOffsets.size === 0) {
                                            // Cancel delayed typing indicator if still pending
                                            if (this.parlantTypingIndicatorTimeout) {
                                                clearTimeout(this.parlantTypingIndicatorTimeout);
                                                this.parlantTypingIndicatorTimeout = null;
                                            }
                                            
                                            // Remove typing indicator when no response (Parlant-specific)
                                            const typingIndicator = this.widget?.querySelector('.typing-indicator');
                                            if (typingIndicator && typingIndicator.classList.contains('active')) {
                                                typingIndicator.classList.remove('active');
                                                this.stopJavaScriptTypingAnimation();
                                            }
                                            this.parlantStopPolling();
                                            this.parlantWaitingForResponse = false;
                                            this.parlantAgentReadyStatusReceived = false;
                                            this.parlantCurrentQueryId = null; // Clear current query
                                        }
                                    }, 2000);
                                }
                            }
                        }, 3000);
                    }
                    
                    // Show typing indicator when waiting for response (smooth like Parlant-ui)
                    if (this.parlantWaitingForResponse && !this.parlantProcessedMessageOffsets.size) {
                        const typingIndicator = this.widget?.querySelector('.typing-indicator');
                        if (!typingIndicator || !typingIndicator.classList.contains('active')) {
                            // Show typing indicator if not already shown - activate it smoothly
                            const chatMessages = this.widget?.querySelector('.chat-messages');
                            if (chatMessages) {
                                const existingIndicator = chatMessages.querySelector('.typing-indicator');
                                if (existingIndicator) {
                                    existingIndicator.classList.add('active');
                                    this.updateParlantTypingIndicator('thinking');
                                    this.startJavaScriptTypingAnimation();
                                    const spacer = chatMessages.querySelector('.chat-spacer');
                                    if (spacer) {
                                        chatMessages.insertBefore(existingIndicator, spacer);
                                    }
                                }
                            }
                        }
                    }
                    
                    // Check for "typing" or "processing" status - agent is active
                    if (event.kind === 'status' && event.source === 'ai_agent' && 
                        event.data && (event.data.status === 'typing' || event.data.status === 'processing')) {
                        // Reset ready status if agent becomes active again
                        if (this.parlantAgentReadyStatusReceived) {
                            this.parlantAgentReadyStatusReceived = false;
                            if (this.parlantReadyStatusGracePeriodTimer) {
                                clearTimeout(this.parlantReadyStatusGracePeriodTimer);
                                this.parlantReadyStatusGracePeriodTimer = null;
                            }
                        }
                        
                        // Keep typing indicator as "Thinking" - smooth and simple
                        this.updateParlantTypingIndicator('thinking');
                        
                        // Show typing indicator for each response
                        const typingIndicator = this.widget?.querySelector('.typing-indicator');
                        if (typingIndicator && !typingIndicator.classList.contains('active')) {
                            typingIndicator.classList.add('active');
                            this.startJavaScriptTypingAnimation();
                        }
                    }
                    
                    // Handle message events from AI agent
                    if (event.kind === 'message' && event.source === 'ai_agent') {
                        // Skip if we've already processed this message
                        if (this.parlantProcessedMessageOffsets.has(event.offset)) {
                            continue;
                        }
                        
                        // Reset ready status if we receive a new message
                        if (this.parlantAgentReadyStatusReceived) {
                            this.parlantAgentReadyStatusReceived = false;
                            if (this.parlantReadyStatusGracePeriodTimer) {
                                clearTimeout(this.parlantReadyStatusGracePeriodTimer);
                                this.parlantReadyStatusGracePeriodTimer = null;
                            }
                        }
                        
                        receivedNewMessage = true;
                        
                        // Extract message text from event
                        let messageText = '';
                        
                        if (event.data && typeof event.data === 'object' && event.data.message) {
                            messageText = event.data.message;
                        } else if (event.message) {
                            messageText = event.message;
                        } else if (event.data && typeof event.data === 'string') {
                            messageText = event.data;
                        } else if (event.data && event.data.text) {
                            messageText = event.data.text;
                        } else if (event.data && event.data.content) {
                            messageText = event.data.content;
                        }
                        
                        if (messageText) {
                            // Track response for current query
                            if (this.parlantCurrentQueryId) {
                                const responses = this.parlantQueryResponses.get(this.parlantCurrentQueryId) || [];
                                responses.push(messageText);
                                this.parlantQueryResponses.set(this.parlantCurrentQueryId, responses);
                            }
                            
                            // Keep typing indicator active while waiting for more responses
                            // Cancel the delayed typing indicator if it hasn't shown yet
                            if (this.parlantTypingIndicatorTimeout) {
                                clearTimeout(this.parlantTypingIndicatorTimeout);
                                this.parlantTypingIndicatorTimeout = null;
                            }
                            
                            // Add message to chat
                            this.addMessage(messageText, 'bot', true);
                            
                            // Store message with query ID for proper grouping
                            let queryId = this.parlantCurrentQueryId;
                            if (!queryId) {
                                queryId = `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                                this.parlantCurrentQueryId = queryId;
                            }
                            this.storageManager.saveParlantMessage(messageText, 'bot', queryId);
                            
                            // After first message, subsequent messages won't show avatar
                            if (this.parlantIsFirstAgentMessageInSequence) {
                                this.parlantIsFirstAgentMessageInSequence = false;
                            }
                            
                            this.parlantProcessedMessageOffsets.add(event.offset);
                            window.lastParlantAgentMessageTime = Date.now();
                            
                            // Mark this message row with query ID for action button logic
                            const messageRows = this.widget.querySelectorAll('.message-row');
                            const lastRow = messageRows[messageRows.length - 1];
                            if (lastRow && this.parlantCurrentQueryId) {
                                lastRow.setAttribute('data-query-id', this.parlantCurrentQueryId);
                                // Also mark the bot message container
                                const botContainer = lastRow.querySelector('.bot-message-container');
                                if (botContainer) {
                                    botContainer.setAttribute('data-query-id', this.parlantCurrentQueryId);
                                }
                            }
                            
                            // Update last bot message to show action buttons on last message of query
                            this.updateLastBotMessage();
                        } else {
                            // Silent fail - could not extract message
                        }
                    }
                }
                
            } else if (response.status === 504) {
                // Gateway timeout - this is expected when waiting for new events
            } else if (response.status === 404) {
                // Session not found - connection issue (silent)
            } else {
                // Error polling (silent)
            }
        } catch (error) {
            // Network errors - connection might be lost (silent)
        }
    }

    // Start polling for Parlant responses
    parlantStartPolling() {
        if (this.parlantPollingInterval) {
            clearInterval(this.parlantPollingInterval);
        }
        
        // Poll every 800ms for better responsiveness
        this.parlantPollingInterval = setInterval(() => {
            this.parlantPollForAgentResponse();
        }, 800);
    }

    // Stop polling for Parlant responses
    parlantStopPolling() {
        if (this.parlantPollingInterval) {
            clearInterval(this.parlantPollingInterval);
            this.parlantPollingInterval = null;
        }
        
        // Clean up safety timeout
        if (window.currentParlantSafetyTimeout) {
            clearTimeout(window.currentParlantSafetyTimeout);
            window.currentParlantSafetyTimeout = null;
        }
        
        // Clean up grace period timer
        if (this.parlantReadyStatusGracePeriodTimer) {
            clearTimeout(this.parlantReadyStatusGracePeriodTimer);
            this.parlantReadyStatusGracePeriodTimer = null;
        }
    }

    // Cleanup Parlant resources
    cleanupParlant() {
        if (this.config.parlant.enabled) {
            this.parlantStopPolling();
            
            // Clean up connection check interval if it exists
            if (this.parlantConnectionCheckInterval) {
                clearInterval(this.parlantConnectionCheckInterval);
                this.parlantConnectionCheckInterval = null;
            }
        }
    }

    // Update Parlant typing indicator text
    updateParlantTypingIndicator(state) {
        if (!this.config.parlant.enabled) return;
        
        const typingIndicator = this.widget?.querySelector('.typing-indicator');
        if (!typingIndicator) return;
        
        // Always use 'thinking' state - no need for fetching/typing states
        this.parlantTypingIndicatorState = 'thinking';
        let typingText = typingIndicator.querySelector('.typing-text');
        
        // Create typing-text if it doesn't exist
        if (!typingText) {
            typingText = document.createElement('div');
            typingText.className = 'typing-text';
            typingIndicator.insertBefore(typingText, typingIndicator.firstChild);
        }
        
        // Always show "Thinking" - smooth and simple like Parlant-ui
        typingText.textContent = 'Thinking';
    }


    loadStyles() {
        // Apply theme first
        this.applyTheme();
        
        const style = document.createElement('style');
        style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&display=swap');
            :root {
                --chat-primary-color: ${this.config.primaryColor};
                --chat-primary-color-gradient: ${this.isGradient(this.config.primaryColor) ? this.config.primaryColor : this.config.primaryColor};
                --chat-message-font-size: ${this.config.fontSize};
                --chat-width: ${this.config.width};
                --chat-height: ${this.config.height};
                --chat-toggle-size: ${this.config.toggleButtonSize}px;
                --chat-toggle-bottom-margin: ${this.config.toggleButtonBottomMargin}px;
                --chat-toggle-right-margin: ${this.config.toggleButtonRightMargin}px;
                --website-bottom-spacing: ${this.config.websiteBottomSpacing}px;
                --text-box-spacing-from-toggle: ${this.config.textBoxSpacingFromToggle}px;
                --text-box-text-color: ${this.config.textBoxTextColor === 'primary' ? this.config.primaryColor : (this.config.textBoxTextColor === 'default' ? '#374151' : this.config.textBoxTextColor)};
                --text-box-submessage-color: ${this.config.textBoxTextColor === 'primary' ? this.config.primaryColor : (this.config.textBoxTextColor === 'default' ? '#6b7280' : this.config.textBoxTextColor)};
                --text-box-submessage-opacity: ${this.config.textBoxTextColor === 'primary' ? '0.8' : '1'};
                --text-box-is-gradient: ${this.config.textBoxTextColor === 'primary' && this.isGradient(this.config.primaryColor) ? 'true' : 'false'};
                --chat-border-radius: 16px;
                --chat-shadow: 0 5px 40px rgba(0,0,0,0.16);
                --typing-dot-color: ${this.config.typingIndicatorColor};
                --chat-primary-color-rgb: ${this.hexToRgb(this.config.primaryColor)};
                --send-button-icon-size: ${this.config.sendButtonIconSize}px;
                
                /* Theme variables */
                --chat-bg-color: ${this.getThemeColor('bg')};
                --chat-text-color: ${this.getThemeColor('text')};
                --chat-border-color: ${this.getThemeColor('border')};
                --chat-input-bg: ${this.getThemeColor('inputBg')};
                --chat-message-bg: ${this.getThemeColor('messageBg')};
                --chat-header-bg: ${this.getThemeColor('headerBg')};
                --chat-header-text: ${this.getThemeColor('headerText')};
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

            /* Chat Toggle Button - Positioned above chat window */
            .chat-toggle {
                width: var(--chat-toggle-size);
                height: var(--chat-toggle-size);
                border-radius: 50%;
                background: var(--chat-primary-color-gradient);
                box-shadow: 0 2px 12px rgba(0,0,0,0.15);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: transform 0.3s ease;
                z-index: 2147483650; /* Higher than chat window (2147483647) to appear in front */
                position: fixed;
                text-align: center;
            }

            .chat-toggle:hover {
                transform: scale(1.1);
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

            /* Chat Window */
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
                border-bottom: 1px solid var(--chat-primary-color);
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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
                border-radius: 50%;
                transition: all 0.2s ease;
                width: 40px;
                height: 40px;
            }

            .erase-chat:hover, .close-chat:hover {
                background: rgba(255, 255, 255, 0.1);
                transform: scale(1.05);
            }

            .erase-chat:active, .close-chat:active {
                background: var(--chat-primary-color) !important;
                transform: scale(0.95);
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

            /* Chat Messages - Normal bottom flow */
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
                background: var(--chat-message-bg);
                ${this.config.chatBackgroundImage ? `
                background-image: url('${this.config.chatBackgroundImage}');
                background-size: cover;
                background-position: center;
                background-repeat: no-repeat;
                background-attachment: fixed;
                ` : `
                background: var(--chat-message-bg);
                `}
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
                box-shadow: none !important;
                ${this.config.chatBackgroundImage ? `
                background: rgba(240, 242, 245, 0.95) !important;
                box-shadow: none !important;
                ` : ''}
            }
            
            /* Ensure bot message has no shadow */
            .chat-widget .bot-message,
            .chat-widget .ai-message {
                box-shadow: none !important;
                background: #f0f2f5 !important;
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
                ${this.config.chatBackgroundImage ? `
                background: rgba(var(--chat-primary-color-rgb, 0, 132, 255), 0.95);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                ` : ''}
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
                padding: 1rem !important;
                background: #f0f2f5 !important;
                border-radius: 1rem !important;
                border-top-left-radius: 0 !important;
                font-size: 14px !important;
                line-height: 1.5 !important;
                color: #000000 !important;
                box-sizing: border-box !important;
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
                background: var(--chat-primary-color, ${this.config.primaryColor || '#0084ff'}) !important;
                font-size: 14px;
                font-weight: 600;
                color: white;
            }
            
            .ai-avatar-icon.image-avatar {
                background: transparent !important;
                padding: 0;
            }
            
            .ai-avatar-icon.svg-avatar {
                background: var(--chat-primary-color, ${this.config.primaryColor || '#0084ff'}) !important;
                padding: 4px;
            }
            
            /* Fallback for when CSS variables don't load properly */
            .chat-widget .ai-avatar-icon:not(.emoji-avatar):not(.image-avatar) {
                background-color: ${this.config.primaryColor || '#0084ff'} !important;
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
                padding: 1rem;
                border-top: 1px solid var(--chat-border-color);
                background: var(--chat-input-bg);
            }

            /* Chat Branding */
            .chat-branding {
                padding: 0.5rem 1rem;
                background: var(--chat-input-bg);
                text-align: center;
                border-bottom-left-radius: inherit;
                border-bottom-right-radius: inherit;
                font-size: 11px;
                color: #666;
                opacity: 0.8;
            }

            .chat-branding a {
                color: inherit;
                text-decoration: none;
                font-size: inherit;
                font-weight: 400;
                transition: color 0.2s ease;
            }

            .chat-branding a:hover {
                color: var(--chat-primary-color);
                opacity: 1;
                text-decoration: none;
            }

            .chat-branding strong {
                font-weight: 600;
                font-size: inherit;
                color: #333;
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
                border: 1.5px solid #e4e6eb;
                border-radius: 14px;
                outline: none;
                font-size: 14px;
                background-color: white;
                cursor: text;
                transition: all 0.25s ease;
                min-height: 48px;
                height: 48px;
                line-height: 1.4;
                box-sizing: border-box;
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
                /* Desktop focus: use a soft ash outline instead of black */
                border-color: #cbd5e1;
                border-width: 2px;
                box-shadow: 0 0 0 3px rgba(203, 213, 225, 0.45);
                outline: none;
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
                width: var(--send-button-icon-size, ${this.config.sendButtonIconSize}px) !important;
                height: var(--send-button-icon-size, ${this.config.sendButtonIconSize}px) !important;
                min-width: var(--send-button-icon-size, ${this.config.sendButtonIconSize}px) !important;
                min-height: var(--send-button-icon-size, ${this.config.sendButtonIconSize}px) !important;
                max-width: var(--send-button-icon-size, ${this.config.sendButtonIconSize}px) !important;
                max-height: var(--send-button-icon-size, ${this.config.sendButtonIconSize}px) !important;
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
                padding: 12px 16px !important;
                background: #f0f2f5 !important;
                border-radius: 14px !important;
                border-top-left-radius: 6px !important;
                align-self: flex-start !important;
                margin: 12px 0 !important;
                margin-left: 0 !important;
                margin-right: auto !important;
                box-shadow: none !important;
                border: 1px solid #e4e6eb !important;
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
                padding: 4px 8px;
                margin: 2px 0;
                background: white;
                border-radius: 4px;
                border: 1px solid #dee2e6;
            }

            .file-preview-item .file-info {
                display: flex;
                align-items: center;
                gap: 8px;
                flex: 1;
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
                width: ${Math.round(this.config.sendButtonIconSize * 1.17)}px !important;
                height: ${Math.round(this.config.sendButtonIconSize * 1.17)}px !important;
                min-width: ${Math.round(this.config.sendButtonIconSize * 1.17)}px !important;
                min-height: ${Math.round(this.config.sendButtonIconSize * 1.17)}px !important;
                max-width: ${Math.round(this.config.sendButtonIconSize * 1.17)}px !important;
                max-height: ${Math.round(this.config.sendButtonIconSize * 1.17)}px !important;
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
                width: ${Math.round(this.config.sendButtonIconSize * 1.25)}px !important;
                height: ${Math.round(this.config.sendButtonIconSize * 1.25)}px !important;
                min-width: ${Math.round(this.config.sendButtonIconSize * 1.25)}px !important;
                min-height: ${Math.round(this.config.sendButtonIconSize * 1.25)}px !important;
                max-width: ${Math.round(this.config.sendButtonIconSize * 1.25)}px !important;
                max-height: ${Math.round(this.config.sendButtonIconSize * 1.25)}px !important;
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

            /* --- Refined UI overrides (Parlant-inspired) --- */
            .chat-widget,
            .chat-widget * {
                font-family: "Manrope", "Segoe UI", sans-serif;
            }

            .chat-window {
                background: #f8fafc;
                border: 1px solid rgba(15, 23, 42, 0.08);
                box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
            }

            .chat-header {
                background: var(--chat-primary-color-gradient);
            }

            .chat-header-title h2 {
                font-size: 18px;
                letter-spacing: 0.2px;
            }

            .chat-header-subname {
                font-size: 12px;
                opacity: 0.85;
            }


            .chat-messages {
                background: linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
                padding: 20px;
                gap: 10px;
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
                border: 1px solid rgba(15, 23, 42, 0.08);
                border-radius: 18px;
                border-top-left-radius: 6px;
                box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
                color: #0f172a;
            }

            .user-message {
                background: var(--chat-primary-color-gradient);
                border-radius: 18px;
                border-top-right-radius: 6px;
                color: #ffffff;
                box-shadow: 0 6px 16px rgba(15, 23, 42, 0.18);
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
            }

            .message-copy-btn.active img,
            .message-copy-btn.copied img {
                filter: brightness(0) invert(1);
                opacity: 1;
            }

            .message-copy-btn.copied::after {
                content: "Copied!";
                position: absolute;
                top: -28px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(15, 23, 42, 0.9);
                color: #ffffff;
                padding: 4px 8px;
                border-radius: 6px;
                font-size: 11px;
                pointer-events: none;
                white-space: nowrap;
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
        widget.className = `chat-widget ${this.config.theme}-theme ${this.config.position}${this.config.parlant.enabled ? ' parlant-mode' : ''}`;
        
        // Get position styles
        const positionStyle = togglePositions[this.config.position];
        
        // Create toggle button with explicit positioning
        const toggleStyle = Object.entries(positionStyle.toggle)
            .map(([key, value]) => `${key}: ${value};`)
            .join(' ');
        
        // Generate send button icon
        const generateSendIcon = () => {
            return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M2.01 21L23 12 2.01 3 2 10l15 2-15 2z'/%3E%3C/svg%3E`;
        };

        const generateToggleIcon = () => {
            if (!this.config.toggleButtonIcon) {
                // Default chat bubble icon
                return `<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z'/%3E%3C/svg%3E" alt="Chat">`;
            }
            
            const icon = this.config.toggleButtonIcon;
            
            // Check if it's an emoji
            if (icon.length <= 4 && /\p{Emoji}/u.test(icon)) {
                return `<span style="font-size: 24px; line-height: 1; display: flex; align-items: center; justify-content: center;">${icon}</span>`;
            }
            
            // Check if it's an image URL
            if (icon.startsWith('http') || icon.startsWith('data:image') || icon.startsWith('/')) {
                return `<img src="${icon}" alt="Chat" style="width: 24px; height: 24px; object-fit: contain;">`;
            }
            
            // Check if it's an SVG (starts with <svg)
            if (icon.trim().startsWith('<svg')) {
                return icon;
            }
            
            // Default fallback
            return `<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z'/%3E%3C/svg%3E" alt="Chat">`;
        };
        
        const toggleButtonHtml = `
            <div class="chat-toggle" style="position: fixed; ${toggleStyle}">
                ${generateToggleIcon()}
            </div>
        `;

        // Create text box HTML (floating message above toggle button)
        const textBoxHtml = this.config.showTextBox ? `
            <div class="chat-text-box" style="position: fixed;">
                <div class="chat-text-box-content">
                    ${this.config.showTextBoxCloseButton ? `
                        <button class="chat-text-box-close">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                        </button>
                    ` : ''}
                    <div class="chat-text-box-message" ${this.config.textBoxTextColor === 'primary' && this.isGradient(this.config.primaryColor) ? 'data-gradient="true"' : ''}>${this.config.textBoxMessage}</div>
                    <div class="chat-text-box-separator"></div>
                    <div class="chat-text-box-submessage" ${this.config.textBoxTextColor === 'primary' && this.isGradient(this.config.primaryColor) ? 'data-gradient="true"' : ''}>${this.config.textBoxSubMessage}</div>
                </div>
            </div>
        ` : '';

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
                        <div class="chat-header-text">
                            <h2 style="font-weight: bold; font-size: 20px; margin: 0;">${this.config.botName}</h2>
                            ${this.config.showBotSubname && this.config.botSubname ? `<div class="chat-header-subname">${this.config.botSubname}</div>` : ''}
                        </div>
                    </div>
                    <div class="chat-header-actions">
                        ${this.config.enableDeleteButton ? `
                        <button class="erase-chat">
                            <img src="https://i.ibb.co.com/9YP3swm/erase.png" alt="Erase" title="Clear chat history">
                        </button>
                        ` : ''}
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
                        <div class="typing-text">Thinking<div class="typing-spinner" aria-hidden="true"></div></div>
                    </div>
                    <div class="chat-spacer"></div>
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
                        <textarea class="chat-textarea" rows="1" placeholder="${this.config.placeholder}" aria-label="Chat input"></textarea>
                        ${this.config.enableFileUpload ? `
                        <input type="file" class="file-input" multiple accept="image/*,.pdf,.doc,.docx,.txt" style="display: none;">
                        <button class="file-button" title="Attach files">
                            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3E%3Cpath d='M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z'/%3E%3C/svg%3E" alt="Attach">
                        </button>
                        ` : ''}
                        <button class="send-button">
                            <img src="${generateSendIcon()}" alt="Send">
                        </button>
                    </div>
                    ${this.config.enableFileUpload ? '<div class="file-preview" style="display: none;"></div>' : ''}
                </div>
                ${this.config.showBranding ? `
                    <div class="chat-branding">
                        Powered by <a href="${this.config.brandingUrl}" target="_blank" rel="noopener noreferrer"><strong>${this.config.brandingText.replace(/^Powered by\s*/i, '')}</strong></a>
                    </div>
                ` : ''}
            </div>
        `;

        widget.innerHTML = textBoxHtml + toggleButtonHtml + chatWindowHtml;
        document.body.appendChild(widget);
        this.widget = widget;
    }
    initializeWidget() {
        this.createWidget();
        this.setupSuggestionChips();
        this.setupResponsiveHandling();
        this.setupScrollContainment();
        
        // Ensure greeting message is properly created with avatar
        setTimeout(() => {
            this.ensureGreetingMessageWithAvatar();
        }, 200); // Increased delay to ensure responsive styles are applied
        
        // Ensure send button icon size is properly applied
        setTimeout(() => {
            this.ensureSendButtonIconSize();
        }, 300); // Delay to ensure all styles are loaded
        
        // Apply toggle button animation
        setTimeout(() => {
            this.applyToggleButtonAnimation();
        }, 100);
        
        // Ensure styles are properly applied for npm/CDN builds
        setTimeout(() => {
            this.forceStyleReapplication();
        }, 500);
        
        // Continuously ensure typing indicator works (debug mode)
        setInterval(() => {
            this.ensureTypingIndicatorAnimation();
        }, 2000);
        
        // Setup text box close functionality
        setTimeout(() => {
            this.setupTextBoxEventListeners();
        }, 100);
        
        // Setup click outside to close functionality
        this.setupClickOutsideToClose();
        
        console.log("Chat widget initialized.");
    }
    
    setupEventListeners() {
        const chatToggle = this.widget.querySelector('.chat-toggle');
        const chatWindow = this.widget.querySelector('.chat-window');
        const closeChat = this.widget.querySelector('.close-chat');    
        const eraseChat = this.widget.querySelector('.erase-chat');
        const chatMessages = this.widget.querySelector('.chat-messages');
        const chatInput = this.widget.querySelector('.chat-input .chat-textarea');
        const sendButton = this.widget.querySelector('.send-button');
        const fileButton = this.widget.querySelector('.file-button');
        const fileInput = this.widget.querySelector('.file-input');
        const filePreview = this.widget.querySelector('.file-preview');
        const typingIndicator = this.widget.querySelector('.typing-indicator');
        
        // Setup mobile fullscreen enforcement
        this.setupMobileFullscreenEnforcement();
        
        // File upload handling - only if enabled
        let selectedFiles = [];
        
        if (this.config.enableFileUpload && fileButton && fileInput && filePreview) {
        fileButton.addEventListener('click', () => {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            selectedFiles = selectedFiles.concat(files);
            this.updateFilePreview(selectedFiles, filePreview);
        });
        
        // Remove file from preview
        filePreview.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-file')) {
                const index = parseInt(e.target.dataset.index);
                selectedFiles.splice(index, 1);
                this.updateFilePreview(selectedFiles, filePreview);
            }
        });
        }


        // Toggle button click handler - clean and safe
        chatToggle.addEventListener('click', () => {
            this.toggleChat();
        });

        // Close button handler - clean and safe
        closeChat.addEventListener('click', () => {
            this.closeChat();
        });

        // Initialize send button state
        sendButton.disabled = false;
        sendButton.style.opacity = '1';
        sendButton.style.pointerEvents = 'auto';

        // Send message handlers with enhanced checks
        const sendMessageHandler = (e) => {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }

            // Preserve multiline whitespace; only trim for "is empty" detection
            const rawMessage = (chatInput.value || '').replace(/\r\n/g, '\n');
            const hasText = rawMessage.trim().length > 0;
            
            // Always allow button click, just check if message is valid
            if (!hasText && (!this.config.enableFileUpload || selectedFiles.length === 0)) {
                // Shake animation or feedback for empty message
                chatInput.focus();
                return;
            }
            
            if (this.isWaitingForResponse || this.isTypewriterActive) {
                return; // Silently ignore if waiting
            }
            
            // Clear input immediately after sending
            chatInput.value = '';
            // Reset textarea height so the send button doesn't "drift" after the first send
            try {
                chatInput.style.height = 'auto';
            } catch (_) {}
            
            if (this.config.enableFileUpload && selectedFiles.length > 0) {
                this.sendMessageWithFiles(rawMessage, selectedFiles);
                selectedFiles = [];
                if (filePreview) {
                    this.updateFilePreview(selectedFiles, filePreview);
                }
                if (fileInput) {
                    fileInput.value = '';
                }
            } else {
                this.sendMessage(rawMessage);
            }
        };

        // Mobile send button handling:
        // Use Pointer Events when available (most reliable on mobile), fallback to click for mouse.
        // This avoids the common "tap doesn't click" issues caused by overlays / touch listeners.
        try {
            sendButton.style.touchAction = 'manipulation';
        } catch (_) {}

        // On many mobile browsers a tap can trigger: pointerup -> click.
        // We handle sending on pointerup for touch/pen, so we must ignore the subsequent synthetic click.
        let ignoreNextClick = false;

        sendButton.addEventListener('pointerdown', (e) => {
            // Prevent bubbling into container "focus input" handlers
            if (e) e.stopPropagation();
            // Visual feedback only
            sendButton.classList.add('is-pressing');
        }, { passive: true });

        sendButton.addEventListener('pointerup', (e) => {
            sendButton.classList.remove('is-pressing');
            if (e) e.stopPropagation();
            // For touch/pen: handle here. For mouse: let click handle it (prevents double-send).
            if (e && e.pointerType && e.pointerType !== 'mouse') {
                ignoreNextClick = true;
                setTimeout(() => { ignoreNextClick = false; }, 400);
                sendMessageHandler(e);
            }
        }, { passive: false });

        sendButton.addEventListener('pointercancel', () => {
            sendButton.classList.remove('is-pressing');
        }, { passive: true });

        // Mouse / desktop fallback (guard against synthetic click after touch)
        sendButton.addEventListener('click', (e) => {
            if (e) e.stopPropagation();
            if (ignoreNextClick) {
                if (e) e.preventDefault();
                return;
            }
            sendMessageHandler(e);
        });

        // Multiline textarea behavior:
        // - Mobile: Enter inserts newline (no auto-send)
        // - Desktop: Enter sends, Shift+Enter inserts newline
        // - Any: Ctrl/Cmd+Enter sends
        chatInput.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter') return;
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                sendMessageHandler(e);
                return;
            }
            if (this.isMobileBrowser()) {
                // allow default newline behavior
                return;
            }
            if (!e.shiftKey) {
                e.preventDefault();
                sendMessageHandler(e);
            }
        });

        // Visual feedback for input state:
        // Keep mobile send button full-color (no gray/opacity changes).
        chatInput.addEventListener('input', () => {
            if (this.isMobileBrowser()) {
                sendButton.style.opacity = '1';
                return;
            }
            const isEmpty = !chatInput.value.trim() && (!this.config.enableFileUpload || selectedFiles.length === 0);
            const isProcessing = this.isWaitingForResponse || this.isTypewriterActive;
            sendButton.style.opacity = isProcessing ? '0.6' : (isEmpty ? '0.7' : '1');
        });

        // Autosize textarea (mobile + desktop)
        const autosize = () => {
            try {
                chatInput.style.height = 'auto';
                const max = 140; // px
                const next = Math.min(chatInput.scrollHeight, max);
                chatInput.style.height = `${next}px`;
            } catch (_) {}
        };
        autosize();
        chatInput.addEventListener('input', autosize);

            // 🚀 Enhanced input handling for both mobile and desktop
        if (this.isMobileBrowser() && this.config.enableEnhancedMobileInput) {
            this.setupCleanMobileInput(chatInput);
        } else {
            // Desktop input handling - ensure cursor is always visible
            this.setupDesktopInput(chatInput);
        }

        // Outside click handler - improved to not interfere with website scrolling
        document.addEventListener('click', (e) => {
            if (!chatWindow.contains(e.target) && !chatToggle.contains(e.target)) {
                if (chatWindow.classList.contains('active')) {
                    // Don't close on outside click to prevent interference with website
                    // Only close via the close button or toggle button
                }
            }
        });

        // Prevent chat window from closing when clicking inside - simplified
        chatWindow.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Mobile scroll handling - minimal and non-intrusive
        if ('ontouchstart' in window) {
            // Allow normal touch scrolling without interference
            chatMessages.style.webkitOverflowScrolling = 'touch';
            chatMessages.style.overscrollBehavior = 'contain';
        }

        // Responsive handlers (mobile-safe):
        // Use visualViewport when available so the input isn't cut off by mobile browser UI / nav bars.
        const getMobileViewportHeight = () => {
            try {
                const vv = window.visualViewport;
                return vv && vv.height ? vv.height : window.innerHeight;
            } catch (_) {
                return window.innerHeight;
            }
        };

        const applyMobileHeight = () => {
            if (window.innerWidth <= 480) {
                // Use CSS variable because many mobile fullscreen rules use !important height.
                // This prevents the bottom input from being cut by browser UI / phone nav bar.
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
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }, 150);
        });

        // Apply once on init
        applyMobileHeight();

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

        // Enhanced mobile-compatible scroll tracking
        let userScrolled = false;
        let lastScrollTop = 0;
        const chatMessages = this.widget.querySelector('.chat-messages');
        
        // Mobile-friendly scroll handler with debouncing
        const scrollHandler = () => {
            // Don't interrupt typewriter on mobile for auto-scroll
            if (this.isMobileBrowser()) {
                // Allow auto-scrolling during typewriter on mobile
                return;
            }
            
            if (chatMessages.scrollTop < lastScrollTop) {
                userScrolled = true;
            }
            lastScrollTop = chatMessages.scrollTop;
        };
        
        // Add scroll listener only for desktop
        if (!this.isMobileBrowser()) {
        chatMessages.addEventListener('scroll', scrollHandler);
        }

        // Enhanced scroll to bottom function with smooth animation
        const scrollToBottom = () => {
            // Check typewritewithscroll configuration
            if (this.config.typewritewithscroll || !this.isTypewriterActive) {
                chatMessages.scrollTo({
                    top: chatMessages.scrollHeight,
                    behavior: 'smooth'
                });
            }
        };

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

        // Initial scroll will be handled after typewriter completes

        // Type next token with enhanced mobile support
        const typeNextToken = () => {
            if (tokenIndex >= tokens.length) {
                // Clean up scroll listener only if it was added
                if (!this.isMobileBrowser()) {
                chatMessages.removeEventListener('scroll', scrollHandler);
                }
                
                this.isTypewriterActive = false;
                this.enableSendingFunctionality();
                
                // No automatic scroll after typewriter completion
                
                if (callback) callback();
                return;
            }

            const token = tokens[tokenIndex];
            const isTag = token.startsWith('<') && token.endsWith('>');
            const isMarkdown = token.startsWith('**') || token.startsWith('[') || token.startsWith('![');
            
            currentText += token;
            element.innerHTML = currentText;
            
            // Scroll during typewriter if enabled
            if (this.config.typewritewithscroll) {
                scrollToBottom();
            }
            
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

            // Use requestAnimationFrame for better mobile performance
            if (delay === 0) {
                requestAnimationFrame(typeNextToken);
            } else {
                setTimeout(() => {
                    try {
                        typeNextToken();
                    } catch (error) {
                        console.error('Typewriter error:', error);
                        // Fallback: complete the animation
                        element.innerHTML = text;
                        this.isTypewriterActive = false;
                        this.enableSendingFunctionality();
                        // Force enable input on typewriter error
                        this.forceEnableInput();
                        if (callback) callback();
                    }
                }, delay);
            }
        };

        // Start typing animation
        typeNextToken();
    }

    disableSendingFunctionality() {
        const chatInput = this.widget.querySelector('.chat-input .chat-textarea');
        const sendButton = this.widget.querySelector('.send-button');
        
        // Don't disable the input box, only make it read-only
        chatInput.readOnly = false;
        
        // Visual feedback only - don't actually disable button
        // Keep mobile button full color
        sendButton.style.opacity = this.isMobileBrowser() ? '1' : '0.6';
        sendButton.style.pointerEvents = 'auto'; // Keep clickable
        this.disableChips();
        
        // Add visual indication that sending is disabled
        chatInput.classList.add('waiting');
    }

    enableSendingFunctionality() {
        if (this.isWaitingForResponse || this.isTypewriterActive) {
            return; // Don't enable if still waiting for response or typing
        }

        const chatInput = this.widget.querySelector('.chat-input .chat-textarea');
        const sendButton = this.widget.querySelector('.send-button');
        
        // Enable everything back
        chatInput.readOnly = false;
        sendButton.style.opacity = '1';
        sendButton.style.pointerEvents = 'auto';
        this.enableChips();
        
        // Remove waiting indication
        chatInput.classList.remove('waiting');
    }
    
    forceEnableInput() {
        // Force enable input functionality regardless of state - used for error recovery
        const chatInput = this.widget.querySelector('.chat-input .chat-textarea');
        const sendButton = this.widget.querySelector('.send-button');
        
        if (chatInput) {
            chatInput.readOnly = false;
            chatInput.disabled = false;
            chatInput.style.opacity = '1';
            chatInput.style.pointerEvents = 'auto';
            chatInput.classList.remove('waiting');
        }
        
        if (sendButton) {
            sendButton.style.opacity = '1';
            sendButton.style.pointerEvents = 'auto';
        }
        
        // Force enable chips
        this.enableChips();
        
        // Reset state flags
        this.isWaitingForResponse = false;
        this.isTypewriterActive = false;
        
        // Remove any typing indicators
        const typingIndicator = this.widget.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.classList.remove('active');
            this.stopJavaScriptTypingAnimation();
        }
    }
    
    ensureTypingIndicatorAnimation() {
        // Continuously ensure typing indicator animation works with ROBUST debugging
        const typingDots = this.widget.querySelectorAll('.typing-indicator span');
        if (typingDots.length === 3) {
            let needsRepair = false;
            
            typingDots.forEach((dot, index) => {
                const computedStyle = window.getComputedStyle(dot);
                const animationName = computedStyle.animationName;
                
                // Check if animation needs repair
                if (animationName === 'none' || !animationName || animationName === 'initial') {
                    needsRepair = true;
                }
            });
            
            if (needsRepair) {
                this.repairTypingAnimation();
            }
        }
    }
    
    repairTypingAnimation() {
        const typingDots = this.widget.querySelectorAll('.typing-indicator span');
        
        // Clear any existing CSS animations
        typingDots.forEach((dot, index) => {
            dot.style.animation = 'none';
            dot.style.webkitAnimation = 'none';
            dot.offsetHeight; // Force repaint
        });
        
        // Start JavaScript-based animation
        this.startJavaScriptTypingAnimation();
    }
    
    setupMobileFullscreenEnforcement() {
        // Handle window resize for mobile fullscreen
        const handleResize = () => {
            const chatWindow = this.widget?.querySelector('.chat-window');
            if (chatWindow && chatWindow.classList.contains('active') && window.innerWidth <= 480) {
                chatWindow.style.setProperty('position', 'fixed', 'important');
                chatWindow.style.setProperty('top', '0', 'important');
                chatWindow.style.setProperty('left', '0', 'important');
                chatWindow.style.setProperty('right', '0', 'important');
                chatWindow.style.setProperty('bottom', '0', 'important');
                chatWindow.style.setProperty('width', '100vw', 'important');
                // Use dynamic viewport height to avoid bottom phone nav/browser UI cutting the input
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
        
        // Add resize listener
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);
        
        // Store cleanup function
        this._mobileFullscreenCleanup = () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
        };
    }

    startJavaScriptTypingAnimation() {
        // Clear any existing animation interval
        if (this.typingAnimationInterval) {
            clearInterval(this.typingAnimationInterval);
        }
        
        const typingDots = this.widget.querySelectorAll('.typing-indicator span');
        if (typingDots.length !== 3) return;
        
        let animationStep = 0;
        const totalSteps = 60; // Total animation cycle steps
        const dotDelays = [0, 20, 40]; // Delay each dot by 20 steps
        
        this.typingAnimationInterval = setInterval(() => {
            typingDots.forEach((dot, index) => {
                const dotStep = (animationStep + dotDelays[index]) % totalSteps;
                const progress = dotStep / (totalSteps / 4); // 4 cycles per full animation
                
                // Create a smooth pulse using sine wave
                const scale = 0.4 + 0.8 * Math.abs(Math.sin(progress * Math.PI));
                const opacity = 0.3 + 0.7 * Math.abs(Math.sin(progress * Math.PI));
                
                // Apply transform and opacity
                dot.style.setProperty('transform', `scale(${scale})`, 'important');
                dot.style.setProperty('-webkit-transform', `scale(${scale})`, 'important');
                dot.style.setProperty('opacity', opacity.toString(), 'important');
            });
            
            animationStep = (animationStep + 1) % totalSteps;
        }, 50); // 50ms = smooth 20fps animation
    }
    
    stopJavaScriptTypingAnimation() {
        if (this.typingAnimationInterval) {
            clearInterval(this.typingAnimationInterval);
            this.typingAnimationInterval = null;
            
            // Reset dots to normal state
            const typingDots = this.widget.querySelectorAll('.typing-indicator span');
            typingDots.forEach(dot => {
                dot.style.setProperty('transform', 'scale(1)', 'important');
                dot.style.setProperty('opacity', '1', 'important');
            });
        }
    }

    addMessage(text, sender, useTypewriter = true, meta = {}) {
        const chatMessages = this.widget.querySelector('.chat-messages');
        const typingIndicator = this.widget.querySelector('.typing-indicator');
        
        const messageRow = document.createElement('div');
        messageRow.className = `message-row ${sender}-row`;
        if (meta.queryId) {
            messageRow.setAttribute('data-query-id', meta.queryId);
        }
        
        if (sender === 'bot') {
            const botMessageContainer = document.createElement('div');
            botMessageContainer.className = 'bot-message-container';
            
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${sender}-message`;
            
            const messageLine = document.createElement('div');
            messageLine.className = 'message-line bot-message-line';
            
            // Add AI avatar and name inside the message bubble - always show for bot messages
            const avatarHtml = this.generateAiAvatar();
            messageDiv.innerHTML = avatarHtml;
            
            // Create actions container only if message actions are enabled
            let actionsDiv = null;
            if (this.config.showMessageActions) {
                actionsDiv = document.createElement('div');
                actionsDiv.className = 'message-actions';
                actionsDiv.style.display = 'none'; // Hide initially
                actionsDiv.innerHTML = `
                    <button class="message-action-btn like-btn" title="Helpful">
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23000'%3E%3Cpath d='M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z'/%3E%3C/svg%3E" alt="Like">
                    </button>
                    <button class="message-action-btn dislike-btn" title="Not helpful">
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23000'%3E%3Cpath d='M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z'/%3E%3C/svg%3E" alt="Dislike">
                    </button>
                    <button class="message-action-btn regenerate-btn" title="Regenerate response">
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23000'%3E%3Cpath d='M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z'/%3E%3C/svg%3E" alt="Regenerate">
                    </button>
                `;
            }

            // Add content to message
            if (this.config.enableMarkdown && sender === 'bot') {
                if (useTypewriter && this.config.enableTypewriter) {
                    // Create content container for typewriter
                    const contentContainer = document.createElement('div');
                    contentContainer.className = 'message-content';
                    messageDiv.appendChild(contentContainer);
                    
                    this.typeWriter(contentContainer, marked.parse(text), () => {
                        // Show actions after typewriter is done (only if enabled)
                        if (actionsDiv && this.config.showMessageActions) {
                            actionsDiv.style.display = 'flex';
                        }
                        this.setupMessageLinks(contentContainer);
                        this.updateLastBotMessage();
                        
                        // Trigger word functionality removed - form now shows on chat open
                    });
                } else {
                    // Create content container for immediate content
                    const contentContainer = document.createElement('div');
                    contentContainer.className = 'message-content';
                    contentContainer.innerHTML = marked.parse(text);
                    messageDiv.appendChild(contentContainer);
                    
                    if (actionsDiv && this.config.showMessageActions) {
                        actionsDiv.style.display = 'flex';
                    }
                    this.setupMessageLinks(contentContainer);
                    
                    // Trigger word functionality removed - form now shows on chat open
                }
            } else {
                // Create content container for plain text
                const contentContainer = document.createElement('div');
                contentContainer.className = 'message-content';
                contentContainer.textContent = text;
                messageDiv.appendChild(contentContainer);
                
                if (actionsDiv && this.config.showMessageActions) {
                    actionsDiv.style.display = 'flex';
                }
            }

            // Add copy button on right side of bot message container (outside message box)
            const copyButton = document.createElement('button');
            copyButton.className = 'message-copy-btn bot-copy-btn';
            copyButton.title = 'Copy to clipboard';
            copyButton.innerHTML = `<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3E%3Cpath d='M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z'/%3E%3C/svg%3E" alt="Copy">`;
            messageLine.appendChild(messageDiv);
            messageLine.appendChild(copyButton);
            botMessageContainer.appendChild(messageLine);
            
            if (actionsDiv) {
                botMessageContainer.appendChild(actionsDiv);
            }
            
            // Set query ID on container for Parlant spacing
            const queryId = meta.queryId || (this.config.parlant.enabled && this.parlantCurrentQueryId ? this.parlantCurrentQueryId : null);
            if (queryId) {
                botMessageContainer.setAttribute('data-query-id', queryId);
            }
            
            messageRow.appendChild(botMessageContainer);

            // Setup action buttons only if they exist
            // For Parlant: Only show on last response of each query
            if (this.config.showMessageActions) {
                // Hide action buttons initially if Parlant is enabled
                if (this.config.parlant.enabled && actionsDiv) {
                    actionsDiv.style.display = 'none';
                }
                this.setupMessageActions(botMessageContainer, text);
            }

            // Hide greeting message action buttons when first AI response comes
            this.hideGreetingActions();

            // Trigger word functionality removed - form now shows on chat open
        } else {
            // Create container for user message with copy button
            const userMessageContainer = document.createElement('div');
            userMessageContainer.className = 'user-message-container';
            
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${sender}-message`;
            messageDiv.textContent = text;
            
            const messageLine = document.createElement('div');
            messageLine.className = 'message-line user-message-line';
            
            // Add copy button on left side of user message container (outside message box)
            const copyButton = document.createElement('button');
            copyButton.className = 'message-copy-btn user-copy-btn';
            copyButton.title = 'Copy to clipboard';
            copyButton.innerHTML = `<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3E%3Cpath d='M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z'/%3E%3C/svg%3E" alt="Copy">`;
            messageLine.appendChild(copyButton);
            messageLine.appendChild(messageDiv);
            userMessageContainer.appendChild(messageLine);
            
            messageRow.appendChild(userMessageContainer);
        }

        // Insert new messages before the spacer (so they appear above the empty space)
        const spacer = chatMessages.querySelector('.chat-spacer');
        chatMessages.insertBefore(messageRow, spacer);
        
        // Keep typing indicator after the latest message so it remains visible
        const typingIndicatorElement = chatMessages.querySelector('.typing-indicator');
        if (typingIndicatorElement && spacer && typingIndicatorElement.classList.contains('active')) {
            chatMessages.insertBefore(typingIndicatorElement, spacer);
        }

        // Setup copy buttons for the new message
        this.setupCopyButtons(messageRow, text);
        
        // Only scroll to show new message if it's a user message
        if (sender === 'user') {
            this.scrollToShowNewMessage(messageRow);
        }
        
        this.updateLastBotMessage();
    }

    setupCopyButtons(messageRow, text) {
        // Setup copy button for bot messages
        const botCopyBtn = messageRow.querySelector('.bot-copy-btn');
        if (botCopyBtn) {
            botCopyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Try multiple ways to get the message text
                let textToCopy = text;
                const messageContent = messageRow.querySelector('.message-content');
                if (messageContent) {
                    textToCopy = messageContent.textContent || messageContent.innerText || text;
                } else {
                    // Fallback: try to get text from message div
                    const messageDiv = messageRow.querySelector('.message');
                    if (messageDiv) {
                        textToCopy = messageDiv.textContent || messageDiv.innerText || text;
                    }
                }
                // Clean up the text (remove extra whitespace)
                textToCopy = textToCopy.trim();
                navigator.clipboard.writeText(textToCopy).then(() => {
                    botCopyBtn.classList.add('copied', 'active');
                    botCopyBtn.innerHTML = `<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z'/%3E%3C/svg%3E" alt="✓">`;
                    setTimeout(() => {
                        botCopyBtn.classList.remove('copied', 'active');
                        botCopyBtn.innerHTML = `<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3E%3Cpath d='M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z'/%3E%3C/svg%3E" alt="Copy">`;
                    }, 2000);
                });
            });
        }

        // Setup copy button for user messages
        const userCopyBtn = messageRow.querySelector('.user-copy-btn');
        if (userCopyBtn) {
            userCopyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Try multiple ways to get the message text
                let textToCopy = text;
                const messageContent = messageRow.querySelector('.user-message');
                if (messageContent) {
                    textToCopy = messageContent.textContent || messageContent.innerText || text;
                }
                // Clean up the text (remove extra whitespace)
                textToCopy = textToCopy.trim();
                navigator.clipboard.writeText(textToCopy).then(() => {
                    userCopyBtn.classList.add('copied', 'active');
                    userCopyBtn.innerHTML = `<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z'/%3E%3C/svg%3E" alt="✓">`;
                    setTimeout(() => {
                        userCopyBtn.classList.remove('copied', 'active');
                        userCopyBtn.innerHTML = `<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3E%3Cpath d='M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z'/%3E%3C/svg%3E" alt="Copy">`;
                    }, 2000);
                });
            });
        }
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
        const chatInput = this.widget.querySelector('.chat-input .chat-textarea');
        const typingIndicator = this.widget.querySelector('.typing-indicator');
        const chatWindow = this.widget.querySelector('.chat-window');
    
        // Comprehensive input reset and interaction management
        const resetInputState = () => {
            // Reset input state
            chatInput.value = '';
            // Don't re-introduce the mobile readonly/cursor hack when enhanced mobile input is enabled
            if (!(this.isMobileBrowser() && this.config.enableEnhancedMobileInput)) {
                chatInput.setAttribute('readonly', 'true');
            } else {
                chatInput.removeAttribute('readonly');
            }
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
            typingIndicator.classList.add('active');
            // Start JavaScript animation when typing indicator becomes active
            setTimeout(() => this.startJavaScriptTypingAnimation(), 100);
            // Typing indicator will be positioned correctly by addMessage
        };
    
        // Enable sending functionality
        const enableSending = () => {
            this.isWaitingForResponse = false;
            this.enableSendingFunctionality();
            typingIndicator.classList.remove('active');
            // Stop JavaScript animation when typing indicator is hidden
            this.stopJavaScriptTypingAnimation();
        };
    
        try {
            // Disable sending and show typing indicator
            disableSending();
    
            // No automatic scroll - let natural positioning handle it
    
            // Add user message if not a regeneration
            if (!isRegeneration) {
                this.addMessage(message, 'user');
                this.storageManager.saveMessage(message, 'user');
            }
    
            // Check if Parlant is enabled - use Parlant endpoints instead of regular API
            if (this.config.parlant.enabled && this.config.parlant.apiBaseUrl) {
                // Use Parlant integration
                try {
                    // Generate unique query ID for this user query
                    this.parlantCurrentQueryId = `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    this.parlantQueryResponses.set(this.parlantCurrentQueryId, []);
                    
                    // Reset state for new message
                    this.parlantAgentReadyStatusReceived = false;
                    if (this.parlantReadyStatusGracePeriodTimer) {
                        clearTimeout(this.parlantReadyStatusGracePeriodTimer);
                        this.parlantReadyStatusGracePeriodTimer = null;
                    }
                    
                    // Reset processed messages for new conversation turn
                    this.parlantProcessedMessageOffsets.clear();
                    this.parlantWaitingForResponse = true;
                    this.parlantIsFirstAgentMessageInSequence = true;
                    this.parlantTypingIndicatorState = 'thinking';
                    
                    // Send user message via Parlant
                    const sentEvent = await this.parlantSendUserMessage(message);
                    
                    // Show typing indicator after 1 second delay (Parlant-specific, like Parlant-ui)
                    // Store timeout reference so we can cancel it if message arrives quickly
                    this.parlantTypingIndicatorTimeout = setTimeout(() => {
                        if (this.parlantWaitingForResponse && !this.parlantProcessedMessageOffsets.size) {
                            const typingIndicator = this.widget?.querySelector('.typing-indicator');
                            if (typingIndicator && !typingIndicator.classList.contains('active')) {
                                typingIndicator.classList.add('active');
                                this.updateParlantTypingIndicator('thinking');
                                this.startJavaScriptTypingAnimation();
                                const chatMessages = this.widget?.querySelector('.chat-messages');
                                const spacer = chatMessages?.querySelector('.chat-spacer');
                                if (chatMessages && spacer) {
                                    chatMessages.insertBefore(typingIndicator, spacer);
                                }
                            }
                        }
                    }, 1000);
                    
                    // Start polling for agent response
                    this.parlantStartPolling();
                    
                    // Poll immediately (don't wait for interval)
                    await this.parlantPollForAgentResponse();
                    // Poll again after a short delay to catch quick responses
                    setTimeout(async () => {
                        await this.parlantPollForAgentResponse();
                    }, 500);
                    
                    // Track the last time we received a message/event
                    window.lastParlantAgentMessageTime = Date.now();
                    window.lastParlantAgentEventTime = Date.now();
                    
                    // Safety check: if no ready status received after 60 seconds, stop polling
                    const safetyTimeout = setTimeout(() => {
                        if (this.parlantWaitingForResponse) {
                            this.parlantStopPolling();
                            this.parlantWaitingForResponse = false;
                            this.parlantAgentReadyStatusReceived = false;
                            if (this.parlantReadyStatusGracePeriodTimer) {
                                clearTimeout(this.parlantReadyStatusGracePeriodTimer);
                            }
                            // Only show error if we haven't received any messages
                            if (this.parlantProcessedMessageOffsets.size === 0) {
                                this.addMessage('Response timeout after 60 seconds. The agent may still be processing your message.', 'bot', false);
                            }
                            // Cancel delayed typing indicator if still pending
                            if (this.parlantTypingIndicatorTimeout) {
                                clearTimeout(this.parlantTypingIndicatorTimeout);
                                this.parlantTypingIndicatorTimeout = null;
                            }
                            
                            // Remove typing indicator on timeout (Parlant-specific)
                            const typingIndicator = this.widget?.querySelector('.typing-indicator');
                            if (typingIndicator && typingIndicator.classList.contains('active')) {
                                typingIndicator.classList.remove('active');
                                this.stopJavaScriptTypingAnimation();
                            }
                        }
                    }, 60000);
                    
                    // Store timeout reference for cleanup
                    window.currentParlantSafetyTimeout = safetyTimeout;
                    
                    // Re-enable input immediately so user can send another message
                    // (polling will continue in background, typing indicator stays active)
                    // Don't call enableSending() as it removes typing indicator
                    // Instead, just enable input functionality
                    this.isWaitingForResponse = false; // Allow sending new messages
                    resetInputState();
                    // Keep typing indicator active - it will be removed when messages arrive or polling stops
                    
                } catch (error) {
                    this.parlantStopPolling();
                    this.parlantWaitingForResponse = false;
                    this.parlantAgentReadyStatusReceived = false;
                    if (this.parlantReadyStatusGracePeriodTimer) {
                        clearTimeout(this.parlantReadyStatusGracePeriodTimer);
                    }
                    this.addMessage(error.message || 'Failed to send message. Please check if the Parlant API server is running.', 'bot', false);
                    enableSending();
                    resetInputState();
                    this.forceEnableInput();
                }
            } else {
                // Regular API call (non-Parlant mode)
            const requestData = this.formatRequestData(message);
            const response = await this.makeApiCall(requestData);

            // Process response with enhanced handling
            let responseText;
            
            try {
                if (this.config.transformResponse) {
                    responseText = this.config.transformResponse(response);
                } else if (typeof response === 'string') {
                    responseText = response;
                } else if (response && typeof response === 'object') {
                    // Handle different response formats
                    if (response.response) {
                        responseText = response.response;
                    } else if (response.message) {
                        responseText = response.message;
                    } else if (response.text) {
                        responseText = response.text;
                    } else if (response.content) {
                        responseText = response.content;
                    } else if (response.answer) {
                        responseText = response.answer;
                    } else {
                        // Fallback: try to extract from apiResponseFormat
                        responseText = response[this.config.apiResponseFormat.response] || 
                                     JSON.stringify(response, null, 2);
                    }
                } else {
                    responseText = String(response);
                }

                // Validate response
                if (!responseText || responseText.trim() === '') {
                    throw new Error('Empty response received from server');
                }

            } catch (error) {
                console.error('Error processing API response:', error);
                responseText = 'Sorry, there was an error processing the response. Please try again.';
            }

            // Add bot response
            this.addMessage(responseText, 'bot', true);
            this.storageManager.saveMessage(responseText, 'bot', isRegeneration);
                
                // Always enable sending and reset input for regular API
                enableSending();
                resetInputState();
            }
    
        } catch (error) {
            console.error('API Error:', error);
            this.addMessage('Sorry, there was an error processing your request.', 'bot', false);
            enableSending();
            resetInputState();
            // Force enable input functionality on error
            this.forceEnableInput();
        }
    }
    
    // Mobile browser detection method
    isMobileBrowser() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    // Clean chat toggle method
    toggleChat() {
        const chatWindow = this.widget.querySelector('.chat-window');
        const chatToggle = this.widget.querySelector('.chat-toggle');
        const chatInput = this.widget.querySelector('.chat-input .chat-textarea');
        const isActive = chatWindow.classList.contains('active');
        
        if (isActive) {
            this.closeChat();
        } else {
            this.openChat();
        }
    }
    
    // Clean close method with proper cleanup
    closeChat() {
        const chatWindow = this.widget.querySelector('.chat-window');
        const chatToggle = this.widget.querySelector('.chat-toggle');
        const chatInput = this.widget.querySelector('.chat-input .chat-textarea');
        
        // Cleanup Parlant polling if enabled
        if (this.config.parlant.enabled) {
            this.parlantStopPolling();
        }
        

        
        // Clean input state completely
        if (chatInput) {
            chatInput.classList.remove('cursor-active', 'mobile-focused');
            chatInput.blur();
            chatInput.style.caretColor = 'transparent';
            
            // Clean up mobile input handlers if they exist
            if (this._mobileInputCleanup) {
                this._mobileInputCleanup();
                this._mobileInputCleanup = null;
            }
        }
        
        // Remove any active modal states
        if (this.activeModal) {
            this.removeActiveForm();
        }
        
        // Restore document scroll behavior
        document.body.style.setProperty('overflow', '', 'important');
        document.body.style.setProperty('position', '', 'important');
        document.body.style.setProperty('width', '', 'important');
        document.documentElement.style.setProperty('overflow', '', 'important');
        
        // Clean up any remaining event listeners that might interfere
        const chatMessages = this.widget.querySelector('.chat-messages');
        if (chatMessages) {
            chatMessages.style.overflow = '';
            chatMessages.style.overscrollBehavior = '';
        }
        
        // Close window with animation
        chatWindow.classList.remove('active');
        this.updateToggleIcon(false);
        
        setTimeout(() => {
            chatWindow.style.display = 'none';
            
            // Show text box when chat closes directly (only if not manually closed)
            const textBox = this.widget.querySelector('.chat-text-box');
            if (textBox && this.config.showTextBox && !this._textBoxManuallyClosed) {
                textBox.style.display = 'block';
                // Reset any lingering styles
                textBox.style.opacity = '1';
                textBox.style.transform = 'translateY(0)';
            }
            
            // Re-enable toggle button animation when chat closes
            this.enableToggleButtonAnimation();
        }, 300);
        

    }
    
    // Clean open method with proper initialization
    openChat() {
        const chatWindow = this.widget.querySelector('.chat-window');
        const chatInput = this.widget.querySelector('.chat-input .chat-textarea');
        const textBox = this.widget.querySelector('.chat-text-box');
        

        
        // Hide text box when chat opens directly (only if not manually closed)
        if (textBox && this.config.showTextBox && !this._textBoxManuallyClosed) {
            textBox.style.display = 'none';
        }
        
        // Ensure window is visible
        chatWindow.style.display = 'flex';
        this.updateToggleIcon(true);
        
        // Disable toggle button animation when chat opens
        this.disableToggleButtonAnimation();
        
        requestAnimationFrame(() => {
            chatWindow.classList.add('active');
            
            // Force mobile fullscreen behavior for npm/CDN builds
            if (window.innerWidth <= 480) {
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
                
                // Ensure body doesn't interfere with fullscreen
                document.body.style.setProperty('overflow', 'hidden', 'important');
                document.documentElement.style.setProperty('overflow', 'hidden', 'important');
            }
            
            // Setup mobile input if needed - only once
            if (this.isMobileBrowser() && this.config.enableEnhancedMobileInput && chatInput && !this._mobileInputSetup) {
                this.setupCleanMobileInput(chatInput);
                this._mobileInputSetup = true;
            }
            
            // Ensure input is ready but not focused initially
            if (chatInput) {
                chatInput.style.caretColor = 'transparent';
                chatInput.classList.remove('mobile-focused');
            }
            
            // Always scroll to bottom when chat opens
            setTimeout(() => {
                this.scrollToBottom();
            }, 100);
            
            // Show form if configured
            if (this.config.showFormOnStart && this.config.hubspot?.enabled && 
                !this.userManager.hasSubmittedForm()) {
                setTimeout(() => {
                    this.showHubSpotForm();
                }, 500);
            }
        });
        

    }
    
    // Helper method to update toggle icon
    updateToggleIcon(isOpen) {
        const chatToggle = this.widget.querySelector('.chat-toggle');
        if (!chatToggle) return;
        
        if (isOpen) {
            // Show close icon
            chatToggle.innerHTML = `<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z'/%3E%3C/svg%3E" alt="Close">`;
        } else {
            // Show custom icon or default
            if (this.config.toggleButtonIcon) {
                const icon = this.config.toggleButtonIcon;
                if (icon.length <= 4 && /\p{Emoji}/u.test(icon)) {
                    chatToggle.innerHTML = `<span style="font-size: 24px;">${icon}</span>`;
                } else if (icon.startsWith('http') || icon.startsWith('data:image') || icon.startsWith('/')) {
                    chatToggle.innerHTML = `<img src="${icon}" alt="Chat" style="width: 24px; height: 24px;">`;
                } else if (icon.trim().startsWith('<svg')) {
                    chatToggle.innerHTML = icon;
                } else {
                    chatToggle.innerHTML = `<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z'/%3E%3C/svg%3E" alt="Chat">`;
                }
            } else {
                chatToggle.innerHTML = `<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z'/%3E%3C/svg%3E" alt="Chat">`;
            }
        }
    }
    
    // Clean mobile input system - fixed for proper UX
    setupCleanMobileInput(inputElement) {
        
        // Track focus state
        let isInputFocused = false;
        
        // Clean input setup
        const setupInput = () => {
            inputElement.removeAttribute('readonly');
            inputElement.removeAttribute('disabled');
            inputElement.style.userSelect = 'text';
            inputElement.style.webkitUserSelect = 'text';
            inputElement.style.pointerEvents = 'auto';
            inputElement.style.fontSize = '16px'; // Prevent iOS zoom
            inputElement.style.webkitAppearance = 'none';
            inputElement.style.appearance = 'none';
        };
        
        // Enhanced focus management for mobile
        const focusInput = ({ forceEnd = true } = {}) => {
            
            setupInput();
            isInputFocused = true;
            
            // Multiple focus strategies for maximum compatibility
                inputElement.focus();
            inputElement.click();
                
            // iOS specific enhancements
                if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                // Force iOS keyboard with temporary input trick
                const tempInput = document.createElement('input');
                tempInput.style.position = 'absolute';
                tempInput.style.left = '-9999px';
                tempInput.style.fontSize = '16px';
                tempInput.style.opacity = '0';
                document.body.appendChild(tempInput);
                tempInput.focus();
                
                setTimeout(() => {
                    inputElement.focus();
                    if (isInputFocused && forceEnd) {
                        inputElement.setSelectionRange(inputElement.value.length, inputElement.value.length);
                    }
                    document.body.removeChild(tempInput);
                }, 50);
            } else {
                // Android and other mobile devices
                setTimeout(() => {
                    if (isInputFocused && forceEnd) {
                        inputElement.setSelectionRange(inputElement.value.length, inputElement.value.length);
                    }
                }, 100);
            }
        };
        
        // Clean blur management
        const blurInput = () => {
            isInputFocused = false;
            inputElement.blur();
            inputElement.classList.remove('mobile-focused');
            // Remove cursor completely
            inputElement.style.caretColor = 'transparent';
        };
        
        // Input focus handler - show cursor when focused
        inputElement.addEventListener('focus', (e) => {

            isInputFocused = true;
            inputElement.classList.add('mobile-focused');
            inputElement.style.caretColor = 'auto';
            inputElement.style.cursor = 'text';
        });
        
        // Input blur handler - only hide cursor when clicking outside chat
        inputElement.addEventListener('blur', (e) => {

            // Short delay to check if focus moved to chat elements
            setTimeout(() => {
                const activeElement = document.activeElement;
                const chatWindow = this.widget.querySelector('.chat-window');
                
                // Only hide cursor if focus moved completely outside chat
                if (!chatWindow.contains(activeElement)) {
                    isInputFocused = false;
                    inputElement.classList.remove('mobile-focused');
                    inputElement.style.caretColor = 'transparent';
                }
            }, 100);
        });
        
        // Enhanced click handler for better mobile touch response
        inputElement.addEventListener('click', () => {
            if (!isInputFocused) {
                focusInput({ forceEnd: false });
            }
        });
        
        // Enhanced touch handlers for mobile
        inputElement.addEventListener('touchstart', () => {
            if (!isInputFocused) {
                focusInput({ forceEnd: false });
            }
        });
        
        inputElement.addEventListener('touchend', () => {
            if (!isInputFocused) {
                focusInput({ forceEnd: false });
            }
        });
        
        // Enhanced container click handler with larger touch area
        const container = inputElement.closest('.chat-input');
        if (container) {
            // Create invisible overlay to ensure full clickability
            const overlay = document.createElement('div');
            overlay.style.position = 'absolute';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.right = '0';
            overlay.style.bottom = '0';
            // IMPORTANT: do NOT block the send / attach buttons.
            // This overlay previously intercepted taps and prevented the send button from working on mobile.
            overlay.style.zIndex = '0';
            overlay.style.background = 'transparent';
            overlay.style.cursor = 'text';
            overlay.style.pointerEvents = 'none';
            container.style.position = 'relative';
            container.appendChild(overlay);
            
            // Enhanced container handlers
            const handleContainerInteraction = (e, type) => {
                // Allow normal interaction with real controls inside the input row
                if (e && e.target && e.target.closest && e.target.closest('.send-button, .file-button')) {
                    return;
                }
                if (e && (e.target === inputElement || (e.target.closest && e.target.closest('.chat-textarea')))) {
                    return;
                }
                e.preventDefault();
                e.stopPropagation();
    
                focusInput();
            };
            
            container.addEventListener('click', (e) => handleContainerInteraction(e, 'clicked'));
            container.addEventListener('touchstart', (e) => handleContainerInteraction(e, 'touched'));
            container.addEventListener('touchend', (e) => handleContainerInteraction(e, 'touch ended'));
        }
        
        // Global click handler to blur when clicking outside chat
        const handleOutsideClick = (e) => {
            const chatWindow = this.widget.querySelector('.chat-window');
            if (isInputFocused && !chatWindow.contains(e.target)) {

                blurInput();
            }
        };
        
        document.addEventListener('click', handleOutsideClick);
        document.addEventListener('touchstart', handleOutsideClick);
        
        // Store cleanup function
        this._mobileInputCleanup = () => {
            document.removeEventListener('click', handleOutsideClick);
            document.removeEventListener('touchstart', handleOutsideClick);
        };
        
        // Initial setup
        setupInput();
        
        // Only hide cursor on mobile initially
        if (this.isMobileBrowser()) {
            inputElement.style.caretColor = 'transparent'; // Start with hidden cursor on mobile
        } else {
            inputElement.style.caretColor = 'auto'; // Show cursor on desktop
        }
        

    }

    // Backwards-compatible helper: older code paths call this after sending.
    // On mobile we simply ensure the textarea is enabled and interactive.
    enableMobileInputInteraction(inputElement) {
        if (!inputElement) return;
        try {
            inputElement.removeAttribute('readonly');
            inputElement.disabled = false;
            inputElement.readOnly = false;
            inputElement.style.pointerEvents = 'auto';
            inputElement.style.userSelect = 'text';
            inputElement.style.webkitUserSelect = 'text';
            inputElement.style.caretColor = 'auto';
        } catch (_) {}
    }
    
    // Desktop input system - simple and effective
    setupDesktopInput(inputElement) {
        
        // Ensure proper input properties
        inputElement.removeAttribute('readonly');
        inputElement.removeAttribute('disabled');
        inputElement.style.userSelect = 'text';
        inputElement.style.pointerEvents = 'auto';
        inputElement.style.cursor = 'text';
        inputElement.style.caretColor = 'auto';
        
        // Simple focus/blur handlers for desktop
        inputElement.addEventListener('focus', () => {

            inputElement.style.caretColor = 'auto';
            inputElement.style.cursor = 'text';
            inputElement.classList.add('cursor-active');
        });
        
        inputElement.addEventListener('blur', () => {

            // Keep cursor visible on desktop even when blurred
            inputElement.style.caretColor = 'auto';
            inputElement.style.cursor = 'text';
        });
        
        inputElement.addEventListener('click', () => {

            inputElement.style.caretColor = 'auto';
            inputElement.style.cursor = 'text';
            inputElement.classList.add('cursor-active');
        });
        

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

    formatRequestData(message, files = []) {
        // Create base request object
        const baseRequest = {
            [this.config.apiRequestFormat.query]: message,
            [this.config.apiRequestFormat.userId]: this.userManager.currentUser,
            [this.config.apiRequestFormat.domain]: this.userManager.domain
        };

        // Add files if provided
        if (files && files.length > 0) {
            // For APIs that expect a single 'image' field, use the first file
            if (this.config.apiDataFormat === 'form-data' && files.length === 1) {
                baseRequest['image'] = files[0];
            } else {
                // For multiple files or different field naming
            files.forEach((file, index) => {
                baseRequest[`file_${index}`] = file;
            });
            baseRequest.fileCount = files.length;
            }
        }

        // Allow for custom request transformation
        if (this.config.transformRequest) {
            return this.config.transformRequest(baseRequest);
        }

        return baseRequest;
    }

    // Update file preview display
    updateFilePreview(files, filePreview) {
        if (files.length === 0) {
            filePreview.style.display = 'none';
            filePreview.innerHTML = '';
            return;
        }

        filePreview.style.display = 'block';
        filePreview.innerHTML = files.map((file, index) => {
            const size = this.formatFileSize(file.size);
            return `
                <div class="file-preview-item">
                    <div class="file-info">
                        <span class="file-name">${file.name}</span>
                        <span class="file-size">${size}</span>
                    </div>
                    <button class="remove-file" data-index="${index}">×</button>
                </div>
            `;
        }).join('');
    }

    // Format file size for display
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Enhanced method to handle file uploads
    async sendMessageWithFiles(message, files = []) {
        if (this.isWaitingForResponse || this.isTypewriterActive) {
            return;
        }

        const chatInput = this.widget.querySelector('.chat-input .chat-textarea');
        const typingIndicator = this.widget.querySelector('.typing-indicator');

        try {
            // Disable sending and show typing indicator
            this.isWaitingForResponse = true;
            this.disableSendingFunctionality();
            typingIndicator.classList.add('active');
            // Start JavaScript animation
            setTimeout(() => this.startJavaScriptTypingAnimation(), 100);

            // No automatic scroll - let natural positioning handle it

            // Add user message
            this.addMessage(message, 'user');
            this.storageManager.saveMessage(message, 'user');

            // Format request data with files
            const requestData = this.formatRequestData(message, files);
            
            // Set multipart content type for file uploads
            const originalHeaders = { ...this.config.apiHeaders };
            this.config.apiHeaders['Content-Type'] = 'multipart/form-data';

            // Make API call
            const response = await this.makeApiCall(requestData);

            // Restore original headers
            this.config.apiHeaders = originalHeaders;

            // Process response
            let responseText;
            
            try {
                if (this.config.transformResponse) {
                    responseText = this.config.transformResponse(response);
                } else if (typeof response === 'string') {
                    responseText = response;
                } else if (response && typeof response === 'object') {
                    if (response.response) {
                        responseText = response.response;
                    } else if (response.message) {
                        responseText = response.message;
                    } else if (response.text) {
                        responseText = response.text;
                    } else if (response.content) {
                        responseText = response.content;
                    } else if (response.answer) {
                        responseText = response.answer;
                    } else {
                        responseText = response[this.config.apiResponseFormat.response] || 
                                     JSON.stringify(response, null, 2);
                    }
                } else {
                    responseText = String(response);
                }

                if (!responseText || responseText.trim() === '') {
                    throw new Error('Empty response received from server');
                }

            } catch (error) {
                console.error('Error processing API response:', error);
                responseText = 'Sorry, there was an error processing the response. Please try again.';
            }

            // Add bot response
            this.addMessage(responseText, 'bot', true);
            this.storageManager.saveMessage(responseText, 'bot');

        } catch (error) {
            console.error('API Error:', error);
            this.addMessage('Sorry, there was an error processing your request.', 'bot', false);
        } finally {
            // Always enable sending and reset input
            this.isWaitingForResponse = false;
            this.enableSendingFunctionality();
            typingIndicator.classList.remove('active');
            // Stop JavaScript animation
            this.stopJavaScriptTypingAnimation();
            // Force enable input functionality on error
            this.forceEnableInput();
            
            // Ensure input is cleared and reset
            chatInput.value = '';
            if (!(this.isMobileBrowser() && this.config.enableEnhancedMobileInput)) {
                chatInput.setAttribute('readonly', 'true');
            } else {
                chatInput.removeAttribute('readonly');
            }
            chatInput.classList.remove('cursor-active');

            if (this.isMobileBrowser()) {
                setTimeout(() => {
                    this.enableMobileInputInteraction(chatInput);
                }, 100);
            } else {
                chatInput.focus();
            }
        }
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

        // Check if we need to send as multipart/form-data
        const shouldUseMultipart = this.config.useMultipartFormData || 
                                  this.config.apiHeaders['Content-Type']?.includes('multipart/form-data') || 
                                  this.config.apiMethod === 'POST' && this.config.apiEndpoint.includes('upload') ||
                                  this.config.apiDataFormat === 'form-data';

        let requestBody;
        let finalHeaders = { ...headers };

        if (shouldUseMultipart) {
            // Create FormData for multipart request
            const formData = new FormData();
            
            // Add all request data to FormData
            Object.keys(requestData).forEach(key => {
                const value = requestData[key];
                
                // Handle different types of data
                if (value instanceof File) {
                    formData.append(key, value);
                } else if (value instanceof Blob) {
                    formData.append(key, value);
                } else if (typeof value === 'object' && value !== null) {
                    // Convert objects to JSON strings for form data
                    formData.append(key, JSON.stringify(value));
                } else {
                    formData.append(key, String(value));
                }
            });

            requestBody = formData;
            
            // Remove Content-Type header to let browser set it with boundary
            delete finalHeaders['Content-Type'];
        } else {
            // Use JSON for regular requests
            requestBody = JSON.stringify(requestData);
            finalHeaders['Content-Type'] = 'application/json';
        }

        // Make the API call
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.apiTimeout);

        try {
            const response = await fetch(this.config.apiEndpoint, {
                method: this.config.apiMethod,
                headers: finalHeaders,
                body: requestBody,
                signal: controller.signal
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            }

            // Handle different response types
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                return data;
            } else if (contentType && contentType.includes('text/')) {
                const text = await response.text();
                return { response: text };
            } else {
                // Handle binary responses or other types
                const blob = await response.blob();
                return { response: URL.createObjectURL(blob) };
            }

        } catch (error) {
            // Enhanced error handling
            if (error.name === 'AbortError') {
                throw new Error('Request timed out. Please try again.');
            } else if (error.message.includes('Failed to fetch')) {
                throw new Error('Network error. Please check your internet connection.');
            } else if (error.message.includes('SSL_PROTOCOL_ERROR')) {
                throw new Error('Secure connection error. Please ensure the server supports HTTPS.');
            } else {
                throw error;
            }
        } finally {
            clearTimeout(timeoutId);
        }
    }

    processApiResponse(data, typingIndicator) {
        typingIndicator.classList.remove('active');
        // Stop JavaScript animation
        this.stopJavaScriptTypingAnimation();
        
        // Enhanced response processing
        let responseText;
        
        try {
            if (this.config.transformResponse) {
                responseText = this.config.transformResponse(data);
            } else if (typeof data === 'string') {
                responseText = data;
            } else if (data && typeof data === 'object') {
                // Handle different response formats
                if (data.response) {
                    responseText = data.response;
                } else if (data.message) {
                    responseText = data.message;
                } else if (data.text) {
                    responseText = data.text;
                } else if (data.content) {
                    responseText = data.content;
                } else if (data.answer) {
                    responseText = data.answer;
                } else {
                    // Fallback: try to extract from apiResponseFormat
                    responseText = data[this.config.apiResponseFormat.response] || 
                                 JSON.stringify(data, null, 2);
                }
            } else {
                responseText = String(data);
            }

            // Validate response
            if (!responseText || responseText.trim() === '') {
                throw new Error('Empty response received from server');
            }

        } catch (error) {
            console.error('Error processing API response:', error);
            responseText = 'Sorry, there was an error processing the response. Please try again.';
        }

        // Ensure chat window stays open and active
        const chatWindow = this.widget.querySelector('.chat-window');
        chatWindow.classList.add('active');
        
        this.addMessage(responseText, 'bot', true);
        this.storageManager.saveMessage(responseText, 'bot');
    }

    handleApiError(error, typingIndicator) {
        console.error('API Error:', error);
        typingIndicator.classList.remove('active');
        // Stop JavaScript animation
        this.stopJavaScriptTypingAnimation();
        
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
        
        // Force enable input functionality on error
        this.isWaitingForResponse = false;
        this.enableSendingFunctionality();
        this.forceEnableInput();
        
        if (this.config.onError) {
            this.config.onError(error);
        }
    }

    updateUIForSending(typingIndicator, chatInput) {
        this.addMessage(chatInput.value.trim(), 'user');
        this.storageManager.saveMessage(chatInput.value.trim(), 'user');
        chatInput.value = '';
        typingIndicator.classList.add('active');
        // Start JavaScript animation
        setTimeout(() => this.startJavaScriptTypingAnimation(), 100);
        this.isWaitingForResponse = true;
        this.disableSendingFunctionality();
    }

    resetUIAfterSending(typingIndicator) {
        this.isWaitingForResponse = false;
        if (!this.isTypewriterActive) {
            this.enableSendingFunctionality();
        }
        typingIndicator.classList.remove('active');
        // Stop JavaScript animation
        this.stopJavaScriptTypingAnimation();
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
        // Clean up mobile input handlers
        if (this._mobileInputCleanup) {
            this._mobileInputCleanup();
            this._mobileInputCleanup = null;
        }
        
        // Clean up mobile fullscreen handlers
        if (this._mobileFullscreenCleanup) {
            this._mobileFullscreenCleanup();
            this._mobileFullscreenCleanup = null;
        }
        
        // Reset mobile setup flag
        this._mobileInputSetup = false;
        
        // Remove any active forms
        this.removeActiveForm();
        
        // Restore document styles
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.documentElement.style.overflow = '';
        
        // Remove widget from DOM
        if (this.widget) {
            this.widget.remove();
            this.widget = null;
        }
        

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
            const formRow = chatMessages.querySelector('.hubspot-form-row');
            
            messages.forEach(message => {
                if (message.id !== 'greeting-row' && !message.classList.contains('hubspot-form-row')) {
                    message.remove();
                }
            });

            // Clear local storage
            this.storageManager.clearHistory();

            // Only delete backend history if explicitly enabled AND endpoint exists
            if (this.config.enableServerHistoryDelete === true && this.config.deleteEndpoint) {

                this.deleteBackendHistory()
                    .then(() => {

                    })
                    .catch(error => {
                        console.error('Failed to delete backend history:', error);
                    });
            } else {

            }

            // Ensure greeting message exists and is properly styled
            const existingGreeting = chatMessages.querySelector('#greeting-row');
            if (!existingGreeting) {
                this.addGreetingMessage();
            } else {
                // If greeting exists but doesn't have avatar, refresh it
                const greetingHasAvatar = existingGreeting.querySelector('.ai-avatar');
                if (!greetingHasAvatar) {
                    existingGreeting.remove();
                this.addGreetingMessage();
                }
            }

            // Clear input
            const chatInput = this.widget.querySelector('.chat-input .chat-textarea');
            if (chatInput) {
                chatInput.value = '';
            }



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
            // ADVANCED: Create greeting message with perfect width consistency
            // Use the exact same structure and timing as addMessage for bot messages
            
            // Step 1: Create the complete DOM structure
            const messageRow = document.createElement('div');
            messageRow.className = 'message-row';
            messageRow.id = 'greeting-row';
            
            const botMessageContainer = document.createElement('div');
            botMessageContainer.className = 'bot-message-container';
            
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message bot-message';
            
            // Step 2: Generate AI avatar using the proper method with correct CSS classes
            const avatarHtml = this.generateGreetingAvatar();
            
            messageDiv.innerHTML = avatarHtml;
            
            // Step 3: Create content container (identical to addMessage)
            const contentContainer = document.createElement('div');
            contentContainer.className = 'message-content';
            contentContainer.textContent = this.config.greeting;
            messageDiv.appendChild(contentContainer);
            
            // Step 4: Do not create actions container for greeting message - greeting should not have action buttons
            let actionsDiv = null;
            
            // Step 5: Assemble the complete structure
            botMessageContainer.appendChild(messageDiv);
            // No action buttons for greeting message
            messageRow.appendChild(botMessageContainer);
            
            // Step 6: Insert at the beginning of chat messages
            chatMessages.insertBefore(messageRow, chatMessages.firstChild);
            
            // Step 7: Comprehensive width synchronization (multiple attempts)
            this.synchronizeGreetingWidth(messageRow);
            
            // Step 8: Additional synchronization attempts to ensure width consistency
            setTimeout(() => {
                this.synchronizeGreetingWidth(messageRow);
            }, 100);
            
            setTimeout(() => {
                this.synchronizeGreetingWidth(messageRow);
            }, 300);
            

        }
    }

    // COMPREHENSIVE: Force greeting message width to match other AI responses
    synchronizeGreetingWidth(greetingRow) {
        // Step 1: Wait for DOM to be fully rendered
        requestAnimationFrame(() => {
            // Step 2: Force recalculation of styles
            const greetingMessage = greetingRow.querySelector('.bot-message');
            const greetingContainer = greetingRow.querySelector('.bot-message-container');
            
            if (greetingMessage && greetingContainer) {
                // Force style recalculation
                greetingMessage.offsetHeight;
                greetingContainer.offsetHeight;
                
                // Step 3: Apply aggressive width synchronization
                const chatMessages = this.widget.querySelector('.chat-messages');
                const otherBotMessages = chatMessages.querySelectorAll('.bot-message:not(#greeting-row .bot-message)');
                
                if (otherBotMessages.length > 0) {
                    // Get computed styles from other bot messages
                    const referenceMessage = otherBotMessages[0];
                    const referenceContainer = referenceMessage.closest('.bot-message-container');
                    const computedStyle = window.getComputedStyle(referenceMessage);
                    const containerStyle = referenceContainer ? window.getComputedStyle(referenceContainer) : null;
                    
                    // Apply the same width constraints aggressively
                    greetingMessage.style.setProperty('max-width', computedStyle.maxWidth, 'important');
                    greetingMessage.style.setProperty('width', computedStyle.width, 'important');
                    greetingMessage.style.setProperty('min-width', computedStyle.minWidth, 'important');
                    
                    // Force container width to match
                    if (containerStyle) {
                        greetingContainer.style.setProperty('max-width', containerStyle.maxWidth, 'important');
                        greetingContainer.style.setProperty('width', containerStyle.width, 'important');
                        greetingContainer.style.setProperty('min-width', containerStyle.minWidth, 'important');
                    } else {
                        // Fallback: force 80% width
                        greetingContainer.style.setProperty('max-width', '80%', 'important');
                        greetingContainer.style.setProperty('width', '80%', 'important');
                    }
                } else {
                    // Fallback: force standard width if no other messages exist
                    greetingContainer.style.setProperty('max-width', '80%', 'important');
                    greetingContainer.style.setProperty('width', '80%', 'important');
                    greetingMessage.style.setProperty('max-width', '100%', 'important');
                    greetingMessage.style.setProperty('width', '100%', 'important');
                }
                
                // Step 4: Force another recalculation
                greetingMessage.offsetHeight;
                greetingContainer.offsetHeight;
                
                // Step 5: Additional force after a short delay
                setTimeout(() => {
                    greetingMessage.style.setProperty('max-width', '100%', 'important');
                    greetingMessage.style.setProperty('width', '100%', 'important');
                    greetingContainer.style.setProperty('max-width', '80%', 'important');
                    greetingContainer.style.setProperty('width', '80%', 'important');
                }, 50);
                
        
            }
        });
    }

    ensureGreetingMessageWithAvatar() {
        const chatMessages = this.widget.querySelector('.chat-messages');
        const existingGreeting = chatMessages.querySelector('#greeting-row');
        
        if (existingGreeting) {
            // Check if greeting has avatar
            const greetingHasAvatar = existingGreeting.querySelector('.ai-avatar');
            if (!greetingHasAvatar) {
    
                existingGreeting.remove();
                this.addGreetingMessage();
            } else {

                // ADVANCED: Re-synchronize width even for existing greeting
                this.synchronizeGreetingWidth(existingGreeting);
            }
        } else {

            this.addGreetingMessage();
        }
    }
    
    ensureSendButtonIconSize() {

        const sendButton = this.widget.querySelector('.send-button');
        const sendButtonImg = this.widget.querySelector('.send-button img');
        
        if (sendButton && sendButtonImg) {
            // Force apply the icon size with inline styles as backup
            const iconSize = this.config.sendButtonIconSize;
            
            // Apply to button
            sendButton.style.width = `${iconSize + 16}px`;
            sendButton.style.height = `${iconSize + 16}px`;
            sendButton.style.minWidth = `${iconSize + 16}px`;
            sendButton.style.minHeight = `${iconSize + 16}px`;
            
            // Apply to image
            sendButtonImg.style.width = `${iconSize}px`;
            sendButtonImg.style.height = `${iconSize}px`;
            sendButtonImg.style.minWidth = `${iconSize}px`;
            sendButtonImg.style.minHeight = `${iconSize}px`;
            sendButtonImg.style.maxWidth = `${iconSize}px`;
            sendButtonImg.style.maxHeight = `${iconSize}px`;
            sendButtonImg.style.objectFit = 'contain';
            sendButtonImg.style.display = 'block';
            sendButtonImg.style.flexShrink = '0';
            

        }
    }

    applyToggleButtonAnimation() {
        const chatToggle = this.widget.querySelector('.chat-toggle');
        if (chatToggle && this.config.toggleButtonAnimation > 0) {
            // Remove any existing animation classes
            chatToggle.classList.remove('animation-1', 'animation-2', 'animation-3', 'animation-4', 'animation-5');
            
            // Add the specific animation class
            chatToggle.classList.add(`animation-${this.config.toggleButtonAnimation}`);
            

        }
    }
    
    forceStyleReapplication() {
        // Force reapplication of critical styles for npm/CDN builds
        const avatarIcons = this.widget.querySelectorAll('.ai-avatar-icon:not(.emoji-avatar):not(.image-avatar)');
        avatarIcons.forEach(icon => {
            if (!icon.style.backgroundColor) {
                icon.style.setProperty('background-color', this.config.primaryColor || '#0084ff', 'important');
            }
        });
        
        // Specifically fix greeting message avatars
        const greetingAvatars = this.widget.querySelectorAll('#greeting-row .ai-avatar-icon:not(.emoji-avatar):not(.image-avatar)');
        greetingAvatars.forEach(icon => {
            icon.style.setProperty('background-color', this.config.primaryColor || '#0084ff', 'important');
        });
        
        // Force reapplication of typing indicator with BULLETPROOF JavaScript animation
        const typingDots = this.widget.querySelectorAll('.typing-indicator span');
        
        typingDots.forEach((dot, index) => {
            // Ensure dot appearance first
            dot.style.setProperty('background', '#666', 'important');
            dot.style.setProperty('background-color', '#666', 'important');
            dot.style.setProperty('display', 'inline-block', 'important');
            dot.style.setProperty('visibility', 'visible', 'important');
            dot.style.setProperty('width', '10px', 'important');
            dot.style.setProperty('height', '10px', 'important');
            dot.style.setProperty('border-radius', '50%', 'important');
            dot.style.setProperty('margin', '0 3px', 'important');
            dot.style.setProperty('box-shadow', 'none', 'important');
            
            // Clear any CSS animations
            dot.style.animation = 'none';
            dot.style.webkitAnimation = 'none';
        });
        
        // Start bulletproof JavaScript animation
        setTimeout(() => {
            this.startJavaScriptTypingAnimation();
        }, 100);
        
        // Force typing indicator container size and remove shadow
        const typingIndicator = this.widget.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.style.setProperty('padding', '16px 20px', 'important');
            typingIndicator.style.setProperty('height', '50px', 'important');
            typingIndicator.style.setProperty('min-width', '85px', 'important');
            typingIndicator.style.setProperty('max-width', '100px', 'important');
            typingIndicator.style.setProperty('border-radius', '24px', 'important');
            typingIndicator.style.setProperty('background', '#f0f2f5', 'important');
            typingIndicator.style.setProperty('box-shadow', 'none', 'important');
        }
        
        // Force removal of bot message shadows
        const botMessages = this.widget.querySelectorAll('.bot-message, .ai-message');
        botMessages.forEach(message => {
            message.style.setProperty('box-shadow', 'none', 'important');
        });
        
        // Force mobile fullscreen behavior for npm/CDN builds
        if (window.innerWidth <= 480) {
            const chatWindow = this.widget.querySelector('.chat-window');
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

    // Disable toggle button animation (when chat opens)
    disableToggleButtonAnimation() {
        const chatToggle = this.widget.querySelector('.chat-toggle');
        if (chatToggle) {
            // Remove all animation classes
            chatToggle.classList.remove('animation-1', 'animation-2', 'animation-3', 'animation-4', 'animation-5');

        }
    }

    // Enable toggle button animation (when chat closes)
    enableToggleButtonAnimation() {
        const chatToggle = this.widget.querySelector('.chat-toggle');
        if (chatToggle && this.config.toggleButtonAnimation > 0) {
            // Re-apply the configured animation
            chatToggle.classList.add(`animation-${this.config.toggleButtonAnimation}`);

        }
    }

    setupTextBoxEventListeners() {
        const textBoxClose = this.widget.querySelector('.chat-text-box-close');
        const textBox = this.widget.querySelector('.chat-text-box');
        
        // Robust text box management
        if (textBox) {
            // Mark text box as persistent if showTextBox is true
            if (this.config.showTextBox) {
                textBox.setAttribute('data-persistent', 'true');
                textBox.style.pointerEvents = 'auto';
                textBox.style.visibility = 'visible';
                textBox.style.opacity = '1';
                
                // Prevent any accidental removal (but respect manual close)
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.type === 'childList') {
                            mutation.removedNodes.forEach((node) => {
                                if (node === textBox && this.config.showTextBox && !this._textBoxManuallyClosed) {
                                    console.warn('🛡️ Text box removal prevented - showTextBox is true');
                                    // Re-add if accidentally removed (but not if manually closed)
                                    if (!this.widget.querySelector('.chat-text-box')) {
                                        this.widget.insertBefore(textBox, this.widget.firstChild);
                                    }
                                }
                            });
                        }
                    });
                });
                
                observer.observe(this.widget, { childList: true, subtree: true });
                

            }
            
            // Setup close button functionality only if close button is enabled
            if (textBoxClose && this.config.showTextBoxCloseButton) {
                textBoxClose.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Only allow manual closing if user explicitly clicks close
                    if (this.config.showTextBoxCloseButton) {
                        // Set flag to indicate manual close
                        this._textBoxManuallyClosed = true;
                        
                        // Direct close without transition
                        textBox.style.display = 'none';
                        
        
                    }
                });
                
            } else {
            }
        }
    }

    // Setup click outside to close functionality
    setupClickOutsideToClose() {
        document.addEventListener('click', (event) => {
            const chatWindow = this.widget.querySelector('.chat-window');
            const chatToggle = this.widget.querySelector('.chat-toggle');
            const isActive = chatWindow && chatWindow.classList.contains('active');
            
            // Only handle clicks when chat is open
            if (!isActive) return;
            
            // Check if click is outside the chat widget
            const isClickInsideWidget = this.widget.contains(event.target);
            
            // If click is outside the widget, close the chat
            if (!isClickInsideWidget) {

                this.closeChat();
            }
        });
        

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

    // Scroll to show new message at the top of the view
    scrollToShowNewMessage(messageElement) {
        const chatMessages = this.widget.querySelector('.chat-messages');
        if (!chatMessages || !messageElement) return;

        // Use requestAnimationFrame for smooth scrolling
        requestAnimationFrame(() => {
            // Position the new message near the top of the view with small buffer
            const messageTop = messageElement.offsetTop;
            const targetScrollTop = Math.max(0, messageTop - 20); // 20px buffer from top
            
            chatMessages.scrollTo({
                top: targetScrollTop,
                behavior: 'smooth'
            });
        });
    }

    // Scroll to the bottom of chat container
    scrollToBottom() {
        const chatMessages = this.widget.querySelector('.chat-messages');
        if (!chatMessages) return;

        // Use requestAnimationFrame for smooth scrolling
        requestAnimationFrame(() => {
            chatMessages.scrollTo({
                top: chatMessages.scrollHeight,
                behavior: 'smooth'
            });
        });
    }

    // Scroll to show the last user message when opening chat
    scrollToLastUserMessage() {
        const chatMessages = this.widget.querySelector('.chat-messages');
        if (!chatMessages) return;

        // Find all user message rows (they contain .user-message as direct child)
        const allMessageRows = chatMessages.querySelectorAll('.message-row');
        const userMessageRows = Array.from(allMessageRows).filter(row => 
            row.querySelector('.user-message')
        );
        
        if (userMessageRows.length === 0) return;

        // Get the last user message row
        const lastUserMessage = userMessageRows[userMessageRows.length - 1];
        
        // Use requestAnimationFrame for smooth scrolling
        requestAnimationFrame(() => {
            // Position the last user message near the top of the view
            const messageTop = lastUserMessage.offsetTop;
            const targetScrollTop = Math.max(0, messageTop - 20); // 20px buffer from top
            
            chatMessages.scrollTo({
                top: targetScrollTop,
                behavior: 'smooth'
            });
        });
    }

    // Smart scroll to show latest message - minimal scrolling with spacer
    scrollToLatestMessage() {
        const chatMessages = this.widget.querySelector('.chat-messages');
        if (!chatMessages) return;

        // Skip scrolling during typewriter animation
        if (this.isTypewriterActive) return;

        // Use requestAnimationFrame for smooth scrolling
        requestAnimationFrame(() => {
            // Get the last actual message (not including spacer or typing indicator)
            const messageRows = chatMessages.querySelectorAll('.message-row:not(#greeting-row)');
            if (messageRows.length === 0) return;
            
            const lastMessage = messageRows[messageRows.length - 1];
            if (!lastMessage) return;

            const containerHeight = chatMessages.clientHeight;
            const currentScrollTop = chatMessages.scrollTop;
            
            // Check if the last message is fully visible
            const messageTop = lastMessage.offsetTop;
            const messageBottom = lastMessage.offsetTop + lastMessage.offsetHeight;
            const visibleTop = currentScrollTop;
            const visibleBottom = currentScrollTop + containerHeight;
            
            // Only scroll if message is not fully visible
            if (messageTop < visibleTop || messageBottom > visibleBottom) {
                // Scroll to show the message with minimal movement
                const targetScrollTop = Math.max(0, messageTop - 50); // 50px buffer from top
                
                chatMessages.scrollTo({
                    top: targetScrollTop,
                    behavior: 'smooth'
                });
            }
        });
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
        // Skip backend history deletion when Parlant is enabled
        if (this.config.parlant.enabled) {
            return Promise.resolve({ message: 'Parlant mode: backend history deletion skipped' });
        }
        
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
        // Check if message actions should be shown
        if (!this.config.showMessageActions) {
            const actionsDiv = container.querySelector('.message-actions');
            if (actionsDiv) {
                actionsDiv.style.display = 'none';
            }
            return;
        }
        
        // Copy button removed - now handled by individual copy buttons on messages
        const likeBtn = container.querySelector('.like-btn');
        const dislikeBtn = container.querySelector('.dislike-btn');
        const regenerateBtn = container.querySelector('.regenerate-btn');
        const messageDiv = container.querySelector('.bot-message');

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
        if (this.config.parlant.enabled) {
            // For Parlant: Show action buttons only on last response of each query
            const botMessages = this.widget.querySelectorAll('.bot-message-container');
            const queryGroups = new Map();
            
            botMessages.forEach((container, index) => {
                container.classList.remove('last');
                const actionsDiv = container.querySelector('.message-actions');
                if (actionsDiv) {
                    actionsDiv.style.display = 'none';
                }
                const messageRow = container.closest('.message-row');
                const queryId = messageRow?.getAttribute('data-query-id');
                
                if (queryId) {
                    if (!queryGroups.has(queryId)) {
                        queryGroups.set(queryId, []);
                    }
                    queryGroups.get(queryId).push({ container, index });
                }
            });
            
            // Mark last message of each query as "last"
            queryGroups.forEach((messages) => {
                if (messages.length > 0) {
                    const lastMessage = messages[messages.length - 1];
                    lastMessage.container.classList.add('last');
                    const actionsDiv = lastMessage.container.querySelector('.message-actions');
                    if (actionsDiv) {
                        actionsDiv.style.display = 'flex';
                    }
                }
            });
            
            // Also mark the very last bot message as "last" if no query groups
            if (queryGroups.size === 0 && botMessages.length > 0) {
                const lastContainer = botMessages[botMessages.length - 1];
                lastContainer.classList.add('last');
                const actionsDiv = lastContainer.querySelector('.message-actions');
                if (actionsDiv) {
                    actionsDiv.style.display = 'flex';
                }
            }
        } else {
            // Regular behavior: show on last bot message
            const botMessages = this.widget.querySelectorAll('.bot-message-container');
            botMessages.forEach((container, index) => {
                container.classList.remove('last');
                if (index === botMessages.length - 1) {
                    container.classList.add('last');
                }
            });
        }
    }

    // Hide greeting message action buttons when AI response comes
    hideGreetingActions() {
        const greetingActions = this.widget.querySelector('#greeting-row .greeting-actions');
        if (greetingActions) {
            // Add smooth hide animation
            greetingActions.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            greetingActions.style.opacity = '0';
            greetingActions.style.transform = 'translateY(-5px)';
            
            // Hide completely after animation
            setTimeout(() => {
                greetingActions.style.display = 'none';
            }, 300);
        }
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
        // Skip feedback when Parlant is enabled
        if (this.config.parlant.enabled) {
            // Still save feedback state locally for UI purposes
            this.saveFeedbackState(response, type);
            return;
        }
        
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
        return !!this.activeForm || !!this.widget.querySelector('.hubspot-form-modal-overlay');
    }

    // Add method to create and show HubSpot form as modal overlay
    showHubSpotForm() {

        if (!this.config.hubspot?.enabled) {

            return;
        }
        if (this.userManager.hasSubmittedForm()) return;
        if (this.isFormActive()) return; // Prevent multiple forms

        // Disable chat functionality
        this.disableChatFunctionality();

        // Remove any existing forms first (cleanup)
        const existingForms = this.widget.querySelectorAll('.hubspot-form-modal-overlay');
        existingForms.forEach(form => form.remove());

        // Create modal overlay within chat window but outside chat messages
        const chatWindow = this.widget.querySelector('.chat-window');
        // Hide chat input while the form is open (prevents it appearing above/over the modal on mobile)
        chatWindow.classList.add('form-active');
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'hubspot-form-modal-overlay';
        modalOverlay.innerHTML = `
            <div class="hubspot-form-modal-backdrop"></div>
            <div class="hubspot-form-modal-container">
                <div class="hubspot-form-modal-content">
                <div class="form-header">
                        <h3>${this.config.formTitle}</h3>
                        <p>${this.config.formSubtitle}</p>
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
            </div>
        `;

        // Add modal overlay to the chat window
        chatWindow.appendChild(modalOverlay);

        // Store reference to active form
        this.activeForm = modalOverlay;

        // Add comprehensive modal styles
        const modalStyles = document.createElement('style');
        modalStyles.textContent = `
            /* Modal Overlay Styles - Within Chat Window */
            .hubspot-form-modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 50000;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: modalFadeIn 0.3s ease-out;
                pointer-events: auto;
                overflow: hidden;
                overscroll-behavior: contain;
            }

            /* While form is open, hide chat input/chips/branding behind it */
            .chat-window.form-active .chat-input-container,
            .chat-window.form-active .suggestion-chips,
            .chat-window.form-active .chat-branding {
                display: none !important;
            }

            .hubspot-form-modal-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                filter: none !important;
            }

            .hubspot-form-modal-container {
                position: relative;
                z-index: 1001;
                width: 90%;
                max-width: 320px;
                max-height: 70%;
                overflow-y: auto;
                animation: modalSlideIn 0.3s ease-out;
                overscroll-behavior: contain;
                -webkit-overflow-scrolling: touch;
                scrollbar-width: thin;
                scrollbar-color: #c1c1c1 #f1f1f1;
            }

            .hubspot-form-modal-container::-webkit-scrollbar {
                width: 6px;
            }

            .hubspot-form-modal-container::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 3px;
            }

            .hubspot-form-modal-container::-webkit-scrollbar-thumb {
                background: #c1c1c1;
                border-radius: 3px;
            }

            .hubspot-form-modal-container::-webkit-scrollbar-thumb:hover {
                background: #a8a8a8;
            }

            .hubspot-form-modal-content {
                background: #ffffff;
                border-radius: 12px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                padding: 20px;
                border: 1px solid rgba(255, 255, 255, 0.2);
                position: relative;
                overflow: hidden;
            }

            /* Mobile-specific modal adjustments */
            @media (max-width: 768px) {
                .hubspot-form-modal-container {
                    width: 95%;
                    max-width: 300px;
                    margin: 8px;
                    max-height: 80%;
                }
                
                .hubspot-form-modal-content {
                    padding: 16px;
                    border-radius: 10px;
                }
                
                .form-header h3 {
                    font-size: 16px;
                }
                
                .form-header p {
                    font-size: 12px;
                }
                
                .hubspot-form .form-group {
                    margin-bottom: 14px;
                }
                
                .hubspot-form input {
                    padding: 8px 10px;
                    font-size: 13px;
                    -webkit-appearance: none;
                    border-radius: 6px;
                }
                
                .hubspot-form button {
                    padding: 10px 16px;
                    font-size: 13px;
                    -webkit-appearance: none;
                    border-radius: 6px;
                }
            }

            /* Prevent iOS zoom on input focus */
            @media screen and (-webkit-min-device-pixel-ratio: 0) {
                .hubspot-form input {
                    font-size: 16px;
                }
            }

            /* Modal animations */
            @keyframes modalFadeIn {
                from {
                    opacity: 0;
                }
                to {
                    opacity: 1;
                }
            }

            @keyframes modalSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(-20px) scale(0.95);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }

            /* Form header styles */
            .form-header {
                margin-bottom: 16px;
                text-align: center;
            }
            
            .form-header h3 {
                margin: 0 0 6px 0;
                color: #333;
                font-size: 18px;
                font-weight: 600;
            }
            
            .form-header p {
                margin: 0;
                color: #666;
                font-size: 13px;
                line-height: 1.3;
            }
            
            /* Form styles */
            .hubspot-form .form-group {
                margin-bottom: 16px;
            }
            
            .hubspot-form label {
                display: block;
                margin-bottom: 6px;
                font-weight: 500;
                color: #333;
                font-size: 13px;
            }
            
            .hubspot-form input {
                width: 100%;
                padding: 10px 12px;
                border: 2px solid #e1e5e9;
                border-radius: 6px;
                font-size: 14px;
                transition: all 0.3s ease;
                background: #ffffff;
                box-sizing: border-box;
            }
            
            .hubspot-form input:focus {
                outline: none !important;
                border-color: #cbd5e1 !important; /* ash */
                box-shadow: 0 0 0 3px rgba(203, 213, 225, 0.45) !important;
                background: #ffffff !important;
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
                background: var(--chat-primary-color, #0084ff);
                color: white;
                border: none;
                padding: 12px 20px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 600;
                width: 100%;
                transition: all 0.3s ease;
                margin-top: 6px;
            }
            
            .hubspot-form button:hover {
                opacity: 0.9;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0, 132, 255, 0.3);
            }

            .hubspot-form button:active {
                transform: translateY(0);
            }
            
            .hubspot-form button:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                transform: none;
                box-shadow: none;
            }

            /* Chat messages disabled when modal is active - no blur */
            .chat-messages.modal-active {
                pointer-events: none;
                user-select: none;
                -webkit-user-select: none;
                opacity: 0.7;
            }

            .chat-messages.modal-active * {
                pointer-events: none !important;
            }

            /* Ensure header is always interactive */
            .chat-header {
                filter: none !important;
                pointer-events: auto !important;
            }

            .chat-header * {
                filter: none !important;
                pointer-events: auto !important;
            }



            /* Success message styles */
            .hubspot-form-success {
                text-align: center;
                padding: 20px;
                background: #d4edda;
                border-radius: 8px;
                color: #155724;
                margin: 10px 0;
                border: 1px solid #c3e6cb;
            }

            .success-countdown {
                margin-top: 15px;
                font-size: 12px;
                color: #6c757d;
                opacity: 0.8;
            }

            .countdown-number {
                font-weight: bold;
                color: #155724;
            }
        `;
        document.head.appendChild(modalStyles);

        // Add modal-active class to chat messages
        const messagesContainer = this.widget.querySelector('.chat-messages');
        if (messagesContainer) {
            messagesContainer.classList.add('modal-active');
        }

        // Animate modal entrance
        requestAnimationFrame(() => {
            modalOverlay.style.opacity = '1';
        });

        // Smart scroll prevention - only prevent when needed
        this.preventScroll = (e) => {
            const container = e.currentTarget.querySelector('.hubspot-form-modal-container');
            if (container) {
                const { scrollTop, scrollHeight, clientHeight } = container;
                const isAtTop = scrollTop === 0;
                const isAtBottom = scrollTop + clientHeight >= scrollHeight;
                
                // Allow scrolling within the form container
                if (e.target.closest('.hubspot-form-modal-container')) {
                    return true;
                }
                
                // Prevent scrolling outside the form
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
            return true;
        };

        // Add scroll prevention to modal with error handling
        try {
            modalOverlay.addEventListener('wheel', this.preventScroll, { passive: false });
            modalOverlay.addEventListener('touchmove', this.preventScroll, { passive: false });
        } catch (error) {
            console.warn('⚠️ Could not add scroll prevention listeners:', error);
        }

        // Setup form handlers
        const form = modalOverlay.querySelector('#hubspotForm');
        if (form) {
        this.setupHubSpotFormHandlers(form);
        }

        // Store modal reference for cleanup
        this.activeModal = modalOverlay;


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
                    // Update user ID with email if enabled
                    if (this.config.useEmailAsUserId) {
                        this.userManager.updateUserIdWithEmail(email);
                    }
                    
                    // Record successful submission
                    this.userManager.recordFormSubmission({
                        firstName: fullname.split(' ')[0],
                        lastName: fullname.split(' ').slice(1).join(' '),
                        email,
                        phone: phone.replace(/\D/g, '')
                    });
                    
                    // Mark form as shown only after successful submission
                    this.userManager.markFormAsShown();
                    
                    // Show success message and cleanup for modal
                    const modalContent = this.widget.querySelector('.hubspot-form-modal-content');
                    if (modalContent) {
                        modalContent.innerHTML = `
                                <div class="hubspot-form-success" style="opacity: 0; transform: translateY(10px)">
                                    <h3>Thank you for your submission!</h3>
                                    <p>We'll get back to you shortly.</p>
                                    <div class="success-countdown">Closing in <span class="countdown-number">2</span> seconds...</div>
                                </div>
                            `;
                            
                            requestAnimationFrame(() => {
                            const successMessage = modalContent.querySelector('.hubspot-form-success');
                                successMessage.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                                successMessage.style.opacity = '1';
                                successMessage.style.transform = 'translateY(0)';
                            });

                        // Countdown animation
                        let countdown = 2;
                        const countdownElement = modalContent.querySelector('.countdown-number');
                        const countdownInterval = setInterval(() => {
                            countdown--;
                            if (countdownElement) {
                                countdownElement.textContent = countdown;
                            }
                            if (countdown <= 0) {
                                clearInterval(countdownInterval);
                            }
                        }, 1000);

                        // Remove modal and re-enable chat after 1.5 seconds for quick user experience
                        setTimeout(() => {
                            clearInterval(countdownInterval);
                            this.removeActiveForm();
                        }, 1500);

                        // Fallback: Force close after 2 seconds if still open
                        setTimeout(() => {
                            clearInterval(countdownInterval);
                            if (this.activeForm) {
                                console.log('🔄 Force closing form after timeout');
                                this.activeForm.remove();
                                this.activeForm = null;
                                this.activeModal = null;
                                this.enableChatFunctionality();
                            }
                        }, 2000);
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
        const chatInput = this.widget.querySelector('.chat-input .chat-textarea');
        const sendButton = this.widget.querySelector('.send-button');
        const chips = this.widget.querySelectorAll('.chip');

        chatInput.disabled = true;
        sendButton.style.opacity = this.isMobileBrowser() ? '1' : '0.6';
        sendButton.style.pointerEvents = 'auto'; // Keep button clickable
        chips.forEach(chip => {
            chip.style.opacity = '0.5';
            chip.style.pointerEvents = 'none';
        });

        // Add visual feedback
        const inputContainer = chatInput.closest('.chat-input-container');
        inputContainer.classList.add('disabled');
    }

    enableChatFunctionality() {
        const chatInput = this.widget.querySelector('.chat-input .chat-textarea');
        const sendButton = this.widget.querySelector('.send-button');
        const chips = this.widget.querySelectorAll('.chip');

        // Animate the transition
        setTimeout(() => {
            chatInput.disabled = false;
            chatInput.style.opacity = '1';
            chatInput.style.pointerEvents = 'auto';
        }, 0);
        
        setTimeout(() => {
            sendButton.style.opacity = '1';
            sendButton.style.pointerEvents = 'auto';
        }, 100);
        
        chips.forEach((chip, index) => {
            setTimeout(() => {
                chip.style.opacity = '1';
                chip.style.pointerEvents = 'auto';
            }, 200 + (index * 100));
        });

        const inputContainer = chatInput.closest('.chat-input-container');
        inputContainer.classList.remove('disabled');
    }

    // Add cleanup method for form removal
    removeActiveForm() {
        if (this.activeForm) {
            try {
                console.log('🔄 Removing active form...');
                
                // Remove modal-active class from chat messages
                const messagesContainer = this.widget.querySelector('.chat-messages');
                if (messagesContainer) {
                    messagesContainer.classList.remove('modal-active');
                }
                
                // Remove scroll prevention event listeners
                if (this.activeModal && this.preventScroll) {
                    try {
                        this.activeModal.removeEventListener('wheel', this.preventScroll);
                        this.activeModal.removeEventListener('touchmove', this.preventScroll);
                    } catch (error) {
                        console.warn('⚠️ Could not remove scroll prevention listeners:', error);
                    }
                }
                
                // Animate modal removal
                this.activeForm.style.transition = 'opacity 0.3s ease';
                this.activeForm.style.opacity = '0';
                
                setTimeout(() => {
                    try {
                        if (this.activeForm && this.activeForm.parentNode) {
                            this.activeForm.remove();
                            console.log('✅ Form removed successfully');
                        }
                        this.activeForm = null;
                        this.activeModal = null;
                        // Unhide chat input
                        const chatWindow = this.widget.querySelector('.chat-window');
                        if (chatWindow) chatWindow.classList.remove('form-active');
                        
                        // Re-enable chat functionality
                        this.enableChatFunctionality();
                    } catch (error) {
                        console.error('❌ Error during form cleanup:', error);
                        // Force cleanup
                        this.activeForm = null;
                        this.activeModal = null;
                        const chatWindow = this.widget.querySelector('.chat-window');
                        if (chatWindow) chatWindow.classList.remove('form-active');
                        this.enableChatFunctionality();
                    }
                }, 300);
            } catch (error) {
                console.error('❌ Error in removeActiveForm:', error);
                // Force cleanup
                this.activeForm = null;
                this.activeModal = null;
                const chatWindow = this.widget.querySelector('.chat-window');
                if (chatWindow) chatWindow.classList.remove('form-active');
                this.enableChatFunctionality();
            }
        } else {
            console.log('⚠️ No active form to remove');
        }
    }
}

class ChatUserManager {
    constructor(config) {
        this.config = config;
        this.domain = this.getCurrentDomain();
        this.path = this.getCurrentPath();
        this.currentUser = this.generateUserId();
        this.userSessionId = this.getOrCreateUserSessionId();
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

    getOrCreateUserSessionId() {
        const sessionKey = this.config.separateSubpageHistory 
            ? `userSessionId_${this.domain}${this.path}`
            : `userSessionId_${this.domain}`;
        
        let sessionId = localStorage.getItem(sessionKey);
        
        if (!sessionId) {
            // Generate unique session ID
            sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem(sessionKey, sessionId);
        }
        
        return sessionId;
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
    
    // Add method to check if form has been shown to user
    hasFormBeenShown() {
        const formShownKey = `chatFormShown_${this.currentUser}`;
        return localStorage.getItem(formShownKey) === 'true';
    }
    
    // Add method to mark form as shown
    markFormAsShown() {
        const formShownKey = `chatFormShown_${this.currentUser}`;
        localStorage.setItem(formShownKey, 'true');
    }
    
    // Add method to reset form shown status (for testing)
    resetFormShownStatus() {
        const formShownKey = `chatFormShown_${this.currentUser}`;
        localStorage.removeItem(formShownKey);
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
    
    updateUserIdWithEmail(email) {
        const storageKey = this.config.separateSubpageHistory 
            ? `currentChatUser_${this.domain}${this.path}`
            : `currentChatUser_${this.domain}`;
        
        // Update the stored user ID with email
        localStorage.setItem(storageKey, email);
        this.currentUser = email;
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

    saveParlantMessage(message, sender, queryId) {
        const historyKey = this.userManager.getHistoryKey();
        let chatHistory = this.getChatHistory();

        const messageData = {
            message: message,
            sender: sender,
            timestamp: new Date().toISOString(),
            domain: this.domain,
            queryId: queryId,
            userSessionId: this.userManager.userSessionId
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
            this.widget.addMessage(item.message, item.sender, false, { queryId: item.queryId });
        });
    }

    clearHistory() {
        const historyKey = this.userManager.getHistoryKey();
        try {
            localStorage.removeItem(historyKey);
            localStorage.setItem(historyKey, JSON.stringify([]));

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

// Cleanup Parlant on page unload
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        // Find all EasyChatWidget instances and cleanup Parlant
        if (window.chatWidgetInstances) {
            window.chatWidgetInstances.forEach(widget => {
                if (widget && typeof widget.cleanupParlant === 'function') {
                    widget.cleanupParlant();
                }
            });
        }
    });
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

// NOTE: Removed legacy `additionalMobileStyles` injection.
// All styling is handled by `loadStyles()` to avoid mobile overrides and conflicts.
