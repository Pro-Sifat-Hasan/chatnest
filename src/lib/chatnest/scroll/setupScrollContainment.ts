/**
 * Setup scroll containment to prevent propagation
 * @param {Chatnest} chatnest - Chatnest instance
 */
export function setupScrollContainment(chatnest: any) {
    const chatMessages = chatnest.widget.querySelector('.chat-messages');
    if (!chatMessages) return;

    chatMessages.addEventListener('wheel', (e: WheelEvent) => {
        const isScrollable = chatMessages.scrollHeight > chatMessages.clientHeight;
        if (!isScrollable) return;

        e.stopPropagation();

        const isScrollingUp = e.deltaY < 0;
        const isScrollingDown = e.deltaY > 0;
        const isAtTop = chatMessages.scrollTop === 0;
        const isAtBottom = chatMessages.scrollTop + chatMessages.clientHeight >= chatMessages.scrollHeight;

        if ((isScrollingUp && isAtTop) || (isScrollingDown && isAtBottom)) {
            e.preventDefault();
        }
    }, { passive: false });

    let touchStartY = 0;
    chatMessages.addEventListener('touchstart', (e: TouchEvent) => {
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    chatMessages.addEventListener('touchmove', (e: TouchEvent) => {
        const touchY = e.touches[0].clientY;
        const isScrollingUp = touchY > touchStartY;
        const isAtTop = chatMessages.scrollTop <= 0;
        const isAtBottom = chatMessages.scrollTop + chatMessages.clientHeight >= chatMessages.scrollHeight;

        if ((isScrollingUp && isAtTop) || (!isScrollingUp && isAtBottom)) {
            e.preventDefault();
        }
    }, { passive: false });
}
