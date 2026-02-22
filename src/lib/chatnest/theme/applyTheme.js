/**
 * Apply theme to chat widget
 * @param {Chatnest} chatnest - Chatnest instance
 */
import { getCurrentTheme } from '../../utils/theme.js';

export function applyTheme(chatnest) {
    const theme = getCurrentTheme(chatnest.config.theme);
    if (chatnest.widget) {
        const classes = new Set(chatnest.widget.className.split(/\s+/).filter(Boolean));
        [...classes].forEach((name) => {
            if (name.endsWith('-theme')) {
                classes.delete(name);
            }
        });
        classes.add('chat-widget');
        classes.add(`${theme}-theme`);
        if (chatnest.config.parlant.enabled) {
            classes.add('parlant-mode');
        } else {
            classes.delete('parlant-mode');
        }
        chatnest.widget.className = Array.from(classes).join(' ');
    }

    // Listen for system theme changes if using 'system' theme
    if (chatnest.config.theme === 'system') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', () => {
            chatnest.loadStyles();
        });
    }
}
