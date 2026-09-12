// Parsing, layout and playback. No DOM, no styling: the looks in looks.js
// draw whatever this emits.
window.Alankar = (() => {
  const DEG = { s: 0, r: 1, g: 2, m: 3, p: 4, d: 5, n: 6 };
  const LAT = ['S', 'R', 'G', 'M', 'P', 'D', 'N'];
  const DEV = ['सा', 'रे', 'ग', 'म', 'प', 'ध', 'नि'];
  const mark = (o, up, dn) => o > 0 ? up.repeat(o) : o < 0 ? dn.repeat(-o) : '';
  const latin = n => (n.komal ? LAT[n.deg].toLowerCase() : LAT[n.deg]) + mark(n.oct, '̇', '̣');
  const deva = n => DEV[n.deg] + mark(n.oct, 'ं', '़');
  const degLatin = p => LAT[((p % 7) + 7) % 7] + mark(Math.floor(p / 7), '̇', '̣');
  const degDeva = p => DEV[((p % 7) + 7) % 7] + mark(Math.floor(p / 7), 'ं', '़');

  function parseNote(tok) {
    const m = /^([SRGMPDNsrgmpdn])(['^.,]*)$/.exec(tok);
    if (!m) return null;
    let oct = 0;
    for (const c of m[2]) oct += (c === "'" || c === '^') ? 1 : -1;
    const deg = DEG[m[1].toLowerCase()];
    return { deg, oct, komal: m[1] === m[1].toLowerCase(), pitch: deg + oct * 7 };
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
  function layout(phrases, W, H, o = {}) {
    const padL = o.padL ?? 80, padR = o.padR ?? 40, padT = o.padT ?? 60, padB = o.padB ?? 60;
    let lo = Infinity, hi = -Infinity, maxN = 1;
    phrases.forEach(ph => {
      maxN = Math.max(maxN, ph.length);
      ph.forEach(n => { lo = Math.min(lo, n.pitch); hi = Math.max(hi, n.pitch); });
    });
    if (!isFinite(lo)) { lo = 0; hi = 7; }
    const rowH = (H - padT - padB) / Math.max(hi - lo, 1);
    const unit = Math.min(o.maxUnit ?? 90, (W - padL - padR) / Math.max(maxN - 1, 1));
    const cx = padL + (W - padL - padR) / 2;
    const yOf = p => H - padB - (p - lo) * rowH;
    const xOf = (i, n) => cx + (i - (n - 1) / 2) * unit;
    return {
      lo, hi, rowH, unit, cx, padL, padR, padT, padB, yOf, xOf,
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
  // { phrases, steps, pos, bpm, playing, k, frac, cur:{p,i}, ph, next }.
  function createPlayer(onFrame) {
    const s = { phrases: [], steps: [], pos: 0, bpm: 80, playing: false, lastT: 0 };
    function emit() {
      if (!s.steps.length) { onFrame(null); return; }
      const k = Math.min(Math.floor(s.pos), s.steps.length - 1);
      const cur = s.steps[k];
      onFrame({ ...s, k, frac: Math.min(s.pos - k, 1), cur, ph: s.phrases[cur.p],
        next: s.phrases[(cur.p + 1) % s.phrases.length] });
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

  return { parseScore, layout, marker, createPlayer, latin, deva, degLatin, degDeva };
})();
