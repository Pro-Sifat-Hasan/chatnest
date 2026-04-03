/**
 * Wire validation + submission for the native lead-capture form.
 * On success:
 *  1. Saves all field values to localStorage
 *  2. If the email field is present and useEmailAsUserId is true,
 *     updates chatnest.userManager.currentUser with the submitted email
 *  3. Calls the optional onSubmit(formData) callback
 *  4. Shows a success message then dismisses the overlay
 *
 * @param {Chatnest}     chatnest  - Chatnest instance
 * @param {HTMLFormElement} form   - The <form> element
 * @param {HTMLElement}  overlay   - The overlay wrapper (for removal)
 */
export function setupNativeFormHandlers(chatnest, form, overlay) {
    const cfg = chatnest.config.nativeForm;

    // ── Live validation ─────────────────────────────────────────────────────
    cfg.fields.forEach(fieldCfg => {
        const input = form.querySelector(`[name="${fieldCfg.name}"]`);
        const errorEl = form.querySelector(`#cnf-${fieldCfg.name}-error`);
        if (!input) return;

        input.addEventListener('input', () => {
            const msg = _validate(input.value, fieldCfg);
            _setError(input, errorEl, msg);
        });

        input.addEventListener('blur', () => {
            const msg = _validate(input.value, fieldCfg);
            _setError(input, errorEl, msg);
        });
    });

    // ── Submit ───────────────────────────────────────────────────────────────
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validate all fields
        let firstInvalid = null;
        let allValid = true;
        const formData = {};

        cfg.fields.forEach(fieldCfg => {
            const input = form.querySelector(`[name="${fieldCfg.name}"]`);
            const errorEl = form.querySelector(`#cnf-${fieldCfg.name}-error`);
            if (!input) return;

            const msg = _validate(input.value, fieldCfg);
            _setError(input, errorEl, msg);
            if (msg) {
                allValid = false;
                if (!firstInvalid) firstInvalid = input;
            } else {
                formData[fieldCfg.name] = input.value.trim();
            }
        });

        if (!allValid) {
            if (firstInvalid) firstInvalid.focus();
            return;
        }

        const submitBtn  = form.querySelector('#cnf-submit');
        const submitErr  = form.querySelector('#cnf-submit-error');

        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
        if (submitErr) submitErr.textContent = '';

        try {
            // Call optional custom onSubmit callback
            if (typeof cfg.onSubmit === 'function') {
                const result = await cfg.onSubmit(formData);
                // If callback explicitly returns false, treat as failure
                if (result === false) {
                    throw new Error('Form submission rejected by onSubmit callback.');
                }
            }

            // ── Persist to localStorage ──────────────────────────────────────
            chatnest.nativeFormManager.saveSubmission(formData);

            // ── Update userId if email field exists ──────────────────────────
            if (cfg.useEmailAsUserId && formData.email) {
                chatnest.userManager.updateUserIdWithEmail(formData.email);
            }

            // ── Show success ─────────────────────────────────────────────────
            const card = overlay.querySelector('.cn-native-form-card');
            if (card) {
                card.innerHTML = `
                    <div class="cnf-success" style="opacity:0;transform:translateY(8px)">
                        <div class="cnf-success-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="20 6 9 17 4 12"/>
                            </svg>
                        </div>
                        <h4>You're all set!</h4>
                        <p>Thanks for sharing your details. Let's chat.</p>
                        <div class="cnf-success-countdown">Starting in <span id="cnf-countdown">2</span>s…</div>
                    </div>
                `;

                requestAnimationFrame(() => {
                    const s = card.querySelector('.cnf-success');
                    if (s) {
                        s.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                        s.style.opacity    = '1';
                        s.style.transform  = 'translateY(0)';
                    }
                });

                let n = 2;
                const cdEl = card.querySelector('#cnf-countdown');
                const iv = setInterval(() => {
                    n--;
                    if (cdEl) cdEl.textContent = n;
                    if (n <= 0) clearInterval(iv);
                }, 1000);

                setTimeout(() => {
                    clearInterval(iv);
                    _dismissOverlay(chatnest, overlay);
                }, 2000);
            } else {
                _dismissOverlay(chatnest, overlay);
            }

        } catch (err) {
            console.error('[Chatnest] Native form submission error:', err);
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
            if (submitErr) submitErr.textContent = 'Something went wrong. Please try again.';
        }
    });
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function _validate(value, fieldCfg) {
    const v = (value || '').trim();

    if (fieldCfg.required && !v) {
        return `${fieldCfg.label} is required.`;
    }
    if (!v) return ''; // optional + empty → ok

    // Custom validator takes priority
    if (typeof fieldCfg.validate === 'function') {
        const msg = fieldCfg.validate(v);
        return msg || '';
    }

    // Built-in type validators
    if (fieldCfg.type === 'email' || fieldCfg.name === 'email') {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Enter a valid email address.';
    }
    if (fieldCfg.type === 'tel' || fieldCfg.name === 'phone') {
        const digits = v.replace(/\D/g, '');
        return digits.length >= 7 && digits.length <= 20 ? '' : 'Enter a valid phone number.';
    }
    if ((fieldCfg.name === 'fullname' || fieldCfg.name === 'name') && fieldCfg.required) {
        return v.length >= 2 ? '' : 'Enter your full name.';
    }

    return '';
}

function _setError(input, errorEl, message) {
    const group = input.closest('.cnf-form-group');
    if (message) {
        if (group) group.classList.add('has-error');
        if (errorEl) errorEl.textContent = message;
        input.setAttribute('aria-invalid', 'true');
    } else {
        if (group) group.classList.remove('has-error');
        if (errorEl) errorEl.textContent = '';
        input.removeAttribute('aria-invalid');
    }
}

function _dismissOverlay(chatnest, overlay) {
    const messagesContainer = chatnest.widget?.querySelector('.chat-messages');
    if (messagesContainer) messagesContainer.classList.remove('modal-active');

    if (chatnest._nativeFormScrollLock) {
        overlay.removeEventListener('wheel',     chatnest._nativeFormScrollLock);
        overlay.removeEventListener('touchmove', chatnest._nativeFormScrollLock);
        chatnest._nativeFormScrollLock = null;
    }

    overlay.style.transition = 'opacity 0.25s ease';
    overlay.style.opacity    = '0';

    setTimeout(() => {
        overlay.remove();
        chatnest.activeForm  = null;
        chatnest.activeModal = null;
        const chatWindow = chatnest.widget?.querySelector('.chat-window');
        if (chatWindow) chatWindow.classList.remove('form-active');
        chatnest.enableChatFunctionality();

        // Focus the textarea so the user can start typing immediately
        const input = chatnest.widget?.querySelector('.chat-input .chat-textarea');
        if (input) input.focus();
    }, 280);
}
