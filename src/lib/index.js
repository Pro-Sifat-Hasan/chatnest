/**
 * Chatnest lib - barrel export for utilities and managers
 */

export { debounce, togglePositions, additionalStyles } from './constants.js';
export { initConfig } from './config.js';
export { ChatUserManager } from './ChatUserManager.js';
export { ChatStorageManager } from './ChatStorageManager.js';
export { hexToRgb, isGradient } from './utils/color.js';
export { isEmoji, isImageUrl, isSvg, sanitizeSvg, generateAvatarHtml } from './utils/avatar.js';
export { getCurrentTheme, getThemeColor, formatTimestamp, THEME_COLORS } from './utils/theme.js';
export { loadScript, formatFileSize, isMobileBrowser } from './utils/dom.js';
export { validateFullName, validateEmail, validatePhoneNumber } from './utils/form.js';
export { formatRequestData } from './api.js';
