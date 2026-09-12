// The looks. Each one owns a container in index.html and a draw(f) that paints
// one frame from core.js. Add a look here and an <option> in the sidebar.
window.Looks = (() => {
  const $ = id => document.getElementById(id);
  const pts = P => P.map(p => p.join(',')).join(' ');
  const A = window.Alankar;

  // ---------- Original: the app's own look, follows the light / dark theme ----------
  const original = (() => {
    const svg = $('og-stage');
    const MONO = '"Geist Mono", ui-monospace, Menlo, monospace';
    return f => {
      const W = svg.clientWidth, H = svg.clientHeight;
      if (!W || !H) return;
      if (!f) { svg.innerHTML = `<text x="${W / 2}" y="${H / 2}" text-anchor="middle" fill="var(--muted-foreground)" font-size="14">Type an alankar in the sidebar</text>`; return; }
      const narrow = W < 500;
      const L = A.layout(f.phrases, W, H, { padL: narrow ? 48 : 80, padR: narrow ? 20 : 40, padT: narrow ? 64 : 76, padB: narrow ? 36 : 56 });
      let out = '';
      // The phrase, current note lit.
      const adv = narrow ? 22 : 28;
      f.ph.forEach((n, i) => {
        const on = i === f.cur.i;
        out += `<text x="${L.padL + i * adv}" y="34" text-anchor="middle" fill="${on ? 'var(--note)' : 'var(--muted-foreground)'}" font-family='${MONO}' font-weight="${on ? 600 : 500}" font-size="18">${A.latin(n)}</text>`;
      });
      for (let p = L.lo; p <= L.hi; p++) {
        const y = L.yOf(p);
        out += `<line x1="${L.padL}" x2="${W - 24}" y1="${y}" y2="${y}" stroke="var(--border)" stroke-dasharray="2 6"/>`;
        out += `<text x="${L.padL - 16}" y="${y + 5}" text-anchor="end" fill="var(--muted-foreground)" font-family='${MONO}' font-size="13">${A.degLatin(p)}</text>`;
      }
      for (let g = 0; g < f.cur.p; g++) {
        const P = L.points(f.phrases[g]);
        out += `<polyline points="${pts(P)}" fill="none" stroke="var(--ghost)" stroke-width="2" opacity=".55"/>`;
        P.forEach(([x, y]) => { out += `<circle cx="${x}" cy="${y}" r="3" fill="var(--ghost)"/>`; });
      }
      // The next phrase, faint, so the eye knows where the line goes after this one.
      const N = L.points(f.next);
      out += `<polyline points="${pts(N)}" fill="none" stroke="var(--foreground)" stroke-width="1.5" opacity=".1"/>`;
      N.forEach(([x, y]) => { out += `<circle cx="${x}" cy="${y}" r="2.5" fill="var(--foreground)" opacity=".14"/>`; });
      const P = L.points(f.ph), up = L.up(f.ph), dy = up ? -16 : 28;
      out += `<polyline points="${pts(P)}" fill="none" stroke="var(--trail)" stroke-width="2" opacity=".18" stroke-dasharray="4 6"/>`;
      if (f.cur.i > 0) out += `<polyline points="${pts(P.slice(0, f.cur.i + 1))}" fill="none" stroke="var(--trail)" stroke-width="3"/>`;
      P.forEach(([x, y], i) => {
        if (i < f.cur.i) out += `<circle cx="${x}" cy="${y}" r="5" fill="var(--trail)"/><text x="${x}" y="${y + dy}" text-anchor="middle" fill="var(--foreground)" font-size="16">${A.latin(f.ph[i])}</text>`;
        else if (i > f.cur.i) out += `<circle cx="${x}" cy="${y}" r="3" fill="var(--trail)" opacity=".3"/>`;
      });
      const [x, y] = P[f.cur.i];
      out += `<circle cx="${x}" cy="${y}" r="${12 + 18 * (1 - f.frac)}" fill="var(--note)" opacity="${.3 * (1 - f.frac)}"/>`;
      out += `<circle cx="${x}" cy="${y}" r="9" fill="var(--note)"/>`;
      out += `<text x="${x}" y="${y + (up ? -24 : 38)}" text-anchor="middle" fill="var(--note)" font-size="30" font-weight="600">${A.latin(f.ph[f.cur.i])}</text>`;
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
      const narrow = W < 600;
      const L = A.layout(f.phrases, W, H, { padL: narrow ? 84 : 120, padR: narrow ? 24 : 48, padT: narrow ? 150 : 170, padB: 56, maxUnit: narrow ? 60 : 84 });
      const margin = L.padL - 30;
      out += `<line x1="${margin}" x2="${margin}" y1="0" y2="${H}" stroke="${RED}" stroke-width="1.2" opacity=".5"/>`;
      for (let p = L.lo; p <= L.hi; p++) {
        const y = L.yOf(p);
        out += `<line x1="${margin + 6}" x2="${W - 14}" y1="${y}" y2="${y}" stroke="${RULE}"/>`;
        out += `<text x="${margin - 12}" y="${y + 8}" text-anchor="end" fill="${GRAPHITE}" font-family='${DEVA}' font-size="${narrow ? 20 : 24}">${A.degDeva(p)}</text>`;
      }
      // The phrase, handwritten on the top line. Current swara circled in red.
      const adv = narrow ? 34 : 46, fs = narrow ? 30 : 40, hy = narrow ? 84 : 96;
      f.ph.forEach((n, i) => {
        const x = L.padL + i * adv, cur = i === f.cur.i;
        out += `<text x="${x}" y="${hy}" text-anchor="middle" fill="${cur ? RED : INK}" font-family="${HAND}" font-weight="700" font-size="${fs}">${A.latin(n)}</text>`;
        if (cur) out += `<ellipse cx="${x}" cy="${hy - fs * .32}" rx="${fs * .55}" ry="${fs * .62}" fill="none" stroke="${RED}" stroke-width="2" transform="rotate(-8 ${x} ${hy - fs * .32})" filter="url(#pen)"/>`;
      });
      out += `<text x="${L.padL}" y="${hy + 28}" fill="${GRAPHITE}" font-family="${HAND}" font-size="16">${f.cur.p + 1} / ${f.phrases.length}</text>`;
      // Earlier phrases, in ink that has already dried.
      for (let g = 0; g < f.cur.p; g++) {
        out += `<polyline points="${pts(L.points(f.phrases[g]))}" fill="none" stroke="${INK}" stroke-width="2" opacity=".28" stroke-linejoin="round" filter="url(#pen)"/>`;
      }
      // The next phrase, a light pencil sketch.
      out += `<polyline points="${pts(L.points(f.next))}" fill="none" stroke="${GRAPHITE}" stroke-width="1.2" opacity=".16" stroke-linejoin="round"/>`;
      const P = L.points(f.ph), up = L.up(f.ph), dy = up ? -14 : 30;
      out += `<polyline points="${pts(P)}" fill="none" stroke="${GRAPHITE}" stroke-width="1.2" opacity=".35" stroke-dasharray="3 7" filter="url(#pen)"/>`;
      if (f.cur.i > 0) out += `<polyline points="${pts(P.slice(0, f.cur.i + 1))}" fill="none" stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" filter="url(#pen)"/>`;
      f.ph.forEach((n, i) => {
        if (i > f.cur.i) return;
        const [x, y] = P[i], cur = i === f.cur.i;
        out += `<circle cx="${x}" cy="${y}" r="${cur ? 5 : 3.5}" fill="${cur ? RED : INK}"/>`;
        out += `<text x="${x}" y="${y + dy}" text-anchor="middle" fill="${cur ? RED : INK}" font-family="${HAND}" font-weight="${cur ? 700 : 400}" font-size="${cur ? 34 : 22}">${A.latin(n)}</text>`;
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
      const L = A.layout(f.phrases, W, H, { padL: 64, padR: 32, padT: H * .32, padB: H * .06, maxUnit: Math.min(90, W / 8) });
      for (let p = L.lo; p <= L.hi; p++) {
        const y = L.yOf(p);
        out += `<line x1="${L.padL}" x2="${W - 20}" y1="${y}" y2="${y}" stroke="${FAINT}" stroke-dasharray="1 5"/>`;
        out += `<text x="${L.padL - 18}" y="${y + 5}" text-anchor="end" fill="${DIM}" font-family='${COND}' font-weight="500" font-size="16" letter-spacing="1">${A.degLatin(p)}</text>`;
      }
      const cur = f.ph[f.cur.i];
      out += `<text x="${W / 2}" y="${heroY + H * .05}" text-anchor="middle" fill="${WHITE}" font-family='${DISPLAY}' font-size="${H * .13}" filter="url(#bloom)">${A.deva(cur)}</text>`;
      const adv = Math.min(40, (W - 80) / Math.max(f.ph.length, 1)), x0 = W / 2 - (f.ph.length - 1) * adv / 2;
      f.ph.forEach((n, i) => {
        const on = i === f.cur.i;
        out += `<text x="${x0 + i * adv}" y="${tickY + 30}" text-anchor="middle" fill="${on ? WHITE : DIM}" font-family='${COND}' font-weight="800" font-size="${on ? 34 : 26}" ${on ? 'filter="url(#glow)"' : ''}>${A.latin(n)}</text>`;
      });
      for (let g = 0; g < f.cur.p; g++) out += `<polyline points="${pts(L.points(f.phrases[g]))}" fill="none" stroke="${DIM}" stroke-width="1.5" stroke-linejoin="round"/>`;
      // The light draws the edge: a comet runs toward the next note at tempo.
      // The next phrase, barely lit.
      const N = L.points(f.next);
      out += `<polyline points="${pts(N)}" fill="none" stroke="${WHITE}" stroke-width="1.5" opacity=".06"/>`;
      N.forEach(([x, y]) => { out += `<circle cx="${x}" cy="${y}" r="2.5" fill="${WHITE}" opacity=".12"/>`; });
      const P = L.points(f.ph), m = A.marker(P, f.cur.i, f.frac);
      out += `<polyline points="${pts(P)}" fill="none" stroke="${FAINT}" stroke-width="1.5"/>`;
      out += `<polyline points="${pts(P.slice(0, f.cur.i + 1).concat([m]))}" fill="none" stroke="${WHITE}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" filter="url(#glow)"/>`;
      P.forEach(([x, y], i) => { if (i <= f.cur.i) out += `<circle cx="${x}" cy="${y}" r="4" fill="${WHITE}"/>`; });
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
      $('zn-badges').innerHTML = f.ph.map((n, i) => `<span class="badge ${i === f.cur.i ? 'default' : i < f.cur.i ? 'secondary' : 'ghost'}">${A.latin(n)}</span>`).join('');
      $('zn-progress').innerHTML = f.phrases.map((_, p) => `<i class="${p < f.cur.p ? 'done' : p === f.cur.p ? 'now' : ''}"></i>`).join('');
      const L = A.layout(f.phrases, W, H, { padL: 56, padR: 28, padT: 36, padB: 36, maxUnit: 80 });
      let out = '';
      for (let p = L.lo; p <= L.hi; p++) {
        const y = L.yOf(p);
        out += `<line x1="${L.padL}" x2="${W - 20}" y1="${y}" y2="${y}" stroke="var(--border)"/>`;
        out += `<text x="${L.padL - 14}" y="${y + 4}" text-anchor="end" fill="var(--muted-foreground)" font-family='${MONO}' font-size="12">${A.degLatin(p)}</text>`;
      }
      for (let g = 0; g < f.cur.p; g++) out += `<polyline points="${pts(L.points(f.phrases[g]))}" fill="none" stroke="var(--ghost)" stroke-width="1.5" stroke-linejoin="round"/>`;
      // The next phrase, faint.
      const N = L.points(f.next);
      out += `<polyline points="${pts(N)}" fill="none" stroke="var(--foreground)" stroke-width="1.5" opacity=".1"/>`;
      N.forEach(([x, y]) => { out += `<circle cx="${x}" cy="${y}" r="2.5" fill="var(--foreground)" opacity=".14"/>`; });
      const P = L.points(f.ph), up = L.up(f.ph), dy = up ? -12 : 22;
      out += `<polyline points="${pts(P)}" fill="none" stroke="var(--ghost)" stroke-width="1.5" stroke-dasharray="4 4"/>`;
      if (f.cur.i > 0) out += `<polyline points="${pts(P.slice(0, f.cur.i + 1))}" fill="none" stroke="var(--foreground)" stroke-width="2" stroke-linejoin="round"/>`;
      P.forEach(([x, y], i) => {
        if (i < f.cur.i) out += `<circle cx="${x}" cy="${y}" r="3.5" fill="var(--foreground)"/><text x="${x}" y="${y + dy}" text-anchor="middle" fill="var(--muted-foreground)" font-family='${MONO}' font-size="12">${A.latin(f.ph[i])}</text>`;
        else if (i > f.cur.i) out += `<circle cx="${x}" cy="${y}" r="3" fill="var(--background)" stroke="var(--ghost)" stroke-width="1.5"/>`;
      });
      const [x, y] = P[f.cur.i];
      // A focus ring with an offset, the way a focused shadcn control looks.
      out += `<circle cx="${x}" cy="${y}" r="${9 + 3 * (1 - f.frac)}" fill="none" stroke="var(--foreground)" stroke-width="2" opacity="${.35 + .65 * (1 - f.frac)}"/>`;
      out += `<circle cx="${x}" cy="${y}" r="5" fill="var(--foreground)" stroke="var(--background)" stroke-width="2"/>`;
      out += `<text x="${x}" y="${y + (up ? -18 : 30)}" text-anchor="middle" fill="var(--foreground)" font-family='${MONO}' font-weight="500" font-size="16">${A.latin(f.ph[f.cur.i])}</text>`;
      svg.innerHTML = out;
    };
  })();

  // ---------- Reel: a 9:16 frame with the top half empty for the singer, keyed background ----------
  const reel = (() => {
    const svg = $('rl-stage'), frame = $('rl-frame');
    const CORAL = '#ff5a4e', SUN = '#ffcc4d';
    let INK = '#1b1b3a', KEY = '#00ff00';
    const hex = c => c.match(/\w\w/g).map(h => parseInt(h, 16));
    const mix = (a, b, t) => '#' + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * t).toString(16).padStart(2, '0')).join('');
    const draw = f => {
      const W = svg.clientWidth, H = svg.clientHeight;
      if (!W || !H || !f) { svg.innerHTML = ''; return; }
      const cur = f.ph[f.cur.i];
      $('rl-ticker').innerHTML = f.ph.map((n, i) => i === f.cur.i ? `<b>${A.latin(n)}</b>` : A.latin(n)).join(' ');
      const L = A.layout(f.phrases, W, H, { padL: 44, padR: 20, padT: 30, padB: 26, maxUnit: W / 9 });
      let out = '';
      for (let p = L.lo; p <= L.hi; p++) out += `<text x="${L.padL - 12}" y="${L.yOf(p) + 4}" text-anchor="end" fill="${INK}" opacity=".55" font-family="Baloo 2" font-weight="800" font-size="12">${A.degLatin(p)}</text>`;
      // Earlier phrases become solid layers behind the current one, like hills.
      // Solid colours only, so a chroma key has clean edges.
      const P = L.points(f.ph);
      const far = mix(INK, '#ffffff', INK === '#ffffff' ? .55 : .82), near = '#7c6cff';
      out += `<polygon points="${pts(P)}" fill="${mix(CORAL, '#ffffff', .55)}"/>`;
      for (let g = f.cur.p - 1; g >= 0; g--) {
        const age = f.cur.p > 1 ? g / (f.cur.p - 1) : 1;
        out += `<polygon points="${pts(L.points(f.phrases[g]))}" fill="${mix(far, near, age)}" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>`;
      }
      // The next phrase as a solid tint of the background, so it still keys cleanly.
      out += `<polyline points="${pts(L.points(f.next))}" fill="none" stroke="${mix(KEY, INK, .28)}" stroke-width="2" stroke-linejoin="round"/>`;
      const m = A.marker(P, f.cur.i, f.frac), up = L.up(f.ph);
      out += `<polyline points="${pts(P)}" fill="none" stroke="${INK}" stroke-width="2" stroke-dasharray="2 6" stroke-linecap="round"/>`;
      out += `<polyline points="${pts(P.slice(0, f.cur.i + 1).concat([m]))}" fill="none" stroke="${INK}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>`;
      P.forEach(([x, y], i) => {
        if (i >= f.cur.i) return;
        out += `<circle cx="${x}" cy="${y}" r="5" fill="${INK}"/><text x="${x}" y="${y + (up ? -12 : 22)}" text-anchor="middle" fill="${INK}" font-family="Baloo 2" font-weight="800" font-size="14">${A.latin(f.ph[i])}</text>`;
      });
      const [x, y] = P[f.cur.i];
      out += `<circle cx="${x}" cy="${y}" r="${12 + 10 * (1 - f.frac)}" fill="${SUN}" stroke="${INK}" stroke-width="3"/>`;
      out += `<circle cx="${m[0]}" cy="${m[1]}" r="6" fill="${CORAL}" stroke="${INK}" stroke-width="2"/>`;
      out += `<text x="${x}" y="${y + (up ? -22 : 34)}" text-anchor="middle" fill="${CORAL}" stroke="${INK}" stroke-width=".6" font-family="Baloo 2" font-weight="800" font-size="26">${A.latin(cur)}</text>`;
      svg.innerHTML = out;
    };
    // Background: green or magenta to key out, black for Screen blend, white to multiply.
    draw.setKey = k => {
      frame.style.setProperty('--key', k);
      KEY = k;
      INK = k === '#000000' ? '#ffffff' : '#1b1b3a';
      frame.style.setProperty('--ink', INK);
    };
    return draw;
  })();

  return { original, notebook, glow, zinc, reel };
})();
