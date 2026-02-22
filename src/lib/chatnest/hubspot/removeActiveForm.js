/**
 * Remove active HubSpot form overlay and re-enable chat
 * @param {Chatnest} chatnest - Chatnest instance
 */
export function removeActiveForm(chatnest) {
    if (chatnest.activeForm) {
        try {
            console.log('Removing active form...');

            const messagesContainer = chatnest.widget.querySelector('.chat-messages');
            if (messagesContainer) {
                messagesContainer.classList.remove('modal-active');
            }

            if (chatnest.activeModal && chatnest.preventScroll) {
                try {
                    chatnest.activeModal.removeEventListener('wheel', chatnest.preventScroll);
                    chatnest.activeModal.removeEventListener('touchmove', chatnest.preventScroll);
                } catch (error) {
                    console.warn('Could not remove scroll prevention listeners:', error);
                }
            }

            chatnest.activeForm.style.transition = 'opacity 0.3s ease';
            chatnest.activeForm.style.opacity = '0';

            setTimeout(() => {
                try {
                    if (chatnest.activeForm && chatnest.activeForm.parentNode) {
                        chatnest.activeForm.remove();
                        console.log('Form removed successfully');
                    }
                    chatnest.activeForm = null;
                    chatnest.activeModal = null;
                    const chatWindow = chatnest.widget.querySelector('.chat-window');
                    if (chatWindow) chatWindow.classList.remove('form-active');

                    chatnest.enableChatFunctionality();
                } catch (error) {
                    console.error('Error during form cleanup:', error);
                    chatnest.activeForm = null;
                    chatnest.activeModal = null;
                    const chatWindow = chatnest.widget.querySelector('.chat-window');
                    if (chatWindow) chatWindow.classList.remove('form-active');
                    chatnest.enableChatFunctionality();
                }
            }, 300);
        } catch (error) {
            console.error('Error in removeActiveForm:', error);
            chatnest.activeForm = null;
            chatnest.activeModal = null;
            const chatWindow = chatnest.widget.querySelector('.chat-window');
            if (chatWindow) chatWindow.classList.remove('form-active');
            chatnest.enableChatFunctionality();
        }
    } else {
        console.log('No active form to remove');
    }
}
