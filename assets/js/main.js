/* Site interactions — v1 (vanilla, no deps). Brand name lives in brand.json */
(() => {
  document.documentElement.classList.remove('no-js');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* header state */
  const header = document.querySelector('.site-header');
  const onScroll = () => header && header.classList.toggle('scrolled', window.scrollY > 20);
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

  /* mobile nav */
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open));
      links.classList.toggle('open', open);
    });
    links.addEventListener('click', e => { if (e.target.closest('a')) { toggle.setAttribute('aria-expanded', 'false'); links.classList.remove('open'); } });
  }

  /* starfield */
  const canvas = document.getElementById('starfield');
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext('2d');
    const palette = ['255,255,255', '200,240,255', '220,200,255', '255,200,235'];
    let w, h, dpr, stars = [], shooting = null, visible = true, mx = 0, my = 0;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(420, (w * h) / 3600));
      stars = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h, z: Math.random() * .9 + .1,
        r: Math.random() * 1.3 + .2, t: Math.random() * Math.PI * 2, s: Math.random() * .02 + .005,
        c: palette[(Math.random() * palette.length) | 0]
      }));
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const st of stars) {
        st.t += st.s;
        if (!reduce) { st.y -= st.z * .12; if (st.y < -2) { st.y = h + 2; st.x = Math.random() * w; } }
        const a = .35 + Math.sin(st.t) * .3 + st.z * .35;
        const x = st.x + mx * st.z * 14, y = st.y + my * st.z * 14;
        ctx.beginPath(); ctx.arc(x, y, st.r * (st.z + .3), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${st.c},${Math.max(0, Math.min(1, a))})`; ctx.fill();
        if (st.r > 1.3 && st.z > .8) { ctx.fillStyle = `rgba(${st.c},${a * .12})`; ctx.beginPath(); ctx.arc(x, y, st.r * 4, 0, Math.PI * 2); ctx.fill(); }
      }
      if (!reduce) {
        if (!shooting && Math.random() < .004) shooting = { x: Math.random() * w * .8 + w * .2, y: Math.random() * h * .4, l: 0, v: 9 + Math.random() * 6 };
        if (shooting) {
          const s = shooting; s.l += s.v;
          const g = ctx.createLinearGradient(s.x - s.l, s.y + s.l * .45, s.x - s.l + 90, s.y + s.l * .45 - 40);
          g.addColorStop(0, 'rgba(94,231,255,0)'); g.addColorStop(1, 'rgba(255,255,255,.9)');
          ctx.strokeStyle = g; ctx.lineWidth = 1.4; ctx.beginPath();
          ctx.moveTo(s.x - s.l, s.y + s.l * .45); ctx.lineTo(s.x - s.l + 90, s.y + s.l * .45 - 40); ctx.stroke();
          if (s.l > w * .6) shooting = null;
        }
      }
    };
    const loop = () => { if (visible) draw(); if (!reduce) requestAnimationFrame(loop); };
    resize(); window.addEventListener('resize', resize);
    if (!reduce) window.addEventListener('pointermove', e => { mx = e.clientX / w - .5; my = e.clientY / h - .5; }, { passive: true });
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
    loop();
  }

  /* waveform bars */
  document.querySelectorAll('[data-wave]').forEach(el => {
    const n = +el.dataset.wave || 48;
    for (let i = 0; i < n; i++) {
      const b = document.createElement('i');
      const env = Math.sin((i / n) * Math.PI);
      b.style.height = `${20 + env * 80 * (0.5 + Math.random() * .5)}%`;
      b.style.animationDelay = `${-(Math.random() * 1.6).toFixed(2)}s`;
      b.style.backgroundPosition = `${(i / n) * 100}% 0`;
      el.appendChild(b);
    }
  });
  document.querySelectorAll('[data-mini]').forEach(el => {
    for (let i = 0; i < 40; i++) { const b = document.createElement('i'); b.style.height = `${15 + Math.random() * 85}%`; el.appendChild(b); }
  });

  /* reveal on scroll */
  const rev = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
    rev.forEach(el => io.observe(el));
  } else rev.forEach(el => el.classList.add('in'));

  /* product filters */
  const filters = document.querySelectorAll('.filter');
  filters.forEach(btn => btn.addEventListener('click', () => {
    filters.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
    const f = btn.dataset.filter;
    document.querySelectorAll('[data-cat]').forEach(c => { c.hidden = f !== 'all' && c.dataset.cat !== f; });
  }));

  const h = location.hash.replace('#', '');
  const pre = { synths: 'synth', effects: 'effect' }[h];
  if (pre) { const b = document.querySelector(`.filter[data-filter="${pre}"]`); b && b.click(); }

  /* forms — front-end only (no backend yet) */
  const emailOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  document.querySelectorAll('form[data-demo]').forEach(form => {
    const status = form.querySelector('.form-status') || form.parentElement.querySelector('.form-status');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const email = form.querySelector('input[type="email"]');
      if (email && !emailOk(email.value.trim())) {
        status.textContent = 'Please enter a valid email address.'; status.classList.add('err'); email.focus(); return;
      }
      const missing = [...form.querySelectorAll('[required]')].find(f => !f.value.trim());
      if (missing) { status.textContent = 'Please fill in all required fields.'; status.classList.add('err'); missing.focus(); return; }
      status.classList.remove('err');
      status.textContent = 'Sending…';
      fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                   body: new URLSearchParams(new FormData(form)).toString() })
        .then(r => {
          if (!r.ok) throw new Error(r.status);
          status.textContent = form.dataset.demo === 'newsletter'
            ? "You're subscribed. Thanks for following the studio!"
            : "Thanks, message received. We'll get back to you soon.";
          form.reset();
        })
        .catch(() => {
          status.classList.add('err');
          status.textContent = "Couldn't send right now. Please email folixaudio@gmail.com instead.";
        });
    });
  });

  /* year */
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
})();
