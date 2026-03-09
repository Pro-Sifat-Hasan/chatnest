/**
 * ParlantIntegration - Handles Parlant API integration for Chatnest
 * Manages sessions, message sending, polling, and event processing
 */

export class ParlantIntegration {
    /**
     * @param {Object} chatnest - Chatnest instance (provides widget, config, storageManager, addMessage, etc.)
     */
    constructor(chatnest) {
        this.chatnest = chatnest;
        this.config = chatnest.config;
        this.userManager = chatnest.userManager;

        const sessionKey = this.config.separateSubpageHistory
            ? `parlantSessionId_${this.userManager.domain}${this.userManager.path}`
            : `parlantSessionId_${this.userManager.domain}`;

        this.sessionStorageKey = sessionKey;
        this.sessionId = localStorage.getItem(sessionKey) || null;
        this.agentId = null;
        this.lastEventOffset = -1;
        this.pollingInterval = null;
        this.processedMessageOffsets = new Set();
        this.waitingForResponse = false;
        this.isFirstAgentMessageInSequence = true;
        this.agentReadyStatusReceived = false;
        this.readyStatusGracePeriodTimer = null;
        this.connectionCheckInterval = null;
        this.currentQueryId = null;
        this.queryResponses = new Map();
        this.typingIndicatorState = 'thinking';
        this.typingIndicatorTimeout = null;
        this._safetyTimeout = null;
        this._lastAgentEventTime = null;
        this._lastAgentMessageTime = null;
    }

    get widget() {
        return this.chatnest.widget;
    }

    get storageManager() {
        return this.chatnest.storageManager;
    }

    async initialize() {
        if (!this.config.parlant.enabled || !this.config.parlant.apiBaseUrl) return;

        try {
            await this.checkAPIConnection();
            try {
                await this.getAgentId();
            } catch {
                // Silent fail - agent ID will be fetched when needed
            }
        } catch {
            // Silent fail - connection will be checked when needed
        }
    }

    async checkAPIConnection() {
        if (!this.config.parlant.enabled || !this.config.parlant.apiBaseUrl) return false;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(`${this.config.parlant.apiBaseUrl}/healthz`, {
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) return true;
            throw new Error('Health check failed');
        } catch {
            return false;
        }
    }

    async getAgentId() {
        if (this.agentId) return this.agentId;

        if (!this.config.parlant.apiBaseUrl) {
            throw new Error('Parlant API base URL is not configured');
        }

        const response = await fetch(`${this.config.parlant.apiBaseUrl}/agents`);
        if (response.ok) {
            const agents = await response.json();
            if (agents && agents.length > 0) {
                this.agentId = agents[0].id;
                return this.agentId;
            }
            throw new Error('No agents found. Please create an agent first.');
        }
        throw new Error(`Failed to fetch agents: ${response.status}`);
    }

