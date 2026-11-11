/* Saves the language choice, points, streak and lesson results on this phone (localStorage).
   Each language pair is its own course: "susu-french" and "french-susu" keep separate points and streaks.
   Nothing is sent anywhere yet. The event list is kept so a future server
   can count users and lessons for sponsors (see readEvents). */
const Store = (() => {
  const KEY = 'fs-progress-v2';
  const OLD_KEY = 'fs-progress-v1'; // first prototype: Susu -> French only
  const EVENTS_KEY = 'fs-events-v1';
  const MAX_EVENTS = 200;
  let memory = null;

  function read(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage full or blocked: keep going */ }
  }

  function remove(key) {
    try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
  }

  function get() {
    if (!memory) {
      memory = read(KEY, null);
      if (!memory) {
        memory = { courses: {} };
        const old = read(OLD_KEY, null);
        if (old) {
          memory.deviceId = old.deviceId;
          memory.courses['susu-french'] = { points: old.points || 0, streak: old.streak || 0, lastDay: old.lastDay || null, lessons: old.lessons || {} };
        }
      }
      memory.courses = memory.courses || {};
      memory.deviceId = memory.deviceId || Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    }
    return memory;
  }

  function save() { write(KEY, get()); }

  function courseId() {
    const p = get();
    return p.speak + '-' + p.learn;
  }

  // Points, streak and lesson results for the current language pair.
  function course() {
    const p = get();
    const id = courseId();
    if (!p.courses[id]) p.courses[id] = { points: 0, streak: 0, lastDay: null, lessons: {} };
    return p.courses[id];
  }

  function setPair(speak, learn) {
    const p = get();
    p.speak = speak;
    p.learn = learn;
    save();
    logEvent('choose_languages', { speak, learn });
  }

  // "2026-11-09" in the phone's own time zone
  function dayString(d) {
    const pad = (n) => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function daysBetween(a, b) {
    const toUTC = (s) => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d); };
    return Math.round((toUTC(b) - toUTC(a)) / 86400000);
  }

  // Streak shown today: kept if the last lesson was today or yesterday, else 0.
  function currentStreak() {
    const c = course();
    if (!c.lastDay) return 0;
    return daysBetween(c.lastDay, dayString(new Date())) <= 1 ? c.streak : 0;
  }

  function finishLesson(lessonId, earned, correct, asked) {
    const c = course();
    const today = dayString(new Date());
    if (c.lastDay !== today) {
      const gap = c.lastDay ? daysBetween(c.lastDay, today) : null;
      c.streak = gap === 1 ? c.streak + 1 : 1;
      c.lastDay = today;
    }
    c.points += earned;
    const r = c.lessons[lessonId] || { best: 0, times: 0 };
    r.best = Math.max(r.best, earned);
    r.times += 1;
    r.last = { correct, asked, day: today };
    c.lessons[lessonId] = r;
    save();
    logEvent('lesson_done', { lesson: lessonId, points: earned, correct, asked });
  }

  function logEvent(type, data) {
    let events = read(EVENTS_KEY, []);
    events.push({ type, time: new Date().toISOString(), device: get().deviceId, course: courseId(), data: data || {} });
    if (events.length > MAX_EVENTS) events = events.slice(-MAX_EVENTS);
    write(EVENTS_KEY, events);
  }

  // For a future server: send these, then call clearEvents().
  function readEvents() { return read(EVENTS_KEY, []); }
  function clearEvents() { remove(EVENTS_KEY); }

  return { get, save, read, write, remove, course, courseId, setPair, currentStreak, finishLesson, logEvent, readEvents, clearEvents };
})();
