/* The screens: Languages (first time), Home, Lesson, Result, Progress.
   "I speak" (speak) = language of the screens. "I want to learn" (learn) = language being taught.
   Text comes from Content (content.js). Points and streak are saved by Store (storage.js). */
(() => {
  const app = document.getElementById('app');
  const POINTS_PICK = 10;
  const POINTS_PAIR = 5;
  const CHUNK = 4;      // new words shown before they are tested
  const MAX_MATCH = 2;  // match-pairs rounds at the end of a lesson

  let screen = 'home';
  let run = null;       // the lesson being played
  let setupSpeak = null;
  let installPrompt = null;

  const ICONS = {
    star: '<path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"/>',
    flame: '<path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 1.5-5 3-6.5 0 2.5 1 4 2.5 4.5C11 8 10.5 5 12 2z"/>',
    home: '<path d="M3 11.5L12 4l9 7.5V21h-6v-6H9v6H3z"/>',
    chart: '<path d="M4 20v-9h4v9zm6 0V5h4v15zm6 0v-7h4v7z"/>',
    book: '<path d="M3 5c3-1 6-1 8 1v14c-2-2-5-2-8-1zm18 0c-3-1-6-1-8 1v14c2-2 5-2 8-1z"/>',
    check: '<path d="M4.5 12.5l5 5 10-11" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
    close: '<path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
    back: '<path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
    down: '<path d="M12 4v14M6 12l6 6 6-6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
    right: '<path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
    speaker: '<path d="M3 9h4l5-4v14l-5-4H3z"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    repeat: '<path d="M4 11a8 8 0 0 1 14-5M20 3v5h-5M20 13a8 8 0 0 1-14 5M4 21v-5h5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M4 20h16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>',
    pencil: '<path d="M4 20l1-4L16 5l3 3L8 19z"/>',
    swap: '<path d="M4 8h14M14 4l4 4-4 4M20 16H6M10 12l-4 4 4 4" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>',
  };
  const icon = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function buzz(pattern) {
    try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) { /* not supported */ }
  }

  function play(src) {
    if (!src) return;
    try { new Audio(src).play().catch(() => {}); } catch (e) { /* no audio */ }
  }

  /* ---------- Text helpers ---------- */

  // The purple tag shown wherever a translation is still missing.
  const missingTag = (code) => `<span class="missing">${esc(Content.language(code).name)}: TO BE TRANSLATED</span>`;

  // The tag shown next to words taken from books that no speaker has checked yet.
  const checkTag = '<span class="to-check">À vérifier / To check</span>';

  // App text as HTML, in "I speak". Missing: French text plus the yellow tag.
  function tx(key) {
    const r = Content.text(key);
    return esc(r.text) + (r.missing ? ' ' + missingTag(r.code) : '');
  }

  // App text as plain words (for screen-reader labels).
  const tp = (key) => Content.text(key).text;

  // Round language badge: colour + 2 letters, the same everywhere.
  function badge(code, size) {
    const l = Content.language(code);
    return `<span class="badge${size ? ' ' + size : ''}" style="--c:${esc(l.color)}" aria-hidden="true">${esc(l.symbol)}</span>`;
  }

  const langTag = (code) => `<span class="lang-tag">${badge(code, 'sm')}${esc(Content.language(code).name)}</span>`;

  // A word in one language. Missing: a stand-in word in italics plus the purple tag.
  // Draft (from books, not checked yet): the word plus the "To check" tag. withNote adds its short explanation.
  function wordHTML(w, code, cls, withNote) {
    const v = Content.word(w, code);
    if (v) {
      const note = withNote ? Content.note(w, code) : null;
      return `<span class="w"><span class="${cls}">${esc(v)}</span>${note ? `<span class="note">(${esc(note)})</span>` : ''}${Content.isDraft(w, code) ? checkTag : ''}</span>`;
    }
    const p = Content.pair();
    return `<span class="w"><span class="${cls} hint">${esc(Content.hint(w, [p.speak, p.learn]))}</span>${missingTag(code)}</span>`;
  }

  function wordPlain(w, code) {
    const p = Content.pair();
    return Content.word(w, code) || Content.hint(w, [p.speak, p.learn]);
  }

  // Lesson title in "I speak" (French with the yellow tag while missing).
  function lessonTitle(lesson) {
    const { speak } = Content.pair();
    const own = Content.title(lesson, speak);
    if (own) return esc(own);
    return esc(Content.title(lesson, 'french') || Content.title(lesson, 'english') || lesson.id) + ' ' + missingTag(speak);
  }

  /* ---------- Back button: Android "back" returns to Home instead of closing the app ---------- */

  function enter(name) {
    try {
      if (history.state) history.replaceState({ s: name }, '');
      else history.pushState({ s: name }, '');
    } catch (e) { /* ignore */ }
  }

  function goHome() {
    try {
      if (history.state) {
        history.back();
        setTimeout(() => { if (screen !== 'home') renderHome(); }, 300);
        return;
      }
    } catch (e) { /* ignore */ }
    renderHome();
  }

  window.addEventListener('popstate', () => {
    if (Content.pair()) renderHome();
    else renderSetup(1);
  });

  /* ---------- Shared pieces ---------- */

  // Red title band with the yellow points and streak. Home also gets the flag stripe above it.
  function topBar(withStripe) {
    const streak = Store.currentStreak();
    const band = `<header class="top">
      <span class="chip points" title="${esc(tp('points'))}">${icon('star')}${Store.course().points}</span>
      <span class="chip streak${streak ? '' : ' off'}" title="${esc(tp('streak'))}">${icon('flame')}${streak}</span>
    </header>`;
    return withStripe
      ? `<div class="home-head"><div class="flag-stripe" aria-hidden="true"><i></i><i></i><i></i></div>${band}</div>`
      : band;
  }

  function nav(active) {
    const item = (go, ic, key) =>
      `<button class="nav-btn" data-go="${go}"${active === go ? ' aria-current="page"' : ''}>${icon(ic)}<span>${tx(key)}</span></button>`;
    return `<nav class="nav">${item('home', 'home', 'home')}${item('progress', 'chart', 'progress')}</nav>`;
  }

  function sponsor() {
    const s = Content.sponsor();
    const body = esc(s.message.text) + (s.message.missing ? ' ' + missingTag(s.message.code) : '');
    const safeLink = /^https?:\/\//.test(s.link);
    return `<aside class="sponsor"><span class="sponsor-tag">${esc(tp('sponsor'))}</span>
      <span>${safeLink ? `<a href="${esc(s.link)}" target="_blank" rel="noopener">${body}</a>` : body}</span></aside>`;
  }

  /* ---------- Language choice (first screen) ---------- */

  // The question written in every language side by side, so anyone can find their own.
  function askAll(key, mine) {
    const langs = Content.languages();
    const ordered = mine ? [langs.find((l) => l.code === mine), ...langs.filter((l) => l.code !== mine)] : langs;
    return `<div class="ask">${ordered.map((l) => {
      const own = Content.textIn(key, l.code);
      return `<p class="ask-line${l.code === mine ? ' mine' : ''}">${badge(l.code)}${own ? `<span>${esc(own)}</span>` : missingTag(l.code)}</p>`;
    }).join('')}</div>`;
  }

  function renderSetup(step) {
    screen = 'setup';
    const langs = Content.languages();
    const choices = step === 1 ? langs : langs.filter((l) => l.code !== setupSpeak);
    const leftBtn = step === 2
      ? `<button class="icon-btn" data-act="setupBack" aria-label="${esc(tp('back'))}">${icon('back')}</button>`
      : Content.pair()
        ? `<button class="icon-btn" data-go="home" aria-label="${esc(tp('home'))}">${icon('close')}</button>`
        : '<span></span>';

    app.innerHTML = `<header class="setup-head">
        ${leftBtn}
        <div class="dots" aria-label="${step} / 2"><i class="on"></i><i class="${step === 2 ? 'on' : ''}"></i></div>
        <span></span>
      </header>
      <main class="stack">
        ${step === 2 ? `<div class="chosen">${badge(setupSpeak, 'lg')}${icon('right')}<span class="badge lg empty" aria-hidden="true">?</span></div>` : ''}
        ${askAll(step === 1 ? 'iSpeak' : 'iLearn', step === 2 ? setupSpeak : null)}
        <div class="choices">
          ${choices.map((l) => `<button class="choice" data-pick="${esc(l.code)}" data-step="${step}">${badge(l.code, 'lg')}<span>${esc(l.name)}</span></button>`).join('')}
        </div>
      </main>`;
    window.scrollTo(0, 0);
  }

  function pickLanguage(el) {
    const code = el.dataset.pick;
    play(Content.languageAudio(code));
    if (el.dataset.step === '1') {
      setupSpeak = code;
      renderSetup(2);
      return;
    }
    Store.setPair(setupSpeak, code);
    goHome();
  }

  function openSetup() {
    const p = Content.pair();
    setupSpeak = p ? p.speak : null;
    enter('setup');
    renderSetup(1);
  }

  /* ---------- Home ---------- */

  function renderHome() {
    if (!Content.pair()) { renderSetup(1); return; }
    screen = 'home';
    const { speak, learn } = Content.pair();
    const done = Store.course().lessons;

    app.innerHTML = `${topBar(true)}
      <main class="stack">
        <button class="course-btn" data-act="setup" aria-label="${esc(Content.language(speak).name)} → ${esc(Content.language(learn).name)}">
          <span class="course-pair">${badge(speak)}<span class="course-arrow">${icon('right')}</span>${badge(learn)}</span>
          <span class="course-change">${icon('swap')}<span>${tx('change')}</span></span>
        </button>
        <h1>${tx('lessons')}</h1>
        <ol class="lesson-list">
          ${Content.lessons().map((l, i) => {
            // Lesson name in the language being learned, when it differs from the name shown above it.
            const shown = Content.title(l, speak) || Content.title(l, 'french');
            const sub = Content.title(l, learn);
            return `<li><button class="lesson-btn" data-lesson="${i}">
              <span class="lesson-num">${i + 1}</span>
              <span class="lesson-text">
                <span class="lesson-title">${lessonTitle(l)}</span>
                <span class="lesson-sub">${sub && sub !== shown ? `${badge(learn, 'sm')}${esc(sub)}` : ''}<span class="count">${icon('book')}${l.words.length}</span></span>
              </span>
              ${done[l.id] ? `<span class="done-mark">${icon('check')}</span>` : ''}
            </button></li>`;
          }).join('')}
        </ol>
        ${installPrompt ? `<button class="btn secondary" data-install>${icon('download')}<span>${tx('install')}</span></button>` : ''}
        ${sponsor()}
        <p class="foot">
          <a href="edit.html">${icon('pencil')}<span>${tx('wordTable')}</span></a>
          ${Content.usingDraft() ? `<span>· ${tx('draftInUse')}</span>` : ''}
        </p>
      </main>
      ${nav('home')}`;
  }

  /* ---------- Lesson ---------- */

  // Words are taught in small groups: word cards, then questions on those words.
  // Half the questions go one way (pick), half the other way (reverse). Match-pairs rounds come at the end.
  function buildSteps(lesson) {
    const { speak, learn } = Content.pair();
    const words = lesson.words;
    const steps = [];
    for (let i = 0; i < words.length; i += CHUNK) {
      const group = words.slice(i, i + CHUNK);
      group.forEach((w) => steps.push({ type: 'card', word: w }));
      shuffle(group.slice()).forEach((w, k) => {
        const reverse = k % 2 === 1;
        const from = reverse ? learn : speak;
        const to = reverse ? speak : learn;
        steps.push({ type: 'pick', reverse, word: w, from, to, options: makeOptions(w, words, from, to) });
      });
    }
    matchGroups(words, speak, learn).forEach((group) => steps.push({ type: 'match', words: group }));
    return steps;
  }

  // Groups of 4 words for "match the pairs". Some words are written the same way
  // (Susu "I nu wali" = Salut, Comment ça va, Merci), so a group never holds two tiles that look alike.
  function matchGroups(words, speak, learn) {
    const pool = shuffle(words.slice());
    const groups = [];
    while (groups.length < MAX_MATCH) {
      const group = [];
      const seenL = new Set();
      const seenR = new Set();
      for (const w of pool) {
        if (group.length === 4) break;
        const l = wordPlain(w, speak);
        const r = wordPlain(w, learn);
        if (seenL.has(l) || seenR.has(r)) continue;
        group.push(w);
        seenL.add(l);
        seenR.add(r);
      }
      if (group.length < 4) break;
      groups.push(group);
      group.forEach((w) => pool.splice(pool.indexOf(w), 1));
    }
    return groups;
  }

  // The right word plus 2 wrong ones that look different, from the same lesson (or others if it is too small).
  // A wrong answer is never a word that is written the same as the question, or as the right answer.
  function makeOptions(word, words, from, to) {
    const answer = wordPlain(word, to);
    const question = wordPlain(word, from);
    const pickFrom = (list) => {
      const seen = new Set([answer]);
      return shuffle(list.slice()).filter((w) => {
        const v = wordPlain(w, to);
        if (w === word || seen.has(v) || wordPlain(w, from) === question) return false;
        seen.add(v);
        return true;
      });
    };
    let others = pickFrom(words);
    if (others.length < 2) others = pickFrom(Content.lessons().flatMap((l) => l.words));
    return shuffle([word, ...others.slice(0, 2)]);
  }

  function startLesson(index) {
    const lesson = Content.lessons()[index];
    if (!lesson || !lesson.words.length) return;
    run = { index, lesson, steps: buildSteps(lesson), i: 0, earned: 0, correct: 0, asked: 0, answered: false, match: null };
    Store.logEvent('lesson_start', { lesson: lesson.id });
    enter('lesson');
    renderStep();
  }

  function renderStep() {
    screen = 'lesson';
    const step = run.steps[run.i];
    run.answered = step.type === 'card';
    const pct = Math.round((run.i / run.steps.length) * 100);
    let body = '';
    if (step.type === 'card') body = cardHTML(step.word);
    if (step.type === 'pick') body = pickHTML(step);
    if (step.type === 'match') {
      run.match = { sel: null, done: 0, missed: new Set(), start: run.earned };
      body = matchHTML(step);
    }

    app.innerHTML = `<header class="lesson-head">
        <button class="icon-btn" data-act="quit" aria-label="${esc(tp('home'))}">${icon('close')}</button>
        <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><i style="width:${pct}%"></i></div>
      </header>
      <main class="stage">
        ${body}
        <div class="feedback-slot" id="fb" aria-live="polite"></div>
      </main>
      <footer class="lesson-foot">
        <button class="btn" id="next" data-act="next"${run.answered ? '' : ' hidden'}>${tx('continue')}</button>
      </footer>`;
    window.scrollTo(0, 0);
    showAudioButtons();

    const { learn } = Content.pair();
    if (step.type === 'card' || (step.type === 'pick' && step.reverse)) play(Content.audio(step.word, learn));
  }

  function pictureHTML(w) {
    const src = Content.picture(w);
    return src
      ? `<div class="pic"><img src="${esc(src)}" alt="${esc(wordPlain(w, Content.pair().learn))}"></div>`
      : `<div class="pic empty">${tx('picture')}</div>`;
  }

  // The speaker button stays hidden until its recording is found, so missing files show nothing.
  function audioHTML(w, code) {
    const src = Content.audio(w, code);
    return src ? `<button class="audio-btn" data-act="audio" data-src="${esc(src)}" aria-label="${esc(tp('listen'))}" hidden>${icon('speaker')}</button>` : '';
  }

  function showAudioButtons() {
    app.querySelectorAll('.audio-btn[hidden]').forEach((btn) => {
      try {
        const a = new Audio();
        a.preload = 'metadata';
        a.addEventListener('loadedmetadata', () => { btn.hidden = false; });
        a.src = btn.dataset.src;
      } catch (e) { /* no audio */ }
    });
  }

  function cardHTML(w) {
    const { speak, learn } = Content.pair();
    return `<p class="prompt">${tx('newWord')}</p>
      <section class="card">
        ${pictureHTML(w)}
        <div class="word-row">${langTag(speak)}${wordHTML(w, speak, 'word-src', true)}</div>
        <span class="arrow">${icon('down')}</span>
        <div class="word-row">${langTag(learn)}<span class="fr-line">${wordHTML(w, learn, 'word-fr', true)}${audioHTML(w, learn)}</span></div>
      </section>`;
  }

  function pickHTML(step) {
    const cls = step.reverse ? 'word-fr' : 'word-src';
    return `<p class="prompt">${tx(step.reverse ? 'chooseMeaning' : 'choose')}</p>
      <section class="card compact">
        ${langTag(step.from)}
        <span class="fr-line">${wordHTML(step.word, step.from, cls)}${step.reverse ? audioHTML(step.word, step.from) : ''}</span>
      </section>
      <div class="options">
        ${step.options.map((o, k) => `<button class="opt" data-act="pick" data-k="${k}">${wordHTML(o, step.to, 'opt-text')}</button>`).join('')}
      </div>`;
  }

  function matchHTML(step) {
    const { speak, learn } = Content.pair();
    const right = shuffle(step.words.map((w, k) => ({ w, k })));
    return `<p class="prompt">${tx('match')}</p>
      <div class="match">
        <div class="col">${langTag(speak)}${step.words.map((w, k) => `<button class="tile" data-act="tile" data-side="L" data-k="${k}">${wordHTML(w, speak, 'tile-text')}</button>`).join('')}</div>
        <div class="col">${langTag(learn)}${right.map(({ w, k }) => `<button class="tile" data-act="tile" data-side="R" data-k="${k}">${wordHTML(w, learn, 'tile-text')}</button>`).join('')}</div>
      </div>`;
  }

  function feedback(ok, html) {
    document.getElementById('fb').innerHTML =
      `<div class="feedback ${ok ? 'ok' : 'no'}">${icon(ok ? 'check' : 'close')}<span>${html}</span></div>`;
  }

  function showNext() {
    const btn = document.getElementById('next');
    btn.hidden = false;
    btn.focus({ preventScroll: true });
  }

  function pick(el) {
    if (run.answered) return;
    const step = run.steps[run.i];
    const ok = step.options[+el.dataset.k] === step.word;
    run.answered = true;
    run.asked++;
    app.querySelectorAll('.opt').forEach((b, k) => {
      b.disabled = true;
      if (step.options[k] === step.word) b.classList.add('right');
    });
    if (ok) {
      run.correct++;
      run.earned += POINTS_PICK;
      feedback(true, `${tx('right')} +${POINTS_PICK}`);
      buzz(30);
    } else {
      el.classList.add('wrong');
      feedback(false, `${tx('wrong')} ${esc(wordPlain(step.word, step.to))}`);
      buzz([60, 40, 60]);
    }
    play(Content.audio(step.word, Content.pair().learn));
    showNext();
  }

  function tile(el) {
    const m = run.match;
    const step = run.steps[run.i];
    if (el.disabled) return;

    // First tap, or a tap on the same column: (re)select this tile.
    if (!m.sel || m.sel.dataset.side === el.dataset.side) {
      const same = m.sel === el;
      if (m.sel) m.sel.classList.remove('sel');
      m.sel = same ? null : el;
      if (m.sel) m.sel.classList.add('sel');
      return;
    }

    const a = m.sel;
    a.classList.remove('sel');
    m.sel = null;

    if (a.dataset.k === el.dataset.k) {
      a.classList.add('ok');
      el.classList.add('ok');
      a.disabled = el.disabled = true;
      m.done++;
      run.asked++;
      if (!m.missed.has(a.dataset.k)) {
        run.correct++;
        run.earned += POINTS_PAIR;
      }
      buzz(30);
      if (m.done === step.words.length) {
        run.answered = true;
        feedback(true, `${tx('right')} +${run.earned - m.start}`);
        showNext();
      }
    } else {
      m.missed.add(a.dataset.k);
      m.missed.add(el.dataset.k);
      [a, el].forEach((x) => {
        x.classList.remove('bad');
        void x.offsetWidth; // restart the shake animation
        x.classList.add('bad');
        setTimeout(() => x.classList.remove('bad'), 600);
      });
      buzz([60, 40, 60]);
    }
  }

  function next() {
    if (!run || !run.answered) return;
    run.i++;
    if (run.i >= run.steps.length) {
      Store.finishLesson(run.lesson.id, run.earned, run.correct, run.asked);
      renderResult();
    } else {
      renderStep();
    }
  }

  /* ---------- Result ---------- */

  function renderResult() {
    screen = 'result';
    app.innerHTML = `<main class="result">
        <span class="big-star">${icon('star')}</span>
        <h1>${tx('done')}</h1>
        <p class="earned">+${run.earned}<span>${tx('points')}</span></p>
        <div class="stats">
          <div class="stat">${icon('check')}<b>${run.correct}/${run.asked}</b><span>${tx('correct')}</span></div>
          <div class="stat streak">${icon('flame')}<b>${Store.currentStreak()}</b><span>${tx('days')}</span></div>
        </div>
        ${sponsor()}
        <div class="actions">
          <button class="btn" data-go="home">${tx('continue')}</button>
          <button class="btn secondary" data-act="again">${tx('again')}</button>
        </div>
      </main>`;
    window.scrollTo(0, 0);
  }

  /* ---------- Progress (for the current language pair only) ---------- */

  function renderProgress() {
    screen = 'progress';
    const { speak, learn } = Content.pair();
    const c = Store.course();
    const lessons = Content.lessons();
    const done = lessons.filter((l) => c.lessons[l.id]);
    const wordsSeen = done.reduce((n, l) => n + l.words.length, 0);
    const stat = (ic, cls, value, key) => `<div class="stat ${cls}">${icon(ic)}<b>${value}</b><span>${tx(key)}</span></div>`;

    app.innerHTML = `${topBar()}
      <main class="stack">
        <h1>${tx('progress')}</h1>
        <p class="course-line">${badge(speak)}${icon('right')}${badge(learn)}<span>${esc(Content.language(speak).name)} → ${esc(Content.language(learn).name)}</span></p>
        <div class="tiles">
          ${stat('star', 'gold', c.points, 'points')}
          ${stat('flame', 'streak', Store.currentStreak(), 'days')}
          ${stat('check', '', `${done.length}/${lessons.length}`, 'lessonsDone')}
          ${stat('book', '', wordsSeen, 'wordsLearned')}
        </div>
        <ol class="lesson-list">
          ${lessons.map((l, i) => {
            const r = c.lessons[l.id];
            return `<li class="prog-row">
              <span class="lesson-num">${i + 1}</span>
              <span class="lesson-text">
                <span class="lesson-title">${lessonTitle(l)}</span>
                <span class="lesson-sub">${r
                  ? `<span class="count" title="${esc(tp('best'))}">${icon('star')}${r.best}</span><span class="count" title="${esc(tp('played'))}">${icon('repeat')}${r.times}</span>`
                  : '—'}</span>
              </span>
              ${r ? `<span class="done-mark">${icon('check')}</span>` : ''}
            </li>`;
          }).join('')}
        </ol>
      </main>
      ${nav('progress')}`;
  }

  /* ---------- Taps ---------- */

  const actions = {
    next,
    pick,
    tile,
    quit: goHome,
    setup: openSetup,
    setupBack: () => renderSetup(1),
    again: () => startLesson(run.index),
    audio: (el) => play(el.dataset.src),
  };

  app.addEventListener('click', (e) => {
    const el = e.target.closest('button');
    if (!el || !app.contains(el)) return;
    if (el.dataset.go === 'home') return goHome();
    if (el.dataset.go === 'progress') { enter('progress'); return renderProgress(); }
    if (el.dataset.pick) return pickLanguage(el);
    if (el.dataset.lesson != null) return startLesson(+el.dataset.lesson);
    if ('install' in el.dataset) return install();
    if (el.dataset.act && actions[el.dataset.act]) return actions[el.dataset.act](el);
  });

  /* ---------- Install button (Android Chrome) ---------- */

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installPrompt = e;
    if (screen === 'home') renderHome();
  });

  function install() {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.finally(() => {
      installPrompt = null;
      if (screen === 'home') renderHome();
    });
  }

  /* ---------- Start ---------- */

  function showLoadError(err) {
    const file = err.file || 'lessons.json';
    const where = err.line
      ? `Erreur à la ligne ${err.line} de ${file}. / Mistake on line ${err.line} of ${file}.`
      : `Le fichier ${file} ne charge pas. / ${file} did not load.`;
    const fileHint = location.protocol === 'file:'
      ? '<p>Ouvre l’appli avec une adresse web (http…), pas comme fichier. / Open the app from a web address, not as a file.</p>'
      : '';
    app.innerHTML = `<main class="stack error">
        <h1>${esc(file)}</h1>
        <p>${esc(where)}</p>
        ${fileHint}
        <p class="small">${esc(err.detail || err.message)}</p>
        <p><a href="edit.html">Table des mots / Word table</a></p>
      </main>`;
  }

  Content.load().then(renderHome).catch(showLoadError);

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    try { navigator.serviceWorker.register('sw.js').catch(() => {}); } catch (e) { /* not allowed here */ }
  }
})();
