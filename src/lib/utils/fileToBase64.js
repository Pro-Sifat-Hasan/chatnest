/**
 * Convert a File to base64 string for storage
 * @param {File} file
 * @returns {Promise<{base64: string, name: string, type: string}>}
 */
export function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        if (!file || !(file instanceof File)) {
            reject(new Error('Invalid file'));
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result;
            resolve({ base64, name: file.name, type: file.type });
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}
