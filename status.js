// Honest feature list shown in the menu. Update this file whenever a feature changes status.
// working = confirmed on the phone | test = built, needs testing on the phone | planned = not built yet
export const FEATURES = [
  { name: 'Animated face and expressions', state: 'working', note: 'Confirmed on your phone' },
  { name: 'Text chat', state: 'working', note: 'Preview replies unless the local model is on' },
  { name: 'Voice input', state: 'test', note: "Chrome's speech service, needs internet" },
  { name: 'Spoken replies', state: 'test', note: "Uses the phone's built-in voices" },
  { name: 'Local AI brain', state: 'test', note: 'Needs a llama.cpp server on this phone. Untested' },
  { name: 'Memory and chat history', state: 'test', note: 'Saved on this device, editable in the menu' },
  { name: 'Shake reaction', state: 'test', note: 'Phone motion sensor' },
  { name: 'Install and offline', state: 'test', note: 'Interface works offline; voice and AI need their own connections' },
  { name: 'Offline voice and "Hey Amaka"', state: 'planned', note: 'Needs the native Android app' },
  { name: 'Camera and vision', state: 'planned', note: 'Version 0.6' },
  { name: 'Tilt and proximity', state: 'planned', note: 'Version 0.7, rest of sensors' },
  { name: '3D avatar', state: 'planned', note: 'Version 0.8' },
  { name: 'Android actions', state: 'planned', note: 'Version 0.9, native app' }
];

const LABEL = { working: 'Working', test: 'Needs your test', planned: 'Planned' };

export function renderStatus(list) {
  FEATURES.forEach((f) => {
    const li = document.createElement('li');
    const left = document.createElement('div');
    left.textContent = f.name;
    const small = document.createElement('small');
    small.textContent = f.note;
    left.appendChild(small);
    const badge = document.createElement('span');
    badge.className = 'badge ' + f.state;
    badge.textContent = LABEL[f.state];
    li.append(left, badge);
    list.appendChild(li);
  });
}
