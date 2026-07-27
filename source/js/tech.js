(() => {
  'use strict';
  const ready = fn => document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', fn, { once: true }) : fn();

  ready(() => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Reading progress: one passive listener and one requestAnimationFrame per visual update.
    const bar = document.createElement('div');
    bar.id = 'cyber-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    let progressTick = false;
    const updateProgress = () => {
      const root = document.documentElement;
      const max = root.scrollHeight - root.clientHeight;
      bar.style.width = `${max > 0 ? Math.min(100, root.scrollTop / max * 100) : 0}%`;
      progressTick = false;
    };
    const requestProgress = () => {
      if (!progressTick) { progressTick = true; requestAnimationFrame(updateProgress); }
    };
    addEventListener('scroll', requestProgress, { passive: true });
    addEventListener('resize', requestProgress, { passive: true });
    updateProgress();

    // Reveal only main cards. IntersectionObserver stops watching after the first reveal.
    const targets = document.querySelectorAll('.post-list .post-card, .l_main > article');
    if ('IntersectionObserver' in window && !reduced) {
      const observer = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('cyber-visible');
          observer.unobserve(entry.target);
        }
      }), { rootMargin: '0px 0px -5% 0px', threshold: .05 });
      targets.forEach((target, index) => {
        target.classList.add('cyber-reveal');
        target.style.transitionDelay = `${Math.min(index % 5, 4) * 35}ms`;
        observer.observe(target);
      });
    } else targets.forEach(target => target.classList.add('cyber-visible'));

    // Native canvas particles: no dependency, capped DPR/count, 30 FPS and paused off-tab.
    if (reduced) return;
    const canvas = document.createElement('canvas');
    canvas.id = 'tech-particles';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(canvas);
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = 0, height = 0, dpr = 1, particles = [], raf = 0, last = 0;
    const mobile = matchMedia('(max-width: 768px)');
    const makeParticle = () => ({
      x: Math.random() * width, y: Math.random() * height,
      vx: (Math.random() - .5) * .14, vy: (Math.random() - .5) * .14 - .035,
      r: Math.random() * 1.05 + .45, a: Math.random() * .38 + .20
    });
    const resize = () => {
      width = innerWidth; height = innerHeight; dpr = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(mobile.matches ? 24 : 46, Math.max(16, Math.round(width * height / 30000)));
      particles = Array.from({ length: count }, makeParticle);
    };
    const draw = time => {
      raf = requestAnimationFrame(draw);
      if (time - last < 33) return; // ~30 FPS is enough for a subtle background.
      last = time;
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < -5) p.x = width + 5; else if (p.x > width + 5) p.x = -5;
        if (p.y < -5) p.y = height + 5; else if (p.y > height + 5) p.y = -5;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(91, 205, 255, ${p.a})`; ctx.fill();
      }
      // Only nearby neighbors, and only every other particle, to keep comparisons low.
      ctx.lineWidth = .55;
      for (let i = 0; i < particles.length; i += 2) {
        const a = particles[i];
        for (let j = i + 1; j < Math.min(i + 7, particles.length); j++) {
          const b = particles[j], dx = a.x - b.x, dy = a.y - b.y, d2 = dx*dx + dy*dy;
          if (d2 < 8500) {
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(85, 172, 220, ${.08 * (1 - d2 / 8500)})`; ctx.stroke();
          }
        }
      }
    };
    let resizeTimer;
    addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 160); }, { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
      else if (!raf) raf = requestAnimationFrame(draw);
    });
    resize(); raf = requestAnimationFrame(draw);
  });
})();
