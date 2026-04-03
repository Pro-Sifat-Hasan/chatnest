/**
 * Stop JavaScript-based typing indicator animation
 * @param {Chatnest} chatnest - Chatnest instance
 */
export function stopJavaScriptTypingAnimation(chatnest: any) {
    if (chatnest.typingAnimationInterval) {
        clearInterval(chatnest.typingAnimationInterval);
        chatnest.typingAnimationInterval = null;

        const typingDots = chatnest.widget.querySelectorAll('.typing-indicator span');
        typingDots.forEach((dot: any) => {
            dot.style.setProperty('transform', 'scale(1)', 'important');
            dot.style.setProperty('opacity', '1', 'important');
        });
    }
}
