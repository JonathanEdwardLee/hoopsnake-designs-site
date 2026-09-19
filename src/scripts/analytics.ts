type GtagFn = (...args: unknown[]) => void;

function track(eventName: string): void {
  const gtag = (window as Window & { gtag?: GtagFn }).gtag;
  if (typeof gtag !== 'function') {
    return;
  }
  gtag('event', eventName);
}

document.querySelectorAll<HTMLAnchorElement>('a[href="#project-review"]').forEach((link) => {
  link.addEventListener('click', () => {
    track('cta_start_project');
  });
});

document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((link) => {
  if (link.textContent?.trim() !== 'View public project') {
    return;
  }
  link.addEventListener('click', () => {
    track('portfolio_project_click');
  });
});
