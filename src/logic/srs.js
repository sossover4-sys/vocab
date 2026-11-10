// אלגוריתם החזרות המרווחות (בסגנון "ארגזים").
// אדום = לא יודע, צהוב = בערך, ירוק = יודע. כל צבע קובע מתי המילה תחזור.

import { addDays } from './dates.js';

export const COLORS = ['red', 'yellow', 'green'];

// כמה ימים עד החזרה הבאה אחרי ירוק, לפי כמה ירוקים ברצף
const GREEN_INTERVALS = [4, 8, 16, 30, 60];
const COLOR_RANK = { red: 0, yellow: 1, green: 2 };

/** מחזיר מצב חדש למילה אחרי סימון צבע. לא משנה את המצב הקודם. */
export function rate(state, color, day, now = Date.now()) {
  const prev = state || { streak: 0, seen: 0 };
  let streak = 0;
  let due;
  if (color === 'red') {
    due = addDays(day, 1);
  } else if (color === 'yellow') {
    due = addDays(day, 2);
  } else if (color === 'green') {
    streak = (prev.color === 'green' ? prev.streak : 0) + 1;
    due = addDays(day, GREEN_INTERVALS[Math.min(streak, GREEN_INTERVALS.length) - 1]);
  } else {
    throw new Error(`צבע לא מוכר: ${color}`);
  }
  return {
    color,
    due,
    streak,
    seen: prev.seen + 1,
    firstSeen: prev.firstSeen || day,
    updatedAt: now,
  };
}

/** טעות במשחק: ירוק → צהוב, צהוב → אדום, אדום נשאר אדום */
export function demote(state, day, now = Date.now()) {
  const next = !state || state.color === 'red' || state.color === 'yellow' ? 'red' : 'yellow';
  return rate(state, next, day, now);
}

/** כמה מילים חדשות כבר נלמדו היום */
export function newToday(wordStates, day) {
  return Object.values(wordStates).filter((s) => s.firstSeen === day).length;
}

function shuffle(list, random) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * בוחר מילים לסבב.
 * סדר עדיפות: מילים שהגיע זמנן (אדום ← צהוב ← ירוק) → מילים חדשות (עד המכסה היומית)
 * → אדומות/צהובות שעוד לא הגיע זמנן → ירוקות שעוד לא הגיע זמנן.
 * @param {string[]} ids המילים שמהן בוחרים (אפשר אחרי סינון)
 * @param {Record<string, object>} wordStates מצב כל מילה
 */
export function pickRound(ids, wordStates, { size = 8, dailyNew = 10 } = {}, day, random = Math.random) {
  const byUrgency = (a, b) =>
    COLOR_RANK[wordStates[a].color] - COLOR_RANK[wordStates[b].color] ||
    wordStates[a].due.localeCompare(wordStates[b].due);

  const seen = ids.filter((id) => wordStates[id]);
  const due = seen.filter((id) => wordStates[id].due <= day).sort(byUrgency);
  const fresh = ids.filter((id) => !wordStates[id]);
  const newLeft = Math.max(0, dailyNew - newToday(wordStates, day));
  const notDue = seen.filter((id) => wordStates[id].due > day).sort(byUrgency);

  const picked = [...due, ...fresh.slice(0, newLeft), ...notDue].slice(0, size);
  return shuffle(picked, random);
}

/** סיכום לפי צבע: { new, red, yellow, green, due } */
export function summarize(ids, wordStates, day) {
  const counts = { new: 0, red: 0, yellow: 0, green: 0, due: 0 };
  for (const id of ids) {
    const s = wordStates[id];
    if (!s) counts.new++;
    else {
      counts[s.color]++;
      if (s.due <= day) counts.due++;
    }
  }
  return counts;
}
