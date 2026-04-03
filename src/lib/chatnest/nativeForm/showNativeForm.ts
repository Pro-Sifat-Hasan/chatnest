/**
 * Show the native (built-in, fully customisable) lead-capture form.
 * Mirrors the HubSpot modal pattern but saves data locally and
 * sets the user's email as their API user_id.
 *
 * @param {Chatnest} chatnest - Chatnest instance
 */
import { setupNativeFormHandlers } from './setupNativeFormHandlers.js';

const STYLE_ID = 'chat-widget-native-form-styles';

export function showNativeForm(chatnest: any) {
    if (!chatnest.config.nativeForm?.enabled) return;
    if (chatnest.nativeFormManager.hasSubmitted()) return;
    if (chatnest.isFormActive()) return;

    chatnest.disableChatFunctionality();

    // Clean up any stale overlay
    chatnest.widget.querySelectorAll('.cn-native-form-overlay').forEach((el: Element) => el.remove());

    const chatWindow = chatnest.widget.querySelector('.chat-window');
    chatWindow.classList.add('form-active');

    const cfg = chatnest.config.nativeForm;
    const isDark = chatnest.widget.classList.contains('dark-theme');

    // Build field HTML from config
    const fieldsHtml = cfg.fields.map((field: any) => {
        const id = `cnf-${field.name}`;
        const req = field.required ? ' *' : '';
        const ariaReq = field.required ? ' aria-required="true"' : '';
        return `
            <div class="cnf-form-group" data-field="${field.name}">
                <label for="${id}">${field.label}${req}</label>
                <input
                    type="${field.type || 'text'}"
                    id="${id}"
                    name="${field.name}"
                    placeholder="${field.placeholder || ''}"
                    autocomplete="${_autocomplete(field)}"
                    ${ariaReq}
                >
                <div class="cnf-field-error" id="${id}-error" role="alert" aria-live="polite"></div>
            </div>
        `;
    }).join('');

    const overlay = document.createElement('div');
    overlay.className = 'cn-native-form-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'cnf-title');
    overlay.innerHTML = `
        <div class="cn-native-form-backdrop"></div>
        <div class="cn-native-form-container">
            <div class="cn-native-form-card${isDark ? ' cn-dark' : ''}">
                <div class="cnf-header">
                    <h3 id="cnf-title">${cfg.title}</h3>
                    <p>${cfg.subtitle}</p>
                </div>
                <form id="cnf-form" class="cnf-form" novalidate>
                    ${fieldsHtml}
                    <div class="cnf-submit-error" id="cnf-submit-error" role="alert" aria-live="assertive"></div>
                    <button type="submit" id="cnf-submit" class="cnf-submit-btn">
                        ${cfg.submitLabel}
                    </button>
                </form>
            </div>
        </div>
    `;

    chatWindow.appendChild(overlay);
    chatnest.activeForm = overlay;
    chatnest.activeModal = overlay;

    _injectStyles(chatnest);

    const messagesContainer = chatnest.widget.querySelector('.chat-messages');
    if (messagesContainer) messagesContainer.classList.add('modal-active');

    // Scroll lock
    chatnest._nativeFormScrollLock = (e: any) => {
        if (!e.target.closest('.cn-native-form-container')) {
            e.preventDefault();
            e.stopPropagation();
        }
    };
    overlay.addEventListener('wheel',     chatnest._nativeFormScrollLock, { passive: false });
    overlay.addEventListener('touchmove', chatnest._nativeFormScrollLock, { passive: false });

    // Wire up handlers
    const form = overlay.querySelector('#cnf-form');
    setupNativeFormHandlers(chatnest, form, overlay);

    // Animate in
    requestAnimationFrame(() => { overlay.style.opacity = '1'; });

    // Move focus to first field
    setTimeout(() => {
        const first = overlay.querySelector('input');
        if (first) first.focus();
    }, 80);
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function _autocomplete(field: any): string {
    const map: Record<string, string> = { email: 'email', tel: 'tel', text: 'name', name: 'name' };
    return map[field.name] || map[field.type] || 'on';
}

function _injectStyles(chatnest: any) {
    if (document.getElementById(STYLE_ID)) return;

    const primaryColor = chatnest.config.primaryColor || '#0084ff';
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
        /* ── Native Form Overlay ─────────────────────────────── */
        .cn-native-form-overlay {
            position: absolute;
            inset: 0;
            z-index: 50000;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.25s ease;
            overflow: hidden;
            overscroll-behavior: contain;
        }

        .cn-native-form-backdrop {
            position: absolute;
            inset: 0;
            background: rgba(15, 23, 42, 0.55);
            backdrop-filter: blur(2px);
        }

        .cn-native-form-container {
            position: relative;
            z-index: 1;
            width: 92%;
            max-width: 340px;
            max-height: 88%;
            overflow-y: auto;
            overscroll-behavior: contain;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: thin;
            scrollbar-color: #cbd5e1 transparent;
            animation: cnf-slide-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }

        @keyframes cnf-slide-in {
            from { opacity: 0; transform: translateY(-18px) scale(0.96); }
            to   { opacity: 1; transform: translateY(0)    scale(1);     }
        }

        /* ── Card ─────────────────────────────────────────────── */
        .cn-native-form-card {
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 24px 64px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.06);
            padding: 24px 22px 20px;
            position: relative;
        }

        .cn-native-form-card.cn-dark {
            background: #1e293b;
            box-shadow: 0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06);
        }

        /* ── Header ───────────────────────────────────────────── */
        .cnf-header {
            text-align: center;
            margin-bottom: 20px;
        }

        .cnf-header h3 {
            margin: 0 0 6px;
            font-size: 17px;
            font-weight: 700;
            color: #0f172a;
            line-height: 1.3;
        }

        .cn-native-form-card.cn-dark .cnf-header h3 {
            color: #f1f5f9;
        }

        .cnf-header p {
            margin: 0;
            font-size: 13px;
            color: #64748b;
            line-height: 1.45;
        }

        .cn-native-form-card.cn-dark .cnf-header p {
            color: #94a3b8;
        }

        /* ── Form Groups ──────────────────────────────────────── */
        .cnf-form-group {
            margin-bottom: 14px;
        }

        .cnf-form-group label {
            display: block;
            margin-bottom: 5px;
            font-size: 12.5px;
            font-weight: 600;
            color: #374151;
            letter-spacing: 0.01em;
        }

        .cn-native-form-card.cn-dark .cnf-form-group label {
            color: #cbd5e1;
        }

        .cnf-form-group input {
            width: 100%;
            padding: 9px 12px;
            border: 1.5px solid #e2e8f0;
            border-radius: 9px;
            font-size: 14px;
            color: #0f172a;
            background: #f8fafc;
            box-sizing: border-box;
            transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
            -webkit-appearance: none;
        }

        .cn-native-form-card.cn-dark .cnf-form-group input {
            background: #0f172a;
            border-color: #334155;
            color: #f1f5f9;
        }

        .cnf-form-group input::placeholder { color: #9ca3af; }

        .cnf-form-group input:focus {
            outline: none;
            border-color: ${primaryColor};
            background: #ffffff;
            box-shadow: 0 0 0 3px ${primaryColor}28;
        }

        .cn-native-form-card.cn-dark .cnf-form-group input:focus {
            background: #1e293b;
        }

        /* invalid state */
        .cnf-form-group.has-error input {
            border-color: #ef4444;
            box-shadow: 0 0 0 3px rgba(239,68,68,0.18);
        }

        .cnf-field-error {
            min-height: 16px;
            font-size: 11.5px;
            color: #ef4444;
            margin-top: 4px;
            font-weight: 500;
        }

        .cnf-submit-error {
            min-height: 18px;
            font-size: 12px;
            color: #ef4444;
            text-align: center;
            margin-bottom: 8px;
            font-weight: 500;
        }

        /* ── Submit Button ────────────────────────────────────── */
        .cnf-submit-btn {
            width: 100%;
            padding: 11px 16px;
            border: none;
            border-radius: 10px;
            background: ${primaryColor};
            color: #fff;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            letter-spacing: 0.01em;
            transition: opacity 0.18s, transform 0.18s, box-shadow 0.18s;
            margin-top: 4px;
        }

        .cnf-submit-btn:hover:not(:disabled) {
            opacity: 0.9;
            transform: translateY(-1px);
            box-shadow: 0 6px 20px ${primaryColor}55;
        }

        .cnf-submit-btn:active:not(:disabled) {
            transform: translateY(0);
        }

        .cnf-submit-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        .cnf-submit-btn.loading {
            position: relative;
            color: transparent;
        }

        .cnf-submit-btn.loading::after {
            content: '';
            position: absolute;
            inset: 0;
            margin: auto;
            width: 18px;
            height: 18px;
            border: 2px solid rgba(255,255,255,0.4);
            border-top-color: #fff;
            border-radius: 50%;
            animation: cnf-spin 0.7s linear infinite;
        }

        @keyframes cnf-spin {
            to { transform: rotate(360deg); }
        }

        /* ── Success state ────────────────────────────────────── */
        .cnf-success {
            text-align: center;
            padding: 10px 4px 4px;
        }

        .cnf-success-icon {
            width: 48px;
            height: 48px;
            background: #dcfce7;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 12px;
        }

        .cnf-success-icon svg { color: #16a34a; }

        .cnf-success h4 {
            margin: 0 0 6px;
            font-size: 16px;
            font-weight: 700;
            color: #0f172a;
        }

        .cn-native-form-card.cn-dark .cnf-success h4 { color: #f1f5f9; }

        .cnf-success p {
            margin: 0 0 14px;
            font-size: 13px;
            color: #64748b;
        }

        .cnf-success-countdown {
            font-size: 11.5px;
            color: #94a3b8;
        }

        /* ── Responsive tweaks ───────────────────────────────── */
        @media (max-width: 480px) {
            .cn-native-form-container {
                width: 96%;
                max-width: 100%;
                max-height: 92%;
            }
            .cn-native-form-card {
                border-radius: 12px;
                padding: 18px 16px 16px;
            }
        }

        /* hide branding/input when form is active */
        .chat-window.form-active .chat-input-container,
        .chat-window.form-active .suggestion-chips,
        .chat-window.form-active .chat-branding,
        .chat-window.form-active .chat-privacy-notice {
            display: none !important;
        }
    `;
    document.head.appendChild(style);
}
