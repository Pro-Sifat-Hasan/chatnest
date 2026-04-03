/**
 * Setup links and images in message content
 * @param {Chatnest} chatnest - Chatnest instance
 * @param {Element} messageDiv - Message content element
 */
export function setupMessageLinks(chatnest: any, messageDiv: any) {
    messageDiv.querySelectorAll('a').forEach((link: Element) => {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
    });

    messageDiv.querySelectorAll('img').forEach((img: any) => {
        const imgContainer = document.createElement('div');
        imgContainer.className = 'image-container';

        img.parentNode.insertBefore(imgContainer, img);
        imgContainer.appendChild(img);

        const fallbackSvg = `
            <svg width="50" height="50" viewBox="0 0 24 24" fill="#999">
                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>`;

        img.addEventListener('error', () => {
            imgContainer.innerHTML = fallbackSvg;
            imgContainer.style.padding = '20px';
            imgContainer.style.textAlign = 'center';
        });
    });
}
