export function setupFaqAccordion(): void {
  const accordion = document.getElementById('faq-accordion');
  if (!accordion) return;
  accordion.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest<HTMLButtonElement>('.faq-question');
    const item = button?.parentElement;
    const answer = item?.querySelector<HTMLElement>('.faq-answer');
    if (!item || !answer) return;
    item.classList.toggle('open');
    answer.style.maxHeight = item.classList.contains('open') ? `${answer.scrollHeight}px` : '0px';
  });
}
