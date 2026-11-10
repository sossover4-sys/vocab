// גישה לרשימת המילים: תגים (כולל תיקונים של המשתמש), תצוגה וחיפוש.

import words from '../data/words.json';
import tags from '../data/tags.json';
import topicsData from '../data/topics.json';

export const WORDS = words;
export const WORDS_BY_ID = Object.fromEntries(words.map((w) => [w.id, w]));
export const LEVELS = topicsData.levels; // { "1": "קל", ... }
export const TOPICS = topicsData.topics; // { emotion: "רגשות ואופי", ... }

/** "to abandon" לפעלים שסומנו ב-[to] */
export function displayEn(word) {
  return word.isVerb ? `to ${word.en}` : word.en;
}

/** התגים של מילה, כשהתיקון של המשתמש גובר על התיוג המקורי */
export function getTags(id, tagOverrides = {}) {
  return { ...tags[id], ...stripMeta(tagOverrides[id]) };
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
