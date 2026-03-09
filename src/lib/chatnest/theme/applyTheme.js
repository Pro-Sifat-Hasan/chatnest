/**
 * Apply theme to chat widget and manage system-theme listener lifecycle.
 * @param {Chatnest} chatnest - Chatnest instance
 */
import { getCurrentTheme } from '../../utils/theme.js';

export function applyTheme(chatnest) {
    const theme = getCurrentTheme(chatnest.config.theme);

    if (chatnest.widget) {
        const classes = new Set(chatnest.widget.className.split(/\s+/).filter(Boolean));
        classes.forEach(name => { if (name.endsWith('-theme')) classes.delete(name); });
        classes.add('chat-widget');
        classes.add(`${theme}-theme`);
        if (chatnest.config.parlant.enabled) {
            classes.add('parlant-mode');
        } else {
            classes.delete('parlant-mode');
        }
        chatnest.widget.className = Array.from(classes).join(' ');
    }

    // System-theme listener — remove the old one before adding a new one
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (mq) {
        if (chatnest._systemThemeHandler) {
            mq.removeEventListener('change', chatnest._systemThemeHandler);
            chatnest._systemThemeHandler = null;
        }
        if (chatnest.config.theme === 'system') {
            chatnest._systemThemeHandler = () => chatnest.loadStyles();
            mq.addEventListener('change', chatnest._systemThemeHandler);
        }
    }
}
