/**
 * Enable all suggestion chips
 * @param {Chatnest} chatnest - Chatnest instance
 */
export function enableChips(chatnest: any) {
    const chips = chatnest.widget.querySelectorAll('.chip');
    chips.forEach((chip: Element) => chip.classList.remove('disabled'));
}
