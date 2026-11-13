/* rating.js — upgraded "Rate My Website" widget for index.html
   Rebuilds the contents of <section id="rating">: a ghost that tracks your cursor with its rifle and eyes,
   lock-on lasers, clickable/selectable ratings with unique effects, and a remembered answer. */
(() => {
  const root = document.getElementById('rating');
  if (!root) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const KEY = 'ap-site-rating';
  const OPTS = {
    excellent: { label: 'Excellent', emoji: '🤩', color: '#22c55e', msg: 'Nice! 🎉' },
    good: { label: 'Good enough', emoji: '🙂', color: '#f59e0b', msg: 'I will let you live for now. (◉ _ ◉)' },
    bad: { label: 'Bad', emoji: '💀', color: '#ef4444', msg: 'My AI Robot is going to kill you. 💀' }
  };
  const MOODS = {
    idle:  { bl: 'M75 84Q84 80 94 84', br: 'M106 84Q116 80 125 84', m: 'M90 126Q100 131 110 126', happy: 0, p: '#1a1a1a', b: '#888' },
    happy: { bl: 'M75 80Q84 74 94 80', br: 'M106 80Q116 74 125 80', m: 'M86 121Q100 142 114 121', happy: 1, p: '#1a1a1a', b: '#888' },
    smirk: { bl: 'M75 82Q84 76 94 83', br: 'M106 84Q116 80 125 84', m: 'M90 128Q102 133 112 123', happy: 0, p: '#1a1a1a', b: '#888' },
    angry: { bl: 'M73 79L95 89', br: 'M127 79L105 89', m: 'M88 131L94 135L100 130L106 135L112 131', happy: 0, p: '#ee2a0f', b: '#ee2a0f' },
    sad:   { bl: 'M75 88Q85 85 94 80', br: 'M106 80Q115 85 125 88', m: 'M90 135Q100 126 110 135', happy: 0, p: '#1a1a1a', b: '#888' }
  };
  const store = {
    get() { try { return localStorage.getItem(KEY); } catch { return null; } },
    set(v) { try { v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY); } catch {} }
  };

  /* ---------- Styles ---------- */
  const css = document.createElement('style');
  css.textContent = `
  .rt-fx{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1}
  .rt-flash{position:absolute;inset:0;z-index:3;pointer-events:none;opacity:0;background:radial-gradient(circle,transparent 45%,rgba(220,20,10,.45));transition:opacity .25s}
  .rt-danger .rt-flash{opacity:1;animation:rtPulse .6s ease-in-out infinite alternate}
  @keyframes rtPulse{from{opacity:.3}to{opacity:1}}
  .rt-shake{animation:rtShake .4s}
  @keyframes rtShake{20%{translate:-7px 3px}40%{translate:6px -3px}60%{translate:-4px 2px}80%{translate:3px -1px}}
  .rt-inner{position:relative;z-index:2;padding:28px;text-align:center;user-select:none}
  .rt-head{display:flex;align-items:center;justify-content:center;gap:12px}
  .rt-ico{display:grid;place-items:center;width:42px;height:42px;border-radius:13px;background:#eaf1ff;font-size:1.15rem}
  .rt-head h2{margin:0;color:#142238;font-size:1.35rem;letter-spacing:-.035em}
  .rt-sub{margin:6px 0 20px;font-size:.9rem}
  .rt-layout{display:flex;align-items:center;justify-content:center;gap:34px}
  .rt-opts{display:flex;flex-direction:column;gap:10px}
  .rt-btn{--c:#2d6cdf;position:relative;display:flex;align-items:center;gap:10px;min-width:215px;padding:11px 16px;border:1.5px solid #dce3ed;border-radius:12px;background:#fff;color:#142238;font:inherit;font-size:14.5px;font-weight:650;cursor:pointer;transition:transform .15s,background .15s,border-color .15s,box-shadow .2s}
  .rt-btn[data-v=excellent]{--c:#22c55e}.rt-btn[data-v=good]{--c:#f59e0b}.rt-btn[data-v=bad]{--c:#ef4444}
  .rt-btn:hover,.rt-btn:focus-visible{transform:translateX(4px) scale(1.02);outline:none}
  .rt-btn.aim{border-color:var(--c);box-shadow:0 0 0 3px color-mix(in srgb,var(--c) 18%,transparent),0 0 20px color-mix(in srgb,var(--c) 40%,transparent)}
  .rt-btn[aria-checked=true]{border-color:var(--c);background:color-mix(in srgb,var(--c) 11%,#fff)}
  .rt-dot{flex:none;width:10px;height:10px;border-radius:50%;background:#c4ccd8;transition:.2s}
  .rt-btn.aim .rt-dot,.rt-btn[aria-checked=true] .rt-dot{background:var(--c);box-shadow:0 0 9px var(--c)}
  .rt-emoji{font-size:1.15rem}
  .rt-check{margin-left:auto;color:var(--c);font-weight:800;opacity:0;transform:scale(.3);transition:.3s cubic-bezier(.3,1.7,.5,1)}
  .rt-btn[aria-checked=true] .rt-check{opacity:1;transform:none}
  .rt-hit{animation:rtHit .45s}
  @keyframes rtHit{20%{transform:translateX(-10px) rotate(-3deg)}45%{transform:translateX(8px) rotate(2deg)}100%{transform:none}}
  .rt-pop{animation:rtPop .5s}
  @keyframes rtPop{40%{transform:scale(1.12)}100%{transform:none}}
  .rt-ghost{flex:none;width:150px;height:188px;animation:rtFloat 3.6s ease-in-out infinite}
  @keyframes rtFloat{50%{transform:translateY(-8px)}}
  .rt-eyes{transform-box:fill-box;transform-origin:center;transition:transform .08s}
  .rt-eyes.blink{transform:scaleY(.1)}
  .rt-result{min-height:1.7em;margin:16px 0 0;color:#142238;font-weight:650;font-size:.95rem}
  .rt-change{margin-left:8px;padding:3px 9px;border:0;border-radius:8px;background:#eaf1ff;color:#2d6cdf;font:inherit;font-size:.8rem;font-weight:700;cursor:pointer}
  @media(max-width:640px){.rt-inner{padding:22px 14px}.rt-layout{flex-direction:column-reverse;gap:10px}.rt-opts{width:100%}.rt-btn{min-width:0}.rt-ghost{width:120px;height:150px}}
  @media(prefers-reduced-motion:reduce){.rt-ghost,.rt-danger .rt-flash,.rt-shake,.rt-hit,.rt-pop{animation:none}}`;
  document.head.appendChild(css);

  /* ---------- Markup ---------- */
  root.innerHTML = `
    <canvas class="rt-fx" aria-hidden="true"></canvas>
    <div class="rt-flash" aria-hidden="true"></div>
    <div class="rt-inner">
      <div class="rt-head"><span class="rt-ico" aria-hidden="true">🎯</span><h2>Rate My Website</h2></div>
      <p class="rt-sub">How did you find it? Pick one, the ghost is watching. 👻</p>
      <div class="rt-layout">
        <div class="rt-opts" role="radiogroup" aria-label="Rate my website">
          ${Object.entries(OPTS).map(([v, o]) => `<button type="button" class="rt-btn" role="radio" aria-checked="false" data-v="${v}"><span class="rt-dot"></span><span class="rt-emoji" aria-hidden="true">${o.emoji}</span><span>${o.label}</span><span class="rt-check" aria-hidden="true">✓</span></button>`).join('')}
        </div>
        <div class="rt-ghost">
          <svg viewBox="0 0 200 250" width="100%" height="100%" role="img" aria-label="A cartoon ghost aiming a rifle at your cursor">
            <defs><radialGradient id="rtG" cx="50%" cy="40%" r="55%"><stop offset="0" stop-color="#f6f6ff"/><stop offset="1" stop-color="#c8c8de"/></radialGradient></defs>
            <ellipse cx="100" cy="238" rx="56" ry="8" fill="rgba(0,0,0,.09)"/>
            <path d="M58 128Q56 215 70 218Q74 200 80 218Q86 200 92 218Q98 200 104 218Q110 200 116 218Q122 200 128 218Q132 215 142 128Z" fill="url(#rtG)" stroke="#b0b0c8" stroke-width="1.2"/>
            <ellipse cx="100" cy="100" rx="38" ry="40" fill="url(#rtG)" stroke="#b0b0c8" stroke-width="1.2"/>
            <g class="rt-eyes" id="rtEyes">
              <ellipse cx="85" cy="102" rx="10" ry="11" fill="#fff" stroke="#aaa" stroke-width=".8"/><ellipse cx="115" cy="102" rx="10" ry="11" fill="#fff" stroke="#aaa" stroke-width=".8"/>
              <circle id="rtPL" cx="85" cy="102" r="6" fill="#1a1a1a"/><circle id="rtPR" cx="115" cy="102" r="6" fill="#1a1a1a"/>
            </g>
            <g id="rtHappy" display="none" fill="none" stroke="#333" stroke-width="3" stroke-linecap="round"><path d="M76 106Q85 94 94 106"/><path d="M106 106Q115 94 124 106"/></g>
            <path id="rtBL" fill="none" stroke-width="2.4" stroke-linecap="round"/><path id="rtBR" fill="none" stroke-width="2.4" stroke-linecap="round"/>
            <path id="rtM" fill="none" stroke="#777" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
            <g id="rtGun">
              <rect x="-78" y="-4" width="96" height="8" rx="2" fill="#3a3a3a" stroke="#222"/><rect x="-52" y="-10" width="30" height="7" rx="2" fill="#2a2a2a"/>
              <path d="M18 -5L46 -2L46 10L18 4Z" fill="#8b6340" stroke="#5a3c1a"/>
              <ellipse cx="-24" cy="6" rx="8" ry="6" fill="#d6d6ea" stroke="#aaa"/><ellipse cx="8" cy="6" rx="8" ry="6" fill="#d6d6ea" stroke="#aaa"/>
            </g>
          </svg>
        </div>
      </div>
      <p class="rt-result" aria-live="polite"></p>
    </div>`;

  const $ = s => root.querySelector(s);
  const cv = $('.rt-fx'), ctx = cv.getContext('2d'), flash = $('.rt-flash');
  const svg = $('svg'), gun = $('#rtGun'), eyes = $('#rtEyes'), happy = $('#rtHappy');
  const pL = $('#rtPL'), pR = $('#rtPR'), bL = $('#rtBL'), bR = $('#rtBR'), mouth = $('#rtM');
  const res = $('.rt-result'), btns = [...root.querySelectorAll('.rt-btn')];

  /* ---------- State ---------- */
  let W = 0, H = 0, raf = 0, last = 0, curA = 0, curSx = 1, kick = 0, mood = '';
  let aimBtn = null, aimV = null, aimT = 0, sel = null, pulse = 0;
  const ptr = { x: 0, y: 0, in: false }, muz = { x: 0, y: 0 };
  const parts = [], tracers = [], holes = [];

  function size() {
    const r = root.getBoundingClientRect(), d = devicePixelRatio || 1;
    W = r.width; H = r.height; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
  }
  size();
  if ('ResizeObserver' in window) new ResizeObserver(size).observe(root);

  /* ---------- Particles ---------- */
  const rnd = (a, b) => a + Math.random() * (b - a);
  function burst(x, y, n, colors, speed, life, type, g = 400) {
    if (reduce) n = Math.ceil(n / 4);
    for (let i = 0; i < n; i++) {
      const a = rnd(0, Math.PI * 2), s = rnd(.25, 1) * speed;
      parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - (type === 'conf' ? speed * .5 : 0), life: rnd(.5, 1) * life, max: life, g,
        c: colors[i % colors.length], sz: rnd(3, type === 'conf' ? 8 : 5), type, rot: rnd(0, 6), vr: rnd(-8, 8) });
    }
  }
  function drawParts(dt) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]; p.life -= dt;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      ctx.save(); ctx.globalAlpha = Math.min(1, p.life / p.max * 1.5); ctx.fillStyle = p.c; ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      if (p.type === 'conf') ctx.fillRect(-p.sz / 2, -p.sz / 4, p.sz, p.sz / 2);
      else if (p.type === 'star') { ctx.beginPath(); for (let k = 0; k < 8; k++) { const r = k % 2 ? p.sz * .4 : p.sz * 1.4, a = k * Math.PI / 4; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.fill(); }
      else { ctx.shadowColor = p.c; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(0, 0, p.sz / 2, 0, 7); ctx.fill(); }
      ctx.restore();
    }
  }

  /* ---------- Drawing helpers ---------- */
  function line(x1, y1, x2, y2, c, w, alpha = .85) {
    ctx.save(); ctx.lineCap = 'round'; ctx.shadowColor = c; ctx.shadowBlur = 14; ctx.strokeStyle = c; ctx.globalAlpha = alpha; ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.shadowBlur = 0; ctx.strokeStyle = '#fff'; ctx.globalAlpha = alpha * .9; ctx.lineWidth = w * .35; ctx.stroke(); ctx.restore();
  }
  function reticle(x, y, c, t) {
    const lock = Math.max(0, 1 - t * 2.5), r = 16 + 36 * lock;
    ctx.save(); ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.shadowColor = c; ctx.shadowBlur = 8; ctx.globalAlpha = .6 + .4 * (1 - lock);
    ctx.translate(x, y); ctx.rotate(reduce ? 0 : t * 1.6); ctx.setLineDash([8, 5]);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.stroke(); ctx.setLineDash([]);
    [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([a, b]) => { ctx.beginPath(); ctx.moveTo(a * (r - 5), b * (r - 5)); ctx.lineTo(a * (r + 9), b * (r + 9)); ctx.stroke(); });
    ctx.restore();
  }
  function setMood(n) {
    if (n === mood) return; mood = n; const m = MOODS[n];
    bL.setAttribute('d', m.bl); bR.setAttribute('d', m.br); mouth.setAttribute('d', m.m);
    bL.setAttribute('stroke', m.b); bR.setAttribute('stroke', m.b);
    pL.setAttribute('fill', m.p); pR.setAttribute('fill', m.p);
    eyes.style.display = m.happy ? 'none' : ''; happy.setAttribute('display', m.happy ? '' : 'none');
  }
  setMood('idle');

  /* ---------- Main loop ---------- */
  function frame(ts) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(.05, (ts - last) / 1000 || 0); last = ts; pulse += dt * 4;
    const R = root.getBoundingClientRect(), S = svg.getBoundingClientRect(), k = S.width / 200;
    ctx.clearRect(0, 0, W, H);
    const px = S.left - R.left + 100 * k, py = S.top - R.top + 150 * k, fx = px, fy = S.top - R.top + 100 * k;
    let tx = null, ty = null;
    if (aimBtn) { const b = aimBtn.getBoundingClientRect(); tx = b.left - R.left + b.width / 2; ty = b.top - R.top + b.height / 2; }
    else if (ptr.in) { tx = ptr.x; ty = ptr.y; }
    const has = tx !== null, dx = has ? tx - px : -1, dy = has ? ty - py : .35;
    curSx = dx < 0 ? 1 : -1;
    const ta = Math.max(-65, Math.min(65, Math.atan2(-dy, Math.abs(dx)) * 180 / Math.PI));
    curA += (ta - curA) * (reduce ? 1 : Math.min(1, dt * 14)); kick = Math.max(0, kick - dt * 6);
    gun.setAttribute('transform', `translate(100 150) scale(${curSx} 1) rotate(${curA.toFixed(2)}) translate(${(kick * 9).toFixed(2)} 0)`);
    const rad = curA * Math.PI / 180;
    muz.x = px - curSx * 78 * Math.cos(rad) * k; muz.y = py - 78 * Math.sin(rad) * k;
    // eyes follow target
    const ex = has ? tx - fx : 0, ey = has ? ty - fy : 0, len = Math.hypot(ex, ey) || 1, m = has ? Math.min(4, len / 30) : 0;
    pL.setAttribute('cx', 85 + ex / len * m); pL.setAttribute('cy', 102 + ey / len * m);
    pR.setAttribute('cx', 115 + ex / len * m); pR.setAttribute('cy', 102 + ey / len * m);
    // laser + reticle
    if (has) {
      const c = aimV ? OPTS[aimV].color : '#ff2a00', fl = reduce ? 1 : .75 + Math.random() * .5, w = (aimV === 'bad' ? 4.5 : aimV ? 3 : 2.2) * fl;
      line(muz.x, muz.y, tx, ty, c, w);
      const g = ctx.createRadialGradient(tx, ty, 0, tx, ty, 16); g.addColorStop(0, c); g.addColorStop(1, 'transparent');
      ctx.fillStyle = g; ctx.globalAlpha = .7 + .3 * Math.sin(pulse); ctx.beginPath(); ctx.arc(tx, ty, 16, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
      if (aimBtn) reticle(tx, ty, c, (ts - aimT) / 1000);
    }
    // persistent bullet holes
    holes.forEach(h => {
      ctx.save(); ctx.translate(h.x, h.y); ctx.strokeStyle = 'rgba(40,20,20,.55)'; ctx.lineWidth = 1.2;
      h.cr.forEach(a => { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * h.r * 2.6, Math.sin(a) * h.r * 2.6); ctx.stroke(); });
      ctx.fillStyle = '#1b1b1f'; ctx.beginPath(); ctx.arc(0, 0, h.r, 0, 7); ctx.fill(); ctx.restore();
    });
    // tracers
    for (let i = tracers.length - 1; i >= 0; i--) {
      const t = tracers[i]; t.life -= dt; if (t.life <= 0) { tracers.splice(i, 1); continue; }
      line(t.x0, t.y0, t.x1, t.y1, '#ffd27a', 5, t.life / .16);
    }
    drawParts(dt);
    // ghost mood + danger vignette
    const eff = aimV || sel;
    setMood(eff ? ({ excellent: 'happy', good: 'smirk', bad: aimV ? 'angry' : 'sad' })[eff] : 'idle');
    root.classList.toggle('rt-danger', aimV === 'bad' && !reduce);
  }
  function start() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  function stop() { cancelAnimationFrame(raf); raf = 0; }
  if ('IntersectionObserver' in window) new IntersectionObserver(e => e[0].isIntersecting ? start() : stop()).observe(root);
  else start();

  /* ---------- Rating logic ---------- */
  function setSelected(v, instant) {
    sel = v; btns.forEach(b => b.setAttribute('aria-checked', String(b.dataset.v === v)));
    if (!v) { res.textContent = ''; return; }
    res.textContent = OPTS[v].msg + ' ';
    const ch = document.createElement('button'); ch.type = 'button'; ch.className = 'rt-change'; ch.textContent = 'Change answer';
    ch.addEventListener('click', () => { setSelected(null); holes.length = 0; store.set(null); });
    res.appendChild(ch);
  }
  function fire(v, btn) {
    const R = root.getBoundingClientRect(), b = btn.getBoundingClientRect();
    const tx = b.left - R.left + b.width / 2, ty = b.top - R.top + b.height / 2, o = OPTS[v];
    kick = 1; burst(muz.x, muz.y, 10, ['#ffd27a', '#fff'], 220, .2, 'spark', 0);
    tracers.push({ x0: muz.x, y0: muz.y, x1: tx, y1: ty, life: .16 });
    setTimeout(() => {
      if (v === 'bad') {
        burst(tx, ty, 30, ['#ef4444', '#f97316', '#fff'], 340, .7, 'spark');
        holes.push({ x: tx + rnd(-30, 30), y: ty + rnd(-6, 6), r: rnd(3, 4.5), cr: [0, 1, 2, 3, 4].map(() => rnd(0, 6.28)) });
        btn.classList.remove('rt-hit'); void btn.offsetWidth; btn.classList.add('rt-hit');
        if (!reduce) { root.classList.remove('rt-shake'); void root.offsetWidth; root.classList.add('rt-shake'); }
      } else {
        btn.classList.remove('rt-pop'); void btn.offsetWidth; btn.classList.add('rt-pop');
        v === 'excellent' ? burst(tx, ty, 80, ['#22c55e', '#facc15', '#38bdf8', '#f472b6', '#a78bfa'], 380, 1.6, 'conf', 520)
                          : burst(tx, ty, 22, ['#f59e0b', '#fde68a', '#fff'], 220, 1, 'star', 120);
      }
    }, reduce ? 0 : 90);
  }
  function choose(v, btn) { setSelected(v); store.set(v); fire(v, btn); }
  function aim(b) { aimBtn = b; aimV = b.dataset.v; aimT = performance.now(); btns.forEach(x => x.classList.toggle('aim', x === b)); }
  function unaim(b) { if (aimBtn === b) { aimBtn = null; aimV = null; } b.classList.remove('aim'); }

  btns.forEach(b => {
    b.addEventListener('pointerenter', () => aim(b)); b.addEventListener('focus', () => aim(b));
    b.addEventListener('pointerleave', () => unaim(b)); b.addEventListener('blur', () => unaim(b));
    b.addEventListener('click', () => choose(b.dataset.v, b));
  });
  root.addEventListener('pointermove', e => { const r = root.getBoundingClientRect(); ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; ptr.in = true; });
  root.addEventListener('pointerleave', () => { ptr.in = false; });

  // Blink now and then
  (function blink() { eyes.classList.add('blink'); setTimeout(() => eyes.classList.remove('blink'), 120); setTimeout(blink, rnd(2500, 5500)); })();

  const saved = store.get();
  if (saved && OPTS[saved]) setSelected(saved, true);
})();