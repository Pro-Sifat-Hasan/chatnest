/**
 * Show HubSpot form as modal overlay
 * @param {Chatnest} chatnest - Chatnest instance
 */
export function showHubSpotForm(chatnest: any) {
    if (!chatnest.config.hubspot?.enabled) {
        return;
    }
    if (chatnest.userManager.hasSubmittedForm()) return;
    if (chatnest.isFormActive()) return;

    chatnest.disableChatFunctionality();

    const existingForms = chatnest.widget.querySelectorAll('.hubspot-form-modal-overlay');
    existingForms.forEach((form: Element) => form.remove());

    const chatWindow = chatnest.widget.querySelector('.chat-window');
    chatWindow.classList.add('form-active');
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'hubspot-form-modal-overlay';
    modalOverlay.innerHTML = `
        <div class="hubspot-form-modal-backdrop"></div>
        <div class="hubspot-form-modal-container">
            <div class="hubspot-form-modal-content">
            <div class="form-header">
                    <h3>${chatnest.config.formTitle}</h3>
                    <p>${chatnest.config.formSubtitle}</p>
            </div>
            <form id="hubspotForm" class="hubspot-form">
                <div class="form-group">
                    <label for="fullname">Full Name *</label>
                    <input type="text" id="fullname" name="fullname" required 
                           placeholder="Enter your full name">
                    <div id="fullname-error" class="error-message"></div>
                </div>
                <div class="form-group">
                    <label for="email">Email Address *</label>
                    <input type="email" id="email" name="email" required 
                           placeholder="Enter your email">
                    <div id="email-error" class="error-message"></div>
                </div>
                <div class="form-group">
                    <label for="phone">Phone Number *</label>
                    <input type="tel" id="phone" name="phone" required 
                           placeholder="Enter your phone number">
                    <div id="phone-error" class="error-message"></div>
                </div>
                <button type="submit" id="submitButton">Submit</button>
            </form>
            </div>
        </div>
    `;

    chatWindow.appendChild(modalOverlay);
    chatnest.activeForm = modalOverlay;

    // Inject modal styles only once — guard by ID to prevent duplicate <style> tags
    // on repeated form shows/dismissals
    const MODAL_STYLE_ID = 'chat-widget-hubspot-styles';
    if (!document.getElementById(MODAL_STYLE_ID)) {
    const modalStyles = document.createElement('style');
    modalStyles.id = MODAL_STYLE_ID;
    modalStyles.textContent = `
        .hubspot-form-modal-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 50000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: modalFadeIn 0.3s ease-out;
            pointer-events: auto;
            overflow: hidden;
            overscroll-behavior: contain;
        }

        .chat-window.form-active .chat-input-container,
        .chat-window.form-active .suggestion-chips,
        .chat-window.form-active .chat-branding {
            display: none !important;
        }

        .hubspot-form-modal-backdrop {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            filter: none !important;
        }

        .hubspot-form-modal-container {
            position: relative;
            z-index: 1001;
            width: 90%;
            max-width: 320px;
            max-height: 70%;
            overflow-y: auto;
            animation: modalSlideIn 0.3s ease-out;
            overscroll-behavior: contain;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: thin;
            scrollbar-color: #c1c1c1 #f1f1f1;
        }

        .hubspot-form-modal-container::-webkit-scrollbar {
            width: 6px;
        }

        .hubspot-form-modal-container::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 3px;
        }

        .hubspot-form-modal-container::-webkit-scrollbar-thumb {
            background: #c1c1c1;
            border-radius: 3px;
        }

        .hubspot-form-modal-container::-webkit-scrollbar-thumb:hover {
            background: #a8a8a8;
        }

        .hubspot-form-modal-content {
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            padding: 20px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            position: relative;
            overflow: hidden;
        }

        @media (max-width: 768px) {
            .hubspot-form-modal-container {
                width: 95%;
                max-width: 300px;
                margin: 8px;
                max-height: 80%;
            }

            .hubspot-form-modal-content {
                padding: 16px;
                border-radius: 10px;
            }

            .form-header h3 {
                font-size: 16px;
            }

            .form-header p {
                font-size: 12px;
            }

            .hubspot-form .form-group {
                margin-bottom: 14px;
            }

            .hubspot-form input {
                padding: 8px 10px;
                font-size: 13px;
                -webkit-appearance: none;
                border-radius: 6px;
            }

            .hubspot-form button {
                padding: 10px 16px;
                font-size: 13px;
                -webkit-appearance: none;
                border-radius: 6px;
            }
        }

        @media screen and (-webkit-min-device-pixel-ratio: 0) {
            .hubspot-form input {
                font-size: 16px;
            }
        }

        @keyframes modalFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        @keyframes modalSlideIn {
            from {
                opacity: 0;
                transform: translateY(-20px) scale(0.95);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        .form-header {
            margin-bottom: 16px;
            text-align: center;
        }

        .form-header h3 {
            margin: 0 0 6px 0;
            color: #333;
            font-size: 18px;
            font-weight: 600;
        }

        .form-header p {
            margin: 0;
            color: #666;
            font-size: 13px;
            line-height: 1.3;
        }

        .hubspot-form .form-group {
            margin-bottom: 16px;
        }

        .hubspot-form label {
            display: block;
            margin-bottom: 6px;
            font-weight: 500;
            color: #333;
            font-size: 13px;
        }

        .hubspot-form input {
            width: 100%;
            padding: 10px 12px;
            border: 2px solid #e1e5e9;
            border-radius: 6px;
            font-size: 14px;
            transition: all 0.3s ease;
            background: #ffffff;
            box-sizing: border-box;
        }

        .hubspot-form input:focus {
            outline: none !important;
            border-color: #cbd5e1 !important;
            box-shadow: 0 0 0 3px rgba(203, 213, 225, 0.45) !important;
            background: #ffffff !important;
        }

        .hubspot-form input::placeholder {
            color: #999;
        }

        .hubspot-form .error-message {
            color: #dc3545;
            font-size: 12px;
            margin-top: 4px;
            min-height: 20px;
        }

        .hubspot-form button {
            background: var(--chat-primary-color, #0084ff);
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            width: 100%;
            transition: all 0.3s ease;
            margin-top: 6px;
        }

        .hubspot-form button:hover {
            opacity: 0.9;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 132, 255, 0.3);
        }

        .hubspot-form button:active {
            transform: translateY(0);
        }

        .hubspot-form button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }

        .chat-messages.modal-active {
            pointer-events: none;
            user-select: none;
            -webkit-user-select: none;
            opacity: 0.7;
        }

        .chat-messages.modal-active * {
            pointer-events: none !important;
        }

        .chat-header {
            filter: none !important;
            pointer-events: auto !important;
        }

        .chat-header * {
            filter: none !important;
            pointer-events: auto !important;
        }

        .hubspot-form-success {
            text-align: center;
            padding: 20px;
            background: #d4edda;
            border-radius: 8px;
            color: #155724;
            margin: 10px 0;
            border: 1px solid #c3e6cb;
        }

        .success-countdown {
            margin-top: 15px;
            font-size: 12px;
            color: #6c757d;
            opacity: 0.8;
        }

        .countdown-number {
            font-weight: bold;
            color: #155724;
        }
    `;
    document.head.appendChild(modalStyles);
    } // end style guard

    const messagesContainer = chatnest.widget.querySelector('.chat-messages');
    if (messagesContainer) {
        messagesContainer.classList.add('modal-active');
    }

    requestAnimationFrame(() => {
        modalOverlay.style.opacity = '1';
    });

    chatnest.preventScroll = (e: any) => {
        const container = e.currentTarget.querySelector('.hubspot-form-modal-container');
        if (container) {
            if (e.target.closest('.hubspot-form-modal-container')) {
                return true;
            }
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        return true;
    };

    try {
        modalOverlay.addEventListener('wheel', chatnest.preventScroll, { passive: false });
        modalOverlay.addEventListener('touchmove', chatnest.preventScroll, { passive: false });
    } catch (error) {
        console.warn('Could not add scroll prevention listeners:', error);
    }

    const form = modalOverlay.querySelector('#hubspotForm');
    if (form) {
        chatnest.setupHubSpotFormHandlers(form);
    }

    chatnest.activeModal = modalOverlay;
}
