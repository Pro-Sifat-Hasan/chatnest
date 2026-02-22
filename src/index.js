/* jshint esversion: 11, asi: true */
/**
 * Chatnest - A lightweight, customizable chat widget for modern web applications
 * @see https://github.com/Pro-Sifat-Hasan/chatnest
 */

import { initConfig, ChatUserManager, ChatStorageManager, togglePositions, hexToRgb, isGradient, getThemeColor, getCurrentTheme, formatTimestamp as formatTimestampUtil, generateAvatarHtml, loadScript, formatFileSize as formatFileSizeUtil, isMobileBrowser, formatRequestData as formatRequestDataUtil } from './lib/index.js';
import { ParlantIntegration } from './parlant/index.js';
import {
    applyTheme,
    createWidget,
    initializeWidget,
    destroy,
    setupEraseButton,
    eraseChat as eraseChatImpl,
    setupResponsiveHandling,
    ensureSendButtonIconSize,
    applyToggleButtonAnimation,
    disableToggleButtonAnimation,
    enableToggleButtonAnimation,
    forceStyleReapplication,
    addMessage,
    addGreetingMessage,
    ensureGreetingMessageWithAvatar,
    setupCopyButtons,
    setupMessageLinks,
    setupMessageActions,
    synchronizeGreetingWidth,
    updateFilePreview,
    hideGreetingActions,
    updateLastBotMessage,
    setupEventListeners,
    setupSuggestionChips,
    setupTextBoxEventListeners,
    setupClickOutsideToClose,
    setupDesktopInput,
    setupCleanMobileInput,
    setupMobileFullscreenEnforcement,
    enableMobileInputInteraction,
    toggleChat,
    closeChat,
    openChat,
    updateToggleIcon,
    typeWriter,
    startJavaScriptTypingAnimation,
    stopJavaScriptTypingAnimation,
    ensureTypingIndicatorAnimation,
    repairTypingAnimation,
    scrollChatToBottom,
    scrollToBottom,
    scrollToShowNewMessage,
    scrollToLastUserMessage,
    scrollToLatestMessage,
    setupScrollContainment,
    scrollToTypingIndicator,
    disableChips,
    enableChips,
    disableSendingFunctionality,
    enableSendingFunctionality,
    forceEnableInput,
    makeApiCall,
    processApiResponse,
    handleApiError,
    deleteBackendHistory,
    sendMessage as sendMessageImpl,
    sendMessageWithFiles as sendMessageWithFilesImpl,
    updateUIForSending,
    resetUIAfterSending,
    loadStyles,
    showHubSpotForm,
    setupHubSpotFormHandlers as setupHubSpotFormHandlersImpl,
    checkForTriggerWords,
    removeActiveForm,
    disableChatFunctionality,
    enableChatFunctionality,
    submitToHubSpot as submitToHubSpotImpl,
    isFormActive as isFormActiveImpl,
    sendFeedback as sendFeedbackImpl,
    saveFeedbackState as saveFeedbackStateImpl,
    restoreFeedbackState as restoreFeedbackStateImpl,
    updateStorageAfterRegeneration as updateStorageAfterRegenerationImpl,
    loadChatHistory as loadChatHistoryImpl
} from './lib/chatnest/index.js';

class Chatnest {
    constructor(config = {}) {
        if (typeof window === 'undefined' || typeof document === 'undefined') {
            throw new Error('Chatnest requires a browser environment (window and document must exist).');
        }
        this.isWaitingForResponse = false;
        this.config = initConfig(config);
        this.hexToRgb = hexToRgb;
        this.isGradient = isGradient;
        this.userManager = new ChatUserManager(this.config);
        this.storageManager = new ChatStorageManager(this.userManager, this.config);
        
        this.parlant = this.config.parlant.enabled ? new ParlantIntegration(this) : null;
        
        this.ensureDependencies().then(() => {
            this.initializeWidget();
            this.setupEventListeners();
            this.storageManager.setWidget(this);
            this.loadChatHistory();
            this.setupEraseButton();
            
            if (this.parlant) {
                this.parlant.initialize();
            }
        });
        this.activeForm = null; // Add this to track active form
        
        // Register instance for cleanup
        if (!window.chatWidgetInstances) {
            window.chatWidgetInstances = [];
        }
        window.chatWidgetInstances.push(this);
        // Validate position
        if (!togglePositions[this.config.position]) {
            console.warn(`Invalid position "${this.config.position}". Falling back to bottom-right.`);
            this.config.position = 'bottom-right';
        }
    }

    getCurrentTheme() {
        return getCurrentTheme(this.config.theme);
    }

