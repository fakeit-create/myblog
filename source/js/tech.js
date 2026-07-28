(() => {
  'use strict';
  const ready = fn => document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', fn, { once: true }) : fn();

  ready(() => {
    document.documentElement.dataset.techFx = 'v8.1-loaded';
    console.info('[tech-fx] v8.1 loaded');
    const media = query => typeof matchMedia === 'function' && matchMedia(query).matches;
    const reduced = media('(prefers-reduced-motion: reduce)');


    // Minimal viewport HUD; decorative and non-interactive.
    const hud = document.createElement('div');
    hud.id = 'tech-hud-frame';
    hud.setAttribute('aria-hidden', 'true');
    hud.innerHTML = '<i class="tech-circuit-node n1"></i><i class="tech-circuit-node n2"></i><i class="tech-circuit-node n3"></i><i class="tech-circuit-node n4"></i>';
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


    // Desktop pointer effects: keep only the sparse ion trail and click ripple.
    // The cyan ring/reticle that followed the pointer has been removed.
    if (!reduced && media('(hover: hover) and (pointer: fine)')) {
      let lastPX = innerWidth / 2, lastPY = innerHeight / 2, lastIonAt = 0;
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
      addEventListener('pointermove', event => {
        const now = performance.now();
        const dx = event.clientX - lastPX, dy = event.clientY - lastPY;
        if (now - lastIonAt > 38 && dx * dx + dy * dy > 80) {
          emitIon(event.clientX, event.clientY, dx, dy); lastIonAt = now;
        }
        lastPX = event.clientX; lastPY = event.clientY;
      }, { passive: true });

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

    // Rare title RGB fault: brief, infrequent and never hides the real title.
    if (!reduced) {
      const titleSelectors = '.md-text h1,.article-title,h1.post-title,.post-title';
      const pulseTitle = () => {
        const titles = [...document.querySelectorAll(titleSelectors)].filter(el => el.textContent.trim());
        if (titles.length) {
          const title = titles[Math.floor(Math.random() * titles.length)];
          title.dataset.techTitle = title.textContent.trim();
          title.classList.remove('tech-title-glitch');
          void title.offsetWidth;
          title.classList.add('tech-title-glitch');
          setTimeout(() => title.classList.remove('tech-title-glitch'), 390);
        }
        setTimeout(pulseTitle, 7000 + Math.random() * 6000);
      };
      setTimeout(pulseTitle, 3500 + Math.random() * 2500);
    }

    // Lightweight magnetic feedback using event delegation; no per-button listeners.
    if (!reduced && media('(hover: hover) and (pointer: fine)')) {
      const magneticSelector = 'button,.btn,.tag-plugin.button,.navbar a,.nav-area a,.post-card';
      let magneticTarget = null;
      addEventListener('pointermove', event => {
        const target = event.target.closest?.(magneticSelector);
        if (magneticTarget && magneticTarget !== target) magneticTarget.style.translate = '';
        magneticTarget = target;
        if (!target) return;
        const rect = target.getBoundingClientRect();
        const dx = Math.max(-3, Math.min(3, (event.clientX - rect.left - rect.width / 2) * .035));
        const dy = Math.max(-3, Math.min(3, (event.clientY - rect.top - rect.height / 2) * .035));
        target.style.translate = `${dx}px ${dy}px`;
      }, { passive: true });
      addEventListener('pointerout', event => {
        if (magneticTarget && !magneticTarget.contains(event.relatedTarget)) {
          magneticTarget.style.translate = '';
          magneticTarget = null;
        }
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
