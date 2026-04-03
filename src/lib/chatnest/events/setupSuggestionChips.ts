/**
 * Setup suggestion chips click handlers
 * @param {Chatnest} chatnest - Chatnest instance
 */
export function setupSuggestionChips(chatnest: any) {
    const chips = chatnest.widget.querySelectorAll('.chip');
    chips.forEach((chip: Element) => {
        chip.addEventListener('click', () => {
            if (!chatnest.isWaitingForResponse) {
                const message = chip.textContent;
                chatnest.sendMessage(message);
                chatnest.disableChips();
            }
        });
    });

    const style = document.createElement('style');
    style.textContent = `
        .chip {
            transition: opacity 0.3s ease, background-color 0.3s ease;
        }

        .chip.disabled {
            opacity: 0.5;
            cursor: not-allowed;
            pointer-events: none;
            background-color: #e0e0e0;
        }
    `;
    document.head.appendChild(style);
}
