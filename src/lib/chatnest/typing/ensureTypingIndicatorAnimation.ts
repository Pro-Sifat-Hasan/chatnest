/**
 * Ensure typing indicator animation works - repair if needed
 * @param {Chatnest} chatnest - Chatnest instance
 */
export function ensureTypingIndicatorAnimation(chatnest: any) {
    const typingDots = chatnest.widget.querySelectorAll('.typing-indicator span');
    if (typingDots.length === 3) {
        let needsRepair = false;

        typingDots.forEach((dot: Element) => {
            const computedStyle = window.getComputedStyle(dot);
            const animationName = computedStyle.animationName;
            if (animationName === 'none' || !animationName || animationName === 'initial') {
                needsRepair = true;
            }
        });

        if (needsRepair) {
            chatnest.repairTypingAnimation();
        }
    }
}
