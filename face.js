// Animation engine. Owns the SVG face and nothing else: no chat, no storage.
// API: createFace(svg, settings) -> { setState, state, lookAt, flash, onChange, start, stop }

export const STATES = {
  idle:      { label: 'Idle',      open: 1,    smile: 0,    narrow: 0,   browY: 0,  tilt: 0,  browR: 0,  glow: .5,  pupil: 1,    gz: { iv: [1.4, 3.6], rx: .8, ry: .4,  by: 0,   home: .35 } },
  listening: { label: 'Listening', open: 1.1,  smile: 0,    narrow: 0,   browY: -4, tilt: 0,  browR: 0,  glow: .72, pupil: 1.12, gz: { iv: [2.5, 4.5], rx: .1, ry: .06, by: 0,   home: .8 } },
  thinking:  { label: 'Thinking',  open: .88,  smile: 0,    narrow: .2,  browY: -2, tilt: -3, browR: -3, glow: .45, pupil: .92,  gz: { iv: [.5, 1.2],  rx: .9, ry: .35, by: -.45, home: 0 } },
  speaking:  { label: 'Speaking',  open: 1,    smile: 0,    narrow: 0,   browY: -1, tilt: 0,  browR: 0,  glow: .68, pupil: 1,    gz: { iv: [1.6, 3.2], rx: .22, ry: .12, by: 0,  home: .5 } },
  happy:     { label: 'Happy',     open: .86,  smile: .72,  narrow: 0,   browY: -7, tilt: 0,  browR: 0,  glow: .85, pupil: 1.08, gz: { iv: [2, 4],     rx: .25, ry: .12, by: 0,  home: .6 } },
  concerned: { label: 'Concerned', open: .78,  smile: 0,    narrow: .32, browY: 5,  tilt: 9,  browR: 0,  glow: .38, pupil: .95,  gz: { iv: [2.2, 4.5], rx: .3, ry: .1,  by: .25, home: .3 } },
  curious:   { label: 'Curious',   open: 1.08, smile: 0,    narrow: 0,   browY: -5, tilt: -4, browR: -9, glow: .66, pupil: 1.05, gz: { iv: [.7, 1.6],  rx: 1,  ry: .5,  by: 0,   home: .1 } },
  sleeping:  { label: 'Sleeping',  open: .03,  smile: 0,    narrow: 0,   browY: 6,  tilt: 0,  browR: 0,  glow: .07, pupil: 1,    gz: null }
};

const KEYS = ['open', 'smile', 'narrow', 'browY', 'tilt', 'browR', 'glow', 'pupil'];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const rnd = (a, b) => a + Math.random() * (b - a);

