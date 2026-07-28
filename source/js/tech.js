(() => {
  'use strict';
  const ready = fn => document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', fn, { once: true }) : fn();

  ready(() => {
    document.documentElement.dataset.techFx = 'v8.2.1-loaded';
    console.info('[tech-fx] v8.2.1 optimized');
    const media = query => typeof matchMedia === 'function' && matchMedia(query).matches;
    const reduced = media('(prefers-reduced-motion: reduce)');
    const saveData = navigator.connection?.saveData === true;
    const lowPower = saveData || (navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4) ||
      (navigator.deviceMemory > 0 && navigator.deviceMemory <= 4);
    if (lowPower) document.documentElement.classList.add('tech-low-power');


    // Minimal viewport HUD; decorative and non-interactive.
    const hud = document.createElement('div');
    hud.id = 'tech-hud-frame';
    hud.setAttribute('aria-hidden', 'true');
    hud.innerHTML = '<i class="tech-circuit-node n1"></i><i class="tech-circuit-node n2"></i><i class="tech-circuit-node n3"></i><i class="tech-circuit-node n4"></i>';
    document.body.appendChild(hud);


    // Show the boot indicator only once per browser tab/session.
    // Reloading or navigating to another page in the same tab skips it.
    let showBootLoader = !reduced;
    try {
      const bootKey = 'tech-boot-loader-shown-v1';
      if (sessionStorage.getItem(bootKey)) showBootLoader = false;
      else sessionStorage.setItem(bootKey, '1');
    } catch (_) {
      // If storage is unavailable, keep the normal first-load behavior.
    }

    if (showBootLoader) {
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
        const wait = Math.max(0, 360 - (performance.now() - shownAt));
        setTimeout(() => {
          loader.classList.add('is-done');
          document.body.classList.add('tech-page-ready');
          setTimeout(() => loader.remove(), 460);
        }, wait);
      };
      if (document.readyState === 'complete') finishLoading();
      else addEventListener('load', finishLoading, { once: true });
      // Safety cap: slow third-party resources cannot keep the overlay forever.
      setTimeout(finishLoading, 900);
    } else {
      document.body.classList.add('tech-page-ready');
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
      const legacySelector = '.k408-user,.k408-extra,.k408-warn,.k408-source';
      const legacyBoxes = [];
      if (root.nodeType === 1 && root.matches?.(legacySelector)) legacyBoxes.push(root);
      root.querySelectorAll?.(legacySelector).forEach(box => legacyBoxes.push(box));
      legacyBoxes.forEach(box => {
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
      const navSelector = '.navbar-blur,.navbar-container,.navbar nav,.navbar nav a';
      const navItems = [];
      if (root.nodeType === 1 && root.matches?.(navSelector)) navItems.push(root);
      root.querySelectorAll?.(navSelector).forEach(el => navItems.push(el));
      navItems.forEach(el => {
        el.style.setProperty('text-shadow', 'none', 'important');
        el.style.setProperty('filter', 'none', 'important');
        el.style.setProperty('box-shadow', 'none', 'important');
      });
    };
    forceReadableLegacyUI();
    // Stellar may replace the main region without a full reload. Observe only
    // direct subtree insertions and batch repairs into one animation frame.
    let repairQueued = false;
    const repairRoots = new Set();
    const repairObserver = new MutationObserver(records => {
      for (const record of records) for (const node of record.addedNodes) {
        if (node.nodeType === 1 && !node.matches?.('#tech-loader,.tech-click-ripple,#tech-hud-frame,#tech-particles')) repairRoots.add(node);
      }
      if (repairRoots.size && !repairQueued) {
        repairQueued = true;
        requestAnimationFrame(() => {
          repairQueued = false;
          repairRoots.forEach(forceReadableLegacyUI);
          repairRoots.clear();
        });
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


    // Click feedback only. Pointer-following DOM particles and magnetic movement were
    // removed: both caused repeated allocation/layout work during every mouse movement.
    if (!reduced && media('(hover: hover) and (pointer: fine)')) {
      addEventListener('pointerdown', event => {
        if (event.button !== 0 || document.hidden) return;
        const ripple = document.createElement('i');
        ripple.className = 'tech-click-ripple';
        ripple.setAttribute('aria-hidden', 'true');
        ripple.style.left = `${event.clientX}px`;
        ripple.style.top = `${event.clientY}px`;
        document.body.appendChild(ripple);
        const remove = () => ripple.remove();
        ripple.addEventListener('animationend', remove, { once: true });
        setTimeout(remove, 520);
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

    // Magnetic pointer tracking removed to avoid forced layout on pointermove.

    // Native canvas particles: no dependency, capped DPR/count, 30 FPS and paused off-tab.
    if (reduced || saveData) return;
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
      width = innerWidth; height = innerHeight; dpr = Math.min(devicePixelRatio || 1, lowPower ? 1 : 1.25);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cap = mobile.matches ? 16 : (lowPower ? 22 : 36);
      const count = Math.min(cap, Math.max(12, Math.round(width * height / 36000)));
      particles = Array.from({ length: count }, makeParticle);
    };
    const draw = time => {
      raf = requestAnimationFrame(draw);
      if (time - last < (lowPower || mobile.matches ? 66 : 50)) return; // 15–20 FPS for a subtle background.
      last = time;
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < -5) p.x = width + 5; else if (p.x > width + 5) p.x = -5;
        if (p.y < -5) p.y = height + 5; else if (p.y > height + 5) p.y = -5;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(116, 222, 255, ${p.a})`; ctx.fill();
      }
      // Connections are skipped on mobile/low-power devices.
      if (mobile.matches || lowPower) return;
      ctx.lineWidth = .5;
      for (let i = 0; i < particles.length; i += 3) {
        const a = particles[i];
        for (let j = i + 1; j < Math.min(i + 5, particles.length); j++) {
          const b = particles[j], dx = a.x - b.x, dy = a.y - b.y, d2 = dx*dx + dy*dy;
          if (d2 < 8500) {
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(85, 172, 220, ${.18 * (1 - d2 / 8500)})`; ctx.stroke();
          }
        }
      }
    };
    let resizeTimer;
    addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 240); }, { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
      else if (!raf) raf = requestAnimationFrame(draw);
    });
    resize(); raf = requestAnimationFrame(draw);
  });
})();
