/**
 * Check if HubSpot form is already showing
 * @param {Chatnest} chatnest - Chatnest instance
 * @returns {boolean}
 */
export function isFormActive(chatnest) {
    return !!chatnest.activeForm || !!chatnest.widget.querySelector('.hubspot-form-modal-overlay');
}