    getThemeColor(type) {
        return getThemeColor(type, this.config.theme);
    }

    applyTheme() {
        applyTheme(this);
    }

    formatTimestamp(timestamp) {
        return formatTimestampUtil(timestamp);
    }

    generateAiAvatar() {
        return generateAvatarHtml(this.config.aiAvatar, this.config.botName, { showAvatar: this.config.showAiAvatar, forGreeting: false });
    }

    generateGreetingAvatar() {
        return generateAvatarHtml(this.config.aiAvatar, this.config.botName, { forGreeting: true });
    }

    // Update the font size update method to include clamping
    updateFontSize(newSize) {
        // Ensure the new size is within bounds
        const numSize = parseInt(newSize, 10);
        const clampedSize = `${Math.min(Math.max(numSize, 14), 25)}px`;
        
        this.config.fontSize = clampedSize;
        document.documentElement.style.setProperty('--chat-message-font-size', clampedSize);
    }

    async ensureDependencies() {
        if (!window.marked && this.config.enableMarkdown) {
            try {
                await this.loadScript('https://cdn.jsdelivr.net/npm/marked@9.1.6/marked.min.js');
                if (!window.marked) {
                    this.config.enableMarkdown = false;
                }
            } catch (err) {
                this.config.enableMarkdown = false;
            }
        }
        this.loadStyles();
    }

    loadScript(src) {
        return loadScript(src);
    }

    loadStyles() {
        loadStyles(this);
    }

    createWidget() {
        createWidget(this);
    }

    initializeWidget() {
        initializeWidget(this);
    }
    
    setupEventListeners() {
        setupEventListeners(this);
    }

    setupClickOutsideToClose() {
        setupClickOutsideToClose(this);
    }

    setupSuggestionChips() {
        setupSuggestionChips(this);
    }

    disableChips() {
        disableChips(this);
    }

    enableChips() {
        enableChips(this);
    }

    typeWriter(element, text, callback) {
        typeWriter(this, element, text, callback);
    }

    disableSendingFunctionality() {
        disableSendingFunctionality(this);
    }

    enableSendingFunctionality() {
        enableSendingFunctionality(this);
    }

    forceEnableInput() {
        forceEnableInput(this);
    }

    ensureTypingIndicatorAnimation() {
        ensureTypingIndicatorAnimation(this);
    }

    repairTypingAnimation() {
        repairTypingAnimation(this);
    }

    setupMobileFullscreenEnforcement() {
        setupMobileFullscreenEnforcement(this);
    }

    startJavaScriptTypingAnimation() {
        startJavaScriptTypingAnimation(this);
    }

    stopJavaScriptTypingAnimation() {
        stopJavaScriptTypingAnimation(this);
    }

    addMessage(text, sender, useTypewriter = true, meta = {}) {
        addMessage(this, text, sender, useTypewriter, meta);
    }

    setupCopyButtons(messageRow, text) {
        setupCopyButtons(this, messageRow, text);
    }

    setupMessageLinks(messageDiv) {
        setupMessageLinks(this, messageDiv);
    }

    async sendMessage(message, isRegeneration = false) {
        return sendMessageImpl(this, message, isRegeneration);
    }

    isMobileBrowser() {
        return isMobileBrowser();
    }
    
    toggleChat() {
        toggleChat(this);
    }

    closeChat() {
        closeChat(this);
    }

    openChat() {
        openChat(this);
    }

    updateToggleIcon(isOpen) {
        updateToggleIcon(this, isOpen);
    }

    setupCleanMobileInput(inputElement) {
        setupCleanMobileInput(this, inputElement);
    }

    setupDesktopInput(inputElement) {
        setupDesktopInput(this, inputElement);
    }

    enableMobileInputInteraction(inputElement) {
        enableMobileInputInteraction(this, inputElement);
    }
    
    scrollToTypingIndicator() {
        scrollToTypingIndicator(this);
    }

    formatRequestData(message, files = []) {
        return formatRequestDataUtil(this.config, this.userManager, message, files);
    }

    updateFilePreview(files, filePreview) {
        updateFilePreview(this, files, filePreview);
    }

    formatFileSize(bytes) {
        return formatFileSizeUtil(bytes);
    }

    async sendMessageWithFiles(message, files = []) {
        return sendMessageWithFilesImpl(this, message, files);
    }

    async makeApiCall(requestData) {
        return makeApiCall(this, requestData);
    }

    processApiResponse(data, typingIndicator) {
        processApiResponse(this, data, typingIndicator);
    }

