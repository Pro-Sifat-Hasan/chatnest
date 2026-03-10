/**
 * Split text at product injection marker
 * @param {string} text
 * @param {string|string[]} markers
 * @returns {{ before: string, marker: string, after: string }|null}
 */
function splitAtProductMarker(text, markers) {
    const arr = Array.isArray(markers) ? markers : [markers];
    for (const marker of arr) {
        if (!marker || typeof marker !== 'string') continue;
        const idx = text.indexOf(marker);
        if (idx !== -1) {
            const before = text.slice(0, idx + marker.length).trimEnd();
            const after = text.slice(idx + marker.length).trimStart();
            return { before, marker, after };
        }
    }
    return null;
}

/**
 * Map product item using apiResponseFormat.productItem
 */
function mapProductItem(item, format) {
    const map = format?.productItem || {};
    return {
        name: item[map.name ?? 'name'],
        price: item[map.price ?? 'price'],
        image_url: item[map.image ?? 'image_url'],
        buy_link: item[map.link ?? 'buy_link'],
        highlights: item[map.highlights ?? 'highlights'],
        ctaText: map.ctaText ?? 'Buy product'
    };
}

/**
 * Create product carousel HTML element with prev/next buttons
 * @param {Array} products - Array of product objects (mapped via productItem format)
 * @param {Object} format - apiResponseFormat
 * @returns {HTMLElement}
 */
function createProductCarousel(products, format = {}) {
    const carousel = document.createElement('div');
    carousel.className = 'chatnest-product-carousel';
    const mapped = products.map(p => mapProductItem(p, format));
    carousel.innerHTML = `
        <div class="chatnest-carousel-nav">
            <button type="button" class="chatnest-carousel-prev" aria-label="Previous products">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
            </button>
            <button type="button" class="chatnest-carousel-next" aria-label="Next products">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
            </button>
        </div>
        <div class="chatnest-product-carousel-viewport">
            <div class="chatnest-product-carousel-inner">
                ${mapped.map(p => `
                    <div class="chatnest-product-card">
                        <div class="chatnest-product-card-image">
                            <img src="${escapeAttr(p.image_url || '')}" alt="${escapeAttr(p.name || '')}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling?.classList?.add('visible')">
                            <div class="chatnest-product-card-image-placeholder" aria-hidden="true">No image</div>
                        </div>
                        <div class="chatnest-product-card-body">
                            <h4 class="chatnest-product-card-name">${escapeHtml(p.name || '')}</h4>
                            ${p.highlights ? `<p class="chatnest-product-card-highlights">${escapeHtml(p.highlights)}</p>` : ''}
                            ${p.price ? `<span class="chatnest-product-card-price">${escapeHtml(p.price)}</span>` : ''}
                            <a href="${escapeAttr(p.buy_link || '#')}" target="_blank" rel="noopener noreferrer" class="chatnest-product-card-btn">${escapeHtml(p.ctaText || 'Buy product')}</a>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    const viewport = carousel.querySelector('.chatnest-product-carousel-viewport');
    const inner = carousel.querySelector('.chatnest-product-carousel-inner');
    const prevBtn = carousel.querySelector('.chatnest-carousel-prev');
    const nextBtn = carousel.querySelector('.chatnest-carousel-next');

    const scroll = (dir) => {
        const card = inner.querySelector('.chatnest-product-card');
        const gap = 12;
        const step = card ? (card.offsetWidth + gap) : viewport.offsetWidth;
        viewport.scrollBy({ left: dir * step, behavior: 'smooth' });
    };

    prevBtn.addEventListener('click', () => scroll(-1));
    nextBtn.addEventListener('click', () => scroll(1));

    viewport.addEventListener('scroll', () => {
        prevBtn.classList.toggle('disabled', viewport.scrollLeft <= 0);
        nextBtn.classList.toggle('disabled', viewport.scrollLeft >= inner.scrollWidth - viewport.offsetWidth - 2);
    });
    viewport.dispatchEvent(new Event('scroll'));

    return carousel;
}

