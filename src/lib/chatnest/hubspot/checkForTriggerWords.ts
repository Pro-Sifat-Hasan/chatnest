/**
 * Check if message contains HubSpot form trigger words
 * @param {Chatnest} chatnest - Chatnest instance
 * @param {string} message - Message to check
 * @returns {boolean}
 */
export function checkForTriggerWords(chatnest: any, message: any) {
    if (!chatnest.config.hubspot?.enabled) return false;
    if (chatnest.userManager.hasSubmittedForm()) return false;
    if (chatnest.isFormActive()) return false;

    const words = message.toLowerCase().split(/\s+/);
    return chatnest.config.hubspot.triggerKeywords.some((trigger: string) =>
        words.includes(trigger.toLowerCase())
    );
}
