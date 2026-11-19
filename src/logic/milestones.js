// אבני דרך לחגיגה: כמות מילים ירוקות. לוגיקה טהורה – בלי תצוגה.

export const GREEN_MILESTONES = [25, 50, 100, 150, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400];

export function countGreen(wordStates = {}) {
  let n = 0;
  for (const s of Object.values(wordStates)) if (s?.color === 'green') n++;
  return n;
}

/** אבן הדרך הגבוהה ביותר שכבר הושגה (0 אם אף אחת) */
export function milestoneFor(greens) {
  let m = 0;
  for (const x of GREEN_MILESTONES) if (greens >= x) m = x;
  return m;
}

/**
 * האם עברנו עכשיו אבן דרך חדשה שעוד לא חגגנו?
 * מחזיר את המספר (למשל 100) או null.
 */
export function newMilestone(beforeGreens, afterGreens, celebrated = 0) {
  if (afterGreens <= beforeGreens) return null;
  const m = milestoneFor(afterGreens);
  return m > celebrated && m > milestoneFor(beforeGreens) ? m : null;
}

/** האם היעד היומי הושג עכשיו (ולא חגגנו אותו כבר היום)? */
export function goalReached(before, after, goal, celebratedDay, day) {
  return celebratedDay !== day && before < goal && after >= goal;
}
