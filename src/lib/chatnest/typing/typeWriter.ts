/**
 * Typewriter effect for message content
 * @param {Chatnest} chatnest - Chatnest instance
 * @param {Element} element - Target element
 * @param {string} text - Text to type
 * @param {Function} callback - Callback when done
 */
export function typeWriter(chatnest: any, element: any, text: any, callback: any) {
    // Use a reference counter so concurrent multi-part typewriters don't
    // prematurely clear isTypewriterActive when the first part finishes.
    chatnest._typewriterCount = (chatnest._typewriterCount || 0) + 1;
    chatnest.isTypewriterActive = true;
    chatnest.disableSendingFunctionality();

    const chatMessages = chatnest.widget.querySelector('.chat-messages');

    const scrollHandler = () => {
        // scroll position tracking reserved for future use
    };

    if (!chatnest.isMobileBrowser()) {
        chatMessages.addEventListener('scroll', scrollHandler);
    }

    const scrollToBottom = () => {
        if (chatnest.config.typewritewithscroll || !chatnest.isTypewriterActive) {
            chatMessages.scrollTo({
                top: chatMessages.scrollHeight,
                behavior: 'smooth'
            });
        }
    };

    function tokenizeContent(text: string): string[] {
        const tokens = [];
        let currentToken = '';
        let inTag = false;
        let inMarkdown = false;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];

            if (char === '<' && !inMarkdown) {
                if (currentToken) tokens.push(currentToken);
                currentToken = char;
                inTag = true;
            } else if (char === '>' && inTag) {
                currentToken += char;
                tokens.push(currentToken);
                currentToken = '';
                inTag = false;
            } else if (inTag) {
                currentToken += char;
            } else if (char === '*' && text[i + 1] === '*') {
                if (currentToken) tokens.push(currentToken);
                tokens.push('**');
                i++;
                currentToken = '';
            } else if (char === '[' || (char === '!' && text[i + 1] === '[')) {
                if (currentToken) tokens.push(currentToken);
                currentToken = char;
                inMarkdown = true;
            } else if (inMarkdown && char === ']' && text[i + 1] === '(') {
                currentToken += char + '(';
                i++;
            } else if (inMarkdown && char === ')') {
                currentToken += char;
                tokens.push(currentToken);
                currentToken = '';
                inMarkdown = false;
            } else if (char === ' ' || char === '\n') {
                if (currentToken) tokens.push(currentToken);
                tokens.push(char);
                currentToken = '';
            } else {
                currentToken += char;
                if (!inMarkdown && !inTag && (i === text.length - 1 || text[i + 1] === ' ' || text[i + 1] === '\n')) {
                    tokens.push(currentToken);
                    currentToken = '';
                }
            }
        }
        if (currentToken) tokens.push(currentToken);
        return tokens;
    }

    element.innerHTML = '';
    let currentText = '';
    const tokens = tokenizeContent(text);
    let tokenIndex = 0;

    const typeNextToken = () => {
        if (tokenIndex >= tokens.length) {
            if (!chatnest.isMobileBrowser()) {
                chatMessages.removeEventListener('scroll', scrollHandler);
            }

            chatnest._typewriterCount = Math.max(0, (chatnest._typewriterCount || 1) - 1);
            if (chatnest._typewriterCount === 0) {
                chatnest.isTypewriterActive = false;
                chatnest.enableSendingFunctionality();
            }

            if (callback) callback();
            return;
        }

        const token = tokens[tokenIndex];
        const isTag = token.startsWith('<') && token.endsWith('>');
        const isMarkdown = token.startsWith('**') || token.startsWith('[') || token.startsWith('![');

        currentText += token;
        element.innerHTML = currentText;

        if (chatnest.config.typewritewithscroll) {
            scrollToBottom();
        }

        tokenIndex++;

        let delay;
        if (isTag || isMarkdown) {
            delay = 0;
        } else if (token === ' ') {
            delay = 20;
        } else if (token === '\n') {
            delay = 50;
        } else {
            delay = Math.random() * 40 + 30;
        }

        if (delay === 0) {
            requestAnimationFrame(typeNextToken);
        } else {
            setTimeout(() => {
                try {
                    typeNextToken();
                } catch (error) {
                    console.error('Typewriter error:', error);
                    element.innerHTML = text;
                    chatnest._typewriterCount = Math.max(0, (chatnest._typewriterCount || 1) - 1);
                    if (chatnest._typewriterCount === 0) {
                        chatnest.isTypewriterActive = false;
                        chatnest.enableSendingFunctionality();
                        chatnest.forceEnableInput();
                    }
                    if (callback) callback();
                }
            }, delay);
        }
    };

    typeNextToken();
}
