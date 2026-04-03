/**
 * NativeFormManager
 * Manages localStorage persistence for the native lead-capture form.
 *
 * Storage keys (all scoped to the domain so sub-pages share state by default):
 *  - <storageKey>_submitted  → "true" once user has submitted
 *  - <storageKey>_data       → JSON of the last submitted field values + timestamp
 */
export class NativeFormManager {
    /**
     * @param {string} domain     - window.location.hostname
     * @param {Object} nativeFormConfig - chatnest.config.nativeForm
     */
    constructor(domain, nativeFormConfig) {
        const base = nativeFormConfig.storageKey || `cnf_${domain}`;
        this._submittedKey = `${base}_submitted`;
        this._dataKey      = `${base}_data`;
    }

    /** Returns true if the user has already submitted the form */
    hasSubmitted() {
        return localStorage.getItem(this._submittedKey) === 'true';
    }

    /**
     * Persist form field values to localStorage.
     * @param {Object} formData - { fieldName: value, … }
     */
    saveSubmission(formData) {
        localStorage.setItem(this._submittedKey, 'true');
        localStorage.setItem(this._dataKey, JSON.stringify({
            ...formData,
            submittedAt: new Date().toISOString()
        }));
    }

    /**
     * Retrieve the previously submitted data (or null).
     * @returns {Object|null}
     */
    loadSubmission() {
        try {
            const raw = localStorage.getItem(this._dataKey);
            return raw ? JSON.parse(raw) : null;
        } catch (_) {
            return null;
        }
    }

    /** Clear stored submission (e.g. for testing / reset flows) */
    clearSubmission() {
        localStorage.removeItem(this._submittedKey);
        localStorage.removeItem(this._dataKey);
    }
}
