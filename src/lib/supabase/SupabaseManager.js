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
        this.client = null;
        this.initialized = false;
        this._pendingUserMessage = null;
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
     */
    async saveChatPair(userId, domain, query, response) {
        if (!this.initialized || !this.client) return null;
        try {
            const { error } = await this.client
                .from(this.tableName)
                .insert({
                    user_id: userId,
                    domain,
                    query,
                    response,
                    timestamp: new Date().toISOString()
                });
            if (error) throw error;
            return true;
        } catch (err) {
            console.error('[Supabase] saveChatPair error:', err);
            return null;
        }
    }

    /**
     * Convert Supabase rows → flat message array for the UI
     * Each row becomes: [{ sender:'user', message:query, timestamp }, { sender:'bot', message:response, timestamp }]
     */
    rowsToMessages(rows) {
        const messages = [];
        for (const row of rows) {
            const ts = row.timestamp || new Date().toISOString();
            messages.push({ sender: 'user', message: row.query, timestamp: ts });
            messages.push({ sender: 'bot',  message: row.response, timestamp: ts });
        }
        return messages;
    }

    get isReady() {
        return this.initialized && !!this.client;
    }
}
