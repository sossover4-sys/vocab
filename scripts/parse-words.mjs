// הופך רשימת שורות טקסט מהוורד לרשימת מילים מסודרת.
// הקובץ "טהור" (בלי קריאת קבצים) כדי שיהיה קל לבדוק אותו בבדיקות.

const HEBREW = /[֐-׿]/;
const LATIN = /[A-Za-z]/;

// שורות שאינן מילים ויש לדלג עליהן
const SKIP_LINES = new Set(['אוצר מילים', 'Top of Form', 'Bottom of Form']);

/** מפצל פירושים לפי פסיק, אבל לא בתוך סוגריים: "להטיל (מס, עונש), לכפות" → 2 פירושים */
export function splitMeanings(text) {
  const parts = [];
  let depth = 0;
  let current = '';
  for (const ch of text) {
    if (ch === '(') depth++;
    if (ch === ')') depth = Math.max(0, depth - 1);
    if ((ch === ',' || ch === ';') && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  parts.push(current);
  return parts
    .map((p) => p.replace(/\s+/g, ' ').replace(/\s*\(\s*/g, ' (').replace(/\s*\)/g, ')').trim())
    .filter(Boolean);
}

/** "[to] Bother " → { en: "bother", isVerb: true } */
export function normalizeEnglish(text) {
  let t = text.replace(/\s+/g, ' ').trim();
  let isVerb = false;
  if (/^\[to\]\s*/i.test(t)) {
    isVerb = true;
    t = t.replace(/^\[to\]\s*/i, '');
  }
  return { en: t.toLowerCase(), isVerb };
}

/**
 * @param {string[]} lines שורות הטקסט מהוורד
 * @param {{en?: Record<string,string>, he?: Record<string, Record<string,string>>}} fixes תיקונים
 * @returns {{ words: Array<{id:string,en:string,isVerb:boolean,he:string[]}>, report: object }}
 */
export function parseWords(lines, fixes = {}) {
  const report = { skipped: [], splitLines: [], merged: [], enFixed: [], heFixed: [], problems: [] };
  const pairs = [];
  let pendingEn = null;

  for (const raw of lines) {
    const line = raw.replace(/ /g, ' ').trim();
    if (!line) continue;
    if (SKIP_LINES.has(line)) {
      report.skipped.push(line);
      continue;
    }
    const hasHe = HEBREW.test(line);
    const hasEn = LATIN.test(line);

    if (hasEn && hasHe) {
      // אנגלית ועברית באותה שורה, למשל "Tiltהטיה"
      const cut = line.search(HEBREW);
      if (pendingEn) report.problems.push(`מילה בלי פירוש: ${pendingEn}`);
      pairs.push({ en: line.slice(0, cut), he: line.slice(cut) });
      report.splitLines.push(line);
      pendingEn = null;
    } else if (hasEn) {
      if (pendingEn) report.problems.push(`מילה בלי פירוש: ${pendingEn}`);
      pendingEn = line;
    } else if (hasHe) {
      if (!pendingEn) {
        report.problems.push(`פירוש בלי מילה: ${line}`);
        continue;
      }
      pairs.push({ en: pendingEn, he: line });
      pendingEn = null;
    } else {
      report.problems.push(`שורה לא מזוהה: ${line}`);
    }
  }
  if (pendingEn) report.problems.push(`מילה בלי פירוש: ${pendingEn}`);

  const enFixes = fixes.en || {};
  const heFixes = fixes.he || {};
  const byId = new Map();

  for (const pair of pairs) {
    let { en, isVerb } = normalizeEnglish(pair.en);
    if (enFixes[en]) {
      report.enFixed.push(`${en} → ${enFixes[en]}`);
      en = enFixes[en];
    }
    let he = splitMeanings(pair.he);
    const wordHeFixes = heFixes[en];
    if (wordHeFixes) {
      // ערך null = מחיקת הפירוש; ערך עם פסיק = פיצול לכמה פירושים
      he = he.flatMap((m) => {
        if (!(m in wordHeFixes)) return [m];
        const to = wordHeFixes[m];
        report.heFixed.push(`${en}: ${m} → ${to ?? '(נמחק)'}`);
        return to === null ? [] : splitMeanings(to);
      });
      for (const from of Object.keys(wordHeFixes)) {
        if (!report.heFixed.some((f) => f.startsWith(`${en}: ${from} →`))) {
          report.problems.push(`תיקון עברית שלא נמצא: ${en}: ${from}`);
        }
      }
    }

    const existing = byId.get(en);
    if (existing) {
      existing.isVerb = existing.isVerb || isVerb;
      for (const m of he) if (!existing.he.includes(m)) existing.he.push(m);
      report.merged.push(en);
    } else {
      byId.set(en, { id: en, en, isVerb, he: [...new Set(he)] });
    }
  }

  return { words: [...byId.values()], report };
}
