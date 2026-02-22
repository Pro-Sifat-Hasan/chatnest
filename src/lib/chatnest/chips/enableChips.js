/**
 * Enable all suggestion chips
 * @param {Chatnest} chatnest - Chatnest instance
 */
export function enableChips(chatnest) {
    const chips = chatnest.widget.querySelectorAll('.chip');
    chips.forEach(chip => chip.classList.remove('disabled'));
}
