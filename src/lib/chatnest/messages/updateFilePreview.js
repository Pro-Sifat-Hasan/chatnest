/**
 * Update file preview display
 * @param {Chatnest} chatnest - Chatnest instance
 * @param {File[]} files - Files to preview
 * @param {Element} filePreview - File preview container element
 */
export function updateFilePreview(chatnest, files, filePreview) {
    if (files.length === 0) {
        filePreview.style.display = 'none';
        if (filePreview._objectUrls) {
            filePreview._objectUrls.forEach(url => URL.revokeObjectURL(url));
            filePreview._objectUrls = [];
        }
        filePreview.innerHTML = '';
        return;
    }

    if (filePreview._objectUrls) {
        filePreview._objectUrls.forEach(url => URL.revokeObjectURL(url));
    }
    filePreview._objectUrls = [];

    filePreview.style.display = 'block';
    filePreview.innerHTML = files.map((file, index) => {
        const size = chatnest.formatFileSize(file.size);
        const isImage = file.type && file.type.startsWith('image/');
        let thumbHtml = '';
        if (isImage) {
            try {
                const url = URL.createObjectURL(file);
                filePreview._objectUrls.push(url);
                thumbHtml = `<img class="file-preview-thumb" src="${url}" alt="${file.name}">`;
            } catch (_) {
                thumbHtml = '';
            }
        }
        return `
            <div class="file-preview-item" data-index="${index}">
                ${thumbHtml}
                <div class="file-info">
                    <span class="file-name">${escapeHtml(file.name)}</span>
                    <span class="file-size">${escapeHtml(size)}</span>
                </div>
                <button class="remove-file" data-index="${index}" type="button" aria-label="Remove file">×</button>
            </div>
        `;
    }).join('');
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
