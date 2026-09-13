// Parsing, layout and playback. No DOM, no styling: the looks in looks.js
// draw whatever this emits.
window.Alankar = (() => {
  const DEG = { s: 0, r: 1, g: 2, m: 3, p: 4, d: 5, n: 6 };
  const LAT = ['S', 'R', 'G', 'M', 'P', 'D', 'N'];
  const DEV = ['सा', 'रे', 'ग', 'म', 'प', 'ध', 'नि'];
  const mark = (o, up, dn) => o > 0 ? up.repeat(o) : o < 0 ? dn.repeat(-o) : '';
  const latin = n => (n.komal ? LAT[n.deg].toLowerCase() : LAT[n.deg]) + mark(n.oct, '̇', '̣');
  // For HTML text: Bhatkhande marks as classes (see index.html).
  const html = n => n.komal ? `<span class="komal">${latin(n)}</span>` : n.tivra ? `<span class="tivra">${latin(n)}</span>` : latin(n);
  // Bhatkhande marks for an SVG label anchored middle at (x, y) with font-size fs:
  // a line under a komal swara, a stroke above tivra Ma.
  const marks = (n, x, y, fs, color, w = 1.2) =>
    n.komal ? `<line x1="${x - fs * .28}" x2="${x + fs * .28}" y1="${y + fs * .2}" y2="${y + fs * .2}" stroke="${color}" stroke-width="${w}"/>` :
    n.tivra ? `<line x1="${x}" x2="${x}" y1="${y - fs * 1.02}" y2="${y - fs * .84}" stroke="${color}" stroke-width="${w}"/>` : '';
  // A note dot: filled for shuddh, a ring for komal and tivra (for lines with no labels).
  const dot = (n, x, y, r, fill, bg, extra = '') => (n.komal || n.tivra)
    ? `<circle cx="${x}" cy="${y}" r="${r}" fill="${bg}" stroke="${fill}" stroke-width="${Math.max(1.2, r * .55)}" ${extra}/>`
    : `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`;
  const deva = n => DEV[n.deg] + mark(n.oct, 'ं', '़');
  const degLatin = p => LAT[((p % 7) + 7) % 7] + mark(Math.floor(p / 7), '̇', '̣');
  const degDeva = p => DEV[((p % 7) + 7) % 7] + mark(Math.floor(p / 7), 'ं', '़');

  // S R G M P D N. Lowercase r g d n are komal; m or M# is tivra Ma.
  // ' raises an octave, . lowers one. A komal note sits half a row below its
  // shuddh line, tivra Ma half a row above.
  function parseNote(tok) {
    const m = /^([SRGMPDNsrgdnm])(#?)(['^.,]*)$/.exec(tok);
    if (!m) return null;
    const deg = DEG[m[1].toLowerCase()];
    if (m[2] && deg !== 3) return null;
    let oct = 0;
    for (const c of m[3]) oct += (c === "'" || c === '^') ? 1 : -1;
    const komal = 'rgdn'.includes(m[1]), tivra = deg === 3 && (m[1] === 'm' || m[2] === '#');
    return { deg, oct, komal, tivra, pitch: deg + oct * 7 + (komal ? -.5 : tivra ? .5 : 0) };
  }

  function parseScore(text) {
    const phrases = [], errors = [];
    text.split('\n').forEach((line, i) => {
      const toks = line.trim().split(/\s+/).filter(Boolean);
      if (!toks.length) return;
      const notes = [];
      for (const t of toks) {
        const n = parseNote(t);
        if (!n) { errors.push(`Line ${i + 1}: can't read "${t}"`); return; }
        notes.push(n);
      }
      phrases.push(notes);
    });
    return { phrases, errors };
  }

  // Pitch on y, beat on x, every phrase centred. Returns helpers in pixels.
  // Rows never get shorter than o.minRow: when the score is taller than the
  // stage, the view slides so o.focus (a pitch) sits in the middle. Guide
  // lines run vLo..vHi, the rows currently in view.
  function layout(phrases, W, H, o = {}) {
    const padL = o.padL ?? 80, padR = o.padR ?? 40, padT = o.padT ?? 60, padB = o.padB ?? 60;
    let lo = Infinity, hi = -Infinity, maxN = 1;
    phrases.forEach(ph => {
      maxN = Math.max(maxN, ph.length);
      ph.forEach(n => { lo = Math.min(lo, n.pitch); hi = Math.max(hi, n.pitch); });
    });
    if (!isFinite(lo)) { lo = 0; hi = 7; }
    lo = Math.floor(lo); hi = Math.max(Math.ceil(hi), lo + 1);
    const avail = H - padT - padB, minRow = o.minRow ?? 40;
    let rowH = avail / (hi - lo), base = lo;
    if (rowH < minRow) {
      rowH = minRow;
      const visible = avail / rowH, focus = o.focus ?? (lo + hi) / 2;
      base = Math.max(lo, Math.min(hi - visible, focus - visible / 2));
    }
    const vLo = Math.max(lo, Math.floor(base)), vHi = Math.min(hi, Math.ceil(base + avail / rowH));
    const unit = Math.min(o.maxUnit ?? 90, (W - padL - padR) / Math.max(maxN - 1, 1));
    const cx = padL + (W - padL - padR) / 2;
    const yOf = p => H - padB - (p - base) * rowH;
    const xOf = (i, n) => cx + (i - (n - 1) / 2) * unit;
    return {
      lo, hi, vLo, vHi, rowH, unit, cx, padL, padR, padT, padB, yOf, xOf,
      isSa: p => ((p % 7) + 7) % 7 === 0,
      points: ph => ph.map((n, i) => [xOf(i, ph.length), yOf(n.pitch)]),
      up: ph => {
        const t = Math.max(...ph.map(n => n.pitch)), b = Math.min(...ph.map(n => n.pitch));
        return t - ph[0].pitch >= ph[0].pitch - b;
      },
    };
  }

  // A marker that rests on the current note for the first part of the beat,
  // then glides to the next one. Returns [x, y].
  function marker(P, i, frac, hold = 0.45) {
    if (i + 1 >= P.length) return P[i];
    const t = Math.max(0, (frac - hold) / (1 - hold));
    const e = t * t * (3 - 2 * t);
    return [P[i][0] + (P[i + 1][0] - P[i][0]) * e, P[i][1] + (P[i + 1][1] - P[i][1]) * e];
  }

  // Playback. onFrame gets null when there is no score, else a frame:
  // { phrases, steps, pos, bpm, playing, k, frac, cur:{p,i}, ph, next, focus }.
  // focus is the pitch the camera should centre on: the middle of the current
  // phrase, eased while playing so tall scores slide rather than jump.
  function createPlayer(onFrame) {
    const s = { phrases: [], steps: [], pos: 0, bpm: 80, playing: false, lastT: 0, focus: 0 };
    function emit() {
      if (!s.steps.length) { onFrame(null); return; }
      const k = Math.min(Math.floor(s.pos), s.steps.length - 1);
      const cur = s.steps[k], ph = s.phrases[cur.p];
      const mid = (Math.max(...ph.map(n => n.pitch)) + Math.min(...ph.map(n => n.pitch))) / 2;
      s.focus = s.playing ? s.focus + (mid - s.focus) * .08 : mid;
      onFrame({ ...s, k, frac: Math.min(s.pos - k, 1), cur, ph, next: s.phrases[(cur.p + 1) % s.phrases.length] });
    }
    function load(text) {
      const r = parseScore(text);
      s.phrases = r.phrases; s.steps = [];
      s.phrases.forEach((ph, p) => ph.forEach((_, i) => s.steps.push({ p, i })));
      s.pos = 0; emit();
      return r.errors;
    }
    function tick(t) {
      if (!s.playing) return;
      if (s.lastT) s.pos += (t - s.lastT) * s.bpm / 60000;
      s.lastT = t;
      if (s.pos >= s.steps.length) s.pos -= s.steps.length;   // loop
      emit();
      requestAnimationFrame(tick);
    }
    function play(on = !s.playing) {
      if (on && !s.steps.length) return;
      s.playing = on; s.lastT = 0;
      if (on) requestAnimationFrame(tick);
      emit();
    }
    function reset() { s.playing = false; s.pos = 0; emit(); }
    function setBpm(v) { s.bpm = Math.min(240, Math.max(30, Number(v) || 80)); emit(); }
    return { state: s, load, play, reset, setBpm, redraw: emit };
  }

  return { parseScore, layout, marker, createPlayer, latin, html, marks, dot, deva, degLatin, degDeva };
})();
