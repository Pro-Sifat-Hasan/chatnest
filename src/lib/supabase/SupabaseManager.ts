// @ts-nocheck
/* jshint esversion: 11 */
/**
 * SupabaseManager - Handles Supabase integration for persistent chat history
 * Uses the chat_history table: (id, user_id, domain, query, response, timestamp)
 * Each row = one complete Q&A exchange (user message + bot response pair)
 */

const SUPABASE_CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';

export class SupabaseManager {
    constructor(config) {
        this.url = config.url || '';
        this.anonKey = config.anonKey || '';
        this.tableName = config.tableName || 'chat_history';
        this.historyLimit = config.historyLimit || 50;
        this.pollIntervalMs = config.pollIntervalMs ?? 5000;
        this.client = null;
        this.initialized = false;
        this._ourInsertedIds = new Set();
        this._lastSeenId = -1;
        this._pollTimer = null;
        this._pollCallback = null;
        this._backgroundRefreshTimer = null;
        this._realtimeChannel = null;
    }

    /**
     * Initialize Supabase client (loads CDN if needed)
     */
    async initialize() {
        if (!this.url || !this.anonKey) {
            console.warn('[Supabase] Missing url or anonKey — Supabase disabled.');
            return;
        }
        try {
            if (!window.supabase || !window.supabase.createClient) {
                await this._loadScript(SUPABASE_CDN);
            }
            if (!window.supabase?.createClient) {
                throw new Error('supabase-js failed to load from CDN');
            }
            this.client = window.supabase.createClient(this.url, this.anonKey);
            this.initialized = true;
        } catch (err) {
            console.error('[Supabase] Initialization failed:', err);
        }
    }

