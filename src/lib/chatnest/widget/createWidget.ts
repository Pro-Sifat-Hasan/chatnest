/**
 * Create the chat widget DOM structure
 * @param {Chatnest} chatnest - Chatnest instance
 */
import { togglePositions } from '../../constants.js';

export function createWidget(chatnest: any) {
    const widget = document.createElement('div');
    widget.className = `chat-widget ${chatnest.config.theme}-theme ${chatnest.config.position}${chatnest.config.parlant.enabled ? ' parlant-mode' : ''}`;

    // Get position styles
    const positionStyle = (togglePositions as Record<string, any>)[chatnest.config.position];

    // Create toggle button with explicit positioning
    const toggleStyle = Object.entries(positionStyle.toggle)
        .map(([key, value]) => `${key}: ${value};`)
        .join(' ');

    // Modern send icon: sleek paper airplane with sharp edges (white)
    const generateSendIcon = () => {
        return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23000'%3E%3Cpath d='M3.4 20.4l17.45-7.48a1 1 0 000-1.84L3.4 3.6a.993.993 0 00-1.39.91L2 9.12c0 .5.37.93.87.99L17 12 2.87 13.88c-.5.06-.87.49-.87.99l.01 4.61c0 .71.73 1.2 1.39.91z'/%3E%3C/svg%3E`;
    };

    const generateToggleIcon = () => {
        if (!chatnest.config.toggleButtonIcon) {
            return `<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z'/%3E%3C/svg%3E" alt="Chat">`;
        }

        const icon = chatnest.config.toggleButtonIcon;

        if (icon.length <= 4 && /\p{Emoji}/u.test(icon)) {
            return `<span style="font-size: 24px; line-height: 1; display: flex; align-items: center; justify-content: center;">${icon}</span>`;
        }

        if (icon.startsWith('http') || icon.startsWith('data:image') || icon.startsWith('/')) {
            return `<img src="${icon}" alt="Chat" style="width: 24px; height: 24px; object-fit: contain;">`;
        }

        if (icon.trim().startsWith('<svg')) {
            return icon;
        }

        return `<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z'/%3E%3C/svg%3E" alt="Chat">`;
    };

    const toggleButtonHtml = `
        <button type="button" class="chat-toggle" aria-label="Open chat" aria-expanded="false" style="position: fixed; ${toggleStyle}">
            ${generateToggleIcon()}
        </button>
    `;

    const textBoxHtml = chatnest.config.showTextBox ? `
        <div class="chat-text-box" style="position: fixed;">
            <div class="chat-text-box-content">
                ${chatnest.config.showTextBoxCloseButton ? `
                    <button type="button" class="chat-text-box-close" aria-label="Dismiss message">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                ` : ''}
                <div class="chat-text-box-message" ${chatnest.config.textBoxTextColor === 'primary' && chatnest.isGradient(chatnest.config.primaryColor) ? 'data-gradient="true"' : ''}>${chatnest.config.textBoxMessage}</div>
                <div class="chat-text-box-separator"></div>
                <div class="chat-text-box-submessage" ${chatnest.config.textBoxTextColor === 'primary' && chatnest.isGradient(chatnest.config.primaryColor) ? 'data-gradient="true"' : ''}>${chatnest.config.textBoxSubMessage}</div>
            </div>
        </div>
    ` : '';

    const windowStyle = Object.entries(positionStyle.window)
        .map(([key, value]) => `${key}: ${value};`)
        .join(' ');

    const greetingTimestampHtml = chatnest.config.showTimestamp
        ? `<div class="message-timestamp bot-timestamp">${chatnest.formatTimestamp()}</div>`
        : '';
    const typingIndicatorHtml = chatnest.config.showTypingText
        ? `<div class="typing-text" aria-live="polite" aria-atomic="true">Thinking<div class="typing-spinner" aria-hidden="true"></div></div>`
        : `<div class="typing-spinner" aria-hidden="true"></div>`;

    const chatWindowHtml = `
        <div class="chat-window" role="dialog" aria-modal="true" aria-labelledby="chat-dialog-title" style="position: fixed; ${windowStyle}">
            <div class="chat-header">
                <div class="chat-header-title">
                    <div class="chat-header-avatar">
                        <img src="${chatnest.config.botImage}" alt="${chatnest.config.botName}" class="bot-avatar">
                    </div>
                    <div class="chat-header-text">
                        <h2 id="chat-dialog-title" style="font-weight: bold; font-size: 20px; margin: 0;">${chatnest.config.botName}</h2>
                        ${chatnest.config.showBotSubname && chatnest.config.botSubname ? `<div class="chat-header-subname">${chatnest.config.botSubname}</div>` : ''}
                    </div>
                </div>
                <div class="chat-header-actions">
                    ${chatnest.config.enableDeleteButton ? `
                    <button type="button" class="erase-chat" aria-label="Clear chat history">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="20" height="20" aria-hidden="true">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                    </button>
                    ` : ''}
                    <button type="button" class="close-chat" aria-label="Close chat">
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z'/%3E%3C/svg%3E" alt="" aria-hidden="true">
                    </button>
                </div>
            </div>

            <div class="chat-messages">
                <div class="message-row" id="greeting-row">
                    <div class="message bot-message greeting-message">
                        ${chatnest.config.greeting}
                        ${greetingTimestampHtml}
                    </div>
                </div>
                <div class="typing-indicator" aria-live="polite" aria-atomic="true">
                    ${typingIndicatorHtml}
                </div>
                <div class="chat-spacer"></div>
            </div>

            ${chatnest.config.chips.length > 0 ? `
                <div class="suggestion-chips" role="group" aria-label="Suggested questions">
                    ${chatnest.config.chips.map((chip: any) => `
                        <button type="button" class="chip">${chip}</button>
                    `).join('')}
                </div>
            ` : ''}

            <div class="chat-input-container">
                <div class="chat-input">
                    <textarea class="chat-textarea" rows="1" placeholder="${chatnest.config.placeholder}" aria-label="Chat input"></textarea>
                    ${chatnest.config.enableFileUpload ? `
                    <input type="file" class="file-input" ${chatnest.config.maxFiles !== 1 ? 'multiple' : ''} accept="${chatnest.config.fileAccept}" style="display: none;">
                    <button type="button" class="file-button" aria-label="${chatnest.config.maxFiles === 1 ? 'Attach image' : 'Attach files'}">
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3E%3Cpath d='M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z'/%3E%3C/svg%3E" alt="" aria-hidden="true">
                    </button>
                    ` : ''}
                    <button type="button" class="send-button" aria-label="Send message">
                        <img src="${generateSendIcon()}" alt="" aria-hidden="true">
                    </button>
                </div>
                ${chatnest.config.enableFileUpload ? '<div class="file-preview" style="display: none;"></div>' : ''}
            </div>
            ${chatnest.config.showPrivacyNotice ? `
                <div class="chat-privacy-notice" role="note">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" width="11" height="11" style="flex-shrink:0;margin-top:1px"><path d="M8 1a4 4 0 0 0-4 4v1H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-1V5a4 4 0 0 0-4-4zm-2 5V5a2 2 0 1 1 4 0v1H6z"/></svg>
                    ${chatnest.config.privacyNoticeText}
                </div>
            ` : ''}
            ${chatnest.config.showBranding ? `
                <div class="chat-branding">
                    Powered by <a href="${chatnest.config.brandingUrl}" target="_blank" rel="noopener noreferrer"><strong>${chatnest.config.brandingText.replace(/^Powered by\s*/i, '')}</strong></a>
                </div>
            ` : ''}
        </div>
    `;

    widget.innerHTML = textBoxHtml + toggleButtonHtml + chatWindowHtml;
    document.body.appendChild(widget);
    chatnest.widget = widget;
}
