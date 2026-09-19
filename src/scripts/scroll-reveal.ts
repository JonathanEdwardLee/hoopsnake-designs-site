const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

function revealNow(node: Element): void {
  node.classList.add('is-revealed');
}

function initScrollReveal(): void {
  const nodes = Array.from(document.querySelectorAll('[data-reveal]'));
  if (nodes.length === 0) {
    return;
  }

  if (motionQuery.matches || typeof IntersectionObserver !== 'function') {
    nodes.forEach(revealNow);
    return;
  }

  document.documentElement.classList.add('js-reveal');

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) {
          continue;
        }
        revealNow(entry.target);
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.14, rootMargin: '0px 0px -6% 0px' },
  );

  nodes.forEach((node, index) => {
    if (node instanceof HTMLElement) {
      node.style.setProperty('--reveal-delay', `${(index % 4) * 45}ms`);
    }
    observer.observe(node);
  });
}

initScrollReveal();