    _loadScript(src) {
        return new Promise((resolve, reject) => {
            const existing = document.querySelector(`script[src="${src}"]`);
            if (existing) {
                // Script tag already present — poll until the library evaluates
                // (avoids unreliable fixed timeouts on slow connections)
                let attempts = 0;
                const check = () => {
                    if (window.supabase?.createClient) { resolve(); return; }
                    if (++attempts > 100) { reject(new Error('Supabase CDN timeout')); return; }
                    setTimeout(check, 50);
                };
                check();
                return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
            document.head.appendChild(script);
        });
    }

    /**
     * Load paginated chat history for a user/domain pair
     * Returns array of {query, response, timestamp} rows ordered oldest→newest
     */
    async getChatHistory(userId, domain) {
        if (!this.initialized || !this.client) return [];
        try {
            const { data, error } = await this.client
                .from(this.tableName)
                .select('id, user_id, domain, query, response, timestamp')
                .eq('user_id', userId)
                .eq('domain', domain)
                .order('timestamp', { ascending: true })
                .limit(this.historyLimit);

            if (error) throw error;
            return data || [];
        } catch (err) {
            console.error('[Supabase] getChatHistory error:', err);
            return [];
        }
    }

    /**
     * Save a complete Q&A pair to Supabase
     * @returns {Promise<number|null>} inserted row id, or null on failure
     */
    async saveChatPair(userId, domain, query, response) {
        if (!this.initialized || !this.client) return null;
        try {
            const { data, error } = await this.client
                .from(this.tableName)
                .insert({
                    user_id: userId,
                    domain,
                    query,
                    response,
                    timestamp: new Date().toISOString()
                })
                .select('id')
                .single();
            if (error) throw error;
            if (data?.id) this._ourInsertedIds.add(data.id);
            return data?.id ?? true;
        } catch (err) {
            console.error('[Supabase] saveChatPair error:', err);
            return null;
        }
    }

    /**
     * Set last seen id from loaded rows (used to avoid re-fetching on poll)
     */
    setLastSeenFromRows(rows) {
        if (!rows?.length) return;
        const maxId = Math.max(...rows.map(r => r.id ?? 0));
        if (maxId > this._lastSeenId) this._lastSeenId = maxId;
    }

    /**
     * Start realtime sync — poll for new messages (Messenger-style)
     * When another source (e.g. human agent, backend) adds a row, we fetch and display it.
     * @param {string} userId
     * @param {string} domain
     * @param {function({id, query, response, timestamp}): void} onNewRow
     */
    startRealtimeSync(userId, domain, onNewRow) {
        this.stopRealtimeSync();
        this._pollCallback = onNewRow;

        const poll = async () => {
            if (!this.initialized || !this.client) return;
            try {
                const { data, error } = await this.client
                    .from(this.tableName)
                    .select('id, query, response, timestamp')
                    .eq('user_id', userId)
                    .eq('domain', domain)
                    .gt('id', this._lastSeenId)
                    .order('id', { ascending: true });

                if (error) throw error;
                const rows = data || [];
                for (const row of rows) {
                    if (this._ourInsertedIds.has(row.id)) continue;
                    this._lastSeenId = row.id;
                    this._pollCallback?.(row);
                }
            } catch (err) {
                console.warn('[Supabase] poll error:', err?.message);
            }
        };

        this._pollTimer = setInterval(poll, this.pollIntervalMs);
        poll();
    }

    stopRealtimeSync() {
        if (this._pollTimer) {
            clearInterval(this._pollTimer);
            this._pollTimer = null;
        }
        this._pollCallback = null;
    }

    /**
     * Start background refresh — periodically re-fetches full history and invokes onRefresh.
     * Works when chat window is open; runs in background without page reload.
     * @param {number} intervalMs - Interval in ms (default: pollIntervalMs)
     * @param {function(): Promise<void>} onRefresh - Async callback to fetch, merge, and re-render
     */
    startBackgroundRefresh(intervalMs, onRefresh) {
        this.stopBackgroundRefresh();
        const ms = intervalMs ?? this.pollIntervalMs;
        const run = () => {
            if (!this.initialized || !this.client) return;
            onRefresh().catch(err => console.warn('[Supabase] background refresh:', err?.message));
        };
        this._backgroundRefreshTimer = setInterval(run, ms);
    }

    stopBackgroundRefresh() {
        if (this._backgroundRefreshTimer) {
            clearInterval(this._backgroundRefreshTimer);
            this._backgroundRefreshTimer = null;
        }
    }

    /**
     * Start Supabase Realtime subscription — instant Messenger-like delivery when new rows are inserted.
     * Requires: alter publication supabase_realtime add table chat_history;
     * @param {string} userId
     * @param {string} domain
     * @param {function({id, query, response, timestamp}): void} onNewRow
     */
    startRealtimeSubscription(userId, domain, onNewRow) {
        this.stopRealtimeSubscription();
        if (!this.initialized || !this.client) return;

        this._realtimeChannel = this.client
            .channel(`chatnest-${domain}-${userId?.slice(0, 20)}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: this.tableName
                },
                (payload) => {
                    const n = payload?.new;
                    if (!n) return;
                    if (n.user_id !== userId || n.domain !== domain) return;
                    if (this._ourInsertedIds.has(n.id)) return;
                    const row = { id: n.id, query: n.query, response: n.response, timestamp: n.timestamp };
                    onNewRow(row);
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') return;
                if (status === 'CHANNEL_ERROR') {
                    console.warn('[Supabase] Realtime subscribe failed — enable Realtime for', this.tableName, 'in Dashboard');
                }
            });
    }

    stopRealtimeSubscription() {
        if (!this._realtimeChannel) return;
        try { this.client?.removeChannel(this._realtimeChannel); } catch { /* channel already removed */ }
        this._realtimeChannel = null;
    }

    /**
     * Split text by ,,, (triple comma) into separate parts for multi-part AI responses
     * @private
     */
    _splitParts(text) {
        if (!text || typeof text !== 'string') return [''];
        return String(text).split(',,,').map(s => s.trim()).filter(Boolean);
    }

    /**
     * Convert Supabase rows → flat message array for the UI
     * Bot responses containing ,,, are split into separate messages (Messenger-style multi-part).
     * skipMessageActions: true for all but the last bot message in each row (reduces vertical space)
     */
    rowsToMessages(rows) {
        const messages = [];
        for (const row of rows) {
            const ts = row.timestamp || new Date().toISOString();
            const rowId = row.id;
            messages.push({ sender: 'user', message: row.query, timestamp: ts, rowId, partKey: rowId !== null && rowId !== undefined ? `sb-${rowId}-u` : null });
            const parts = this._splitParts(row.response);
            parts.forEach((part, i) => {
                const isLast = i === parts.length - 1;
                messages.push({
                    sender: 'bot',
                    message: part,
                    timestamp: ts,
                    skipMessageActions: !isLast,
                    rowId,
                    partKey: rowId !== null && rowId !== undefined ? `sb-${rowId}-b${i}` : null
                });
            });
        }
        return messages;
    }

    get isReady() {
        return this.initialized && !!this.client;
    }
}
