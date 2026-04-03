/**
 * API request/response helpers for Chatnest
 */

/**
 * Format message and files into API request payload
 * @param {Object} config - Chatnest config
 * @param {Object} userManager - User manager instance
 * @param {string} message - User message
 * @param {File[]} files - Optional file attachments
 * @returns {Object}
 */
export function formatRequestData(config, userManager, message, files = []) {
    // Resolve userId: config.userId (string or function) → email from nativeForm → auto-generated
    let resolvedUserId;
    if (typeof config.userId === 'function') {
        resolvedUserId = config.userId(userManager);
    } else if (typeof config.userId === 'string' && config.userId.trim()) {
        resolvedUserId = config.userId.trim();
    } else {
        resolvedUserId = userManager.currentUser;
    }

    const baseRequest = {
        [config.apiRequestFormat.query]: message,
        [config.apiRequestFormat.userId]: resolvedUserId,
        [config.apiRequestFormat.domain]: userManager.domain
    };

    if (files && files.length > 0) {
        if (config.apiDataFormat === 'form-data' && files.length === 1) {
            baseRequest['image'] = files[0];
        } else {
            files.forEach((file, index) => {
                baseRequest[`file_${index}`] = file;
            });
            baseRequest.fileCount = files.length;
        }
    }

    if (config.transformRequest) {
        return config.transformRequest(baseRequest);
    }

    return baseRequest;
}
