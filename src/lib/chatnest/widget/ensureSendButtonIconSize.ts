/**
 * Ensure send button icon size is applied
 * @param {Chatnest} chatnest - Chatnest instance
 */
export function ensureSendButtonIconSize(chatnest: any) {
    const sendButton = chatnest.widget.querySelector('.send-button');
    const sendButtonImg = chatnest.widget.querySelector('.send-button img');

    if (sendButton && sendButtonImg) {
        const iconSize = chatnest.config.sendButtonIconSize;

        sendButton.style.width = `${iconSize + 16}px`;
        sendButton.style.height = `${iconSize + 16}px`;
        sendButton.style.minWidth = `${iconSize + 16}px`;
        sendButton.style.minHeight = `${iconSize + 16}px`;

        sendButtonImg.style.width = `${iconSize}px`;
        sendButtonImg.style.height = `${iconSize}px`;
        sendButtonImg.style.minWidth = `${iconSize}px`;
        sendButtonImg.style.minHeight = `${iconSize}px`;
        sendButtonImg.style.maxWidth = `${iconSize}px`;
        sendButtonImg.style.maxHeight = `${iconSize}px`;
        sendButtonImg.style.objectFit = 'contain';
        sendButtonImg.style.display = 'block';
        sendButtonImg.style.flexShrink = '0';
    }
}
