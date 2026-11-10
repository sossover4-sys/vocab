import { describe, it, expect } from 'vitest';
import { pickMatch, newMatchRound, checkPairs } from './match.js';
import { rate, pickRound } from './srs.js';
import { streakDays, lastDays, addActivity } from './streak.js';
import { migrate, merge, VERSION } from './storage.js';

const DAY = '2026-11-10';
const ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
const meaningOf = (id) => `פירוש-${id}`;

describe('pickMatch', () => {
  it('בחכם מעדיף מילים שכבר תורגלו', () => {
    const states = { c: rate(null, 'red', DAY), f: rate(null, 'green', DAY) };
    const picked = pickMatch(ids, states, { n: 4 }, DAY, meaningOf);
    expect(picked).toHaveLength(4);
    expect(picked).toContain('c');
    expect(picked).toContain('f');
  });

  it('לא מכניס שתי מילים עם אותו פירוש', () => {
    const same = (id) => (id === 'a' || id === 'b' ? 'אותו דבר' : id);
    for (let i = 0; i < 20; i++) {
      const picked = pickMatch(['a', 'b', 'c', 'd'], {}, { n: 4 }, DAY, same);
      expect(picked.includes('a') && picked.includes('b')).toBe(false);
    }
  });

  it('רק חדשות: לא בוחר מילים שתורגלו כשיש מספיק חדשות', () => {
    const states = { a: rate(null, 'red', DAY), b: rate(null, 'red', DAY) };
    const picked = pickMatch(ids, states, { n: 4, mode: 'new' }, DAY, meaningOf);
    expect(picked.some((id) => states[id])).toBe(false);
  });

  it('שני הטורים מכילים אותן מילים', () => {
    const r = newMatchRound(['a', 'b', 'c']);
    expect([...r.left].sort()).toEqual(['a', 'b', 'c']);
    expect([...r.right].sort()).toEqual(['a', 'b', 'c']);
  });

  it('בדיקת זוגות', () => {
    expect(checkPairs({ a: 'a', b: 'c', c: 'b' })).toEqual({ correct: ['a'], wrong: ['b', 'c'] });
  });
});

describe('pickRound לפי מצב', () => {
  it('מכבד את גודל הסבב', () => {
    expect(pickRound(ids, {}, { size: 5, dailyNew: 50 }, DAY)).toHaveLength(5);
  });
  it('רק חדשות: מתעלם מהמכסה היומית', () => {
    const round = pickRound(ids, {}, { size: 6, dailyNew: 2, mode: 'new' }, DAY);
    expect(round).toHaveLength(6);
  });
  it('מעורבב: כולל גם ירוקות שעוד לא הגיע זמנן', () => {
    const states = Object.fromEntries(ids.map((id) => [id, rate(null, 'green', DAY)]));
    expect(pickRound(ids, states, { size: 10, mode: 'mixed' }, DAY)).toHaveLength(10);
  });
  it('חכם: כשאין מה לחזור והמכסה נגמרה – עדיין אפשר לתרגל', () => {
    expect(pickRound(ids, {}, { size: 4, dailyNew: 0 }, DAY)).toHaveLength(4);
  });
});

describe('streak', () => {
  it('סופר ימים רצופים עד היום', () => {
    const act = { '2026-11-08': 3, '2026-11-09': 1, [DAY]: 5 };
    expect(streakDays(act, DAY)).toBe(3);
  });
  it('אם היום עוד לא תורגל – הרצף לא נשבר', () => {
    expect(streakDays({ '2026-11-08': 3, '2026-11-09': 1 }, DAY)).toBe(2);
  });
  it('יום חסר שובר את הרצף', () => {
    expect(streakDays({ '2026-11-07': 3, '2026-11-09': 1 }, DAY)).toBe(1);
    expect(streakDays({}, DAY)).toBe(0);
  });
  it('7 הימים האחרונים ותוספת פעילות', () => {
    const act = addActivity(addActivity({}, DAY), DAY, 2);
    expect(act[DAY]).toBe(3);
    const days = lastDays(act, DAY);
    expect(days).toHaveLength(7);
    expect(days[6]).toEqual({ day: DAY, count: 3 });
    expect(days[0].day).toBe('2026-11-04');
  });
});

describe('storage v2', () => {
  it('נתונים מגרסה 1 עוברים בלי לאבד כלום', () => {
    const v1 = { version: 1, words: { a: { color: 'green' } }, settings: { roundSize: 12, updatedAt: 3 }, lastBackup: '2026-11-01' };
    const out = migrate(v1);
    expect(out.version).toBe(VERSION);
    expect(out.words.a.color).toBe('green');
    expect(out.settings.roundSize).toBe(12);
    expect(out.settings.matchPairs).toBe(8);
    expect(out.settings.wordMode).toBe('smart');
    expect(out.activity).toEqual({});
    expect(out.lastBackup).toBe('2026-11-01');
  });
  it('מיזוג פעילות: המקסימום לכל יום', () => {
    const out = merge({ words: {}, activity: { x: 3, y: 1 } }, { words: {}, activity: { x: 2, z: 4 } });
    expect(out.activity).toEqual({ x: 3, y: 1, z: 4 });
  });
});
