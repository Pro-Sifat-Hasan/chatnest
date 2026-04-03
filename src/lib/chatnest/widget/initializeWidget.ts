/**
 * Initialize the chat widget after creation
 * @param {Chatnest} chatnest - Chatnest instance
 */
export function initializeWidget(chatnest: any) {
    chatnest.createWidget();
    chatnest.setupSuggestionChips();
    chatnest.setupResponsiveHandling();
    chatnest.setupScrollContainment();

    setTimeout(() => {
        chatnest.ensureGreetingMessageWithAvatar();
    }, 200);

    setTimeout(() => {
        chatnest.ensureSendButtonIconSize();
    }, 300);

    setTimeout(() => {
        chatnest.applyToggleButtonAnimation();
    }, 100);

    setTimeout(() => {
        chatnest.forceStyleReapplication();
    }, 500);

    chatnest._typingIndicatorInterval = setInterval(() => {
        chatnest.ensureTypingIndicatorAnimation();
    }, 2000);

    setTimeout(() => {
        chatnest.setupTextBoxEventListeners();
    }, 100);

    chatnest.setupClickOutsideToClose();

    if (chatnest.config.onInit && typeof chatnest.config.onInit === 'function') {
        chatnest.config.onInit();
    }
}
