/**
 * Theme utilities for Chatnest
 */

export const THEME_COLORS = {
    light: {
        bg: '#ffffff',
        text: '#333333',
        border: '#e1e5e9',
        inputBg: '#ffffff',
        messageBg: '#ffffff',
        headerBg: '#ffffff',
        headerText: '#333333'
    },
    dark: {
        bg: '#1a1a1a',
        text: '#ffffff',
        border: '#404040',
        inputBg: '#2d2d2d',
        messageBg: '#2d2d2d',
        headerBg: '#2d2d2d',
        headerText: '#ffffff'
    }
};

export function getCurrentTheme(themeSetting: string): string {
    if (themeSetting === 'system') {
        return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return themeSetting;
}

export function getThemeColor(type: string, themeSetting: string): string {
    const theme = getCurrentTheme(themeSetting) as keyof typeof THEME_COLORS;
    const themeColors = THEME_COLORS[theme] ?? THEME_COLORS.light;
    return (themeColors as Record<string, string>)[type] || (THEME_COLORS.light as Record<string, string>)[type];
}

export function formatTimestamp(timestamp?: string | number | Date): string {
    const date = timestamp ? new Date(timestamp) : new Date();
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
