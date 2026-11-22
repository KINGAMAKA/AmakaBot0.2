// Conversation: typed or spoken input -> (memory | local model | preview reply) -> text and voice output.
// Talks to the face only through face.setState.
import * as memory from './memory.js';

const REMEMBER = /^(?:please\s+)?remember(?:\s+that|:)?\s+(.+)/i;
const RECALL = /what do you (?:remember|know about me)/i;

function pickReply(text) {
  const t = text.toLowerCase();
  if (/\b(hi|hello|hey|habari|muli bwanji|good (morning|afternoon|evening))\b/.test(t))
    return { mood: 'happy', line: "Hello. I'm Amaka. Right now I'm a face with no mind attached. That comes in a later version." };
  if (/\b(thanks|thank you|cheers)\b/.test(t)) return { mood: 'happy', line: "You're welcome." };
  if (/\b(sad|tired|stress|stressed|worried|problem|sick|angry|broke|lost|hurt)\b/.test(t))
    return { mood: 'concerned', line: "That sounds heavy. Once my language model is connected, I'll be able to help properly." };
  if (/\?\s*$/.test(t) || /^(what|why|how|who|when|where|can|could|do|does|is|are)\b/.test(t))
    return { mood: 'curious', line: "Good question. I can't answer it yet because my language model isn't connected." };
  return { mood: 'idle', line: "I received that. My language model isn't connected yet, so this is a preview reply." };
}

export function initChat({ face, form, input, log, micBtn, voice, brain, settings }) {
  let timers = [], fadeTimer = 0, runId = 0;
  const history = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const cancel = () => { timers.forEach(clearTimeout); timers = []; runId++; voice.cancelSpeech(); };

  function showLog() {
    log.classList.remove('faded');
    clearTimeout(fadeTimer);
    fadeTimer = setTimeout(() => { if (document.activeElement !== input) log.classList.add('faded'); }, 10000);
  }
  function add(kind, text, tag) {
    const li = document.createElement('li');
    li.className = kind;
    li.textContent = text;
    if (tag) { const s = document.createElement('span'); s.className = 'tag'; s.textContent = tag; li.appendChild(s); }
    log.appendChild(li);
    log.scrollTop = log.scrollHeight;
    showLog();
  }

  async function respond(text) {
    cancel();
    const my = runId;
    const started = Date.now();
    history.push({ role: 'user', content: text });
    memory.addMessage('user', text);
    face.setState('listening');
    later(() => face.setState('thinking'), 500);

    let line = '', mood = 'idle', tag = '', err = '';
    const rem = text.match(REMEMBER);
    if (rem) {
      await memory.addMemory(rem[1].trim());
      line = "Saved. I'll remember that."; mood = 'happy'; tag = 'Saved to memory';
    } else if (RECALL.test(text)) {
      const ms = await memory.listMemories();
      line = ms.length ? `I'm holding ${ms.length} thing${ms.length > 1 ? 's' : ''}: ` + ms.slice(-5).map((m) => m.text).join('; ') + '.'
        : "You haven't asked me to remember anything yet.";
      mood = 'curious'; tag = 'From memory';
    } else if (settings.aiEnabled) {
      try {
        const ms = await memory.listMemories();
        line = await brain.ask(history.slice(-8), ms.map((m) => m.text));
        if (!line) throw new Error('empty reply');
        tag = 'Local model'; mood = pickReply(text).mood;
      } catch (e) { line = ''; err = e.name === 'AbortError' ? 'timed out' : e.message; }
    }
    if (!line) {
      const r = pickReply(text);
      line = r.line; mood = r.mood;
      tag = err ? `Brain unreachable (${err}). Preview reply` : 'Preview reply, no AI connected';
    }
    if (my !== runId) return;
    await new Promise((r) => setTimeout(r, Math.max(0, 1300 - (Date.now() - started))));
    if (my !== runId) return;

    history.push({ role: 'assistant', content: line });
    memory.addMessage('assistant', line);
    add('amaka', line, tag);
    face.setState('speaking');
    let fin = false;
    const done = () => {
      if (fin || my !== runId) return;
      fin = true;
      face.setState(mood);
      later(() => face.setState('idle'), 2800);
    };
    if (voice.speak(line, done)) later(done, 30000);
    else later(done, Math.min(6000, 1200 + line.length * 45));
  }

  function send(text) {
    add('you', text);
    respond(text);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    send(text);
  });
  input.addEventListener('focus', showLog);

  // Microphone
  if (micBtn) {
    if (!voice.canListen) micBtn.hidden = true;
    micBtn.addEventListener('click', () => {
      if (voice.listening) { voice.stopListening(); return; }
      cancel();
      voice.listen();
    });
  }
  function onListening(on) {
    if (micBtn) micBtn.setAttribute('aria-pressed', String(on));
    if (on) face.setState('listening');
    else if (face.state === 'listening' && !timers.length) face.setState('idle');
  }
  function onVoiceError(code) {
    const msg = {
      'not-allowed': 'Microphone blocked. Allow it in Chrome: lock icon next to the address, then Permissions.',
      'service-not-allowed': 'Microphone blocked. Allow it in Chrome: lock icon next to the address, then Permissions.',
      'network': 'Voice input needs an internet connection in the browser.',
      'no-speech': "I didn't hear anything. Tap the microphone and try again.",
      'audio-capture': 'No microphone found.'
    }[code] || 'Voice input failed (' + code + ').';
    add('note', msg);
    if (!timers.length) face.setState('concerned'), later(() => face.setState('idle'), 1800);
  }

  // Restore the last conversation from this device
  memory.recentMessages(12).then((msgs) => {
    msgs.forEach((m) => {
      add(m.role === 'user' ? 'you' : 'amaka', m.text);
      history.push({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text });
    });
    if (!settings.aiEnabled) add('note', 'Replies are scripted previews until you connect a local model (menu, AI brain).');
  });

  return { cancel, send, onListening, onVoiceError, add };
}
