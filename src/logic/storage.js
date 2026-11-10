// שמירת ההתקדמות בזיכרון הדפדפן (localStorage), גיבוי ומיזוג.
// זה המקום היחיד שנוגע באחסון – כשיהיה סנכרון, רק הקובץ הזה ישתנה.

const KEY = 'vocab-progress';
export const VERSION = 1;

export const DEFAULT_SETTINGS = {
  roundSize: 8,
  dailyNew: 10,
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
  };
  // עתיד: if (out.version < 2) { ... ; out.version = 2 }
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
    lastBackup: a.lastBackup,
  };
}

/** קורא קובץ גיבוי ובודק שהוא נראה תקין */
export function parseBackup(text) {
  const data = JSON.parse(text);
  if (!data || typeof data !== 'object' || typeof data.words !== 'object') {
    throw new Error('הקובץ לא נראה כמו גיבוי של האפליקציה');
  }
  return migrate(data);
}
