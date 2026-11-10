// רצף ימים ופעילות יומית – מחושבים מתוך activity: { 'YYYY-MM-DD': מספר תרגולים }.

import { addDays } from './dates.js';

/**
 * כמה ימים ברצף תורגלו.
 * אם היום עוד לא תורגל, הרצף נספר עד אתמול – כדי שהרצף לא "יישבר" בבוקר לפני שהספקת לתרגל.
 */
export function streakDays(activity = {}, day) {
  let d = activity[day] > 0 ? day : addDays(day, -1);
  let count = 0;
  while (activity[d] > 0) {
    count++;
    d = addDays(d, -1);
  }
  return count;
}

/** הפעילות של n הימים האחרונים, מהישן לחדש: [{ day, count }] */
export function lastDays(activity = {}, day, n = 7) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = addDays(day, -i);
    out.push({ day: d, count: activity[d] || 0 });
  }
  return out;
}

/** מוסיף תרגולים ליום מסוים (לא משנה את האובייקט המקורי) */
export function addActivity(activity = {}, day, n = 1) {
  return { ...activity, [day]: (activity[day] || 0) + n };
}