    handleApiError(error, typingIndicator) {
        handleApiError(this, error, typingIndicator);
    }

    updateUIForSending(typingIndicator, chatInput) {
        updateUIForSending(this, typingIndicator, chatInput);
    }

    resetUIAfterSending(typingIndicator) {
        resetUIAfterSending(this, typingIndicator);
    }

    loadChatHistory() {
        loadChatHistoryImpl(this);
    }

    updateConfig(newConfig) {
        this.config = initConfig({ ...this.config, ...newConfig });
        if (this.storageManager) {
            this.storageManager.config = this.config;
            this.storageManager.enableHistory = this.config.enableHistory !== false;
            this.storageManager.maxHistoryLength = this.config.maxHistoryLength || 100;
        }
        this.destroy();
        this.createWidget();
        this.initializeWidget();
        this.setupEventListeners();
        this.loadChatHistory();
        this.setupEraseButton();
    }

    destroy() {
        destroy(this);
    }

    setupEraseButton() {
        setupEraseButton(this);
    }

    eraseChat() {
        eraseChatImpl(this);
    }

    addGreetingMessage() {
        addGreetingMessage(this);
    }

    // COMPREHENSIVE: Force greeting message width to match other AI responses
    synchronizeGreetingWidth(greetingRow) {
        synchronizeGreetingWidth(this, greetingRow);
    }

    ensureGreetingMessageWithAvatar() {
        ensureGreetingMessageWithAvatar(this);
    }

    ensureSendButtonIconSize() {
        ensureSendButtonIconSize(this);
    }

    applyToggleButtonAnimation() {
        applyToggleButtonAnimation(this);
    }

    forceStyleReapplication() {
        forceStyleReapplication(this);
    }

    disableToggleButtonAnimation() {
        disableToggleButtonAnimation(this);
    }

    enableToggleButtonAnimation() {
        enableToggleButtonAnimation(this);
    }

    setupTextBoxEventListeners() {
        setupTextBoxEventListeners(this);
    }

    setupResponsiveHandling() {
        setupResponsiveHandling(this);
    }

    scrollChatToBottom() {
        scrollChatToBottom(this);
    }

    scrollToShowNewMessage(messageElement) {
        scrollToShowNewMessage(this, messageElement);
    }

    scrollToBottom() {
        scrollToBottom(this);
    }

    scrollToLastUserMessage() {
        scrollToLastUserMessage(this);
    }

    scrollToLatestMessage() {
        scrollToLatestMessage(this);
    }

    setupScrollContainment() {
        setupScrollContainment(this);
    }

    deleteBackendHistory() {
        return deleteBackendHistory(this);
    }

    setupMessageActions(container, originalText) {
        setupMessageActions(this, container, originalText);
    }

    updateLastBotMessage() {
        updateLastBotMessage(this);
    }

    hideGreetingActions() {
        hideGreetingActions(this);
    }

    async updateStorageAfterRegeneration(lastUserMessageIndex, userMessage) {
        return updateStorageAfterRegenerationImpl(this, lastUserMessageIndex, userMessage);
    }

    async sendFeedback(type, response) {
        return sendFeedbackImpl(this, type, response);
    }

    saveFeedbackState(response, type) {
        saveFeedbackStateImpl(this, response, type);
    }

    restoreFeedbackState(container, response) {
        restoreFeedbackStateImpl(this, container, response);
    }

    checkForTriggerWords(message) {
        return checkForTriggerWords(this, message);
    }

    isFormActive() {
        return isFormActiveImpl(this);
    }

    showHubSpotForm() {
        showHubSpotForm(this);
    }

    setupHubSpotFormHandlers(form) {
        setupHubSpotFormHandlersImpl(this, form);
    }

    async submitToHubSpot(data) {
        return submitToHubSpotImpl(this, data);
    }

    disableChatFunctionality() {
        disableChatFunctionality(this);
    }

    enableChatFunctionality() {
        enableChatFunctionality(this);
    }

    removeActiveForm() {
        removeActiveForm(this);
    }
}

// Export for non-module environments (webpack UMD outputs this; we also set both names for CDN)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Chatnest;
} else if (typeof window !== 'undefined') {
    window.Chatnest = Chatnest;
    window.EasyChatWidget = Chatnest; // Backward compatibility
}

// Cleanup Parlant on page unload
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        // Find all Chatnest instances and cleanup Parlant
        if (window.chatWidgetInstances) {
            window.chatWidgetInstances.forEach(widget => {
                if (widget?.parlant) {
                    widget.parlant.cleanup();
                }
            });
        }
    });
}

