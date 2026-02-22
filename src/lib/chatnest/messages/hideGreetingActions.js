/**
 * Hide greeting message action buttons when AI response comes
 * @param {Chatnest} chatnest - Chatnest instance
 */
export function hideGreetingActions(chatnest) {
    const greetingActions = chatnest.widget.querySelector('#greeting-row .greeting-actions');
    if (greetingActions) {
        greetingActions.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        greetingActions.style.opacity = '0';
        greetingActions.style.transform = 'translateY(-5px)';

        setTimeout(() => {
            greetingActions.style.display = 'none';
        }, 300);
    }
}
