// Bootstrap: creates the modules and wires them together.
// face.js <- chat.js (expressions) / voice.js / sensors.js     chat.js -> memory.js, brain.js
import { createFace, STATES } from './face.js';
import { loadSettings, initSettingsUI, fillVoices } from './settings.js';
import { initChat } from './chat.js';
import { renderStatus } from './status.js';
import { createVoice } from './voice.js';
import { createBrain } from './brain.js';
import { initMemoryUI } from './memory-ui.js';
import { initSensors } from './sensors.js';

const $ = (id) => document.getElementById(id);
const settings = loadSettings();
const svg = $('face');
const face = createFace(svg, settings);

// Menu panel
const panel = $('panel'), scrim = $('scrim'), menuBtn = $('menuBtn');
function setPanel(open) {
  panel.classList.toggle('open', open);
  scrim.classList.toggle('open', open);
  panel.setAttribute('aria-hidden', String(!open));
  menuBtn.setAttribute('aria-expanded', String(open));
}
menuBtn.addEventListener('click', () => setPanel(!panel.classList.contains('open')));
$('closeBtn').addEventListener('click', () => setPanel(false));
scrim.addEventListener('click', () => setPanel(false));

// Modules
let chat;
const voice = createVoice(settings, {
  onText: (t) => chat.send(t),
  onError: (c) => chat.onVoiceError(c),
  onListening: (on) => chat.onListening(on)
});
const brain = createBrain(settings);
chat = initChat({ face, form: $('composer'), input: $('msg'), log: $('log'), micBtn: $('micBtn'), voice, brain, settings });

// Expression buttons
const chips = {};
Object.keys(STATES).forEach((name) => {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'chip'; b.textContent = STATES[name].label;
  b.setAttribute('aria-pressed', 'false');
  b.addEventListener('click', () => { chat.cancel(); face.setState(name); });
  $('chips').appendChild(b);
  chips[name] = b;
});
face.onChange((s) => {
  $('stateLabel').textContent = STATES[s].label;
  Object.keys(chips).forEach((n) => chips[n].setAttribute('aria-pressed', String(n === s)));
});

initSettingsUI(settings);
renderStatus($('status'));
initMemoryUI({ list: $('memList'), form: $('memForm'), input: $('memInput'), wipeBtn: $('wipeBtn') });
initSensors({ face, settings });

// Voice menu
$('voiceHint').textContent = voice.canSpeak
  ? (voice.canListen ? "Microphone input uses Chrome's speech service and needs internet. Offline recognition is not built." : 'This browser cannot do voice input. Spoken replies work.')
  : 'This browser has no speech output.';
if (voice.canSpeak) {
  fillVoices(settings, voice.voices());
  speechSynthesis.addEventListener('voiceschanged', () => fillVoices(settings, voice.voices()));
}
$('testVoice').addEventListener('click', () => {
  const was = settings.speak;
  settings.speak = true;
  face.setState('speaking');
  if (!voice.speak('Hello. This is how I sound.', () => face.setState('idle'))) face.setState('idle');
  settings.speak = was;
});

// AI connection test
$('testAi').addEventListener('click', async () => {
  const out = $('aiResult');
  out.textContent = 'Testing…';
  try { await brain.ping(); out.textContent = 'Connected. Switch on "Use local model" to start using it.'; }
  catch (e) { out.textContent = `Could not reach ${settings.aiEndpoint}: ${e.name === 'AbortError' ? 'timed out' : e.message}. Is the server running? See the README.`; }
});

// Touch, wake and sleep
let lastActive = Date.now();
const touch = () => { lastActive = Date.now(); };
window.addEventListener('pointerdown', touch);
window.addEventListener('keydown', touch);
window.addEventListener('pointermove', (e) => {
  if (!settings.followTouch) return;
  const r = svg.getBoundingClientRect();
  face.lookAt((e.clientX - (r.left + r.width / 2)) / (r.width / 2), (e.clientY - (r.top + r.height * .4)) / (r.height / 2));
});
$('stage').addEventListener('pointerdown', () => {
  if (face.state === 'sleeping') face.setState('idle');
  else if (face.state === 'idle') face.flash('curious', 1600);
});
setInterval(() => {
  if (settings.autoSleep && face.state === 'idle' && Date.now() - lastActive > 90000) face.setState('sleeping');
}, 5000);

document.addEventListener('visibilitychange', () => (document.hidden ? face.stop() : face.start()));
face.start();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
