// AI brain: talks to a local llama.cpp server (OpenAI-compatible API), e.g. running in Termux.
// Nothing is connected until you switch it on in the menu and the server is running.
export function createBrain(settings) {
  const base = () => settings.aiEndpoint.trim().replace(/\/+$/, '');
  async function req(path, opt = {}, ms = 60000) {
    const c = new AbortController();
    const timer = setTimeout(() => c.abort(), ms);
    try {
      const r = await fetch(base() + path, { ...opt, signal: c.signal });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r;
    } finally { clearTimeout(timer); }
  }
  return {
    async ping() { await req('/v1/models', {}, 8000); return true; },
    async ask(history, memories) {
      let system = 'You are Amaka, a calm, wise and concise digital companion with an African-inspired presence. ' +
        'Reply in British English in one to three short sentences, because your words are spoken aloud. ' +
        'You cannot see, browse the internet or control the phone; never pretend otherwise.';
      if (memories.length) system += '\nThings the user asked you to remember:\n- ' + memories.join('\n- ');
      const body = { messages: [{ role: 'system', content: system }, ...history], max_tokens: 200, temperature: 0.7 };
      const r = await req('/v1/chat/completions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      const j = await r.json();
      return ((j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '').trim();
    }
  };
}
