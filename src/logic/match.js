// משחק ההתאמה: בחירת המילים לסבב ובדיקת הזוגות. לוגיקה טהורה בלי React.

import { orderByMode, shuffle } from './srs.js';

/**
 * בוחר n מילים למשחק.
 * - חכם: קודם מילים שכבר תרגלת (אדום ← צהוב ← ירוק), ואם חסר – חדשות. המשחק לא "צורך" מכסת חדשות.
 * - רק חדשות / מעורבב: כמו בכרטיסיות.
 * לא מכניס שתי מילים עם אותו פירוש מוצג, כדי שלא יהיו שתי תשובות נכונות.
 * כדי שלא יחזרו תמיד אותן מילים, בוחרים באקראי מתוך המועמדים הדחופים ביותר.
 * @param {(id: string) => string} meaningOf הפירוש שמוצג במשחק
 */
export function pickMatch(ids, wordStates, { n = 8, mode = 'smart' } = {}, day, meaningOf, random = Math.random) {
  const mixTop = (list) => [...shuffle(list.slice(0, n * 2), random), ...list.slice(n * 2)];
  let candidates;
  if (mode === 'smart') {
    const seen = orderByMode(ids.filter((id) => wordStates[id]), wordStates, { dailyNew: 0 }, day, random);
    const fresh = ids.filter((id) => !wordStates[id]);
    candidates = [...mixTop(seen), ...fresh];
  } else {
    candidates = mixTop(orderByMode(ids, wordStates, { mode, dailyNew: Infinity }, day, random));
  }

  const picked = [];
  const meanings = new Set();
  for (const id of candidates) {
    const m = meaningOf(id);
    if (meanings.has(m)) continue;
    meanings.add(m);
    picked.push(id);
    if (picked.length === n) break;
  }
  return picked;
}

/** מכין סבב: אותן מילים, בשני סדרים אקראיים שונים לשני הטורים */
export function newMatchRound(picked, random = Math.random) {
  return { left: shuffle(picked, random), right: shuffle(picked, random) };
}

/**
 * בודק את הזוגות.
 * @param {Record<string, string>} pairs מילה באנגלית (id) → id של הפירוש שנבחר לה
 * @returns {{ correct: string[], wrong: string[] }}
 */
export function checkPairs(pairs) {
  const correct = [];
  const wrong = [];
  for (const [en, he] of Object.entries(pairs)) (en === he ? correct : wrong).push(en);
  return { correct, wrong };
}
