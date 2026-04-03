/**
 * Repair typing indicator animation by switching to JavaScript animation
 * @param {Chatnest} chatnest - Chatnest instance
 */
export function repairTypingAnimation(chatnest: any) {
    const typingDots = chatnest.widget.querySelectorAll('.typing-indicator span');

    typingDots.forEach((dot: any) => {
        dot.style.animation = 'none';
        dot.style.webkitAnimation = 'none';
        dot.offsetHeight; // Force repaint
    });

    chatnest.startJavaScriptTypingAnimation();
}
