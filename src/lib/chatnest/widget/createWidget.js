/**
 * Create the chat widget DOM structure
 * @param {Chatnest} chatnest - Chatnest instance
 */
import { togglePositions } from '../../constants.js';

export function createWidget(chatnest) {
    const widget = document.createElement('div');
    widget.className = `chat-widget ${chatnest.config.theme}-theme ${chatnest.config.position}${chatnest.config.parlant.enabled ? ' parlant-mode' : ''}`;

    // Get position styles
    const positionStyle = togglePositions[chatnest.config.position];

    // Create toggle button with explicit positioning
    const toggleStyle = Object.entries(positionStyle.toggle)
        .map(([key, value]) => `${key}: ${value};`)
        .join(' ');

    // Generate send button icon
    const generateSendIcon = () => {
        return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M2.01 21L23 12 2.01 3 2 10l15 2-15 2z'/%3E%3C/svg%3E`;
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
                    <button class="chat-text-box-close">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
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
        <div class="chat-window" role="dialog" aria-modal="true" aria-label="Chat with ${chatnest.config.botName}" style="position: fixed; ${windowStyle}">
            <div class="chat-header">
                <div class="chat-header-title">
                    <div class="chat-header-avatar">
                        <img src="${chatnest.config.botImage}" alt="${chatnest.config.botName}" class="bot-avatar">
                    </div>
                    <div class="chat-header-text">
                        <h2 style="font-weight: bold; font-size: 20px; margin: 0;">${chatnest.config.botName}</h2>
                        ${chatnest.config.showBotSubname && chatnest.config.botSubname ? `<div class="chat-header-subname">${chatnest.config.botSubname}</div>` : ''}
                    </div>
                </div>
                <div class="chat-header-actions">
                    ${chatnest.config.enableDeleteButton ? `
                    <button class="erase-chat">
                        <img src="https://i.ibb.co.com/9YP3swm/erase.png" alt="Erase" title="Clear chat history">
                    </button>
                    ` : ''}
                    <button class="close-chat">
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z'/%3E%3C/svg%3E" alt="Close" title="Close chat">
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
                    ${chatnest.config.chips.map(chip => `
                        <button type="button" class="chip">${chip}</button>
                    `).join('')}
                </div>
            ` : ''}

            <div class="chat-input-container">
                <div class="chat-input">
                    <textarea class="chat-textarea" rows="1" placeholder="${chatnest.config.placeholder}" aria-label="Chat input"></textarea>
                    ${chatnest.config.enableFileUpload ? `
                    <input type="file" class="file-input" ${chatnest.config.maxFiles !== 1 ? 'multiple' : ''} accept="${chatnest.config.fileAccept}" style="display: none;">
                    <button class="file-button" title="${chatnest.config.maxFiles === 1 ? 'Attach image' : 'Attach files'}">
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3E%3Cpath d='M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z'/%3E%3C/svg%3E" alt="Attach">
                    </button>
                    ` : ''}
                    <button class="send-button">
                        <img src="${generateSendIcon()}" alt="Send">
                    </button>
                </div>
                ${chatnest.config.enableFileUpload ? '<div class="file-preview" style="display: none;"></div>' : ''}
            </div>
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
