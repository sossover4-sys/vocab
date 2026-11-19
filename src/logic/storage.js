// שמירת ההתקדמות בזיכרון הדפדפן (localStorage), גיבוי ומיזוג.
// זה המקום היחיד שנוגע באחסון – כשיהיה סנכרון, רק הקובץ הזה ישתנה.

import { countGreen, milestoneFor } from './milestones.js';

const KEY = 'vocab-progress';
export const VERSION = 3;

export const DEFAULT_SETTINGS = {
  roundSize: 8,
  dailyNew: 10,
  matchPairs: 8,
  sentenceCount: 10,
  dailyGoal: 20,
  wordMode: 'smart', // smart = חכם, new = רק חדשות, mixed = מעורבב
  sound: true, // צלילים בחגיגות
  theme: 'auto', // auto = לפי הטלפון, light = בהיר, dark = כהה
  direction: 'en-he', // כרטיסיות: en-he = רואים אנגלית, he-en = רואים עברית
  speechRate: 0.9,
  voiceEn: '',
  voiceHe: '',
};

export function emptyProgress() {
  return {
    version: VERSION,
    words: {}, // id → { color, due, streak, seen, firstSeen, updatedAt }
    tagOverrides: {}, // id → { level?, topic?, updatedAt }
    settings: { ...DEFAULT_SETTINGS, updatedAt: 0 },
    activity: {}, // 'YYYY-MM-DD' → כמה תרגולים נעשו באותו יום (לרצף ימים וליעד יומי)
    celebrated: { greens: 0, goalDay: '' }, // אבן הדרך האחרונה שחגגנו, והיום האחרון שחגגנו בו יעד
    customWords: {}, // id → { id, en, isVerb, he: [], createdAt, updatedAt, deleted? } – מילים שהמשתמש הוסיף
    extraMeanings: {}, // id → { he: [], updatedAt } – פירושים שהמשתמש הוסיף למילה קיימת
    lastBackup: null,
  };
}

/** מעדכן נתונים ישנים למבנה הנוכחי. בכל שינוי מבנה מוסיפים כאן שלב. */
export function migrate(data) {
  if (!data || typeof data !== 'object') return emptyProgress();
  const base = emptyProgress();
  const out = {
    ...base,
    ...data,
    words: data.words || {},
    tagOverrides: data.tagOverrides || {},
    settings: { ...base.settings, ...(data.settings || {}) },
    activity: data.activity || {},
    // מה כבר חגגנו. למי שמעדכן גרסה – אבני דרך שכבר עבר נחשבות "נחגגו", כדי שלא תקפוץ חגיגה סתם.
    celebrated: data.celebrated || { greens: milestoneFor(countGreen(data.words)), goalDay: '' },
    customWords: data.customWords || {},
    extraMeanings: data.extraMeanings || {},
  };
  // גרסה 1 → 2: נוסף activity (ריק). כל השאר נשאר כמו שהוא.
  // גרסה 2 → 3: נוספו customWords ו-extraMeanings (ריקים) ו-celebrated.
  // בשינוי מבנה הבא: if ((data.version || 1) < 4) { ... }
  out.version = VERSION;
  return out;
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? migrate(JSON.parse(raw)) : emptyProgress();
  } catch {
    return emptyProgress();
  }
}

/**
 * מבקש מהדפדפן לסמן את הנתונים כ"חשובים" כדי שלא יימחקו כשחסר מקום.
 * (בעדכון גרסה הנתונים ממילא לא נמחקים – זו הגנה נוספת.)
 */
export async function requestPersist() {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) {
      await navigator.storage.persist();
    }
  } catch {
    // דפדפן שלא תומך – לא נורא
  }
}

export function save(progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}

function mergeById(a = {}, b = {}) {
  const out = { ...a };
  for (const [id, item] of Object.entries(b)) {
    if (!out[id] || (item.updatedAt || 0) > (out[id].updatedAt || 0)) out[id] = item;
  }
  return out;
}

/** מיזוג שני גיבויים: לכל מילה נשמר מה שעודכן אחרון, כך שלא מאבדים עבודה משני המכשירים. */
export function merge(local, incoming) {
  const a = migrate(local);
  const b = migrate(incoming);
  return {
    ...a,
    words: mergeById(a.words, b.words),
    tagOverrides: mergeById(a.tagOverrides, b.tagOverrides),
    settings: (b.settings.updatedAt || 0) > (a.settings.updatedAt || 0) ? b.settings : a.settings,
    activity: mergeActivity(a.activity, b.activity),
    customWords: mergeById(a.customWords, b.customWords),
    extraMeanings: mergeById(a.extraMeanings, b.extraMeanings),
    lastBackup: a.lastBackup,
  };
}

/** לכל יום לוקחים את המספר הגבוה מבין שני המכשירים (כדי לא לספור פעמיים את אותו תרגול) */
function mergeActivity(a = {}, b = {}) {
  const out = { ...a };
  for (const [day, n] of Object.entries(b)) out[day] = Math.max(out[day] || 0, n);
  return out;
}

/** קורא קובץ גיבוי ובודק שהוא נראה תקין */
export function parseBackup(text) {
  const data = JSON.parse(text);
  if (!data || typeof data !== 'object' || typeof data.words !== 'object') {
    throw new Error('הקובץ לא נראה כמו גיבוי של האפליקציה');
  }
  return migrate(data);
}
