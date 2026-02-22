/**
 * Setup HubSpot form validation and submission handlers
 * @param {Chatnest} chatnest - Chatnest instance
 * @param {HTMLFormElement} form - Form element
 */
import { validateFullName, validateEmail, validatePhoneNumber } from '../../utils/form.js';

export function setupHubSpotFormHandlers(chatnest, form) {
    form.querySelector('#fullname').addEventListener('input', function () {
        const error = form.querySelector('#fullname-error');
        error.textContent = validateFullName(this.value) ? '' : 'Please enter your full name';
    });

    form.querySelector('#email').addEventListener('input', function () {
        const error = form.querySelector('#email-error');
        error.textContent = validateEmail(this.value) ? '' : 'Please enter a valid email';
    });

    form.querySelector('#phone').addEventListener('input', function () {
        const error = form.querySelector('#phone-error');
        error.textContent = validatePhoneNumber(this.value) ? '' : 'Please enter a valid phone number';
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitButton = form.querySelector('#submitButton');
        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';

        const fullname = form.querySelector('#fullname').value;
        const email = form.querySelector('#email').value;
        const phone = form.querySelector('#phone').value;

        if (!validateFullName(fullname) || !validateEmail(email) || !validatePhoneNumber(phone)) {
            submitButton.disabled = false;
            submitButton.textContent = 'Submit';
            return;
        }

        try {
            const response = await chatnest.submitToHubSpot({
                firstName: fullname.split(' ')[0],
                lastName: fullname.split(' ').slice(1).join(' '),
                email,
                phone: phone.replace(/\D/g, '')
            });

            if (response.ok) {
                if (chatnest.config.useEmailAsUserId) {
                    chatnest.userManager.updateUserIdWithEmail(email);
                }

                chatnest.userManager.recordFormSubmission({
                    firstName: fullname.split(' ')[0],
                    lastName: fullname.split(' ').slice(1).join(' '),
                    email,
                    phone: phone.replace(/\D/g, '')
                });

                chatnest.userManager.markFormAsShown();

                const modalContent = chatnest.widget.querySelector('.hubspot-form-modal-content');
                if (modalContent) {
                    modalContent.innerHTML = `
                        <div class="hubspot-form-success" style="opacity: 0; transform: translateY(10px)">
                            <h3>Thank you for your submission!</h3>
                            <p>We'll get back to you shortly.</p>
                            <div class="success-countdown">Closing in <span class="countdown-number">2</span> seconds...</div>
                        </div>
                    `;

                    requestAnimationFrame(() => {
                        const successMessage = modalContent.querySelector('.hubspot-form-success');
                        successMessage.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                        successMessage.style.opacity = '1';
                        successMessage.style.transform = 'translateY(0)';
                    });

                    let countdown = 2;
                    const countdownElement = modalContent.querySelector('.countdown-number');
                    const countdownInterval = setInterval(() => {
                        countdown--;
                        if (countdownElement) {
                            countdownElement.textContent = countdown;
                        }
                        if (countdown <= 0) {
                            clearInterval(countdownInterval);
                        }
                    }, 1000);

                    setTimeout(() => {
                        clearInterval(countdownInterval);
                        chatnest.removeActiveForm();
                    }, 1500);

                    setTimeout(() => {
                        clearInterval(countdownInterval);
                        if (chatnest.activeForm) {
                            chatnest.activeForm.remove();
                            chatnest.activeForm = null;
                            chatnest.activeModal = null;
                            chatnest.enableChatFunctionality();
                        }
                    }, 2000);
                }
            } else {
                throw new Error('Submission failed');
            }
        } catch (error) {
            console.error('HubSpot submission error:', error);
            submitButton.textContent = 'Error - Try Again';
            submitButton.disabled = false;

            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = 'Failed to submit form. Please try again.';
            form.appendChild(errorDiv);
        }
    });
}
