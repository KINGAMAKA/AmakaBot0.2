// Settings: values and the menu controls that edit them. Stored on this device only.
const KEY = 'amaka.settings.v1';

function defaults() {
  const reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  return {
    glow: 1, reduceMotion: reduce, followTouch: true, autoSleep: true, motionReact: true,
    speak: false, voiceName: '', rate: 1, aiEnabled: false, aiEndpoint: 'http://localhost:8080'
  };
}
// [element id, setting key, kind]
const BIND = [
  ['setGlow', 'glow', 'pct'], ['setReduce', 'reduceMotion', 'check'], ['setFollow', 'followTouch', 'check'],
  ['setSleep', 'autoSleep', 'check'], ['setMotion', 'motionReact', 'check'], ['setSpeak', 'speak', 'check'],
  ['setRate', 'rate', 'pct'], ['setAi', 'aiEnabled', 'check'], ['setEndpoint', 'aiEndpoint', 'text']
];

export function loadSettings() {
  const s = defaults();
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    Object.keys(s).forEach((k) => { if (typeof saved[k] === typeof s[k]) s[k] = saved[k]; });
  } catch (e) { /* storage unavailable: use defaults */ }
  return s;
}
const save = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* ignore */ } };

export function initSettingsUI(s) {
  const sync = () => BIND.forEach(([id, key, kind]) => {
    const el = document.getElementById(id);
    if (kind === 'check') el.checked = s[key];
    else if (kind === 'pct') el.value = Math.round(s[key] * 100);
    else el.value = s[key];
  });
  BIND.forEach(([id, key, kind]) => {
    const el = document.getElementById(id);
    el.addEventListener(kind === 'check' ? 'change' : 'input', () => {
      s[key] = kind === 'check' ? el.checked : kind === 'pct' ? Number(el.value) / 100 : el.value;
      save(s);
    });
  });
  document.getElementById('resetBtn').addEventListener('click', () => { Object.assign(s, defaults()); save(s); sync(); });
  sync();
}

// Fill the voice picker (voices load late on Android, so this can be called again).
export function fillVoices(s, voices) {
  const sel = document.getElementById('setVoice');
  sel.textContent = '';
  const def = document.createElement('option');
  def.value = ''; def.textContent = 'Phone default';
  sel.appendChild(def);
  voices.filter((v) => /^en/i.test(v.lang)).forEach((v) => {
    const o = document.createElement('option');
    o.value = v.name; o.textContent = v.name + ' (' + v.lang + ')';
    sel.appendChild(o);
  });
  sel.value = s.voiceName;
  sel.onchange = () => { s.voiceName = sel.value; save(s); };
}
