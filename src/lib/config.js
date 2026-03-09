/**
 * Configuration initialization for Chatnest
 */

function clampDimension(value, min, max) {
    const numValue = parseInt(value, 10);
    return `${Math.min(Math.max(numValue || 0, min), max)}px`;
}

function clampFontSize(size) {
    let numSize;
    if (typeof size === 'string') {
        numSize = parseInt(size.replace('px', ''), 10);
    } else if (typeof size === 'number') {
        numSize = size;
    } else {
        numSize = 14;
    }
    const clampedSize = Math.min(Math.max(14, numSize), 25);
    return `${clampedSize}px`;
}

function formatApiEndpoint(endpoint) {
    if (!endpoint) return 'http://localhost:7000/chat';
    if (endpoint.startsWith('//')) return `${window.location.protocol}${endpoint}`;
    if (endpoint.startsWith('/')) return `${window.location.origin}${endpoint}`;
    if (!endpoint.startsWith('http')) return `http://${endpoint}`;
    return endpoint;
}

export function initConfig(config) {
    const apiEndpoint = formatApiEndpoint(config.apiEndpoint);
    return {
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
        typewritewithscroll: config.typewritewithscroll !== undefined ? config.typewritewithscroll : false,
        chips: config.chips || [],
        customStyles: config.customStyles || {},
        onInit: config.onInit || null,
        onMessage: config.onMessage || null,
        onError: config.onError || null,
        apiEndpoint,
        apiKey: config.apiKey || '',
        apiHeaders: config.apiHeaders || { 'Content-Type': 'application/json' },
        apiRequestFormat: config.apiRequestFormat || { query: 'query', userId: 'userId', domain: 'domain' },
        apiResponseFormat: {
            response: 'response',
            products: 'products',
            ...(config.apiResponseFormat || {}),
            productItem: {
                name: 'name',
                price: 'price',
                image: 'image_url',
                link: 'buy_link',
                highlights: 'highlights',
                ctaText: 'Buy product',
                ...(config.apiResponseFormat?.productItem || {})
            }
        },
        productInjectionMarker: config.productInjectionMarker ?? [
            'Here are some product recommendations that might be beneficial for your skin condition:',
            'Now, here are some products that might be helpful:'
        ],
        apiMethod: config.apiMethod || 'POST',
        apiTimeout: config.apiTimeout || 30000,
        enableBackendHistory: config.enableBackendHistory !== false,
        backendHistoryEndpoint: config.backendHistoryEndpoint ? formatApiEndpoint(config.backendHistoryEndpoint) : '',
        deleteEndpoint: config.deleteEndpoint
            ? formatApiEndpoint(config.deleteEndpoint)
            : `${apiEndpoint.replace(/\/chat$/, '')}/delete-history`,
        separateSubpageHistory: config.separateSubpageHistory || false,
        feedbackEndpoint: config.feedbackEndpoint
            ? formatApiEndpoint(config.feedbackEndpoint)
            : `${apiEndpoint.replace(/\/?$/, '')}/feedback`,
        hubspot: {
            enabled: config.hubspot?.enabled || false,
            portalId: config.hubspot?.portalId || '',
            formGuid: config.hubspot?.formGuid || '',
            triggerKeywords: config.hubspot?.triggerKeywords || ['pricing', 'demo', 'contact', 'quote', 'help', 'support'],
            formShownToUsers: new Set(),
            formSubmittedUsers: new Set()
        },
        position: config.position || 'bottom-right',
        enableServerHistoryDelete: config.enableServerHistoryDelete !== undefined ? config.enableServerHistoryDelete : false,
        enableFileUpload: config.enableFileUpload !== false,
        fileAccept: config.fileAccept ?? 'image/*,.pdf,.doc,.docx,.txt',
        maxFiles: config.maxFiles ?? null,
        enableDeleteButton: config.enableDeleteButton !== false,
        useMultipartFormData: config.useMultipartFormData !== false,
        apiDataFormat: config.apiDataFormat || 'json',
        typingIndicatorColor: config.typingIndicatorColor || '#666',
        showTypingText: config.showTypingText !== false,
        toggleButtonIcon: config.toggleButtonIcon || null,
        chatBackgroundImage: config.chatBackgroundImage || null,
        chatBackgroundColor: config.chatBackgroundColor || '#ffffff',
        sendButtonIconSize: config.sendButtonIconSize || 24,
        enableEnhancedMobileInput: config.enableEnhancedMobileInput !== false,
        aiAvatar: config.aiAvatar || null,
        showAiAvatar: config.showAiAvatar !== false,
        botSubname: config.botSubname || null,
        showBotSubname: config.showBotSubname !== false,
        showFormOnStart: config.showFormOnStart !== false,
        useEmailAsUserId: config.useEmailAsUserId !== false,
        formTitle: config.formTitle || 'Give Your Details',
        formSubtitle: config.formSubtitle || 'Please provide your information to start chatting.',
        theme: config.theme || 'light',
        showBranding: config.showBranding !== false,
        brandingText: config.brandingText || 'Powered by NeuroBrain',
        brandingUrl: config.brandingUrl || 'https://neurobrains.co/',
        showMessageActions: config.showMessageActions !== false,
        showTextBox: config.showTextBox !== false,
        textBoxMessage: config.textBoxMessage || 'Hi there! If you need any assistance, I am always here.',
        textBoxSubMessage: config.textBoxSubMessage || '24/7 Live Chat Support',
        showTextBoxCloseButton: config.showTextBoxCloseButton !== false,
        toggleButtonAnimation: config.toggleButtonAnimation !== undefined ? Math.max(0, Math.min(5, parseInt(config.toggleButtonAnimation, 10) || 0)) : 4,
        toggleButtonSize: config.toggleButtonSize ? Math.max(40, Math.min(80, parseInt(config.toggleButtonSize, 10))) : 60,
        toggleButtonBottomMargin: config.toggleButtonBottomMargin ? Math.max(10, Math.min(50, parseInt(config.toggleButtonBottomMargin, 10))) : 50,
        toggleButtonRightMargin: config.toggleButtonRightMargin ? Math.max(10, Math.min(100, parseInt(config.toggleButtonRightMargin, 10))) : 30,
        websiteBottomSpacing: config.websiteBottomSpacing ? Math.max(0, Math.min(100, parseInt(config.websiteBottomSpacing, 10))) : 0,
        textBoxSpacingFromToggle: config.textBoxSpacingFromToggle !== undefined ? Math.max(0, Math.min(30, parseInt(config.textBoxSpacingFromToggle, 10))) : 0,
        textBoxTextColor: config.textBoxTextColor || 'primary',
        parlant: {
            enabled: config.parlant?.enabled || false,
            apiBaseUrl: config.parlant?.apiBaseUrl || ''
        },
        supabase: {
            enabled: config.supabase?.enabled || false,
            url: config.supabase?.url || '',
            anonKey: config.supabase?.anonKey || '',
            tableName: config.supabase?.tableName || 'chat_history',
            historyLimit: config.supabase?.historyLimit || 50
        }
    };
}
