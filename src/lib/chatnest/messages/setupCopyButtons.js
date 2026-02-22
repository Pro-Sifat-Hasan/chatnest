/**
 * Setup copy buttons for message row
 * @param {Chatnest} chatnest - Chatnest instance
 * @param {Element} messageRow - Message row element
 * @param {string} text - Text to copy
 */
export function setupCopyButtons(chatnest, messageRow, text) {
    const botCopyBtn = messageRow.querySelector('.bot-copy-btn');
    if (botCopyBtn) {
        botCopyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            let textToCopy = text;
            const messageContent = messageRow.querySelector('.message-content');
            if (messageContent) {
                textToCopy = messageContent.textContent || messageContent.innerText || text;
            } else {
                const messageDiv = messageRow.querySelector('.message');
                if (messageDiv) {
                    textToCopy = messageDiv.textContent || messageDiv.innerText || text;
                }
            }
            textToCopy = textToCopy.trim();
            navigator.clipboard.writeText(textToCopy).then(() => {
                botCopyBtn.classList.add('copied', 'active');
                const checkSvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z'/%3E%3C/svg%3E`;
                const copySvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3E%3Cpath d='M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z'/%3E%3C/svg%3E`;
                botCopyBtn.innerHTML = `<img src="${checkSvg}" alt="Copied" style="display:block;">`;
                setTimeout(() => {
                    botCopyBtn.classList.remove('copied', 'active');
                    botCopyBtn.innerHTML = `<img src="${copySvg}" alt="Copy" style="display:block;">`;
                }, 2000);
            });
        });
    }

    const userCopyBtn = messageRow.querySelector('.user-copy-btn');
    if (userCopyBtn) {
        userCopyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            let textToCopy = text;
            const messageContent = messageRow.querySelector('.user-message');
            if (messageContent) {
                textToCopy = messageContent.textContent || messageContent.innerText || text;
            }
            textToCopy = textToCopy.trim();
            navigator.clipboard.writeText(textToCopy).then(() => {
                userCopyBtn.classList.add('copied', 'active');
                const checkSvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z'/%3E%3C/svg%3E`;
                const copySvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3E%3Cpath d='M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z'/%3E%3C/svg%3E`;
                userCopyBtn.innerHTML = `<img src="${checkSvg}" alt="Copied" style="display:block;">`;
                setTimeout(() => {
                    userCopyBtn.classList.remove('copied', 'active');
                    userCopyBtn.innerHTML = `<img src="${copySvg}" alt="Copy" style="display:block;">`;
                }, 2000);
            });
        });
    }
}
