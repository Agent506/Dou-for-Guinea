/* Where the text comes from.
   lessons.json = the words (one field per language). ui-text.json = the app's own text (one block per language).
   Corrections typed on this phone in the word table (edit.html) are used first.
   Later: change getFile() to download from a server; the rest of the app does not need to change. */
const Content = (() => {
  const LESSONS_DRAFT = 'fs-draft-lessons-v1';
  const UI_DRAFT = 'fs-draft-ui-v1';
  const MISSING = 'TO BE TRANSLATED';
  let lessonData = null;
  let ui = null;
  let lessonCache = null;
  const drafts = { lessons: false, ui: false };

  async function load() {
    [lessonData, ui] = await Promise.all([
      getFile('lessons.json', LESSONS_DRAFT, 'lessons'),
      getFile('ui-text.json', UI_DRAFT, 'ui'),
    ]);
    lessonCache = null;
  }

  // Corrections typed on this phone win, unless they were made on an older version of the file
  // (then the new file is used, so new words and languages show up).
  async function getFile(name, draftKey, kind) {
    const draft = Store.read(draftKey, null);
    const hasDraft = draft && typeof draft === 'object';
    let official;
    try {
      const res = await fetch(name);
      if (!res.ok) {
        const e = new Error(name + ': ' + res.status);
        e.file = name;
        throw e;
      }
      official = parseJSON(name, await res.text());
    } catch (err) {
      if (hasDraft && !err.detail) { drafts[kind] = true; return draft; } // file not reachable: use this phone's copy
      throw err;
    }
    if (hasDraft && (draft.version || 0) >= (official.version || 0)) {
      drafts[kind] = true;
      return draft;
    }
    return official;
  }

  // Turns a JSON mistake into a line number a person can find in the file.
  function parseJSON(name, text) {
    try {
      return JSON.parse(text);
    } catch (err) {
      const e = new Error(name);
      e.file = name;
      e.detail = err.message;
      const byLine = /line (\d+)/.exec(err.message);
      const byPos = /position (\d+)/.exec(err.message);
      if (byLine) e.line = +byLine[1];
      else if (byPos) e.line = text.slice(0, +byPos[1]).split('\n').length;
      throw e;
    }
  }

  const isMissing = (v) => !v || !String(v).trim() || String(v).trim().toUpperCase() === MISSING;
  const clean = (v) => (isMissing(v) ? null : String(v).trim());

  // Every language with a block in ui-text.json, in file order.
  function languages() {
    return Object.entries((ui && ui.languages) || {}).map(([code, l]) => ({
      code,
      name: l.name || code,
      symbol: l.symbol || code.slice(0, 2).toUpperCase(),
      color: l.color || '#17804A',
      audio: l.audio || '',
    }));
  }

  function language(code) {
    return languages().find((l) => l.code === code) || { code, name: code, symbol: code.slice(0, 2).toUpperCase(), color: '#17804A', audio: '' };
  }

  // The saved choice, or null when it is missing or no longer valid.
  function pair() {
    const { speak, learn } = Store.get();
    const codes = languages().map((l) => l.code);
    if (!codes.includes(speak) || !codes.includes(learn) || speak === learn) return null;
    return { speak, learn };
  }

  // App text in the "I speak" language. When it is missing: French text, marked missing.
  function text(key, code) {
    code = code || Store.get().speak;
    const own = textIn(key, code);
    if (own) return { text: own, missing: false, code };
    const other = textIn(key, ui.fallback || 'french');
    return { text: other || key, missing: true, code };
  }

  // App text in one language only, or null.
  function textIn(key, code) {
    const block = (ui.languages || {})[code];
    return block && block.text ? clean(block.text[key]) : null;
  }

  // A word in one language, or null while it is not translated.
  function word(w, code) { return clean(w[code]); }

  // True when the word comes from a book and no speaker has checked it yet ("status": "draft").
  function isDraft(w, code) { return !!(clean(w[code]) && w.status && w.status[code] === 'draft'); }

  // Short explanation for a word, like "respectful" or "also means child".
  function note(w, code) { return (w.note && clean(w.note[code])) || null; }

  // Stand-in for a missing word: the first filled-in language that is not already on screen.
  function hint(w, exclude) {
    const order = ['english', 'french', ...languages().map((l) => l.code)];
    for (const code of order) {
      const v = exclude.includes(code) ? null : clean(w[code]);
      if (v) return v;
    }
    return '…';
  }

  function lessons() {
    if (!lessonCache) {
      const codes = languages().map((l) => l.code);
      lessonCache = (lessonData.lessons || []).map((l, i) => ({
        ...l,
        id: l.id || 'lesson-' + (i + 1),
        title: l.title || {},
        words: (l.words || []).filter((w) => w && codes.some((c) => clean(w[c]))),
      }));
    }
    return lessonCache;
  }

  function title(lesson, code) { return clean(lesson.title[code]); }

  // "bonjour.jpg" -> "pictures/bonjour.jpg"; full paths and web addresses are used as they are.
  function picture(w) {
    const name = clean(w.picture);
    if (!name) return null;
    return name.includes('/') || name.includes(':') ? name : 'pictures/' + name;
  }

  // "bonjour.mp3" in French -> "audio/french/bonjour.mp3". Each language has its own recordings.
  function audio(w, code) {
    const name = clean(w.audio);
    if (!name) return null;
    if (name.includes('/') || name.includes(':')) return name;
    return 'audio/' + code + '/' + (/\.[a-z0-9]{2,4}$/i.test(name) ? name : name + '.mp3');
  }

  function languageAudio(code) {
    const name = clean(language(code).audio);
    if (!name) return null;
    return name.includes('/') || name.includes(':') ? name : 'audio/' + name;
  }

  function sponsor() { return { message: text('sponsorMessage'), link: (ui && ui.sponsorLink) || '' }; }

  return {
    load, languages, language, pair, text, textIn, word, isDraft, note, hint, lessons, title, picture, audio, languageAudio, sponsor, isMissing,
    usingDraft: () => drafts.lessons || drafts.ui,
  };
})();
