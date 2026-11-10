import { describe, it, expect } from 'vitest';
import { parseWords, splitMeanings, normalizeEnglish } from './parse-words.mjs';
import words from '../src/data/words.json';
import tags from '../src/data/tags.json';
import topics from '../src/data/topics.json';

describe('splitMeanings', () => {
  it('מפצל לפי פסיק אבל לא בתוך סוגריים', () => {
    expect(splitMeanings('להטיל (מס, עונש), לכפות')).toEqual(['להטיל (מס, עונש)', 'לכפות']);
  });
  it('מסדר רווח לפני סוגריים', () => {
    expect(splitMeanings('עובר(ברחם)')).toEqual(['עובר (ברחם)']);
  });
});

describe('normalizeEnglish', () => {
  it('מזהה [to] כפועל ומקטין אותיות', () => {
    expect(normalizeEnglish('[to] Bother ')).toEqual({ en: 'bother', isVerb: true });
  });
});

describe('parseWords', () => {
  it('מדלג על כותרת ושאריות, מפצל שורה צמודה וממזג כפילויות', () => {
    const lines = ['אוצר מילים', 'Bold', 'נועז', '', 'Tiltהטיה', 'bold', 'אמיץ, נועז', 'Top of Form'];
    const { words, report } = parseWords(lines);
    expect(words).toEqual([
      { id: 'bold', en: 'bold', isVerb: false, he: ['נועז', 'אמיץ'] },
      { id: 'tilt', en: 'tilt', isVerb: false, he: ['הטיה'] },
    ]);
    expect(report.merged).toEqual(['bold']);
    expect(report.problems).toEqual([]);
  });
  it('מדווח על מילה בלי פירוש', () => {
    const { report } = parseWords(['alpha', 'beta', 'בטא']);
    expect(report.problems).toEqual(['מילה בלי פירוש: alpha']);
  });
  it('מחיל תיקונים: שינוי, מחיקה ופיצול', () => {
    const fixes = { en: { stuck: 'stack' }, he: { stack: { 'ערימה': 'ערימה, ערמה', 'ארובה': null } } };
    const { words } = parseWords(['Stuck', 'ערימה, ארובה'], fixes);
    expect(words[0]).toMatchObject({ id: 'stack', he: ['ערימה', 'ערמה'] });
  });
});

describe('הנתונים שנוצרו מהוורד', () => {
  it('יש 1,459 מילים ייחודיות (1,462 פחות 3 כפילויות)', () => {
    expect(words.length).toBe(1459);
    expect(new Set(words.map((w) => w.id)).size).toBe(1459);
  });
  it('לכל מילה יש לפחות פירוש אחד', () => {
    expect(words.filter((w) => w.he.length === 0)).toEqual([]);
  });
  it('התיקונים הוחלו', () => {
    const ids = new Set(words.map((w) => w.id));
    expect(ids.has('by no means')).toBe(true);
    expect(ids.has('stack')).toBe(true);
    expect(ids.has('stuck')).toBe(false);
  });
  it('כל מילה מתויגת ברמה ובנושא קיימים', () => {
    for (const w of words) {
      const t = tags[w.id];
      expect(t, w.id).toBeDefined();
      expect(topics.levels[t.level], w.id).toBeDefined();
      expect(topics.topics[t.topic], w.id).toBeDefined();
    }
  });
});
