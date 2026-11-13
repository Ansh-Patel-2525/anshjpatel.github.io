/* terminal.js — Ansh Patel's website terminal
   Drop next to index.html and add <script src="terminal.js"></script> before </body>.
   It injects its own nav button, styles and UI, and reads widgets.html at runtime,
   so any card you add there appears here automatically. */
(() => {
  const WIDGETS_URL = 'widgets.html';
  // Only used if widgets.html can't be fetched (e.g. opening files via file://)
  const FALLBACK = [
    ['tictactoe.html','Tic Tac Toe','games','⭕'],['blackjack.html','Blackjack','games','🃏'],
    ['guess.html','Number Guessing','games','🎲'],['snake.html','Snake','games','🐍'],
    ['tetris.html','Tetris','games','🧱'],['shooter.html','Space Shooter','games','🚀'],
    ['chess.html','Chess','games','♟️'],['mindi.html','Mindi Solo','games','🃏'],
    ['mindih.html','Mindi Multiplayer','games','♠️'],['voidracer.html','Void Racer','games','🔺'],
    ['metromayhem.html','Metro Mayhem','games','🚗'],['skyglide.html','Skyfury','games','🪂'],
    ['calculator.html','Calculator','tools','🔢'],['random.html','Random Generator','tools','🔀'],
    ['frognumbers.html','Frog Numbers','tools','🐸'],['timer.html','Timer','tools','⏱️'],
    ['bitcoinminer.html','Bitcoin Miner','tools','₿'],['coinflip.html','Coin Flip','tools','🪙'],
    ['encryptor.html','Encryptor / Decryptor','tools','🔐'],['plotter.html','Plotter','tools','📊'],
    ['qrcode.html','QR Code Studio','tools','📱'],['dice.html','Dice Roller','tools','🎲']
  ].map(([href, name, cat, icon]) => ({ href, name, cat, icon, desc: '', slug: href.replace(/\.html$/, '') }));

  const THEMES = { white: '#f2f2f2', green: '#4ade80', amber: '#fbbf24', cyan: '#22d3ee', purple: '#c084fc' };
  const PS = 'C:\\Users\\Guest>';
  const store = {
    get(k, d) { try { return localStorage.getItem(k) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} }
  };

  /* ---------- Styles ---------- */
  const css = document.createElement('style');
  css.textContent = `
  .tm-overlay{position:fixed;inset:0;z-index:2000;display:none;align-items:center;justify-content:center;padding:12px;background:rgba(0,0,0,.5)}
  .tm-overlay.open{display:flex;animation:tmIn .15s ease-out}
  .tm-overlay.max{padding:0}
  @keyframes tmIn{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:none}}
  .tm-win{--fg:#f2f2f2;position:relative;display:flex;flex-direction:column;width:min(900px,100%);height:min(600px,88vh);overflow:hidden;border:1px solid #4a4a4a;border-radius:8px;background:#000;box-shadow:0 24px 70px rgba(0,0,0,.75);font:14px/1.5 Consolas,"Cascadia Mono","Lucida Console",ui-monospace,Menlo,monospace;color:var(--fg)}
  .tm-win.max{width:100%;height:100%;border:0;border-radius:0;transform:none!important}
  .tm-bar{display:flex;align-items:stretch;height:38px;background:#1f1f1f;user-select:none;touch-action:none}
  .tm-app{display:flex;align-items:center;gap:8px;margin:6px 0 0 8px;padding:0 14px;border-top:2px solid #60cdff;border-radius:8px 8px 0 0;background:#000;color:#fff;font:12px "Segoe UI",system-ui,sans-serif}
  .tm-app i{color:#60cdff;font:700 11px Consolas,monospace;font-style:normal}
  .tm-drag{flex:1}
  .tm-ctl{width:46px;border:0;background:transparent;color:#fff;font:14px "Segoe UI Symbol","Segoe UI",sans-serif;cursor:default}
  .tm-ctl:hover{background:rgba(255,255,255,.1)}
  .tm-ctl.x:hover{background:#c42b1c}
  .tm-body{flex:1;overflow-y:auto;padding:10px 14px;cursor:text;scrollbar-width:thin;scrollbar-color:#555 #000}
  .tm-line{white-space:pre-wrap;overflow-wrap:anywhere;min-height:1.5em}
  .tm-dim{opacity:.6}.tm-err{color:#f87171}.tm-hi{color:#fff;font-weight:700}
  .tm-link{cursor:pointer;text-decoration:underline;text-decoration-style:dotted;text-underline-offset:3px;color:#60cdff}
  .tm-link:hover,.tm-link:focus-visible{background:#60cdff;color:#000;outline:none}
  .tm-prompt{display:flex;gap:8px;align-items:center}
  .tm-ps{white-space:nowrap}
  .tm-input{flex:1;min-width:0;border:0;outline:0;background:transparent;color:#fff;font:inherit;caret-color:#fff}
  .tm-matrix{position:absolute;inset:38px 0 0;width:100%;height:calc(100% - 38px);z-index:5;background:#000}
  @media(max-width:600px){.tm-overlay{padding:0}.tm-win{width:100%;height:100%;border-radius:0;border:0;font-size:12.5px}}
  @media(prefers-reduced-motion:reduce){.tm-overlay.open{animation:none}}`;
  document.head.appendChild(css);

  /* ---------- DOM ---------- */
  const overlay = document.createElement('div');
  overlay.className = 'tm-overlay';
  overlay.innerHTML = `
    <div class="tm-win" role="dialog" aria-modal="true" aria-label="Terminal">
      <div class="tm-bar">
        <span class="tm-app"><i>&gt;_</i>Ansh Patel Terminal</span>
        <span class="tm-drag"></span>
        <button class="tm-ctl min" type="button" aria-label="Minimise (close)">&#8212;</button>
        <button class="tm-ctl max" type="button" aria-label="Maximise">&#9744;</button>
        <button class="tm-ctl x" type="button" aria-label="Close terminal">&#10005;</button>
      </div>
      <div class="tm-body" id="tmBody">
        <div id="tmOut"></div>
        <label class="tm-prompt"><span class="tm-ps">C:\\Users\\Guest&gt;</span>
          <input class="tm-input" id="tmIn" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Terminal input"></label>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  const win = overlay.querySelector('.tm-win'), body = overlay.querySelector('#tmBody');
  const out = overlay.querySelector('#tmOut'), input = overlay.querySelector('#tmIn');

  // Nav button (injected, so index.html needs no markup change)
  const navUl = document.querySelector('nav ul');
  const openers = [];
  if (navUl) {
    const li = document.createElement('li');
    li.innerHTML = '<a href="#terminal" role="button" aria-label="Open terminal">Terminal ⌨️</a>';
    navUl.insertBefore(li, navUl.firstChild);
    openers.push(li.firstChild);
  }
  openers.push(...document.querySelectorAll('[data-terminal]'));
  openers.forEach(a => a.addEventListener('click', e => { e.preventDefault(); open(); }));

  /* ---------- Output helpers ---------- */
  const scroll = () => { body.scrollTop = body.scrollHeight; };
  function line(text = '', cls = '') {
    const d = document.createElement('div');
    d.className = 'tm-line ' + cls; d.textContent = text; out.appendChild(d); scroll(); return d;
  }
  function addLink(parent, text, fn) {
    const s = document.createElement('span');
    s.className = 'tm-link'; s.textContent = text; s.tabIndex = 0; s.setAttribute('role', 'button');
    s.addEventListener('click', e => { e.stopPropagation(); fn(); });
    s.addEventListener('keydown', e => { if (e.key === 'Enter') fn(); });
    parent.appendChild(s); return s;
  }
  function row(parts) { // parts: strings or [text, fn]
    const d = line();
    parts.forEach(p => {
      if (Array.isArray(p)) addLink(d, p[0], p[1]);
      else d.appendChild(document.createTextNode(p));
    });
    return d;
  }
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  /* ---------- Widget discovery ---------- */
  let widgets = [], usedFallback = false;
  const ready = (async () => {
    try {
      const res = await fetch(WIDGETS_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error(res.status);
      const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
      doc.querySelectorAll('.widget-section').forEach(sec => {
        const cat = sec.dataset.category || 'misc';
        sec.querySelectorAll('a.widget-link-card').forEach(a => {
          const href = a.getAttribute('href');
          widgets.push({
            href, cat,
            slug: href.replace(/\.html$/, '').replace(/^.*\//, ''),
            name: (a.querySelector('h3')?.textContent || href).trim(),
            desc: (a.querySelector('p')?.textContent || '').trim().replace(/\s+/g, ' '),
            icon: (a.querySelector('.widget-icon')?.textContent || '•').trim()
          });
        });
      });
      if (!widgets.length) throw new Error('empty');
    } catch {
      widgets = FALLBACK.slice(); usedFallback = true;
    }
  })();

  const categories = () => [...new Set(widgets.map(w => w.cat))];
  function find(q) {
    q = (q || '').trim().toLowerCase(); if (!q) return null;
    if (/^\d+$/.test(q)) return widgets[+q - 1] || null;
    return widgets.find(w => w.slug === q || w.name.toLowerCase() === q)
      || widgets.find(w => w.slug.startsWith(q) || w.name.toLowerCase().startsWith(q))
      || widgets.find(w => (w.name + ' ' + w.slug + ' ' + w.desc).toLowerCase().includes(q)) || null;
  }
  function go(w) {
    line(`→ launching ${w.name}...`, 'tm-hi');
    setTimeout(() => { location.href = w.href; }, 450);
  }
  function widgetRow(w) {
    const i = widgets.indexOf(w) + 1;
    row([String(i).padStart(2, ' ') + '  ' + w.icon + '  ', [w.slug.padEnd(16, ' '), () => go(w)], ' ' + w.name + (w.desc ? ' — ' + w.desc : '')]);
  }

  /* ---------- Commands ---------- */
  const startTime = Date.now();
  const cmds = {
    help: ['show this list', () => {
      line('Available commands:', 'tm-hi');
      Object.entries(cmds).filter(([, c]) => !c[2]).forEach(([n, c]) => line('  ' + n.padEnd(14) + c[0]));
      line('Tips: Tab autocompletes · ↑/↓ history · click any name to open it · Esc closes', 'tm-dim');
    }],
    ls: ['list widgets (ls games | ls tools | ls <category>)', args => {
      const f = (args[0] || '').toLowerCase();
      const cats = f ? categories().filter(c => c.startsWith(f)) : categories();
      if (!cats.length) return line(`ls: no category '${f}'. Try: ${categories().join(', ')}`, 'tm-err');
      cats.forEach(c => {
        const list = widgets.filter(w => w.cat === c);
        line(`── ${c} (${list.length}) ──`, 'tm-hi'); list.forEach(widgetRow); line();
      });
      line('Run "open <name or number>" to launch one.', 'tm-dim');
    }],
    open: ['launch a widget by name or number', args => {
      const w = find(args.join(' '));
      if (!args.length) return line('usage: open <name|number>   (see "ls")', 'tm-err');
      w ? go(w) : line(`open: nothing matches '${args.join(' ')}'. Try "search ${args[0]}".`, 'tm-err');
    }],
    search: ['search widgets by keyword', args => {
      const q = args.join(' ').toLowerCase();
      if (!q) return line('usage: search <keyword>', 'tm-err');
      const hits = widgets.filter(w => (w.name + ' ' + w.slug + ' ' + w.desc + ' ' + w.cat).toLowerCase().includes(q));
      hits.length ? hits.forEach(widgetRow) : line(`No widgets match '${q}'.`, 'tm-err');
    }],
    info: ['details about a widget', args => {
      const w = find(args.join(' '));
      if (!w) return line('usage: info <name|number>', 'tm-err');
      line(`${w.icon}  ${w.name}`, 'tm-hi'); line(`category : ${w.cat}`); line(`file     : ${w.href}`);
      if (w.desc) line(`about    : ${w.desc}`);
      row(['         ', ['[ launch ]', () => go(w)]]);
    }],
    random: ['open a random widget (or "random games")', args => {
      const pool = args[0] ? widgets.filter(w => w.cat.startsWith(args[0].toLowerCase())) : widgets;
      if (!pool.length) return line('random: empty pool', 'tm-err');
      go(pool[Math.floor(Math.random() * pool.length)]);
    }],
    home: ['go to the widgets hub', () => { line('→ opening widgets hub...', 'tm-hi'); setTimeout(() => { location.href = WIDGETS_URL; }, 350); }],
    about: ['who made this', () => {
      const sub = document.querySelector('.subtitle')?.textContent || 'Graduate Actuarial Analyst';
      line('Ansh Patel', 'tm-hi'); line(sub); line('Builds games, tools and other little experiments for the web.');
    }],
    contact: ['links from the homepage', () => {
      const links = [...document.querySelectorAll('.contact-links a')];
      if (!links.length) return line('No contact links found.', 'tm-dim');
      links.forEach(a => row([a.querySelector('.cl-text small')?.textContent.replace('↗', '').trim().padEnd(10) || '', [a.querySelector('.cl-text')?.textContent.replace(/^\S+\s*/, '').trim() || a.href, () => window.open(a.href, a.target || '_self')]]));
    }],
    neofetch: ['system info, website edition', () => {
      const g = widgets.filter(w => w.cat === 'games').length, t = widgets.filter(w => w.cat === 'tools').length;
      const art = ['   ___    ____ ', '  / _ \\  / __ \\', ' / ___ \\/ /_/ /', '/_/  |_/ .___/ ', '      /_/      '];
      const info = ['ansh@website', '------------', `Widgets : ${widgets.length} (${g} games, ${t} tools)`, `Theme   : ${store.get('tm-theme', 'white')}`, `Session : ${Math.round((Date.now() - startTime) / 1000)}s`, `Screen  : ${innerWidth}x${innerHeight}`];
      for (let i = 0; i < Math.max(art.length, info.length); i++) line((art[i] || ' '.repeat(15)) + '   ' + (info[i] || ''), i < 2 ? 'tm-hi' : '');
    }],
    theme: ['change text colour: theme white|green|amber|cyan|purple', args => {
      const t = (args[0] || '').toLowerCase();
      if (!THEMES[t]) return line('usage: theme ' + Object.keys(THEMES).join('|'), 'tm-err');
      applyTheme(t); store.set('tm-theme', t); line('Theme set to ' + t + '.');
    }],
    calc: ['evaluate maths, e.g. calc (2+3)*4^2', args => {
      const ex = args.join(' ').replace(/\^/g, '**');
      if (!ex || !/^[0-9+\-*/().%\s]+$/.test(ex)) return line('usage: calc <expression>  (numbers and + - * / % ^ ( ) only)', 'tm-err');
      try { const v = Function('"use strict";return (' + ex + ')')(); line('= ' + (Number.isFinite(v) ? +v.toPrecision(12) : 'undefined')); }
      catch { line('calc: invalid expression', 'tm-err'); }
    }],
    roll: ['roll dice, e.g. roll 2d6', args => {
      const m = /^(\d*)d(\d+)$/i.exec(args[0] || '1d6');
      if (!m) return line('usage: roll <N>d<sides>', 'tm-err');
      const n = Math.min(+m[1] || 1, 50), s = Math.max(+m[2], 2);
      const r = Array.from({ length: n }, () => 1 + Math.floor(Math.random() * s));
      line(`🎲 ${r.join(' + ')}${n > 1 ? ' = ' + r.reduce((a, b) => a + b) : ''}`);
    }],
    flip: ['flip a coin', () => line('🪙 ' + (Math.random() < .5 ? 'Heads' : 'Tails'))],
    date: ['current date and time', () => line(new Date().toString())],
    echo: ['print text', args => line(args.join(' '))],
    history: ['previous commands', () => hist.forEach((h, i) => line(String(i + 1).padStart(3) + '  ' + h))],
    clear: ['clear the screen', () => { out.textContent = ''; }],
    exit: ['close the terminal', () => close()],
    matrix: ['you know what this does', () => matrix(), true],
    cowsay: ['moo', args => {
      const t = args.join(' ') || 'Check out my widgets!';
      line(' ' + '_'.repeat(t.length + 2)); line(`< ${t} >`); line(' ' + '-'.repeat(t.length + 2));
      ['        \\   ^__^', '         \\  (oo)\\_______', '            (__)\\       )\\/\\', '                ||----w |', '                ||     ||'].forEach(l => line(l));
    }, true],
    sudo: ['', () => line('ansh is not in the sudoers file. This incident will be reported. 👀', 'tm-err'), true],
    secret: ['', () => line('Psst... the "AP" logo in the top-left corner is more than decoration. 🤫', 'tm-hi'), true],
    whoami: ['', () => line('a curious visitor'), true]
  };
  cmds.games = ['shortcut for "ls games"', () => cmds.ls[1](['games'])];
  cmds.tools = ['shortcut for "ls tools"', () => cmds.ls[1](['tools'])];
  cmds.run = ['', args => cmds.open[1](args), true];
  cmds.cd = ['', args => (args[0] === 'widgets' ? cmds.home[1]() : cmds.open[1](args)), true];
  cmds.dir = ['', a => cmds.ls[1](a), true];
  cmds.cls = ['', () => cmds.clear[1](), true];
  cmds.quit = ['', () => close(), true];
  cmds.guide = ['beginner guide: how to use this terminal', () => welcome()];
  cmds.ver = ['', () => line('Ansh Patel Terminal [Version 1.0]'), true];

  async function run(raw) {
    const text = raw.trim();
    line(PS + ' ' + text, 'tm-dim');
    if (!text) return;
    hist.push(text); hIdx = hist.length;
    try { sessionStorage.setItem('tm-hist', JSON.stringify(hist.slice(-50))); } catch {}
    const [name, ...args] = text.split(/\s+/);
    await ready;
    const c = cmds[name.toLowerCase()];
    if (c) { try { await c[1](args); } catch (e) { line(name + ': ' + e.message, 'tm-err'); } return; }
    // Typing just a widget name opens it
    const w = find(text);
    if (w && text.length > 2) return go(w);
    const lev = (a, b) => { const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]); for (let j = 1; j <= b.length; j++) d[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; };
    line(`'${name}' is not recognized as a command.`, 'tm-err');
    const best = Object.keys(cmds).filter(c => !cmds[c][2]).map(c => [c, lev(name.toLowerCase(), c)]).sort((x, y) => x[1] - y[1])[0];
    if (best && best[1] <= 2) row(['Did you mean ', [best[0], () => { input.focus(); run(best[0]); }], '?']);
    else row(['Not sure where to start? Try ', ['help', () => { input.focus(); run('help'); }], '.']);
  }

  /* ---------- Matrix easter egg ---------- */
  function matrix() {
    const cv = document.createElement('canvas'); cv.className = 'tm-matrix';
    win.appendChild(cv);
    cv.width = win.clientWidth; cv.height = win.clientHeight - 38;
    const cx = cv.getContext('2d'), size = 15, cols = Math.floor(cv.width / size);
    const drops = Array(cols).fill(0).map(() => Math.random() * -20);
    const chars = 'アイウエオカキクケコサシスセソ0123456789ABCDEF';
    const fg = getComputedStyle(win).getPropertyValue('--fg');
    let alive = true;
    const stop = () => { alive = false; cv.remove(); document.removeEventListener('keydown', stop, true); input.focus(); };
    const loop = () => {
      if (!alive) return;
      cx.fillStyle = 'rgba(0,0,0,.08)'; cx.fillRect(0, 0, cv.width, cv.height);
      cx.fillStyle = fg; cx.font = size + 'px monospace';
      drops.forEach((y, i) => {
        cx.fillText(chars[Math.floor(Math.random() * chars.length)], i * size, y * size);
        drops[i] = y * size > cv.height && Math.random() > .975 ? 0 : y + 1;
      });
      requestAnimationFrame(loop);
    };
    loop(); cv.addEventListener('click', stop);
    document.addEventListener('keydown', stop, true); setTimeout(stop, 8000);
  }

  /* ---------- State, input, open/close ---------- */
  let hist = [], hIdx = 0, booted = false;
  try { hist = JSON.parse(sessionStorage.getItem('tm-hist') || '[]'); } catch {}
  hIdx = hist.length;

  function applyTheme(t) {
    win.style.setProperty('--fg', THEMES[t] || THEMES.white);
  }
  applyTheme(store.get('tm-theme', 'white'));

  async function welcome() {
    await ready;
    const hint = (cmd, desc) => row(['  ', [cmd, () => { input.focus(); run(cmd); }], ' '.repeat(Math.max(2, 16 - cmd.length)) + desc]);
    line('New to terminals? No problem. Here is all you need to know:', 'tm-hi');
    line('  1. Type a command and press Enter (or just click the blue ones).');
    line('  2. Tab autocompletes, ↑ repeats your last command.');
    line('  3. You cannot break anything, so try things out!');
    line();
    line('Good first commands:', 'tm-hi');
    hint('help', 'see every command');
    hint('ls', 'list all games and tools');
    hint('open snake', 'launch a widget by name or number');
    hint('random', 'surprise me with a random widget');
    hint('search chess', 'find widgets by keyword');
    hint('theme green', 'change the text colour');
    hint('guide', 'show this guide again');
    line();
  }
  async function boot() {
    booted = true;
    line('Ansh Patel Terminal [Version 1.0]', 'tm-hi');
    line('(c) Ansh Patel. Press Esc or click ✕ to close.', 'tm-dim');
    await ready;
    const sub = usedFallback ? ' (built-in list: widgets.html could not be read; use a web server for live updates)' : ' (auto-detected from widgets.html)';
    line(`Loaded ${widgets.length} widgets${sub}`, usedFallback ? 'tm-err' : 'tm-dim');
    line();
    await welcome();
  }

  function open() {
    overlay.classList.add('open'); document.body.style.overflow = 'hidden';
    if (!booted) boot();
    setTimeout(() => input.focus(), 30);
  }
  function close() { overlay.classList.remove('open'); document.body.style.overflow = ''; }

  function complete() {
    const v = input.value, parts = v.split(/\s+/);
    if (parts.length === 1) {
      const m = Object.keys(cmds).filter(c => !cmds[c][2] && c.startsWith(v.toLowerCase()));
      if (m.length === 1) input.value = m[0] + ' ';
      else if (m.length > 1) line(m.join('   '), 'tm-dim');
    } else {
      const p = parts[parts.length - 1].toLowerCase();
      const pool = ['games', 'tools', ...categories(), ...widgets.map(w => w.slug)];
      const m = [...new Set(pool)].filter(s => s.startsWith(p));
      if (m.length === 1) { parts[parts.length - 1] = m[0]; input.value = parts.join(' '); }
      else if (m.length > 1) line(m.join('   '), 'tm-dim');
    }
  }

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { const v = input.value; input.value = ''; run(v); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (hIdx > 0) input.value = hist[--hIdx]; }
    else if (e.key === 'ArrowDown') { e.preventDefault(); input.value = hIdx < hist.length - 1 ? hist[++hIdx] : ((hIdx = hist.length), ''); }
    else if (e.key === 'Tab') { e.preventDefault(); ready.then(complete); }
    else if (e.ctrlKey && e.key.toLowerCase() === 'l') { e.preventDefault(); out.textContent = ''; }
    else if (e.ctrlKey && e.key.toLowerCase() === 'c') { line('^C', 'tm-dim'); input.value = ''; }
  });
  body.addEventListener('click', () => { if (!getSelection().toString()) input.focus(); });
  overlay.addEventListener('mousedown', e => { if (e.target === overlay) close(); });
  const bar = overlay.querySelector('.tm-bar');
  const toggleMax = () => { const m = win.classList.toggle('max'); overlay.classList.toggle('max', m); input.focus(); };
  overlay.querySelector('.tm-ctl.x').addEventListener('click', close);
  overlay.querySelector('.tm-ctl.min').addEventListener('click', close);
  overlay.querySelector('.tm-ctl.max').addEventListener('click', toggleMax);
  bar.addEventListener('dblclick', e => { if (!e.target.closest('.tm-ctl')) toggleMax(); });
  let ox = 0, oy = 0; // drag the window by its title bar (desktop)
  bar.addEventListener('pointerdown', e => {
    if (e.target.closest('.tm-ctl') || win.classList.contains('max') || innerWidth < 600) return;
    const sx = e.clientX - ox, sy = e.clientY - oy;
    const mv = ev => { ox = ev.clientX - sx; oy = ev.clientY - sy; win.style.transform = `translate(${ox}px,${oy}px)`; };
    const up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); };
    addEventListener('pointermove', mv); addEventListener('pointerup', up);
  });

  document.addEventListener('keydown', e => {
    const isOpen = overlay.classList.contains('open');
    if (e.key === 'Escape' && isOpen) close();
    else if (e.key === '`' && !isOpen && !/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) && !e.target.isContentEditable) { e.preventDefault(); open(); }
  });
  if (location.hash === '#terminal') open();
})();