function escapeAttr(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Add a message to the chat
 * @param {Chatnest} chatnest - Chatnest instance
 * @param {string} text - Message text
 * @param {string} sender - 'user' or 'bot'
 * @param {boolean} useTypewriter - Use typewriter effect
 * @param {Object} meta - Additional metadata
 */
function isEffectivelyEmpty(text) {
    if (text == null) return true;
    const s = String(text).trim();
    if (!s) return true;
    if (/^\s*\{\s*"response"\s*:\s*""\s*\}\s*$/i.test(s) || s === '{}') return true;
    try {
        const o = JSON.parse(s);
        const v = o?.response ?? o?.message ?? o?.text ?? o?.content ?? o?.answer;
        return v == null || String(v).trim() === '';
    } catch (_) { return false; }
}

export function addMessage(chatnest, text, sender, useTypewriter = true, meta = {}) {
    if (sender === 'bot' && isEffectivelyEmpty(text)) return;

    const chatMessages = chatnest.widget.querySelector('.chat-messages');
    const typingIndicator = chatnest.widget.querySelector('.typing-indicator');
    const timestampText = chatnest.config.showTimestamp ? chatnest.formatTimestamp(meta.timestamp) : '';

    const messageRow = document.createElement('div');
    messageRow.className = `message-row ${sender}-row`;
    if (meta.queryId) {
        messageRow.setAttribute('data-query-id', meta.queryId);
    }

    if (sender === 'bot') {
        const botMessageContainer = document.createElement('div');
        botMessageContainer.className = 'bot-message-container';

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message${meta.isError ? ' error-message' : ''}`;

        const messageLine = document.createElement('div');
        messageLine.className = 'message-line bot-message-line';

        const avatarHtml = chatnest.generateAiAvatar();
        messageDiv.innerHTML = avatarHtml;

        let actionsDiv = null;
        const showActions = chatnest.config.showMessageActions && !meta.skipMessageActions;
        if (showActions) {
            actionsDiv = document.createElement('div');
            actionsDiv.className = 'message-actions';
            actionsDiv.style.display = 'none';
            actionsDiv.innerHTML = `
                <button class="message-action-btn like-btn" title="Helpful">
                    <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23000'%3E%3Cpath d='M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z'/%3E%3C/svg%3E" alt="Like">
                </button>
                <button class="message-action-btn dislike-btn" title="Not helpful">
                    <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23000'%3E%3Cpath d='M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z'/%3E%3C/svg%3E" alt="Dislike">
                </button>
                <button class="message-action-btn regenerate-btn" title="Regenerate response">
                    <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23000'%3E%3Cpath d='M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z'/%3E%3C/svg%3E" alt="Regenerate">
                </button>
            `;
        }

        const products = meta.products || [];
        const useMarkdown = chatnest.config.enableMarkdown && sender === 'bot' && window.marked && typeof window.marked.parse === 'function';
        const useTypewriterForBot = useTypewriter && chatnest.config.enableTypewriter && products.length === 0;
        const format = chatnest.config.apiResponseFormat || {};
        const marker = chatnest.config.productInjectionMarker;

        const renderContentWithProducts = (contentContainer, textBefore, textAfter, productsArr) => {
            const parseMd = (t) => useMarkdown && window.marked ? window.marked.parse(t || '') : (t || '');
            if (textBefore) {
                const beforeDiv = document.createElement('div');
                beforeDiv.className = 'message-content-part';
                beforeDiv.innerHTML = parseMd(textBefore);
                contentContainer.appendChild(beforeDiv);
            }
            if (productsArr.length > 0) {
                const carousel = createProductCarousel(productsArr, format);
                contentContainer.appendChild(carousel);
            }
            if (textAfter) {
                const afterDiv = document.createElement('div');
                afterDiv.className = 'message-content-part';
                afterDiv.innerHTML = parseMd(textAfter);
                contentContainer.appendChild(afterDiv);
            }
        };

        if (useMarkdown) {
            if (useTypewriterForBot) {
                const contentContainer = document.createElement('div');
                contentContainer.className = 'message-content';
                messageDiv.appendChild(contentContainer);

                chatnest.typeWriter(contentContainer, window.marked.parse(text), () => {
                    if (actionsDiv && showActions) {
                        actionsDiv.style.display = 'flex';
                    }
                    chatnest.setupMessageLinks(contentContainer);
                    chatnest.updateLastBotMessage();
                });
            } else {
                const contentContainer = document.createElement('div');
                contentContainer.className = 'message-content';
                if (products.length > 0 && marker) {
                    const split = splitAtProductMarker(text, marker);
                    if (split) {
                        renderContentWithProducts(contentContainer, split.before, split.after, products);
                    } else {
                        contentContainer.innerHTML = window.marked.parse(text);
                        const carousel = createProductCarousel(products, format);
                        contentContainer.appendChild(carousel);
                    }
                } else {
                    contentContainer.innerHTML = window.marked.parse(text);
                }
                messageDiv.appendChild(contentContainer);

                if (actionsDiv && showActions) {
                    actionsDiv.style.display = 'flex';
                }
                chatnest.setupMessageLinks(contentContainer);
            }
        } else {
            const contentContainer = document.createElement('div');
            contentContainer.className = 'message-content';
            if (products.length > 0 && marker) {
                const split = splitAtProductMarker(text, marker);
                if (split) {
                    const beforeSpan = document.createElement('div');
                    beforeSpan.className = 'message-content-part';
                    beforeSpan.textContent = split.before;
                    contentContainer.appendChild(beforeSpan);
                    contentContainer.appendChild(createProductCarousel(products, format));
                    if (split.after) {
                        const afterSpan = document.createElement('div');
                        afterSpan.className = 'message-content-part';
                        afterSpan.textContent = split.after;
                        contentContainer.appendChild(afterSpan);
                    }
                } else {
                    contentContainer.textContent = text;
                    contentContainer.appendChild(createProductCarousel(products, format));
                }
            } else {
                contentContainer.textContent = text;
            }
            messageDiv.appendChild(contentContainer);

            if (actionsDiv && showActions) {
                actionsDiv.style.display = 'flex';
            }
        }

        const copyButton = document.createElement('button');
        copyButton.className = 'message-copy-btn bot-copy-btn';
        copyButton.title = 'Copy to clipboard';
        copyButton.innerHTML = `<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3E%3Cpath d='M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z'/%3E%3C/svg%3E" alt="Copy">`;
        messageLine.appendChild(messageDiv);
        messageLine.appendChild(copyButton);
        botMessageContainer.appendChild(messageLine);

        if (chatnest.config.showTimestamp && timestampText) {
            const timestampDiv = document.createElement('div');
            timestampDiv.className = 'message-timestamp bot-timestamp';
            timestampDiv.textContent = timestampText;
            botMessageContainer.appendChild(timestampDiv);
        }

        if (actionsDiv) {
            botMessageContainer.appendChild(actionsDiv);
        }

        const queryId = meta.queryId || (chatnest.parlant?.currentQueryId ?? null);
        if (queryId) {
            botMessageContainer.setAttribute('data-query-id', queryId);
        }

        messageRow.appendChild(botMessageContainer);

        if (showActions && actionsDiv) {
            if (chatnest.parlant) {
                actionsDiv.style.display = 'none';
            }
            chatnest.setupMessageActions(botMessageContainer, text);
        }

        chatnest.hideGreetingActions();
    } else {
        const userMessageContainer = document.createElement('div');
        userMessageContainer.className = 'user-message-container';

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;

        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'user-message-content';
        if (text && text.trim()) {
            const textSpan = document.createElement('span');
            textSpan.className = 'user-message-text';
            textSpan.textContent = text;
            contentWrapper.appendChild(textSpan);
        }
        const files = meta.files || [];
        const imageFiles = files.filter(f => f && (f.type?.startsWith('image/') || f.base64));
        if (imageFiles.length > 0) {
            const attachmentsDiv = document.createElement('div');
            attachmentsDiv.className = 'user-message-attachments';
            imageFiles.forEach((file) => {
                try {
                    const src = file.base64 || (file.type && file.type.startsWith('image/') ? URL.createObjectURL(file) : null);
                    if (src) {
                        const img = document.createElement('img');
                        img.src = src;
                        img.alt = file.name || 'Attached image';
                        img.className = 'user-message-attachment-img';
                        attachmentsDiv.appendChild(img);
                    }
                } catch (_) {}
            });
            contentWrapper.appendChild(attachmentsDiv);
        }
        messageDiv.appendChild(contentWrapper);

        const messageLine = document.createElement('div');
        messageLine.className = 'message-line user-message-line';

        const copyButton = document.createElement('button');
        copyButton.className = 'message-copy-btn user-copy-btn';
        copyButton.title = 'Copy to clipboard';
        copyButton.innerHTML = `<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3E%3Cpath d='M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z'/%3E%3C/svg%3E" alt="Copy">`;
        messageLine.appendChild(copyButton);
        messageLine.appendChild(messageDiv);
        userMessageContainer.appendChild(messageLine);

        if (chatnest.config.showTimestamp && timestampText) {
            const timestampDiv = document.createElement('div');
            timestampDiv.className = 'message-timestamp user-timestamp';
            timestampDiv.textContent = timestampText;
            userMessageContainer.appendChild(timestampDiv);
        }

        messageRow.appendChild(userMessageContainer);
    }

    const spacer = chatMessages.querySelector('.chat-spacer');
    chatMessages.insertBefore(messageRow, spacer);

    const typingIndicatorElement = chatMessages.querySelector('.typing-indicator');
    if (typingIndicatorElement && spacer && typingIndicatorElement.classList.contains('active')) {
        chatMessages.insertBefore(typingIndicatorElement, spacer);
    }

    chatnest.setupCopyButtons(messageRow, text);

    if (sender === 'user') {
        chatnest.scrollToShowNewMessage(messageRow);
    }

    chatnest.updateLastBotMessage();
}
