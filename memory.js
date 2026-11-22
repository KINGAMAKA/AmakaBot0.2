// Local memory (IndexedDB, on this device only): saved facts + recent chat history.
// Every call is safe: if storage is unavailable it returns an empty result instead of throwing.
let dbp;
function db() {
  if (!dbp) dbp = new Promise((res, rej) => {
    const r = indexedDB.open('amaka-db', 1);
    r.onupgradeneeded = () => {
      r.result.createObjectStore('memories', { keyPath: 'id', autoIncrement: true });
      r.result.createObjectStore('messages', { keyPath: 'id', autoIncrement: true });
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  return dbp;
}
function run(store, mode, fn) {
  return db().then((d) => new Promise((res, rej) => {
    const t = d.transaction(store, mode);
    const req = fn(t.objectStore(store));
    t.oncomplete = () => res(req ? req.result : undefined);
    t.onerror = () => rej(t.error);
  }));
}
const changed = () => window.dispatchEvent(new Event('amaka:memory'));
const safe = (fn, fallback, notify) => (...a) => fn(...a).then((v) => { if (notify) changed(); return v; }).catch(() => fallback);

export const listMemories = safe(() => run('memories', 'readonly', (s) => s.getAll()), []);
export const addMemory = safe((text) => run('memories', 'readwrite', (s) => s.add({ text, created: Date.now() })), null, true);
export const updateMemory = safe((m) => run('memories', 'readwrite', (s) => s.put(m)), null, true);
export const deleteMemory = safe((id) => run('memories', 'readwrite', (s) => s.delete(id)), null, true);
export const addMessage = safe((role, text) => run('messages', 'readwrite', (s) => s.add({ role, text, at: Date.now() })), null);
export const recentMessages = (n) => run('messages', 'readonly', (s) => s.getAll()).then((a) => a.slice(-n)).catch(() => []);
export const wipeAll = safe(() => Promise.all([run('memories', 'readwrite', (s) => s.clear()), run('messages', 'readwrite', (s) => s.clear())]), null, true);
