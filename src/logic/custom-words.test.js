import { describe, it, expect } from 'vitest';
import { buildWords, findWord, normalizeEn, parseMeanings, similarWords, customId, getTags, WORDS } from './words.js';
import { migrate, merge, VERSION } from './storage.js';

describe('personal words', () => {
  it('normalizes English and detects "to" verbs', () => {
    expect(normalizeEn('  To Abandon ')).toEqual({ en: 'abandon', isVerb: true });
    expect(normalizeEn('Resilient')).toEqual({ en: 'resilient', isVerb: false });
  });

  it('splits meanings and removes duplicates', () => {
    expect(parseMeanings('לנטוש, לזנוח ;לנטוש')).toEqual(['לנטוש', 'לזנוח']);
    expect(parseMeanings('  ')).toEqual([]);
  });

  it('adds custom words and extra meanings to the list', () => {
    const first = WORDS[0];
    const id = customId('zzzresilient');
    const list = buildWords(
      { [id]: { id, en: 'zzzresilient', he: ['עמיד'] }, 'my-gone': { id: 'my-gone', en: 'gone', he: ['x'], deleted: true } },
      { [first.id]: { he: ['פירוש שלי', first.he[0]] } },
    );
    expect(list).toHaveLength(WORDS.length + 1); // המחוקה לא נספרת
    const mine = list.find((w) => w.id === id);
    expect(mine.custom).toBe(true);
    const withExtra = list.find((w) => w.id === first.id);
    expect(withExtra.he).toEqual([...first.he, 'פירוש שלי']); // בלי כפילות
    expect(withExtra.extra).toEqual(['פירוש שלי']);
  });

  it('finds existing words regardless of case and "to"', () => {
    const w = WORDS.find((x) => x.isVerb);
    expect(findWord(WORDS, `To ${w.en.toUpperCase()}`).id).toBe(w.id);
    expect(findWord(WORDS, 'qwertyuiop')).toBeNull();
  });

  it('suggests similar words', () => {
    const w = WORDS.find((x) => x.en.length >= 6);
    expect(similarWords(WORDS, w.en.slice(0, 4)).length).toBeGreaterThan(0);
  });

  it('custom words get default tags', () => {
    expect(getTags('my-anything', {})).toEqual({ level: 2, topic: 'mine' });
  });

  it('migrates v2 data to v3 without losing anything', () => {
    const v2 = { version: 2, words: { a: { color: 'green', updatedAt: 1 } }, activity: { '2026-11-01': 5 }, settings: { roundSize: 6 } };
    const p = migrate(v2);
    expect(p.version).toBe(VERSION);
    expect(p.words).toEqual(v2.words);
    expect(p.activity).toEqual(v2.activity);
    expect(p.settings.roundSize).toBe(6);
    expect(p.customWords).toEqual({});
    expect(p.extraMeanings).toEqual({});
  });

  it('merges custom words from two devices, keeping the newest (including deletions)', () => {
    const a = { words: {}, customWords: { 'my-x': { id: 'my-x', en: 'x', he: ['א'], updatedAt: 1 } } };
    const b = { words: {}, customWords: { 'my-x': { id: 'my-x', en: 'x', he: ['א'], deleted: true, updatedAt: 2 }, 'my-y': { id: 'my-y', en: 'y', he: ['ב'], updatedAt: 1 } } };
    const m = merge(a, b);
    expect(m.customWords['my-x'].deleted).toBe(true);
    expect(m.customWords['my-y']).toBeTruthy();
  });
});
