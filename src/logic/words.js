// גישה לרשימת המילים: תגים (כולל תיקונים של המשתמש), תצוגה וחיפוש.

import words from '../data/words.json';
import tags from '../data/tags.json';
import topicsData from '../data/topics.json';

// המילים מהוורד בלבד. במסכים משתמשים ב-words מה-context, שכולל גם מילים ופירושים שהמשתמש הוסיף.
export const WORDS = words;
export const WORDS_BY_ID = Object.fromEntries(words.map((w) => [w.id, w]));
export const LEVELS = topicsData.levels; // { "1": "קל", ... }
export const TOPICS = { ...topicsData.topics, mine: 'המילים שלי' }; // { emotion: "רגשות ואופי", ... }

/** "To Abandon " → { en: 'abandon', isVerb: true }. אנגלית תמיד באותיות קטנות. */
export function normalizeEn(text) {
  let en = String(text || '').trim().toLowerCase().replace(/\s+/g, ' ');
  let isVerb = false;
  if (en.startsWith('to ')) {
    en = en.slice(3).trim();
    isVerb = true;
  }
  return { en, isVerb };
}

/** "לנטוש, לזנוח ;לעזוב" → ['לנטוש', 'לזנוח', 'לעזוב'] */
export function parseMeanings(text) {
  return [...new Set(String(text || '').split(/[,;،\n]/).map((m) => m.trim()).filter(Boolean))];
}

/** מזהה למילה אישית – עם קידומת, כדי שלא יתנגש במילה מהוורד */
export function customId(en) {
  return `my-${en}`;
}

/**
 * הרשימה המלאה: מילים מהוורד (עם פירושים נוספים שהמשתמש הוסיף) + המילים האישיות.
 * extra = הפירושים שנוספו (כדי לסמן אותם ולאפשר למחוק).
 */
export function buildWords(customWords = {}, extraMeanings = {}) {
  const withExtra = (w) => {
    const extra = (extraMeanings[w.id]?.he || []).filter((m) => !w.he.includes(m));
    return extra.length ? { ...w, he: [...w.he, ...extra], extra } : w;
  };
  const mine = Object.values(customWords)
    .filter((w) => !w.deleted)
    .map((w) => withExtra({ id: w.id, en: w.en, isVerb: Boolean(w.isVerb), he: w.he, custom: true }));
  const base = words.map(withExtra);
  if (!mine.length) return base;
  return [...base, ...mine].sort((a, b) => a.en.localeCompare(b.en));
}

/** מחפש מילה קיימת לפי האנגלית (מתעלם מ-"to" ומאותיות גדולות) */
export function findWord(list, text) {
  const { en } = normalizeEn(text);
  return en ? list.find((w) => w.en === en) || null : null;
}

/** מילים דומות (מתחילות באותן אותיות) – כדי לשים לב ל-abandoned מול abandon */
export function similarWords(list, text, max = 3) {
  const { en } = normalizeEn(text);
  if (en.length < 3) return [];
  return list
    .filter((w) => w.en !== en && (w.en.startsWith(en) || (en.startsWith(w.en) && w.en.length >= 4)))
    .slice(0, max);
}

/** "to abandon" לפעלים שסומנו ב-[to] */
export function displayEn(word) {
  return word.isVerb ? `to ${word.en}` : word.en;
}

/** התגים של מילה, כשהתיקון של המשתמש גובר על התיוג המקורי */
export function getTags(id, tagOverrides = {}) {
  // מילה אישית: ברירת מחדל "בינוני" + "המילים שלי"
  const base = tags[id] || { level: 2, topic: 'mine' };
  return { ...base, ...stripMeta(tagOverrides[id]) };
}

/** התיוג המקורי (לפני תיקונים) */
export function originalTags(id) {
  return tags[id] || { level: 2, topic: 'mine' };
}

function stripMeta(o) {
  if (!o) return {};
  const { updatedAt, ...rest } = o;
  return rest;
}

const HEBREW = /[֐-׿]/;

/**
 * מסנן מילים.
 * @param {{query?: string, level?: string, topic?: string, color?: string}} filters
 * color יכול להיות 'new' / 'red' / 'yellow' / 'green'
 */
export function filterWords(list, filters, progress) {
  const q = (filters.query || '').trim().toLowerCase();
  const isHe = HEBREW.test(q);
  return list.filter((w) => {
    if (q) {
      if (isHe ? !w.he.some((m) => m.includes(q)) : !w.en.includes(q)) return false;
    }
    if (filters.level || filters.topic) {
      const t = getTags(w.id, progress.tagOverrides);
      if (filters.level && String(t.level) !== String(filters.level)) return false;
      if (filters.topic && t.topic !== filters.topic) return false;
    }
    if (filters.color) {
      const color = progress.words[w.id]?.color || 'new';
      if (color !== filters.color) return false;
    }
    return true;
  });
}

/** עד שני פירושים קצרים – לכרטיסיות צפופות */
export function shortMeaning(word, max = 2) {
  return word.he.slice(0, max).join(', ');
}
