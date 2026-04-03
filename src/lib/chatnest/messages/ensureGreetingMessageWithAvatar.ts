/**
 * Ensure greeting message exists and has avatar
 * @param {Chatnest} chatnest - Chatnest instance
 */
export function ensureGreetingMessageWithAvatar(chatnest: any) {
    const chatMessages = chatnest.widget.querySelector('.chat-messages');
    const existingGreeting = chatMessages.querySelector('#greeting-row');

    if (existingGreeting) {
        const greetingHasAvatar = existingGreeting.querySelector('.ai-avatar');
        if (!greetingHasAvatar) {
            existingGreeting.remove();
            chatnest.addGreetingMessage();
        } else {
            chatnest.synchronizeGreetingWidth(existingGreeting);
        }
    } else {
        chatnest.addGreetingMessage();
    }
}
