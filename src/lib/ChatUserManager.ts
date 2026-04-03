// @ts-nocheck
/**
 * ChatUserManager - Handles user identity, session, and form submission tracking
 */

export class ChatUserManager {
    constructor(config) {
        this.config = config;
        this.domain = this.getCurrentDomain();
        this.path = this.getCurrentPath();
        this.currentUser = this.generateUserId();
        this.userSessionId = this.getOrCreateUserSessionId();
        this.initializeUser();
        this.formSubmissionsKey = `chatFormSubmissions_${this.domain}`;
        this.initializeFormSubmissions();
    }

    getCurrentDomain() {
        return window.location.hostname;
    }

    getCurrentPath() {
        return window.location.pathname;
    }

    generateUserId() {
        const storageKey = this.config.separateSubpageHistory
            ? `currentChatUser_${this.domain}${this.path}`
            : `currentChatUser_${this.domain}`;
        const storedId = localStorage.getItem(storageKey);
        if (!storedId) {
            const newId = `user_${this.domain}${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            localStorage.setItem(storageKey, newId);
            return newId;
        }
        return storedId;
    }

    getOrCreateUserSessionId() {
        const sessionKey = this.config.separateSubpageHistory
            ? `userSessionId_${this.domain}${this.path}`
            : `userSessionId_${this.domain}`;
        let sessionId = localStorage.getItem(sessionKey);
        if (!sessionId) {
            sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
            localStorage.setItem(sessionKey, sessionId);
        }
        return sessionId;
    }

    getHistoryKey() {
        return this.config.separateSubpageHistory
            ? `chatHistory_${this.domain}${this.path}`
            : `chatHistory_${this.domain}`;
    }

    initializeUser() {
        if (!this.config.enableHistory) return;
        const historyKey = this.getHistoryKey();
        if (!localStorage.getItem(historyKey)) {
            localStorage.setItem(historyKey, JSON.stringify([]));
        }
    }

    initializeFormSubmissions() {
        if (!localStorage.getItem(this.formSubmissionsKey)) {
            localStorage.setItem(this.formSubmissionsKey, JSON.stringify([]));
        }
    }

    hasSubmittedForm() {
        const submissions = JSON.parse(localStorage.getItem(this.formSubmissionsKey) || '[]');
        return submissions.includes(this.currentUser);
    }

    hasFormBeenShown() {
        const formShownKey = `chatFormShown_${this.currentUser}`;
        return localStorage.getItem(formShownKey) === 'true';
    }

    markFormAsShown() {
        const formShownKey = `chatFormShown_${this.currentUser}`;
        localStorage.setItem(formShownKey, 'true');
    }

    resetFormShownStatus() {
        const formShownKey = `chatFormShown_${this.currentUser}`;
        localStorage.removeItem(formShownKey);
    }

    recordFormSubmission(formData) {
        const submissions = JSON.parse(localStorage.getItem(this.formSubmissionsKey) || '[]');
        if (!submissions.includes(this.currentUser)) {
            submissions.push(this.currentUser);
            localStorage.setItem(this.formSubmissionsKey, JSON.stringify(submissions));
            const formDataKey = `chatFormData_${this.currentUser}`;
            localStorage.setItem(formDataKey, JSON.stringify({ ...formData, submittedAt: new Date().toISOString() }));
        }
    }

    loadUserData() {
        const historyKey = this.getHistoryKey();
        return {
            userId: this.currentUser,
            domain: this.domain,
            path: this.path,
            chatHistory: JSON.parse(localStorage.getItem(historyKey)) || []
        };
    }

    updateUserIdWithEmail(email) {
        const storageKey = this.config.separateSubpageHistory
            ? `currentChatUser_${this.domain}${this.path}`
            : `currentChatUser_${this.domain}`;
        localStorage.setItem(storageKey, email);
        this.currentUser = email;
    }
}
