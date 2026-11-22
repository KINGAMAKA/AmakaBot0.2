// Memory manager in the menu: view, edit, add, delete.
import * as mem from './memory.js';

export function initMemoryUI({ list, form, input, wipeBtn }) {
  async function render() {
    const items = await mem.listMemories();
    list.textContent = '';
    if (!items.length) {
      const li = document.createElement('li');
      li.className = 'empty';
      li.textContent = 'Nothing saved yet. Type "remember that…" in the chat, or add something below.';
      list.appendChild(li);
      return;
    }
    items.forEach((m) => {
      const li = document.createElement('li');
      const span = document.createElement('span');
      span.textContent = m.text;
      const edit = document.createElement('button');
      edit.type = 'button'; edit.className = 'mini'; edit.textContent = 'Edit';
      edit.addEventListener('click', () => {
        const t = prompt('Edit memory', m.text);
        if (t && t.trim()) mem.updateMemory({ ...m, text: t.trim() });
      });
      const del = document.createElement('button');
      del.type = 'button'; del.className = 'mini'; del.textContent = 'Delete';
      del.addEventListener('click', () => mem.deleteMemory(m.id));
      li.append(span, edit, del);
      list.appendChild(li);
    });
  }
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const t = input.value.trim();
    if (t) { mem.addMemory(t); input.value = ''; }
  });
  wipeBtn.addEventListener('click', () => {
    if (confirm('Delete every saved memory and the chat history on this device?')) mem.wipeAll();
  });
  window.addEventListener('amaka:memory', render);
  render();
}
