/**
 * Disable all suggestion chips
 * @param {Chatnest} chatnest - Chatnest instance
 */
export function disableChips(chatnest) {
    const chips = chatnest.widget.querySelectorAll('.chip');
    chips.forEach(chip => chip.classList.add('disabled'));
}
