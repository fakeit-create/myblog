/* Lightweight scroll-linked text motion for the FENG // LAB homepage. */
(() => {
  'use strict';
  const init = () => {
    const home = document.getElementById('feng-home');
    if (!home || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const items = [...home.querySelectorAll('[data-feng-scroll]')];
    if (!items.length) return;
    let ticking = false;
    let idleTimer = 0;

    const paint = () => {
      const vh = Math.max(document.documentElement.clientHeight, 1);
      for (const el of items) {
        const rect = el.getBoundingClientRect();
        const kind = el.dataset.fengScroll;
        let visibility;
        let scale;
        let y;

        if (kind === 'hero' || kind === 'hero-card') {
          const progress = Math.max(0, Math.min(1, -rect.top / (vh * .72)));
          visibility = 1 - progress;
          scale = 1 - progress * (kind === 'hero' ? .12 : .08);
          y = -progress * (kind === 'hero' ? 34 : 20);
        } else {
          const center = rect.top + rect.height / 2;
          const distance = Math.abs(center - vh / 2) / (vh * .72);
          visibility = Math.max(0, Math.min(1, 1 - distance));
          scale = .92 + visibility * .08;
          y = (1 - visibility) * 22;
        }

        el.style.setProperty('--feng-scroll-opacity', String(.16 + visibility * .84));
        el.style.setProperty('--feng-scroll-scale', scale.toFixed(4));
        el.style.setProperty('--feng-scroll-y', `${y.toFixed(2)}px`);
        el.classList.remove('is-scroll-idle');
      }
      ticking = false;
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => items.forEach(el => el.classList.add('is-scroll-idle')), 140);
    };

    const requestPaint = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(paint);
      }
    };
    addEventListener('scroll', requestPaint, { passive: true });
    addEventListener('resize', requestPaint, { passive: true });
    paint();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
