// Voice: browser speech recognition (input) and speech synthesis (output).
// Chrome's recognition sends audio to Google, so it needs internet. Offline voice is NOT implemented.
export function createVoice(settings, { onText, onError, onListening }) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const canListen = !!SR;
  const canSpeak = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  let rec = null, listening = false;

  function listen() {
    if (!canListen || listening) return;
    rec = new SR();
    rec.lang = 'en-GB';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onstart = () => { listening = true; onListening(true); };
    rec.onresult = (e) => { const t = e.results[0][0].transcript.trim(); if (t) onText(t); };
    rec.onerror = (e) => onError(e.error);
    rec.onend = () => { listening = false; onListening(false); };
    try { rec.start(); } catch (e) { onError('start-failed'); }
  }
  function stopListening() { if (rec && listening) rec.stop(); }

  function speak(text, onend) {
    if (!canSpeak || !settings.speak) return false;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = speechSynthesis.getVoices().find((x) => x.name === settings.voiceName);
    if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'en-GB';
    u.rate = settings.rate;
    let done = false;
    const end = () => { if (!done) { done = true; onend && onend(); } };
    u.onend = end; u.onerror = end;
    speechSynthesis.speak(u);
    return true;
  }
  return {
    canListen, canSpeak, listen, stopListening, speak,
    cancelSpeech: () => { if (canSpeak) speechSynthesis.cancel(); },
    voices: () => (canSpeak ? speechSynthesis.getVoices() : []),
    get listening() { return listening; }
  };
}
