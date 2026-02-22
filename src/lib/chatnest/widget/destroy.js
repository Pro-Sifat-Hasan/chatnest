/**
 * Destroy widget and cleanup
 * @param {Chatnest} chatnest - Chatnest instance
 */
export function destroy(chatnest) {
    if (chatnest._mobileInputCleanup) {
        chatnest._mobileInputCleanup();
        chatnest._mobileInputCleanup = null;
    }

    if (chatnest._mobileFullscreenCleanup) {
        chatnest._mobileFullscreenCleanup();
        chatnest._mobileFullscreenCleanup = null;
    }

    chatnest._mobileInputSetup = false;

    if (chatnest._typingIndicatorInterval) {
        clearInterval(chatnest._typingIndicatorInterval);
        chatnest._typingIndicatorInterval = null;
    }

    chatnest.removeActiveForm();

    if (chatnest.parlant) {
        chatnest.parlant.cleanup();
    }

    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.documentElement.style.overflow = '';

    if (chatnest.widget) {
        chatnest.widget.remove();
        chatnest.widget = null;
    }

    if (window.chatWidgetInstances) {
        const idx = window.chatWidgetInstances.indexOf(chatnest);
        if (idx !== -1) window.chatWidgetInstances.splice(idx, 1);
    }
}