export function createFace(svg, settings) {
  const q = (s) => svg.querySelector(s);
  const el = {
    halo: q('#halo'), faceGlow: q('#faceGlow'), orn: q('#orn'),
    clip: q('#eyeClipPath'),
    outlines: svg.querySelectorAll('.outline'),
    irises: svg.querySelectorAll('.iris'),
    pupils: svg.querySelectorAll('.pupil'),
    browL: q('#browL'), browR: q('#browR')
  };

  let state = 'idle', base = 'idle', flashTimer = 0;
  const cur = {};
  KEYS.forEach((k) => (cur[k] = STATES.idle[k]));
  let raf = 0, last = 0, t = 0;
  const listeners = [];

  // blinking
  let nextBlink = 2500, blinkStart = -1;
  function blinkAmount(now) {
    if (state === 'sleeping') { blinkStart = -1; return 0; }
    if (blinkStart < 0) {
      if (now < nextBlink) return 0;
      blinkStart = now;
    }
    const p = (now - blinkStart) / 190;
    if (p >= 1) {
      blinkStart = -1;
      nextBlink = now + (Math.random() < .15 ? 230 : rnd(2200, 6000));
      return 0;
    }
    return p < .4 ? p / .4 : 1 - (p - .4) / .6;
  }

  // gaze
  let gx = 0, gy = 0, tx = 0, ty = 0, nextSac = 0, overrideUntil = 0;
  function stepGaze(now, dt, T) {
    const reduce = settings.reduceMotion;
    if (!T.gz) { tx = 0; ty = 0; }
    else if (now >= overrideUntil && now >= nextSac) {
      const g = T.gz, s = reduce ? .5 : 1;
      if (Math.random() < g.home) { tx = 0; ty = g.by * .3; }
      else { tx = rnd(-g.rx, g.rx) * s; ty = g.by + rnd(-g.ry, g.ry) * s; }
      nextSac = now + rnd(g.iv[0], g.iv[1]) * 1000 * (reduce ? 1.8 : 1);
    }
    const k = 1 - Math.exp(-dt * 16);
    gx += (tx - gx) * k;
    gy += (ty - gy) * k;
  }

  function eyePath(open, smile, narrow) {
    const W = 46;
    const top = 32 * open * (1 - narrow * .45);
    let bot = 26 * open - smile * 36;
    bot = Math.max(bot, -top * .9);
    return `M${-W} 0Q0 ${(-2 * top).toFixed(2)} ${W} 0Q0 ${(2 * bot).toFixed(2)} ${-W} 0Z`;
  }

  function frame(nowMs) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(.05, (nowMs - last) / 1000 || .016);
    last = nowMs; t += dt;
    const T = STATES[state];
    const reduce = settings.reduceMotion;

    const k = 1 - Math.exp(-dt * (state === 'sleeping' ? 3 : 9));
    KEYS.forEach((key) => { cur[key] += (T[key] - cur[key]) * k; });

    stepGaze(nowMs, dt, T);

    let glow = cur.glow, open = cur.open;
    if (!reduce) {
      if (state === 'thinking') glow += .22 * Math.sin(t * 3.2);
      else if (state === 'speaking') {
        const r = .5 + .5 * Math.sin(t * 9) * Math.sin(t * 2.7 + 1);
        glow += .14 * r; open += .04 * r;
      }
      else if (state === 'idle') glow += .05 * Math.sin(t * 1.1);
      else if (state === 'sleeping') glow += .03 * Math.sin(t * .8);
    } else if (state === 'speaking') glow += .06;

    const b = blinkAmount(nowMs);
    const d = eyePath(open * (1 - b), cur.smile, cur.narrow);
    el.clip.setAttribute('d', d);
    el.outlines.forEach((o) => o.setAttribute('d', d));

    const ix = (gx * 17).toFixed(2), iy = (gy * 9).toFixed(2);
    el.irises.forEach((i) => i.setAttribute('transform', `translate(${ix} ${iy})`));
    el.pupils.forEach((p) => p.setAttribute('r', (12 * cur.pupil).toFixed(2)));

    const by = 218 + cur.browY;
    el.browL.setAttribute('transform', `translate(134 ${by.toFixed(2)}) rotate(${(-cur.tilt).toFixed(2)})`);
    el.browR.setAttribute('transform', `translate(266 ${(by + cur.browR).toFixed(2)}) rotate(${cur.tilt.toFixed(2)})`);

    const g = clamp(glow * settings.glow, 0, 1.2);
    el.halo.setAttribute('opacity', (g * .8).toFixed(3));
    el.faceGlow.setAttribute('opacity', (g * .55).toFixed(3));
    el.orn.setAttribute('opacity', clamp(.5 + .5 * g, 0, 1).toFixed(3));
    svg.querySelectorAll('.iris').forEach((i) => i.setAttribute('opacity', clamp(.55 + .6 * g, 0, 1).toFixed(3)));
  }

  function emit() { listeners.forEach((fn) => fn(state)); }

  const api = {
    get state() { return state; },
    setState(name) {
      if (!STATES[name]) return;
      clearTimeout(flashTimer);
      base = name; state = name; emit();
    },
    // Show a state briefly, then return to the base state.
    flash(name, ms = 1600) {
      if (!STATES[name] || base === 'sleeping') return;
      clearTimeout(flashTimer);
      state = name; emit();
      flashTimer = setTimeout(() => { state = base; emit(); }, ms);
    },
    lookAt(x, y, ms = 2200) {
      if (state === 'sleeping') return;
      tx = clamp(x, -1, 1); ty = clamp(y * .7, -.7, .7);
      overrideUntil = performance.now() + ms;
    },
    onChange(fn) { listeners.push(fn); fn(state); },
    start() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } },
    stop() { cancelAnimationFrame(raf); raf = 0; }
  };
  return api;
}
