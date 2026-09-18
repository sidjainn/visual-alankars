// The looks. Each one owns a container in index.html and a draw(f) that paints
// one frame from core.js. Add a look here and an <option> in the sidebar.
window.Looks = (() => {
  const $ = id => document.getElementById(id);
  const pts = P => P.map(p => p.join(',')).join(' ');
  const A = window.Alankar;
  // The topbar floats over the stage (see index.html); looks that draw close to the
  // very top read its live height so nothing renders underneath it.
  const topbarH = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--topbar-h')) || 0;

  // ---------- Original: the app's own look, follows the light / dark theme ----------
  const original = (() => {
    const svg = $('og-stage');
    const MONO = '"Geist Mono", ui-monospace, Menlo, monospace';
    return f => {
      const W = svg.clientWidth, H = svg.clientHeight;
      if (!W || !H) return;
      if (!f) { svg.innerHTML = `<text x="${W / 2}" y="${H / 2}" text-anchor="middle" fill="var(--muted-foreground)" font-size="14">Type an alankar in the sidebar</text>`; return; }
      const narrow = W < 500, topY = 34 + topbarH();
      const L = A.layout(f.phrases, W, H, { padL: narrow ? 48 : 80, padR: narrow ? 20 : 40, padT: (narrow ? 64 : 76) + topbarH(), padB: narrow ? 36 : 56, focus: f.focus });
      const BG = 'var(--background)';
      let out = '';
      // The phrase, current note lit.
      const adv = narrow ? 22 : 28;
      f.ph.forEach((n, i) => {
        const on = i === f.cur.i, c = on ? 'var(--note)' : 'var(--muted-foreground)', x = L.padL + i * adv;
        out += `<text x="${x}" y="${topY}" text-anchor="middle" fill="${c}" font-family='${MONO}' font-weight="${on ? 600 : 500}" font-size="18">${A.latin(n)}</text>` + A.marks(n, x, topY, 18, c);
      });
      // Guide lines. Every Sa is heavier: the gap between two Sa lines is one saptak.
      for (let p = L.vLo; p <= L.vHi; p++) {
        const y = L.yOf(p), sa = L.isSa(p);
        out += `<line x1="${L.padL}" x2="${W - 24}" y1="${y}" y2="${y}" stroke="${sa ? 'var(--muted-foreground)' : 'var(--border)'}" stroke-width="${sa ? 1.5 : 1}" ${sa ? '' : 'stroke-dasharray="2 6"'}/>`;
        out += `<text x="${L.padL - 16}" y="${y + 5}" text-anchor="end" fill="${sa ? 'var(--foreground)' : 'var(--muted-foreground)'}" font-family='${MONO}' font-weight="${sa ? 600 : 400}" font-size="13">${A.degLatin(p)}</text>`;
      }
      for (let g = 0; g < f.cur.p; g++) {
        const q = f.phrases[g], P = L.points(q);
        out += `<polyline points="${pts(P)}" fill="none" stroke="var(--ghost)" stroke-width="2" opacity=".55"/>`;
        P.forEach(([x, y], i) => { out += A.dot(q[i], x, y, 3, 'var(--ghost)', BG); });
      }
      // The next phrase, faint, so the eye knows where the line goes after this one.
      const N = L.points(f.next);
      out += `<polyline points="${pts(N)}" fill="none" stroke="var(--foreground)" stroke-width="1.5" opacity=".1"/>`;
      N.forEach(([x, y], i) => { out += A.dot(f.next[i], x, y, 2.5, 'var(--foreground)', BG, 'opacity=".14"'); });
      const P = L.points(f.ph), up = L.up(f.ph), dy = up ? -16 : 28;
      out += `<polyline points="${pts(P)}" fill="none" stroke="var(--trail)" stroke-width="2" opacity=".18" stroke-dasharray="4 6"/>`;
      if (f.cur.i > 0) out += `<polyline points="${pts(P.slice(0, f.cur.i + 1))}" fill="none" stroke="var(--trail)" stroke-width="3"/>`;
      P.forEach(([x, y], i) => {
        const n = f.ph[i];
        if (i < f.cur.i) out += A.dot(n, x, y, 5, 'var(--trail)', BG) + `<text x="${x}" y="${y + dy}" text-anchor="middle" fill="var(--foreground)" font-size="16">${A.latin(n)}</text>` + A.marks(n, x, y + dy, 16, 'var(--foreground)');
        else if (i > f.cur.i) out += A.dot(n, x, y, 3, 'var(--trail)', BG, 'opacity=".3"');
      });
      const [x, y] = P[f.cur.i], cur = f.ph[f.cur.i], ly = y + (up ? -24 : 38);
      out += `<circle cx="${x}" cy="${y}" r="${12 + 18 * (1 - f.frac)}" fill="var(--note)" opacity="${.3 * (1 - f.frac)}"/>`;
      out += `<circle cx="${x}" cy="${y}" r="9" fill="var(--note)"/>`;
      out += `<text x="${x}" y="${ly}" text-anchor="middle" fill="var(--note)" font-size="30" font-weight="600">${A.latin(cur)}</text>` + A.marks(cur, x, ly, 30, 'var(--note)', 2);
      svg.innerHTML = out;
    };
  })();

  // ---------- Notebook: ruled paper, Devanagari margin, ballpoint and red pencil ----------
  const notebook = (() => {
    const svg = $('nb-stage');
    const INK = '#1d2a6e', RED = '#c9352b', RULE = '#cfc2a3', GRAPHITE = '#6d6353';
    const HAND = 'Kalam, cursive', DEVA = '"Tiro Devanagari Hindi", serif';
    return f => {
      const W = svg.clientWidth, H = svg.clientHeight;
      if (!W || !H) return;
      let out = `<defs><filter id="pen" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="7" result="n"/>
        <feDisplacementMap in="SourceGraphic" in2="n" scale="2.5" xChannelSelector="R" yChannelSelector="G"/></filter></defs>`;
      if (!f) { svg.innerHTML = out; return; }
      const narrow = W < 600, top = topbarH();
      const L = A.layout(f.phrases, W, H, { padL: narrow ? 84 : 120, padR: narrow ? 24 : 48, padT: (narrow ? 150 : 170) + top, padB: 56, maxUnit: narrow ? 60 : 84, focus: f.focus });
      const PAPER = '#efe6d0', margin = L.padL - 30;
      out += `<line x1="${margin}" x2="${margin}" y1="${top}" y2="${H}" stroke="${RED}" stroke-width="1.2" opacity=".5"/>`;
      // Ruled lines. Every Sa is a heavier rule: one saptak between two of them.
      for (let p = L.vLo; p <= L.vHi; p++) {
        const y = L.yOf(p), sa = L.isSa(p);
        out += `<line x1="${margin + 6}" x2="${W - 14}" y1="${y}" y2="${y}" stroke="${sa ? GRAPHITE : RULE}" stroke-width="${sa ? 1.4 : 1}" opacity="${sa ? .7 : 1}"/>`;
        out += `<text x="${margin - 12}" y="${y + 8}" text-anchor="end" fill="${sa ? INK : GRAPHITE}" font-family='${DEVA}' font-size="${narrow ? 20 : 24}">${A.degDeva(p)}</text>`;
      }
      // The phrase, handwritten on the top line. Current swara circled in red.
      const adv = narrow ? 34 : 46, fs = narrow ? 30 : 40, hy = (narrow ? 84 : 96) + top;
      f.ph.forEach((n, i) => {
        const x = L.padL + i * adv, cur = i === f.cur.i, c = cur ? RED : INK;
        out += `<text x="${x}" y="${hy}" text-anchor="middle" fill="${c}" font-family="${HAND}" font-weight="700" font-size="${fs}">${A.latin(n)}</text>` + A.marks(n, x, hy, fs, c, 2);
        if (cur) out += `<ellipse cx="${x}" cy="${hy - fs * .32}" rx="${fs * .55}" ry="${fs * .62}" fill="none" stroke="${RED}" stroke-width="2" transform="rotate(-8 ${x} ${hy - fs * .32})" filter="url(#pen)"/>`;
      });
      out += `<text x="${L.padL}" y="${hy + 28}" fill="${GRAPHITE}" font-family="${HAND}" font-size="16">${f.cur.p + 1} / ${f.phrases.length}</text>`;
      // Earlier phrases, in ink that has already dried. Komal and tivra notes are rings.
      for (let g = 0; g < f.cur.p; g++) {
        const q = f.phrases[g], P = L.points(q);
        out += `<polyline points="${pts(P)}" fill="none" stroke="${INK}" stroke-width="2" opacity=".28" stroke-linejoin="round" filter="url(#pen)"/>`;
        P.forEach(([x, y], i) => { if (q[i].komal || q[i].tivra) out += A.dot(q[i], x, y, 3, INK, PAPER, 'opacity=".4"'); });
      }
      // The next phrase, a light pencil sketch.
      const N = L.points(f.next);
      out += `<polyline points="${pts(N)}" fill="none" stroke="${GRAPHITE}" stroke-width="1.2" opacity=".16" stroke-linejoin="round"/>`;
      N.forEach(([x, y], i) => { if (f.next[i].komal || f.next[i].tivra) out += A.dot(f.next[i], x, y, 2.5, GRAPHITE, PAPER, 'opacity=".3"'); });
      const P = L.points(f.ph), up = L.up(f.ph), dy = up ? -14 : 30;
      out += `<polyline points="${pts(P)}" fill="none" stroke="${GRAPHITE}" stroke-width="1.2" opacity=".35" stroke-dasharray="3 7" filter="url(#pen)"/>`;
      if (f.cur.i > 0) out += `<polyline points="${pts(P.slice(0, f.cur.i + 1))}" fill="none" stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" filter="url(#pen)"/>`;
      f.ph.forEach((n, i) => {
        if (i > f.cur.i) return;
        const [x, y] = P[i], cur = i === f.cur.i, c = cur ? RED : INK, lfs = cur ? 34 : 22;
        out += cur ? `<circle cx="${x}" cy="${y}" r="5" fill="${RED}"/>` : A.dot(n, x, y, 3.5, INK, PAPER);
        out += `<text x="${x}" y="${y + dy}" text-anchor="middle" fill="${c}" font-family="${HAND}" font-weight="${cur ? 700 : 400}" font-size="${lfs}">${A.latin(n)}</text>` + A.marks(n, x, y + dy, lfs, c, cur ? 2 : 1.4);
        if (cur) out += `<ellipse cx="${x}" cy="${y}" rx="${18 + 6 * (1 - f.frac)}" ry="${16 + 5 * (1 - f.frac)}" fill="none" stroke="${RED}" stroke-width="2.2" transform="rotate(-12 ${x} ${y})" filter="url(#pen)" opacity="${.5 + .5 * (1 - f.frac)}"/>`;
      });
      svg.innerHTML = out;
    };
  })();

  // ---------- Glow: black and light, for the Screen blend mode over video ----------
  const glow = (() => {
    const svg = $('gl-stage');
    const WHITE = '#ffffff', WARM = '#ffd7a3', DIM = 'rgba(255,255,255,.22)', FAINT = 'rgba(255,255,255,.08)';
    const DISPLAY = '"Yatra One", serif', COND = '"Big Shoulders Display", sans-serif';
    return f => {
      const W = svg.clientWidth, H = svg.clientHeight;
      if (!W || !H) return;
      let out = `<defs>
        <filter id="glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="6" result="b"/><feFlood flood-color="${WARM}" flood-opacity=".9"/><feComposite in2="b" operator="in" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="bloom" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="18" result="b"/><feFlood flood-color="${WARM}" flood-opacity=".8"/><feComposite in2="b" operator="in" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;
      if (!f) { svg.innerHTML = out; return; }
      const heroY = H * .14, tickY = H * .245;
      const L = A.layout(f.phrases, W, H, { padL: 64, padR: 32, padT: H * .32, padB: H * .06, maxUnit: Math.min(90, W / 8), focus: f.focus });
      // Guide lines. Every Sa is a little brighter: one saptak between two of them.
      for (let p = L.vLo; p <= L.vHi; p++) {
        const y = L.yOf(p), sa = L.isSa(p);
        out += `<line x1="${L.padL}" x2="${W - 20}" y1="${y}" y2="${y}" stroke="${sa ? DIM : FAINT}" stroke-width="${sa ? 1.5 : 1}" ${sa ? '' : 'stroke-dasharray="1 5"'}/>`;
        out += `<text x="${L.padL - 18}" y="${y + 5}" text-anchor="end" fill="${sa ? WHITE : DIM}" font-family='${COND}' font-weight="${sa ? 800 : 500}" font-size="16" letter-spacing="1" ${sa ? 'opacity=".7"' : ''}>${A.degLatin(p)}</text>`;
      }
      const cur = f.ph[f.cur.i];
      out += `<text x="${W / 2}" y="${heroY + H * .05}" text-anchor="middle" fill="${WHITE}" font-family='${DISPLAY}' font-size="${H * .13}" filter="url(#bloom)">${A.deva(cur)}</text>`;
      const adv = Math.min(40, (W - 80) / Math.max(f.ph.length, 1)), x0 = W / 2 - (f.ph.length - 1) * adv / 2;
      f.ph.forEach((n, i) => {
        const on = i === f.cur.i, c = on ? WHITE : DIM, fs = on ? 34 : 26, x = x0 + i * adv, y = tickY + 30;
        out += `<text x="${x}" y="${y}" text-anchor="middle" fill="${c}" font-family='${COND}' font-weight="800" font-size="${fs}" ${on ? 'filter="url(#glow)"' : ''}>${A.latin(n)}</text>` + A.marks(n, x, y, fs, c, 2);
      });
      for (let g = 0; g < f.cur.p; g++) {
        const q = f.phrases[g], P = L.points(q);
        out += `<polyline points="${pts(P)}" fill="none" stroke="${DIM}" stroke-width="1.5" stroke-linejoin="round"/>`;
        P.forEach(([x, y], i) => { if (q[i].komal || q[i].tivra) out += A.dot(q[i], x, y, 3, DIM, '#000'); });
      }
      // The next phrase, barely lit.
      const N = L.points(f.next);
      out += `<polyline points="${pts(N)}" fill="none" stroke="${WHITE}" stroke-width="1.5" opacity=".06"/>`;
      N.forEach(([x, y], i) => { out += A.dot(f.next[i], x, y, 2.5, WHITE, '#000', 'opacity=".12"'); });
      // The light draws the edge: a comet runs toward the next note at tempo.
      const P = L.points(f.ph), m = A.marker(P, f.cur.i, f.frac);
      out += `<polyline points="${pts(P)}" fill="none" stroke="${FAINT}" stroke-width="1.5"/>`;
      out += `<polyline points="${pts(P.slice(0, f.cur.i + 1).concat([m]))}" fill="none" stroke="${WHITE}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" filter="url(#glow)"/>`;
      P.forEach(([x, y], i) => { if (i <= f.cur.i) out += A.dot(f.ph[i], x, y, 4, WHITE, '#000'); });
      const [cx, cy] = P[f.cur.i];
      out += `<circle cx="${cx}" cy="${cy}" r="${10 + 22 * (1 - f.frac)}" fill="${WARM}" opacity="${.35 * (1 - f.frac)}"/>`;
      out += `<circle cx="${m[0]}" cy="${m[1]}" r="7" fill="${WHITE}" filter="url(#bloom)"/>`;
      svg.innerHTML = out;
    };
  })();

  // ---------- Zinc: a shadcn card, follows the light / dark theme ----------
  const zinc = (() => {
    const svg = $('zn-stage');
    const MONO = '"Geist Mono", ui-monospace, monospace';
    return f => {
      const W = svg.clientWidth, H = svg.clientHeight;
      if (!W || !H || !f) { svg.innerHTML = ''; return; }
      $('zn-desc').textContent = `Phrase ${f.cur.p + 1} of ${f.phrases.length}`;
      $('zn-tempo').textContent = `${f.bpm} BPM`;
      $('zn-count').textContent = `${f.cur.p + 1} / ${f.phrases.length}`;
      $('zn-badges').innerHTML = f.ph.map((n, i) => `<span class="badge ${i === f.cur.i ? 'default' : i < f.cur.i ? 'secondary' : 'ghost'}">${A.html(n)}</span>`).join('');
      $('zn-progress').innerHTML = f.phrases.map((_, p) => `<i class="${p < f.cur.p ? 'done' : p === f.cur.p ? 'now' : ''}"></i>`).join('');
      const L = A.layout(f.phrases, W, H, { padL: 56, padR: 28, padT: 36, padB: 36, maxUnit: 80, focus: f.focus });
      const BG = 'var(--background)';
      let out = '';
      // Guide lines. Every Sa is heavier: one saptak between two of them.
      for (let p = L.vLo; p <= L.vHi; p++) {
        const y = L.yOf(p), sa = L.isSa(p);
        out += `<line x1="${L.padL}" x2="${W - 20}" y1="${y}" y2="${y}" stroke="${sa ? 'var(--muted-foreground)' : 'var(--border)'}" stroke-width="${sa ? 1.5 : 1}"/>`;
        out += `<text x="${L.padL - 14}" y="${y + 4}" text-anchor="end" fill="${sa ? 'var(--foreground)' : 'var(--muted-foreground)'}" font-family='${MONO}' font-weight="${sa ? 500 : 400}" font-size="12">${A.degLatin(p)}</text>`;
      }
      for (let g = 0; g < f.cur.p; g++) {
        const q = f.phrases[g], P = L.points(q);
        out += `<polyline points="${pts(P)}" fill="none" stroke="var(--ghost)" stroke-width="1.5" stroke-linejoin="round"/>`;
        P.forEach(([x, y], i) => { if (q[i].komal || q[i].tivra) out += A.dot(q[i], x, y, 3, 'var(--ghost)', BG); });
      }
      // The next phrase, faint.
      const N = L.points(f.next);
      out += `<polyline points="${pts(N)}" fill="none" stroke="var(--foreground)" stroke-width="1.5" opacity=".1"/>`;
      N.forEach(([x, y], i) => { out += A.dot(f.next[i], x, y, 2.5, 'var(--foreground)', BG, 'opacity=".14"'); });
      const P = L.points(f.ph), up = L.up(f.ph), dy = up ? -12 : 22;
      out += `<polyline points="${pts(P)}" fill="none" stroke="var(--ghost)" stroke-width="1.5" stroke-dasharray="4 4"/>`;
      if (f.cur.i > 0) out += `<polyline points="${pts(P.slice(0, f.cur.i + 1))}" fill="none" stroke="var(--foreground)" stroke-width="2" stroke-linejoin="round"/>`;
      P.forEach(([x, y], i) => {
        const n = f.ph[i];
        if (i < f.cur.i) out += A.dot(n, x, y, 3.5, 'var(--foreground)', BG) + `<text x="${x}" y="${y + dy}" text-anchor="middle" fill="var(--muted-foreground)" font-family='${MONO}' font-size="12">${A.latin(n)}</text>` + A.marks(n, x, y + dy, 12, 'var(--muted-foreground)', 1);
        else if (i > f.cur.i) out += `<circle cx="${x}" cy="${y}" r="3" fill="${BG}" stroke="var(--ghost)" stroke-width="1.5"/>`;
      });
      const [x, y] = P[f.cur.i], cur = f.ph[f.cur.i], ly = y + (up ? -18 : 30);
      // A focus ring with an offset, the way a focused shadcn control looks.
      out += `<circle cx="${x}" cy="${y}" r="${9 + 3 * (1 - f.frac)}" fill="none" stroke="var(--foreground)" stroke-width="2" opacity="${.35 + .65 * (1 - f.frac)}"/>`;
      out += `<circle cx="${x}" cy="${y}" r="5" fill="var(--foreground)" stroke="${BG}" stroke-width="2"/>`;
      out += `<text x="${x}" y="${ly}" text-anchor="middle" fill="var(--foreground)" font-family='${MONO}' font-weight="500" font-size="16">${A.latin(cur)}</text>` + A.marks(cur, x, ly, 16, 'var(--foreground)');
      svg.innerHTML = out;
    };
  })();

  // ---------- Reel: a 9:16 frame with the top half empty for the singer, keyed background ----------
  const reel = (() => {
    const svg = $('rl-stage'), frame = $('rl-frame');
    const hex = c => c.match(/\w\w/g).map(h => parseInt(h, 16));
    const mix = (a, b, t) => '#' + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * t).toString(16).padStart(2, '0')).join('');
    // Backgrounds. The first four are for compositing: green and magenta to
    // key out, black for Screen blend, white to multiply. The rest are real
    // backgrounds for a reel with the video in the top half. Each one names
    // its ink (lines, labels), accent (the note being sung) and hot (comet and
    // current label). Hills, the earlier phrases, run from far (oldest) to
    // near (just sung); soft palettes draw their hill outlines lighter.
    const PALETTES = {
      green:      { name: 'Green key',   bg: '#00ff00', ink: '#1b1b3a', accent: '#ffcc4d', hot: '#ff5a4e', far: '#d6d3ea', near: '#7c6cff', fill: '#ffb8b2' },
      magenta:    { name: 'Magenta key', bg: '#ff00ff', ink: '#1b1b3a', accent: '#ffcc4d', hot: '#ff5a4e', far: '#d6d3ea', near: '#7c6cff', fill: '#ffd9a8' },
      black:      { name: 'Black',       bg: '#000000', ink: '#ffffff', accent: '#ffcc4d', hot: '#ff5a4e', far: '#3a3a48', near: '#7c6cff', fill: '#6b3f3b' },
      white:      { name: 'White',       bg: '#ffffff', ink: '#1b1b3a', accent: '#ffcc4d', hot: '#ff5a4e', far: '#e6e4f2', near: '#7c6cff', fill: '#ffb8b2' },
      terracotta: { name: 'Terracotta',  bg: '#c4603d', ink: '#26140e', accent: '#f6d79c', hot: '#fff3df', far: '#cf7d5d', near: '#f1b993', soft: true },
      saffron:    { name: 'Saffron',     bg: '#e29a2e', ink: '#3a2208', accent: '#fff2cf', hot: '#9e2619', far: '#e8ad52', near: '#f7d693', soft: true },
      sand:       { name: 'Sand',        bg: '#ebdfc7', ink: '#2a241f', accent: '#e0603f', hot: '#9a2a1c', far: '#dccbb0', near: '#bda58a', soft: true },
      olive:      { name: 'Olive',       bg: '#5b6939', ink: '#f3efe0', accent: '#f1c95e', hot: '#fff1bb', far: '#6f7d49', near: '#9aa86a', soft: true },
      plum:       { name: 'Plum',        bg: '#4a2237', ink: '#f7e7ec', accent: '#f3b19b', hot: '#ffd66c', far: '#5e3049', near: '#8c5477', soft: true },
      espresso:   { name: 'Espresso',    bg: '#2a1a13', ink: '#f2e5d2', accent: '#e6914f', hot: '#ffd8a4', far: '#3e2a20', near: '#6b4a38', soft: true },
      navy:       { name: 'Ink',         bg: '#1e2340', ink: '#f2ebdc', accent: '#efb13f', hot: '#ffefc2', far: '#2c3356', near: '#4a5583', soft: true },
    };
    let P0 = PALETTES.green, INK = P0.ink, KEY = P0.bg;
    const draw = f => {
      const W = svg.clientWidth, H = svg.clientHeight;
      if (!W || !H || !f) { svg.innerHTML = ''; return; }
      const cur = f.ph[f.cur.i];
      $('rl-ticker').innerHTML = f.ph.map((n, i) => i === f.cur.i ? `<b>${A.html(n)}</b>` : A.html(n)).join(' ');
      const L = A.layout(f.phrases, W, H, { padL: 44, padR: 20, padT: 30, padB: 26, maxUnit: W / 9, minRow: 26, focus: f.focus });
      let out = '';
      // Row names. Every Sa gets a short heavy rule: one saptak between two of them.
      for (let p = L.vLo; p <= L.vHi; p++) {
        const y = L.yOf(p), sa = L.isSa(p);
        if (sa) out += `<line x1="${L.padL - 6}" x2="${W - 12}" y1="${y}" y2="${y}" stroke="${INK}" stroke-width="1.5" opacity=".35"/>`;
        out += `<text x="${L.padL - 12}" y="${y + 4}" text-anchor="end" fill="${INK}" opacity="${sa ? .9 : .55}" font-family="Baloo 2" font-weight="800" font-size="12">${A.degLatin(p)}</text>`;
      }
      // Earlier phrases become solid layers behind the current one, like hills.
      // Solid colours only, so a chroma key has clean edges.
      const P = L.points(f.ph);
      out += `<polygon points="${pts(P)}" fill="${P0.fill ?? mix(KEY, P0.accent, .5)}"/>`;
      for (let g = f.cur.p - 1; g >= 0; g--) {
        const age = f.cur.p > 1 ? g / (f.cur.p - 1) : 1;
        out += `<polygon points="${pts(L.points(f.phrases[g]))}" fill="${mix(P0.far, P0.near, age)}" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round" ${P0.soft ? 'stroke-opacity=".5"' : ''}/>`;
      }
      // The next phrase as a solid tint of the background, so it still keys cleanly.
      const N = L.points(f.next), TINT = mix(KEY, INK, .28);
      out += `<polyline points="${pts(N)}" fill="none" stroke="${TINT}" stroke-width="2" stroke-linejoin="round"/>`;
      N.forEach(([x, y], i) => { if (f.next[i].komal || f.next[i].tivra) out += A.dot(f.next[i], x, y, 3, TINT, KEY); });
      const m = A.marker(P, f.cur.i, f.frac), up = L.up(f.ph);
      out += `<polyline points="${pts(P)}" fill="none" stroke="${INK}" stroke-width="2" stroke-dasharray="2 6" stroke-linecap="round"/>`;
      out += `<polyline points="${pts(P.slice(0, f.cur.i + 1).concat([m]))}" fill="none" stroke="${INK}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>`;
      P.forEach(([x, y], i) => {
        if (i >= f.cur.i) return;
        const n = f.ph[i], ly = y + (up ? -12 : 22);
        out += A.dot(n, x, y, 5, INK, KEY) + `<text x="${x}" y="${ly}" text-anchor="middle" fill="${INK}" font-family="Baloo 2" font-weight="800" font-size="14">${A.latin(n)}</text>` + A.marks(n, x, ly, 14, INK, 1.5);
      });
      const [x, y] = P[f.cur.i], ly = y + (up ? -22 : 34);
      out += `<circle cx="${x}" cy="${y}" r="${12 + 10 * (1 - f.frac)}" fill="${P0.accent}" stroke="${INK}" stroke-width="3"/>`;
      out += `<circle cx="${m[0]}" cy="${m[1]}" r="6" fill="${P0.hot}" stroke="${INK}" stroke-width="2"/>`;
      out += `<text x="${x}" y="${ly}" text-anchor="middle" fill="${P0.hot}" stroke="${INK}" stroke-width=".6" font-family="Baloo 2" font-weight="800" font-size="26">${A.latin(cur)}</text>` + A.marks(cur, x, ly, 26, P0.hot, 2.5);
      svg.innerHTML = out;
    };
    draw.palettes = PALETTES;
    draw.setPalette = name => {
      P0 = PALETTES[name] ?? PALETTES.green;
      KEY = P0.bg; INK = P0.ink;
      frame.style.setProperty('--key', KEY);
      frame.style.setProperty('--ink', INK);
      frame.style.setProperty('--hot', P0.hot);
    };
    return draw;
  })();

  return { original, notebook, glow, zinc, reel };
})();
