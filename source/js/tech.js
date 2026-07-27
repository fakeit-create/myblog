(() => {
  'use strict';

  const ready = (fn) => document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', fn, { once: true })
    : fn();

  ready(() => {
    // Lightweight reading progress bar.
    const bar = document.createElement('div');
    bar.id = 'cyber-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);

    let ticking = false;
    const updateProgress = () => {
      const root = document.documentElement;
      const max = root.scrollHeight - root.clientHeight;
      const value = max > 0 ? Math.min(100, Math.max(0, root.scrollTop / max * 100)) : 0;
      bar.style.width = `${value}%`;
      ticking = false;
    };
    const requestProgress = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateProgress);
      }
    };
    addEventListener('scroll', requestProgress, { passive: true });
    addEventListener('resize', requestProgress, { passive: true });
    updateProgress();

    // Reveal cards without external animation libraries.
    const targets = [...document.querySelectorAll('.post-list .post-card, .l_main > article')];
    if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('cyber-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
      targets.forEach((target, index) => {
        target.classList.add('cyber-reveal');
        target.style.transitionDelay = `${Math.min(index % 6, 5) * 45}ms`;
        observer.observe(target);
      });
    } else {
      targets.forEach((target) => target.classList.add('cyber-visible'));
    }
  });
})();
