/* Word table: shows every word and every app text in all languages,
   so native speakers can read and correct any of them.
   Changes are kept on this phone (the app uses them right away)
   and can be downloaded as new lessons.json / ui-text.json files to send back. */
(() => {
  const KEYS = { lessons: 'fs-draft-lessons-v1', ui: 'fs-draft-ui-v1', hidden: 'fs-edit-hidden-v1' }; // same draft keys as content.js
  const FILE_NAMES = { lessons: 'lessons.json', ui: 'ui-text.json' };
  const MISSING = 'TO BE TRANSLATED';
  const FILES_COLUMN = 'files'; // picture + audio, shown or hidden together
  const $ = (id) => document.getElementById(id);
  const files = { lessons: null, ui: null };
  const drafts = { lessons: false, ui: false };
  let hidden = new Set();

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const isMissing = (v) => !v || !String(v).trim() || String(v).trim().toUpperCase() === MISSING;

  function read(key) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch (e) { return null; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; }
  }
  function remove(key) {
    try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
  }

  function saveDraft(kind) {
    if (write(KEYS[kind], files[kind])) drafts[kind] = true;
    else say('Pas de place sur ce téléphone. Télécharge le fichier. / No space: download the file.');
  }

  // This phone's changes are used, unless they were made on an older version of the file:
  // then the new file is shown and the old changes are kept aside (key ...-old), not lost.
  let oldSetAside = false;
  async function loadFile(kind) {
    const draft = read(KEYS[kind]);
    const hasDraft = draft && typeof draft === 'object';
    const name = FILE_NAMES[kind];
    let text;
    try {
      text = await (await fetch(name, { cache: 'no-store' })).text();
    } catch (err) {
      if (hasDraft) { files[kind] = draft; drafts[kind] = true; return; }
      throw err;
    }
    let official;
    try {
      official = JSON.parse(text);
    } catch (err) {
      const pos = /position (\d+)/.exec(err.message);
      const line = /line (\d+)/.exec(err.message);
      const n = line ? line[1] : pos ? text.slice(0, +pos[1]).split('\n').length : '?';
      throw new Error(`Erreur à la ligne ${n} de ${name} / Mistake on line ${n} of ${name}. (${err.message})`);
    }
    if (hasDraft && (draft.version || 0) >= (official.version || 0)) {
      files[kind] = draft;
      drafts[kind] = true;
      return;
    }
    if (hasDraft) {
      write(KEYS[kind] + '-old', draft);
      remove(KEYS[kind]);
      oldSetAside = true;
    }
    files[kind] = official;
    drafts[kind] = false;
  }

  const NO_STATUS = ['french', 'english']; // only learner languages get "draft" / "confirmed"

  // Every language with a block in ui-text.json.
  function languages() {
    return Object.entries(files.ui.languages || {}).map(([code, l]) => ({ code, name: l.name || code, symbol: l.symbol || code.slice(0, 2).toUpperCase(), color: l.color || '' }));
  }
  const shownLanguages = () => languages().filter((l) => !hidden.has(l.code));

  function wordColumns() {
    const cols = shownLanguages().map((l) => ({ key: l.code, label: l.name, lang: true }));
    if (!hidden.has(FILES_COLUMN)) cols.push({ key: 'picture', label: 'Image (fichier)', media: true }, { key: 'audio', label: 'Audio (fichier)', media: true });
    return cols;
  }

  function cell(path, value, col) {
    const todo = col.lang && isMissing(value);
    const shown = todo ? '' : value || '';
    const id = 'f-' + path.replace(/\./g, '-');
    return `<td data-label="${esc(col.label)}"><input id="${id}" data-path="${esc(path)}"${col.lang ? ' data-lang="1"' : ''}
      class="${todo ? 'todo' : ''}" value="${esc(shown)}" placeholder="${col.lang ? MISSING : ''}"
      aria-label="${esc(col.label)}" autocomplete="off" spellcheck="false"></td>`;
  }

  // A word in one language: the word, then "To check" + Confirm for drafts, then its alt and note if it has them.
  function wordCell(li, wi, w, col) {
    if (!col.lang) return cell(`w.${li}.${wi}.${col.key}`, w[col.key], col);
    const at = `${li}.${wi}.${col.key}`;
    const id = (kind) => `f-${kind}-${at.replace(/\./g, '-')}`;
    const value = w[col.key];
    const todo = isMissing(value);
    const draft = !todo && w.status && w.status[col.key] === 'draft';
    const extra = (kind, label, v) => (v
      ? `<label class="extra">${label} <input id="${id(kind)}" data-path="${kind}.${at}" value="${esc(v)}" autocomplete="off" spellcheck="false"></label>`
      : '');
    return `<td data-label="${esc(col.label)}">
      <input id="${id('w')}" data-path="w.${at}" data-lang="1" class="${todo ? 'todo' : ''}" value="${esc(todo ? '' : value)}"
        placeholder="${MISSING}" aria-label="${esc(col.label)}" autocomplete="off" spellcheck="false">
      ${draft ? `<div class="check-row"><span class="to-check">À vérifier / To check</span><button class="confirm" data-confirm="${at}">✓ Confirmé / Confirmed</button></div>` : ''}
      ${extra('a', 'alt', w.alt && w.alt[col.key])}
      ${extra('o', 'note', w.note && w.note[col.key])}
    </td>`;
  }

  /* ---------- Show / hide language columns ---------- */

  function renderToggles() {
    const chip = (code, label, symbol, color) =>
      `<button class="toggle" data-toggle="${esc(code)}" aria-pressed="${!hidden.has(code)}"><i style="--c:${esc(color)}">${esc(symbol)}</i>${esc(label)}</button>`;
    $('toggles').innerHTML = languages().map((l) => chip(l.code, l.name, l.symbol, l.color)).join('') +
      chip(FILES_COLUMN, 'Fichiers / Files', '…', '');
  }

  $('toggles').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-toggle]');
    if (!btn) return;
    const code = btn.dataset.toggle;
    if (hidden.has(code)) hidden.delete(code);
    else hidden.add(code);
    write(KEYS.hidden, [...hidden]);
    render();
  });

  /* ---------- Tables ---------- */

  function renderWords() {
    const cols = wordColumns();
    $('words').innerHTML = (files.lessons.lessons || []).map((l, li) => {
      const title = l.title || {};
      return `<section>
        <h2>${li + 1}. ${esc(title.french || l.id)} <small>${esc(title.english || '')}</small></h2>
        <div class="scroll"><table>
          <thead><tr><th>#</th>${cols.map((c) => `<th>${esc(c.label)}</th>`).join('')}<th class="print-only">Correction</th></tr></thead>
          <tbody>
            <tr class="title-row"><td class="num">Titre</td>${cols.map((c) => (c.media ? '<td class="empty"></td>' : cell(`t.${li}.${c.key}`, title[c.key], c))).join('')}<td class="print-only"></td></tr>
            ${(l.words || []).map((w, wi) => `<tr><td class="num">${wi + 1}</td>${cols.map((c) => wordCell(li, wi, w, c)).join('')}<td class="print-only"></td></tr>`).join('')}
          </tbody>
        </table></div>
        <button class="btn add" data-add="${li}">+ Ajouter un mot / Add a word</button>
      </section>`;
    }).join('');
  }

  // App text: one row per message, one column per language.
  function renderUi() {
    const langs = shownLanguages();
    const blocks = files.ui.languages || {};
    const fallback = blocks[files.ui.fallback || 'french'] || {};
    const keys = [...new Set([
      ...Object.keys(fallback.text || {}),
      ...Object.values(blocks).flatMap((b) => Object.keys(b.text || {})),
    ])];
    const cols = langs.map((l) => ({ key: l.code, label: l.name, lang: true }));
    $('ui').innerHTML = `<div class="scroll"><table>
      <thead><tr><th class="hint-col">Code</th>${cols.map((c) => `<th>${esc(c.label)}</th>`).join('')}<th class="print-only">Correction</th></tr></thead>
      <tbody>
        <tr class="title-row"><td class="key">Nom de la langue / Language name</td>${cols.map((c) => cell(`n.${c.key}`, (blocks[c.key] || {}).name, { ...c, lang: false })).join('')}<td class="print-only"></td></tr>
        ${keys.map((k) => `<tr><td class="key">${esc(k)}</td>${cols.map((c) => cell(`u.${c.key}.${k}`, ((blocks[c.key] || {}).text || {})[k], c)).join('')}<td class="print-only"></td></tr>`).join('')}
      </tbody>
    </table></div>`;
  }

  function render() {
    renderToggles();
    renderWords();
    renderUi();
    updateStatus();
  }

  // Per language: words still to translate and words still to check, e.g. "Susu: 2 à traduire, 26 à vérifier".
  function updateStatus() {
    const lines = languages().map((l) => {
      let todo = 0;
      let check = 0;
      (files.lessons.lessons || []).forEach((les) => (les.words || []).forEach((w) => {
        if (isMissing(w[l.code])) todo++;
        else if (w.status && w.status[l.code] === 'draft') check++;
      }));
      return `<li><b>${esc(l.name)}</b>: ${todo} à traduire / to translate${check ? `, ${check} à vérifier / to check` : ''}</li>`;
    });
    const anyDraft = drafts.lessons || drafts.ui;
    $('status').innerHTML = `<ul class="counts">${lines.join('')}</ul>` +
      [
        anyDraft ? 'Changements gardés sur ce téléphone / Changes saved on this phone' : '',
        oldSetAside ? 'Anciens changements mis de côté (fichier plus récent) / Older changes set aside (newer file)' : '',
      ].filter(Boolean).join('<br>');
  }

  /* ---------- Typing ---------- */

  document.addEventListener('input', (e) => {
    const el = e.target;
    if (!el.dataset || !el.dataset.path) return;
    const [kind, a, b, c] = el.dataset.path.split('.');
    const isLang = el.dataset.lang === '1';
    const value = isLang && !el.value.trim() ? MISSING : el.value;

    if (kind === 't' || kind === 'w' || kind === 'a' || kind === 'o') {
      const lesson = files.lessons.lessons[+a];
      if (kind === 't') {
        lesson.title = lesson.title || {};
        lesson.title[b] = value;
      } else if (kind === 'w') {
        const w = lesson.words[+b];
        w[c] = value;
        // A speaker edited the word: it is no longer a draft.
        if (!NO_STATUS.includes(c)) {
          w.status = w.status || {};
          if (isMissing(value)) delete w.status[c];
          else w.status[c] = 'confirmed';
          const row = el.closest('td').querySelector('.check-row');
          if (row) row.remove();
        }
      } else {
        // alt or note: an empty box removes it
        const field = kind === 'a' ? 'alt' : 'note';
        const w = lesson.words[+b];
        w[field] = w[field] || {};
        if (el.value.trim()) w[field][c] = el.value;
        else delete w[field][c];
      }
      saveDraft('lessons');
    } else {
      const block = files.ui.languages[a];
      if (kind === 'n') block.name = el.value;
      else {
        block.text = block.text || {};
        block.text[b] = value;
      }
      saveDraft('ui');
    }
    if (isLang) el.classList.toggle('todo', isMissing(el.value));
    updateStatus();
  });

  // "Confirmé / Confirmed": a speaker checked the draft word and it is right.
  $('words').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-confirm]');
    if (!btn) return;
    const [li, wi, code] = btn.dataset.confirm.split('.');
    const w = files.lessons.lessons[+li].words[+wi];
    w.status = w.status || {};
    w.status[code] = 'confirmed';
    saveDraft('lessons');
    btn.closest('.check-row').remove();
    updateStatus();
    say('Confirmé / Confirmed');
  });

  $('words').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-add]');
    if (!btn) return;
    const li = +btn.dataset.add;
    const lesson = files.lessons.lessons[li];
    const word = {};
    languages().forEach((l) => { word[l.code] = MISSING; });
    word.picture = '';
    word.audio = '';
    lesson.words = lesson.words || [];
    lesson.words.push(word);
    saveDraft('lessons');
    render();
    const rows = $('words').querySelectorAll('section')[li].querySelectorAll('tbody tr');
    const first = rows[rows.length - 1].querySelector('input');
    if (first) first.focus();
  });

  /* ---------- Download / copy ---------- */

  const json = (kind) => JSON.stringify(files[kind], null, 2) + '\n';

  let noteTimer = null;
  function say(text) {
    $('note').textContent = text;
    clearTimeout(noteTimer);
    noteTimer = setTimeout(() => { $('note').textContent = ''; }, 4000);
  }

  function download(kind) {
    const blob = new Blob([json(kind)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = FILE_NAMES[kind];
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    say(`${FILE_NAMES[kind]} téléchargé / downloaded`);
  }

  let rawKind = 'lessons';
  function showRaw(kind) {
    rawKind = kind;
    $('rawLabel').textContent = `${FILE_NAMES[kind]} : texte / text`;
    $('raw').open = true;
    $('rawText').value = json(kind);
    $('rawText').focus();
    $('rawText').select();
  }

  function copy(kind) {
    const fallback = () => { showRaw(kind); say('Sélectionne et copie le texte en bas. / Select and copy the text below.'); };
    try {
      navigator.clipboard.writeText(json(kind)).then(() => say(`${FILE_NAMES[kind]} copié / copied`), fallback);
    } catch (e) {
      fallback();
    }
  }

  document.addEventListener('click', (e) => {
    const d = e.target.closest('[data-download]');
    if (d) return download(d.dataset.download);
    const c = e.target.closest('[data-copy]');
    if (c) return copy(c.dataset.copy);
  });

  $('raw').addEventListener('toggle', () => { if ($('raw').open) $('rawText').value = json(rawKind); });

  // Printing is not possible when this page is shown inside another page.
  if (window.top !== window.self) $('print').hidden = true;
  $('print').addEventListener('click', () => window.print());

  // Two taps to erase, so it does not happen by mistake.
  let resetArmed = null;
  $('reset').addEventListener('click', async () => {
    const btn = $('reset');
    if (!resetArmed) {
      btn.textContent = 'Sûr ? Appuie encore / Tap again';
      resetArmed = setTimeout(() => { resetArmed = null; btn.textContent = 'Effacer mes changements'; }, 4000);
      return;
    }
    clearTimeout(resetArmed);
    resetArmed = null;
    btn.textContent = 'Effacer mes changements';
    remove(KEYS.lessons);
    remove(KEYS.ui);
    await start();
    say('Changements effacés / Changes erased');
  });

  async function start() {
    hidden = new Set(read(KEYS.hidden) || []);
    try {
      await Promise.all([loadFile('lessons'), loadFile('ui')]);
      render();
    } catch (err) {
      $('words').innerHTML = `<p>${esc(err.message)}</p>`;
      $('status').textContent = '';
    }
  }

  start();
})();
