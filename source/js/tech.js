(() => {
  'use strict';
  const ready = fn => document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', fn, { once: true }) : fn();

  ready(() => {
    document.documentElement.dataset.techFx = 'v7-loaded';
    console.info('[tech-fx] v7 loaded');
    const media = query => typeof matchMedia === 'function' && matchMedia(query).matches;
    const reduced = media('(prefers-reduced-motion: reduce)');


    // Minimal viewport HUD; decorative and non-interactive.
    const hud = document.createElement('div');
    hud.id = 'tech-hud-frame';
    hud.setAttribute('aria-hidden', 'true');
    document.body.appendChild(hud);


    // Tiny DOM-only boot indicator. It never blocks input and is removed after fading.
    if (!reduced) {
      const loader = document.createElement('div');
      loader.id = 'tech-loader';
      loader.setAttribute('aria-hidden', 'true');
      loader.innerHTML = '<span class="tech-loader-core"></span><span class="tech-loader-label">SYSTEM READY</span>';
      document.body.appendChild(loader);
      let finishing = false;
      const shownAt = performance.now();
      const finishLoading = () => {
        if (finishing) return;
        finishing = true;
        const wait = Math.max(0, 950 - (performance.now() - shownAt));
        setTimeout(() => {
          loader.classList.add('is-done');
          document.body.classList.add('tech-page-ready');
          setTimeout(() => loader.remove(), 460);
        }, wait);
      };
      if (document.readyState === 'complete') finishLoading();
      else addEventListener('load', finishLoading, { once: true });
      // Safety cap: slow third-party resources cannot keep the overlay forever.
      setTimeout(finishLoading, 1800);
    }


    // Correct the two legacy components with inline !important declarations.
    // This survives article-local <style> blocks, theme source order and PJAX-like swaps.
    const forceReadableLegacyUI = (root = document) => {
      const colors = {
        'k408-user': ['#102d4a', '#58b3ff'],
        'k408-extra': ['#12372b', '#54d99a'],
        'k408-warn': ['#403313', '#f2bd46'],
        'k408-source': ['#30234d', '#ae8cff']
      };
      root.querySelectorAll?.('.k408-user,.k408-extra,.k408-warn,.k408-source').forEach(box => {
        const key = Object.keys(colors).find(name => box.classList.contains(name));
        if (!key) return;
        box.style.setProperty('background', colors[key][0], 'important');
        box.style.setProperty('background-color', colors[key][0], 'important');
        box.style.setProperty('border-left-color', colors[key][1], 'important');
        box.style.setProperty('color', '#f7fbff', 'important');
        box.style.setProperty('opacity', '1', 'important');
        box.querySelectorAll('*').forEach(child => {
          child.style.setProperty('color', 'inherit', 'important');
          child.style.setProperty('opacity', '1', 'important');
          child.style.setProperty('text-shadow', 'none', 'important');
        });
      });
      root.querySelectorAll?.('.navbar-blur,.navbar-container,.navbar nav,.navbar nav a').forEach(el => {
        el.style.setProperty('text-shadow', 'none', 'important');
        el.style.setProperty('filter', 'none', 'important');
        el.style.setProperty('box-shadow', 'none', 'important');
      });
    };
    forceReadableLegacyUI();
    // Stellar may replace the main region without a full reload. Observe only
    // direct subtree insertions and batch repairs into one animation frame.
    let repairQueued = false;
    const repairObserver = new MutationObserver(records => {
      if (!records.some(record => record.addedNodes.length)) return;
      if (!repairQueued) {
        repairQueued = true;
        requestAnimationFrame(() => { repairQueued = false; forceReadableLegacyUI(); });
      }
    });
    repairObserver.observe(document.body, { childList: true, subtree: true });

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

    // Content must always be visible. Previous reveal code could leave whole
    // articles at opacity: 0 when navigation replaced content dynamically.
    document.querySelectorAll('.cyber-reveal').forEach(element => {
      element.classList.remove('cyber-reveal');
      element.classList.add('cyber-visible');
      element.style.removeProperty('transition-delay');
    });


    // Desktop pointer aura: one element, one passive event, RAF only while catching up.
    if (!reduced && media('(hover: hover) and (pointer: fine)')) {
      const aura = document.createElement('div');
      aura.id = 'tech-pointer-aura';
      aura.setAttribute('aria-hidden', 'true');
      document.body.appendChild(aura);
      let tx = innerWidth / 2, ty = innerHeight / 2, x = tx, y = ty, pointerRAF = 0;
      let lastPX = tx, lastPY = ty, lastIonAt = 0;
      const ions = new Set();
      const emitIon = (px, py, dx, dy) => {
        const ion = document.createElement('i');
        ion.className = 'tech-cursor-ion';
        ion.setAttribute('aria-hidden', 'true');
        ion.style.left = `${px}px`; ion.style.top = `${py}px`;
        ion.style.setProperty('--ion-x', `${-dx * .10 + (Math.random() - .5) * 5}px`);
        ion.style.setProperty('--ion-y', `${-dy * .10 + (Math.random() - .5) * 5}px`);
        document.body.appendChild(ion); ions.add(ion);
        const remove = () => { ions.delete(ion); ion.remove(); };
        ion.addEventListener('animationend', remove, { once: true });
        setTimeout(remove, 520);
        if (ions.size > 14) { const oldest = ions.values().next().value; ions.delete(oldest); oldest.remove(); }
      };
      const follow = () => {
        x += (tx - x) * .58; y += (ty - y) * .58;
        aura.style.transform = `translate3d(${x}px,${y}px,0)`;
        if (Math.abs(tx - x) + Math.abs(ty - y) > .35) pointerRAF = requestAnimationFrame(follow);
        else pointerRAF = 0;
      };
      addEventListener('pointermove', event => {
        tx = event.clientX; ty = event.clientY;
        aura.classList.add('is-active');
        const now = performance.now(), dx = tx - lastPX, dy = ty - lastPY;
        if (now - lastIonAt > 38 && dx * dx + dy * dy > 80) {
          emitIon(tx, ty, dx, dy); lastIonAt = now;
        }
        lastPX = tx; lastPY = ty;
        if (!pointerRAF) pointerRAF = requestAnimationFrame(follow);
      }, { passive: true });
      document.documentElement.addEventListener('mouseleave', () => aura.classList.remove('is-active'), { passive: true });

      // A single short-lived ripple per primary click; animation is CSS-composited.
      addEventListener('pointerdown', event => {
        if (event.button !== 0) return;
        const ripple = document.createElement('i');
        ripple.className = 'tech-click-ripple';
        ripple.setAttribute('aria-hidden', 'true');
        ripple.style.left = `${event.clientX}px`;
        ripple.style.top = `${event.clientY}px`;
        document.body.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
      }, { passive: true });
    }

    // Native canvas particles: no dependency, capped DPR/count, 30 FPS and paused off-tab.
    if (reduced) return;
    const canvas = document.createElement('canvas');
    canvas.id = 'tech-particles';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(canvas);
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = 0, height = 0, dpr = 1, particles = [], raf = 0, last = 0;
    const mobile = typeof matchMedia === 'function' ? matchMedia('(max-width: 768px)') : { matches: innerWidth <= 768 };
    const makeParticle = () => ({
      x: Math.random() * width, y: Math.random() * height,
      vx: (Math.random() - .5) * .14, vy: (Math.random() - .5) * .14 - .035,
      r: Math.random() * 1.45 + .65, a: Math.random() * .40 + .38
    });
    const resize = () => {
      width = innerWidth; height = innerHeight; dpr = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(mobile.matches ? 30 : 64, Math.max(24, Math.round(width * height / 22000)));
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
        ctx.fillStyle = `rgba(116, 222, 255, ${p.a})`; ctx.fill();
      }
      // Only nearby neighbors, and only every other particle, to keep comparisons low.
      ctx.lineWidth = .55;
      for (let i = 0; i < particles.length; i += 2) {
        const a = particles[i];
        for (let j = i + 1; j < Math.min(i + 7, particles.length); j++) {
          const b = particles[j], dx = a.x - b.x, dy = a.y - b.y, d2 = dx*dx + dy*dy;
          if (d2 < 8500) {
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(85, 172, 220, ${.18 * (1 - d2 / 8500)})`; ctx.stroke();
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