    async createSession() {
        if (this.sessionId) return this.sessionId;

        if (!this.config.parlant.apiBaseUrl) {
            throw new Error('Parlant API base URL is not configured');
        }

        const agentId = await this.getAgentId();

        const response = await fetch(`${this.config.parlant.apiBaseUrl}/sessions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agent_id: agentId, mode: 'auto' })
        });

        if (response.ok) {
            const session = await response.json();
            this.sessionId = session.id;
            localStorage.setItem(this.sessionStorageKey, this.sessionId);
            return this.sessionId;
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `Failed to create session: ${response.status}`);
    }

    async sendUserMessage(message) {
        if (!this.config.parlant.apiBaseUrl) {
            throw new Error('Parlant API base URL is not configured');
        }

        const sessionId = await this.createSession();

        const response = await fetch(`${this.config.parlant.apiBaseUrl}/sessions/${sessionId}/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ kind: 'message', source: 'customer', message })
        });

        if (response.ok) {
            const event = await response.json();
            this.lastEventOffset = event.offset;
            return event;
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `Failed to send message: ${response.status}`);
    }

    async pollForAgentResponse() {
        if (!this.sessionId || !this.config.parlant.apiBaseUrl) return;

        try {
            const pollOffset = this.lastEventOffset + 1;
            const response = await fetch(
                `${this.config.parlant.apiBaseUrl}/sessions/${this.sessionId}/events?offset=${pollOffset}`,
                { method: 'GET', headers: { 'Content-Type': 'application/json' } }
            );

            if (response.ok) {
                const data = await response.json();
                const events = Array.isArray(data) ? data : (data.items || []);

                for (const event of events) {
                    if (event.offset <= this.lastEventOffset) continue;

                    if (event.offset > this.lastEventOffset) {
                        this.lastEventOffset = event.offset;
                    }

                    if (event.source === 'ai_agent') {
                        this._lastAgentEventTime = Date.now();
                    }

                    // Ready status - agent finished responding
                    if (event.kind === 'status' && event.source === 'ai_agent' &&
                        event.data && event.data.status === 'ready') {
                        this.agentReadyStatusReceived = true;

                        if (this.readyStatusGracePeriodTimer) {
                            clearTimeout(this.readyStatusGracePeriodTimer);
                        }

                        this.readyStatusGracePeriodTimer = setTimeout(() => {
                            if (this.agentReadyStatusReceived && this.waitingForResponse) {
                                if (this.processedMessageOffsets.size > 0) {
                                    this.chatnest.updateLastBotMessage();
                                    this.stopPolling();
                                    this.waitingForResponse = false;
                                    this.agentReadyStatusReceived = false;
                                    if (this.typingIndicatorTimeout) {
                                        clearTimeout(this.typingIndicatorTimeout);
                                        this.typingIndicatorTimeout = null;
                                    }
                                    const typingIndicator = this.widget?.querySelector('.typing-indicator');
                                    if (typingIndicator?.classList.contains('active')) {
                                        typingIndicator.classList.remove('active');
                                        this.chatnest.stopJavaScriptTypingAnimation();
                                    }
                                } else {
                                    this.readyStatusGracePeriodTimer = setTimeout(() => {
                                        if (this.agentReadyStatusReceived && this.waitingForResponse &&
                                            this.processedMessageOffsets.size === 0) {
                                            if (this.typingIndicatorTimeout) {
                                                clearTimeout(this.typingIndicatorTimeout);
                                                this.typingIndicatorTimeout = null;
                                            }
                                            const typingIndicator = this.widget?.querySelector('.typing-indicator');
                                            if (typingIndicator?.classList.contains('active')) {
                                                typingIndicator.classList.remove('active');
                                                this.chatnest.stopJavaScriptTypingAnimation();
                                            }
                                            this.stopPolling();
                                            this.waitingForResponse = false;
                                            this.agentReadyStatusReceived = false;
                                            this.currentQueryId = null;
                                        }
                                    }, 2000);
                                }
                            }
                        }, 3000);
                    }

                    // Show typing indicator when waiting
                    if (this.waitingForResponse && !this.processedMessageOffsets.size) {
                        const typingIndicator = this.widget?.querySelector('.typing-indicator');
                        if (!typingIndicator?.classList.contains('active')) {
                            const chatMessages = this.widget?.querySelector('.chat-messages');
                            if (chatMessages) {
                                const existingIndicator = chatMessages.querySelector('.typing-indicator');
                                if (existingIndicator) {
                                    existingIndicator.classList.add('active');
                                    this.updateTypingIndicator('thinking');
                                    this.chatnest.startJavaScriptTypingAnimation();
                                    const spacer = chatMessages.querySelector('.chat-spacer');
                                    if (spacer) {
                                        chatMessages.insertBefore(existingIndicator, spacer);
                                    }
                                }
                            }
                        }
                    }

                    // Typing/processing status
                    if (event.kind === 'status' && event.source === 'ai_agent' &&
                        event.data && (event.data.status === 'typing' || event.data.status === 'processing')) {
                        if (this.agentReadyStatusReceived) {
                            this.agentReadyStatusReceived = false;
                            if (this.readyStatusGracePeriodTimer) {
                                clearTimeout(this.readyStatusGracePeriodTimer);
                                this.readyStatusGracePeriodTimer = null;
                            }
                        }
                        this.updateTypingIndicator('thinking');
                        const typingIndicator = this.widget?.querySelector('.typing-indicator');
                        if (typingIndicator && !typingIndicator.classList.contains('active')) {
                            typingIndicator.classList.add('active');
                            this.chatnest.startJavaScriptTypingAnimation();
                        }
                    }

                    // Message events from AI agent
                    if (event.kind === 'message' && event.source === 'ai_agent') {
                        if (this.processedMessageOffsets.has(event.offset)) continue;

                        if (this.agentReadyStatusReceived) {
                            this.agentReadyStatusReceived = false;
                            if (this.readyStatusGracePeriodTimer) {
                                clearTimeout(this.readyStatusGracePeriodTimer);
                                this.readyStatusGracePeriodTimer = null;
                            }
                        }

                        let messageText = '';
                        if (event.data && typeof event.data === 'object' && event.data.message) {
                            messageText = event.data.message;
                        } else if (event.message) {
                            messageText = event.message;
                        } else if (event.data && typeof event.data === 'string') {
                            messageText = event.data;
                        } else if (event.data?.text) {
                            messageText = event.data.text;
                        } else if (event.data?.content) {
                            messageText = event.data.content;
                        }

                        if (messageText) {
                            if (this.currentQueryId) {
                                const responses = this.queryResponses.get(this.currentQueryId) || [];
                                responses.push(messageText);
                                this.queryResponses.set(this.currentQueryId, responses);
                            }

                            if (this.typingIndicatorTimeout) {
                                clearTimeout(this.typingIndicatorTimeout);
                                this.typingIndicatorTimeout = null;
                            }

                            this.chatnest.addMessage(messageText, 'bot', true);

                            let queryId = this.currentQueryId;
                            if (!queryId) {
                                queryId = `query_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
                                this.currentQueryId = queryId;
                            }
                            this.storageManager.saveParlantMessage(messageText, 'bot', queryId);

                            if (this.isFirstAgentMessageInSequence) {
                                this.isFirstAgentMessageInSequence = false;
                            }

                            this.processedMessageOffsets.add(event.offset);
                            this._lastAgentMessageTime = Date.now();

                            const messageRows = this.widget.querySelectorAll('.message-row');
                            const lastRow = messageRows[messageRows.length - 1];
                            if (lastRow && this.currentQueryId) {
                                lastRow.setAttribute('data-query-id', this.currentQueryId);
                                const botContainer = lastRow.querySelector('.bot-message-container');
                                if (botContainer) {
                                    botContainer.setAttribute('data-query-id', this.currentQueryId);
                                }
                            }

                            this.chatnest.updateLastBotMessage();
                        }
                    }
                }
            }
        } catch (err) {
            if (err?.name !== 'AbortError') {
                console.warn('[Parlant] Poll error:', err?.message || err);
            }
        }
    }

    startPolling() {
        if (this.pollingInterval) clearInterval(this.pollingInterval);
        this.pollingInterval = setInterval(() => this.pollForAgentResponse(), 800);
    }

    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
        if (this._safetyTimeout) {
            clearTimeout(this._safetyTimeout);
            this._safetyTimeout = null;
        }
        if (this.readyStatusGracePeriodTimer) {
            clearTimeout(this.readyStatusGracePeriodTimer);
            this.readyStatusGracePeriodTimer = null;
        }
    }

    cleanup() {
        if (this.config.parlant.enabled) {
            this.stopPolling();
            if (this.connectionCheckInterval) {
                clearInterval(this.connectionCheckInterval);
                this.connectionCheckInterval = null;
            }
        }
    }

    updateTypingIndicator(state = 'thinking') {
        if (!this.config.parlant.enabled) return;
        if (!this.config.showTypingText) return;

        const typingIndicator = this.widget?.querySelector('.typing-indicator');
        if (!typingIndicator) return;

        this.typingIndicatorState = state;

        let typingText = typingIndicator.querySelector('.typing-text');
        if (!typingText) {
            typingText = document.createElement('div');
            typingText.className = 'typing-text';
            typingIndicator.insertBefore(typingText, typingIndicator.firstChild);
        }

        const labels = { thinking: 'Thinking', typing: 'Typing', processing: 'Processing' };
        typingText.textContent = labels[state] ?? 'Thinking';
    }

    /**
     * Send a user message via Parlant and start polling
     * @param {string} message - User message
     * @param {Object} options - { disableSending, enableSending, resetInputState, forceEnableInput }
     */
    async sendMessage(message, options = {}) {
        const { disableSending, enableSending, resetInputState, forceEnableInput } = options;

        this.currentQueryId = `query_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        this.queryResponses.set(this.currentQueryId, []);
        this.agentReadyStatusReceived = false;
        if (this.readyStatusGracePeriodTimer) {
            clearTimeout(this.readyStatusGracePeriodTimer);
            this.readyStatusGracePeriodTimer = null;
        }
        this.processedMessageOffsets.clear();
        this.waitingForResponse = true;
        this.isFirstAgentMessageInSequence = true;
        this.typingIndicatorState = 'thinking';

        try {
            await this.sendUserMessage(message);

            this.typingIndicatorTimeout = setTimeout(() => {
                if (this.waitingForResponse && !this.processedMessageOffsets.size) {
                    const typingIndicator = this.widget?.querySelector('.typing-indicator');
                    if (typingIndicator && !typingIndicator.classList.contains('active')) {
                        typingIndicator.classList.add('active');
                        this.updateTypingIndicator('thinking');
                        this.chatnest.startJavaScriptTypingAnimation();
                        const chatMessages = this.widget?.querySelector('.chat-messages');
                        const spacer = chatMessages?.querySelector('.chat-spacer');
                        if (chatMessages && spacer) {
                            chatMessages.insertBefore(typingIndicator, spacer);
                        }
                    }
                }
            }, 1000);

            this.startPolling();
            await this.pollForAgentResponse();
            setTimeout(() => this.pollForAgentResponse(), 500);

            this._lastAgentMessageTime = Date.now();
            this._lastAgentEventTime = Date.now();

            if (this._safetyTimeout) clearTimeout(this._safetyTimeout);
            const safetyTimeout = setTimeout(() => {
                if (this.waitingForResponse) {
                    this.stopPolling();
                    this.waitingForResponse = false;
                    this.agentReadyStatusReceived = false;
                    if (this.readyStatusGracePeriodTimer) {
                        clearTimeout(this.readyStatusGracePeriodTimer);
                    }
                    if (this.processedMessageOffsets.size === 0) {
                        this.chatnest.addMessage('Response timeout after 60 seconds. The agent may still be processing your message.', 'bot', false, { isError: true });
                    }
                    if (this.typingIndicatorTimeout) {
                        clearTimeout(this.typingIndicatorTimeout);
                        this.typingIndicatorTimeout = null;
                    }
                    const typingIndicator = this.widget?.querySelector('.typing-indicator');
                    if (typingIndicator?.classList.contains('active')) {
                        typingIndicator.classList.remove('active');
                        this.chatnest.stopJavaScriptTypingAnimation();
                    }
                }
            }, 60000);

            this._safetyTimeout = safetyTimeout;

            this.chatnest.isWaitingForResponse = false;
            if (resetInputState) resetInputState();
        } catch (error) {
            this.stopPolling();
            this.waitingForResponse = false;
            this.agentReadyStatusReceived = false;
            if (this.readyStatusGracePeriodTimer) {
                clearTimeout(this.readyStatusGracePeriodTimer);
            }
            this.chatnest.addMessage(error.message || 'Failed to send message. Please check if the Parlant API server is running.', 'bot', false, { isError: true });
            if (enableSending) enableSending();
            if (resetInputState) resetInputState();
            if (forceEnableInput) forceEnableInput();
        }
    }
}
