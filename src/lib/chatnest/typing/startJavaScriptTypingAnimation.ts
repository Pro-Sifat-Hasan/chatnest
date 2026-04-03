/**
 * Start JavaScript-based typing indicator animation
 * @param {Chatnest} chatnest - Chatnest instance
 */
export function startJavaScriptTypingAnimation(chatnest: any) {
    if (chatnest.typingAnimationInterval) {
        clearInterval(chatnest.typingAnimationInterval);
    }

    const typingDots = chatnest.widget.querySelectorAll('.typing-indicator span');
    if (typingDots.length !== 3) return;

    let animationStep = 0;
    const totalSteps = 60;
    const dotDelays = [0, 20, 40];

    chatnest.typingAnimationInterval = setInterval(() => {
        typingDots.forEach((dot: any, index: number) => {
            const dotStep = (animationStep + dotDelays[index]) % totalSteps;
            const progress = dotStep / (totalSteps / 4);

            const scale = 0.4 + 0.8 * Math.abs(Math.sin(progress * Math.PI));
            const opacity = 0.3 + 0.7 * Math.abs(Math.sin(progress * Math.PI));

            dot.style.setProperty('transform', `scale(${scale})`, 'important');
            dot.style.setProperty('-webkit-transform', `scale(${scale})`, 'important');
            dot.style.setProperty('opacity', opacity.toString(), 'important');
        });

        animationStep = (animationStep + 1) % totalSteps;
    }, 50);
}
