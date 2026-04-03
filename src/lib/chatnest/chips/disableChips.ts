/**
 * Disable all suggestion chips
 * @param {Chatnest} chatnest - Chatnest instance
 */
export function disableChips(chatnest: any) {
    const chips = chatnest.widget.querySelectorAll('.chip');
    chips.forEach((chip: Element) => chip.classList.add('disabled'));
}
