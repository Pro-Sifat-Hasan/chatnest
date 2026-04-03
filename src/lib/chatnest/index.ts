/**
 * Chatnest core modules - barrel export
 * Each domain has its own folder with one function per file for easy navigation
 */

export { applyTheme } from './theme/index.js';
export { createWidget, initializeWidget, destroy, setupEraseButton, eraseChat, setupResponsiveHandling, ensureSendButtonIconSize, applyToggleButtonAnimation, disableToggleButtonAnimation, enableToggleButtonAnimation, forceStyleReapplication } from './widget/index.js';
export { addMessage, addGreetingMessage, ensureGreetingMessageWithAvatar, setupCopyButtons, setupMessageLinks, setupMessageActions, synchronizeGreetingWidth, updateFilePreview, hideGreetingActions, updateLastBotMessage } from './messages/index.js';
export { setupEventListeners, setupSuggestionChips, setupTextBoxEventListeners, setupClickOutsideToClose } from './events/index.js';
export { setupDesktopInput, setupCleanMobileInput, setupMobileFullscreenEnforcement, enableMobileInputInteraction } from './input/index.js';
export { toggleChat, closeChat, openChat, updateToggleIcon } from './chat/index.js';
export { typeWriter, startJavaScriptTypingAnimation, stopJavaScriptTypingAnimation, ensureTypingIndicatorAnimation, repairTypingAnimation } from './typing/index.js';
export { scrollChatToBottom, scrollToBottom, scrollToShowNewMessage, scrollToLastUserMessage, scrollToLatestMessage, setupScrollContainment, scrollToTypingIndicator } from './scroll/index.js';
export { disableChips, enableChips } from './chips/index.js';
export { disableSendingFunctionality, enableSendingFunctionality, forceEnableInput } from './sending/index.js';
export { makeApiCall, processApiResponse, handleApiError, sendMessage, sendMessageWithFiles, updateUIForSending, resetUIAfterSending, deleteBackendHistory } from './api/index.js';
export { loadStyles } from './styles/index.js';
export { showHubSpotForm, setupHubSpotFormHandlers, checkForTriggerWords, removeActiveForm, disableChatFunctionality, enableChatFunctionality, submitToHubSpot, isFormActive } from './hubspot/index.js';
export { showNativeForm, setupNativeFormHandlers, NativeFormManager } from './nativeForm/index.js';
export { sendFeedback, saveFeedbackState, restoreFeedbackState } from './feedback/index.js';
export { updateStorageAfterRegeneration, loadChatHistory } from './storage/index.js';
